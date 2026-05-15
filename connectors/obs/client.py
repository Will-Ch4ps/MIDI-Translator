"""Cliente OBS WebSocket v5 simples (best-effort, lib opcional).

Tenta usar `obsws_python` (mais maduro) ou `simpleobsws`. Se nenhum
estiver instalado, o connector reporta MISSING e suas ações ficam
indisponíveis até `pip install obsws-python`.
"""
from __future__ import annotations

import sys
from typing import Any


class ObsClient:
    def __init__(self) -> None:
        self._impl = None
        self._connected = False
        self._kind: str = "none"
        self._lib = self._detect_lib()

    @property
    def available(self) -> bool:
        return self._lib != "none"

    @property
    def connected(self) -> bool:
        return self._connected

    @property
    def kind(self) -> str:
        return self._kind

    def connect(self, host: str = "127.0.0.1", port: int = 4455, password: str = "") -> bool:
        if self._lib == "obsws_python":
            try:
                from obsws_python import ReqClient  # type: ignore
                self._impl = ReqClient(host=host, port=port, password=password, timeout=3)
                self._connected = True
                self._kind = "obsws_python"
                return True
            except Exception as exc:  # noqa: BLE001
                self._connected = False
                print(f"[obs] obsws_python connect: {exc}", file=sys.stderr, flush=True)
                return False
        return False

    def disconnect(self) -> None:
        try:
            if self._impl and hasattr(self._impl, "disconnect"):
                self._impl.disconnect()
        except Exception:  # noqa: BLE001
            pass
        self._connected = False
        self._impl = None

    def call(self, request: str, **fields: Any) -> Any:
        if not self._impl:
            return None
        try:
            method = getattr(self._impl, request, None)
            if not method:
                return self._impl.send(request, fields) if hasattr(self._impl, "send") else None
            return method(**fields) if fields else method()
        except Exception as exc:  # noqa: BLE001
            print(f"[obs] {request} falhou: {exc}", file=sys.stderr, flush=True)
            self._connected = False
            return None

    def set_scene(self, name: str) -> Any:
        return self.call("set_current_program_scene", scene_name=name)

    def toggle_mute(self, input_name: str) -> Any:
        return self.call("toggle_input_mute", input_name=input_name)

    def start_streaming(self) -> Any:
        return self.call("start_stream")

    def stop_streaming(self) -> Any:
        return self.call("stop_stream")

    def start_recording(self) -> Any:
        return self.call("start_record")

    def stop_recording(self) -> Any:
        return self.call("stop_record")

    def trigger_replay_buffer(self) -> Any:
        return self.call("save_replay_buffer")

    @staticmethod
    def _detect_lib() -> str:
        try:
            import obsws_python  # type: ignore  # noqa: F401
            return "obsws_python"
        except Exception:  # noqa: BLE001
            return "none"
