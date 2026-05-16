"""Bridge JSON entre Tauri e Runtime Python.

Importar `dispatch` direto de `app.bridge.server` (não re-exportamos
aqui pra evitar dupla execução ao rodar `python -m app.bridge.server`).
"""
