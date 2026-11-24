"""Nome amigável de um .exe (campo "Descrição do arquivo" das propriedades do Windows)."""
from __future__ import annotations

import ctypes
from ctypes import wintypes
from functools import lru_cache


@lru_cache(maxsize=256)
def file_description(path: str) -> str:
    """Ex.: ...\\Microsoft VS Code\\Code.exe → "Visual Studio Code". Vazio se não houver."""
    if not path:
        return ""
    try:
        version = ctypes.windll.version
        size = version.GetFileVersionInfoSizeW(path, None)
        if not size:
            return ""
        buffer = ctypes.create_string_buffer(size)
        if not version.GetFileVersionInfoW(path, 0, size, buffer):
            return ""

        pointer = ctypes.c_void_p()
        length = wintypes.UINT()
        if not version.VerQueryValueW(buffer, "\\VarFileInfo\\Translation", ctypes.byref(pointer), ctypes.byref(length)):
            return ""
        pairs = ctypes.cast(pointer, ctypes.POINTER(wintypes.WORD * 2))
        lang, codepage = pairs.contents[0], pairs.contents[1]

        key = f"\\StringFileInfo\\{lang:04x}{codepage:04x}\\FileDescription"
        if not version.VerQueryValueW(buffer, key, ctypes.byref(pointer), ctypes.byref(length)) or not length.value:
            return ""
        # Lê até o \0: alguns .exe informam um tamanho errado e viria lixo junto.
        return ctypes.wstring_at(pointer.value).strip()
    except Exception:  # noqa: BLE001
        return ""
