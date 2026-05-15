# Reestruturacao MIDITranslate

O app foi reiniciado com arquitetura desktop moderna:

- Frontend em React + Vite + TypeScript dentro de `frontend/`
- Shell desktop em Tauri dentro de `src-tauri/`
- Backend e regras em Python dentro de `core/` e `backend/`
- Ponte Tauri -> Python via comando `backend_call`
- Visual inicial baseado no editor StarryKey 25, com pads, knobs, botoes, teclado e sustain
- Editor inicial de mapeamentos para atalho, macro, midia, volume, programa, comando e script

Primeira fatia concluida:

- Tauri criado e compilando
- Backend Python respondendo ao bootstrap
- Perfil default carregado no frontend
- Bancos A/B/C dos pads clicaveis
- Mapeamentos salvos em `profiles/default.json`

Proximas fatias sugeridas:

1. Captura MIDI ao vivo para mostrar tecla/pad/knob ativo em tempo real.
2. Tela de perfis com criar, duplicar, renomear e excluir.
3. Execucao residente em background com start/stop do listener MIDI.
4. Editor avancado de macros com etapas, delay e validacao.
5. Empacotamento Windows com Python embutido ou sidecar.

Documentacao base em `docs/Base.md`.
