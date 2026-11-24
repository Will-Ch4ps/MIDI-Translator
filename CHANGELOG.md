# Changelog

Todas as mudanças relevantes do MIDITranslate. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [1.0.0] — 2026-11-24

Interface refeita do zero sobre o backend estável da 0.1.

### Novo
- Tela **Mapear**: pads grandes com o nome da ação, bancos A/B/C, knobs com nível ao vivo, botões e piano que cabe na tela.
- Painel em dois passos: **o que faz** → **detalhes**, com gatilhos ao tocar / segurar / duplo / ao soltar.
- **Botões liga/desliga** (A–D) com regras *ao ligar* e *ao desligar*, LED de estado e opção "fazer o mesmo".
- **Seletor de programas**: abertos agora (com o nome real) e busca entre os instalados no menu Iniciar.
- Apps da Microsoft Store salvos como `shell:AppsFolder\<AppID>`, que não quebra quando o app atualiza.
- A tela acompanha o banco de pads e a oitava tocados no teclado; setas para trocar a oitava manualmente.
- Tela **Configurações**: iniciar com o Windows e já começar ouvindo o teclado.
- Salvar um vínculo reinicia o listener: a mudança vale na hora.

### Corrigido
- Gatilho **ao soltar** não executava abrir programa, comando, script, atalho nem mídia.
- Botões A–D (mensagens CC) eram tratados como knobs: a ação disparava ao ligar *e* ao desligar.
- Textos com acento chegavam corrompidos entre o Python e o app.
- Chamadas simultâneas podiam ler o layout ou o perfil pela metade, ou sobrescrever vínculos uns dos outros (gravação atômica + trava entre processos).
- A janela congelava enquanto o Python respondia.

### Removido
- Backend multi-conector e interface da 0.2 (arquivados na tag `v0.2-studio-archive`).
- Perfis pessoais deixam de ser versionados (`profiles/*.json` no `.gitignore`).

## [0.2.0] — 2026-05-16 · arquivada

Remodelagem "MIDI Studio": multi-dispositivo, 14 conectores (OBS, Spotify, Discord, Home Assistant…), camadas e preset packs. Nunca substituiu a 0.1 no uso diário e foi arquivada na tag `v0.2-studio-archive`.

## [0.1.0] — 2026-05-15

Primeira versão funcional para o StarryKey 25: mapeamento de pads, knobs, botões e teclas; listener em segundo plano; bandeja e autostart. Tag `v0.1-starrykey`.

[1.0.0]: https://github.com/Will-Ch4ps/MIDI-Translator/releases/tag/v1.0.0
[0.2.0]: https://github.com/Will-Ch4ps/MIDI-Translator/tree/v0.2-studio-archive
[0.1.0]: https://github.com/Will-Ch4ps/MIDI-Translator/tree/v0.1-starrykey
