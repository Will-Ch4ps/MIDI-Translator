# Roadmap Tauri

## Arquitetura atual

- `frontend/`: React, Vite e TypeScript para a interface.
- `src-tauri/`: janela desktop e comandos nativos.
- `backend/bridge.py`: ponte JSON entre Tauri e Python.
- `core/`: logica de MIDI, perfis, roteamento e acoes.
- `devices/`: layouts de controladores, com StarryKey 25 como primeiro alvo.
- `profiles/`: mapeamentos salvos por perfil.

## Contrato inicial

O frontend chama `backend_call` no Tauri. O Tauri executa o Python e retorna JSON para a UI.

Comandos disponiveis:

- `bootstrap`: carrega layout, perfil e portas MIDI.
- `save_mapping`: salva ou substitui o mapping de um controle.
- `delete_mapping`: remove o mapping de um controle.

## Regra de evolucao

Cada feature deve entrar pequena e verificavel:

1. Mostrar dados reais.
2. Permitir editar.
3. Persistir no Python.
4. Validar visualmente no mapa do teclado.
5. So entao ligar execucao MIDI ao vivo.

## Proxima feature

Implementar listener MIDI residente para enviar eventos ativos para a tela:

- Pad pressionado.
- Botao ativo/inativo.
- Posicao atual de knob.
- Nota do teclado reconhecida.
- Ultimo evento MIDI bruto para depuracao.
