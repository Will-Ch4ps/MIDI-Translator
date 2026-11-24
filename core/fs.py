"""Gravação segura de arquivos JSON compartilhados entre processos.

A UI pode chamar o Python várias vezes ao mesmo tempo (e o listener lê os mesmos
arquivos). Com `write_text` direto, quem lê no meio da escrita encontra o arquivo
vazio/cortado. Aqui: só grava se mudou, e grava num temporário + troca atômica.
"""
from __future__ import annotations

import os
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


@contextmanager
def file_lock(lock_path: Path) -> Iterator[None]:
    """Trava entre processos para ler-alterar-gravar sem um sobrescrever o outro."""
    lock_path = Path(lock_path)
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with open(lock_path, "a+b") as handle:
        if os.name == "nt":
            import msvcrt

            for attempt in range(200):  # até ~10s
                try:
                    handle.seek(0)
                    msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
                    break
                except OSError:
                    time.sleep(0.05)
            else:
                raise TimeoutError(f"{lock_path.name} travado há muito tempo")
            try:
                yield
            finally:
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            import fcntl

            fcntl.flock(handle, fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(handle, fcntl.LOCK_UN)


def write_text_atomic(path: Path, text: str) -> None:
    path = Path(path)
    try:
        if path.read_text(encoding="utf-8") == text:
            return  # nada mudou: não mexe no arquivo
    except (OSError, UnicodeDecodeError):
        pass

    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(text, encoding="utf-8")
    # No Windows a troca falha se outro processo estiver lendo naquele instante: tenta de novo.
    for attempt in range(20):
        try:
            os.replace(tmp, path)
            return
        except PermissionError:
            time.sleep(0.025 * (attempt + 1))
    tmp.unlink(missing_ok=True)
    raise PermissionError(f"não consegui gravar {path.name}: arquivo em uso")
