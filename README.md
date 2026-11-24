# MIDITranslate

Transforma o teclado MIDI (StarryKey 25) num painel de atalhos: cada pad, knob, botão ou tecla pode abrir um programa, rodar um script ou comando, disparar um atalho de teclado, controlar mídia ou volume.

## Como funciona

```
frontend/   React + Vite: a interface (Mapear / Configurações)
src-tauri/  Rust/Tauri: janela, bandeja, autostart e o processo do listener
backend/    Python: bridge.py (comandos da UI) e service.py (listener MIDI)
core/       Python: dispositivo, perfis, roteamento e execução das ações
devices/    layout do controlador (starrykey25.json)
profiles/   seus vínculos (default.json) — dados pessoais, fora do git
tools/      midi_probe.py, para inspecionar mensagens MIDI cruas
```

O executável chama `py -3 backend/bridge.py` e `backend/service.py` **a partir desta pasta** (o caminho é fixado na compilação). Não mova a pasta do projeto sem recompilar.

## Rodar

```bash
pip install -r requirements.txt     # uma vez
npm --prefix frontend ci            # uma vez

npm --prefix frontend run dev       # UI no navegador (http://127.0.0.1:5173), com o Python real
npm run tauri:dev                   # app completo em modo dev
npm run tauri:build                 # gera src-tauri/target/release/miditranslate.exe
```

No navegador, listener, autostart e "Procurar…" ficam desativados (são do Rust). Atenção: "Testar" executa a ação de verdade.

## Dados

- Vínculos: `profiles/default.json`. Copie esse arquivo para fazer backup.
- Preferência "começar ouvindo no boot": guardada no WebView do app.
- A versão anterior (MIDI Studio v0.2, com conectores OBS/Spotify/etc.) está arquivada na tag `v0.2-studio-archive`.
