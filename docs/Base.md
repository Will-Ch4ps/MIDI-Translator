# Perguntas e respostas

# Vamos estruturar o MIDITranslate do zero 🎯

Ótima decisão. Antes de escrever uma linha de código, vamos definir **tudo** em documentos. Começando pelo mais fundamental.

---

## 📸 Contexto que já entendi pela imagem

Você tem o **StarryKey 25 (Donner)** com:
- 3 banks de pads (A/B/C) × 8 pads = 24 pads
- 4 knobs + 1 modulation
- 4 buttons (A/B/C/D)
- Pitch bend
- Sustain pedal
- Teclado 25 teclas

---

## Bloco 1 — Identidade e Propósito do Sistema

Preciso entender **o que o sistema é** antes de qualquer coisa.

---

**1.** O MIDITranslate é um app **só para você** (uso pessoal) ou você pensa em distribuir para outras pessoas com outros teclados MIDI?

**2.** O caso de uso principal é: apertar um pad → simular uma tecla no Windows. Existem outros casos de uso igualmente importantes? (ex: controlar volume de apps específicos, acionar macros complexas, mudar perfis automaticamente)

**3.** Você quer que o app rode **em segundo plano** (na bandeja do sistema) sempre que o Windows ligar, ou é algo que você abre manualmente quando precisa?

**4.** Existe algum app similar que você usa como referência de experiência? (ex: MIDI2LR, AutoHotkey, Stream Deck software, VoiceMeeter)

---

## Bloco 2 — O Hardware

**5.** Você usa **só o StarryKey 25** ou pretende suportar outros teclados MIDI no futuro?

**6.** Os **banks de pads (A/B/C)** — você quer que cada bank seja um "contexto" diferente (ex: Bank A = jogos, Bank B = streaming) ou os 3 banks juntos formam um único conjunto de 24 pads mapeáveis independentemente?

**7.** O **teclado de 25 teclas** — você quer mapear teclas individuais para ações, ou o teclado sempre funciona como MIDI musical e não entra no sistema de mapeamento?

**8.** Os **knobs** — você usa principalmente para volume/scroll contínuo, ou também para acionar ações discretas (ex: girar = próxima faixa)?

---

## Bloco 3 — Perfis

**9.** Como você imagina um "perfil"? É um conjunto completo de mapeamentos para uma situação (ex: "perfil Discord", "perfil jogando CS")? Ou é algo mais granular?

**10.** Você quer trocar de perfil **pelo próprio teclado MIDI** (ex: segurar um pad por 2s = muda perfil) ou só pelo software?

**11.** Perfis diferentes podem ter **layouts de hardware diferentes**? (ex: perfil A usa Bank A como pads normais, perfil B usa Bank A como teclado de notas)

---

Responda o que souber — pode ser curto. Vou adaptando as próximas perguntas conforme suas respostas. 🎯
1- primeiramente pra mim, mas se for algo amplo eu distribuo pra outros midi com o tempo e validação própria
2- o uso é amplo, quero regular volume de um software ou do pc, quero realizar ações estabelecidas, quero criar cenários de automação, quero conseguir vincular um atalho, ativar ou desativar algo e etc, uso amplo
3- deixe o usuário definir, se o sistema for prático e legal deixar aberto ao ligar, se for usado as vezes o usuário poderá desabilitar isso
4- usei alguns como o bomb, midi2midikey acho q é isso, e já ouvi falar do stream deck, quero algo mais simples, visual e com fluxo melhor, acho muito poluído os sistemas q utilizei e muito complexo, nada direto e simples de entender
5- pretendo suportar mais mídi, por isso conseguir criar grupos, vincular e mapear o mídi e reconhecer é primordial, pensei em um esboço do teclado por exemplo, onde posso dar drag and drop e reorganizar os botões pra posição real do teclado
6- cada um com o próprio contexto, mas podem receber atalhos diversos também, fica de organização do usuário 
7- deixe possível mapear mas deixe como habilitado ou não acho q apenas casos específicos que usarão isso
8- deixe pra coisas que fazem sentido com o botão, um clique ou abrir algo não encaixa com o nível do knob, som, brilho, scroll e etc as vezes faz mais sentido
9- acho q perfil é legal pra definir um workspace melhor, se tiver muito atalho pra um jogo, e justo usar o perfil do jogo
10- isso é uma ótima opção mas poderia ser personalizado pelo usuário pra não dar conflito de atalhos ou teclado quebrada e bugada
11- perfis vinculam a um mídi específico e seguem o padrão dele, a não ser que outro sofra alteração de layout e aí sim segue a regra criada nele

# Excelente base. Vamos aprofundar. 🎯

Suas respostas definem um sistema **visual, simples e poderoso**. Anotei tudo. Agora vou ao próximo bloco.

---

## Bloco 4 — Ações e Automações

Você disse "uso amplo" — preciso entender os limites e prioridades.

**12.** Quando você fala em **"cenários de automação"**, você pensa em algo como:
- (A) Sequência de teclas em ordem — ex: aperta pad → digita `ctrl+c`, espera 200ms, digita `ctrl+v`
- (B) Condicionais — ex: se o Discord estiver aberto, faz X, senão faz Y
- (C) Loops — ex: enquanto segurar o pad, repete a ação a cada 500ms
- (D) Tudo isso acima
- (E) Algo diferente?

**13.** **Controle de volume por software específico** — você quer controlar o volume de um app individual (ex: só o Discord, só o Spotify) ou principalmente o volume mestre do sistema?

**14.** Quando você fala em **"ativar ou desativar algo"** — exemplos concretos que você usaria:
- Mutar microfone?
- Ligar/desligar uma janela/app?
- Toggle de uma tecla (ex: Caps Lock, Num Lock)?
- Pausar/retomar um processo?

**15.** Você quer integração com **aplicativos específicos** nativamente? (ex: controlar OBS diretamente, Spotify API, Discord mute via API) ou tudo via simulação de teclas/mouse?

**16.** **Mouse** — você mencionou ações. Quer controlar o mouse também? (mover cursor, clicar, scroll com knob?)

---

## Bloco 5 — Interface Visual

Você foi bem claro: simples, visual, fluxo direto. Vamos detalhar.

**17.** Quando você imagina abrir o app, qual é a **primeira tela** que faz sentido ver? 
- O mapa visual do seu teclado com os pads/knobs?
- Uma lista de mapeamentos ativos?
- Um dashboard com status (conectado, perfil ativo, últimos acionamentos)?

**18.** Você mencionou **drag and drop para reorganizar botões** na posição real do teclado. Isso seria uma tela separada de "configurar dispositivo" ou faz parte da tela principal?

**19.** Quando clica em um pad/knob para mapear, como você imagina o fluxo?
- (A) Um painel lateral abre na mesma tela
- (B) Um modal/popup aparece
- (C) Uma tela nova de configuração

**20.** Você quer **feedback visual em tempo real** quando aperta um pad? (ex: o pad pisca na tela quando você o aperta fisicamente)

**21.** Tema visual: você já tem preferência? Dark mode, cores específicas, estilo mais "pro" (como Ableton) ou mais "clean" (como Notion/Linear)?

---

## Bloco 6 — Troca de Perfil pelo Hardware

Você disse que quer isso mas configurável. Vamos definir.

**22.** A troca de perfil pelo teclado seria:
- (A) Segurar um pad por X segundos
- (B) Combinação de pads (ex: pad 1 + pad 2 simultaneamente)
- (C) Um pad dedicado exclusivamente para isso
- (D) O usuário escolhe qualquer uma dessas opções

**23.** Quando trocar de perfil pelo hardware, você quer **confirmação visual** na tela ou só um feedback sonoro/LED (se o teclado suportar)?

**24.** Se o usuário estiver em um jogo em fullscreen e trocar de perfil, o app precisa funcionar **sem aparecer na tela** (só em background)?

---

## Bloco 7 — Reconhecimento de MIDI

**25.** Quando conecta um MIDI novo que o sistema não conhece, qual fluxo você prefere?
- (A) Um wizard automático: "mexa cada controle para eu identificar"
- (B) O usuário escolhe de uma lista de dispositivos conhecidos
- (C) Começa em branco e o usuário monta o layout manualmente com drag and drop
- (D) Combinação: tenta reconhecer automaticamente, se não conhecer abre o wizard

**26.** O sistema deve **detectar automaticamente** quando o MIDI é conectado/desconectado via USB, sem precisar reiniciar o app?

**27.** Você quer salvar o **layout físico do teclado** (posição visual dos controles) separado dos **mapeamentos** (o que cada controle faz)? Assim o mesmo layout serve para múltiplos perfis.

---

Pode responder tudo de uma vez ou por bloco. Quanto mais detalhe, melhor o documento final. 🎯
12- D) tudo isso e mais um pouco, como digitar texto, executar algum comando, realizar algum script e etc.
13- os dois
14- mutar, toggle de qualquer coisa, e coisas simples também 
15- penso que vincular a um app é dificil pois requer muito código, portanto pensei que, se eu pudar atribuir uma tecla ou atalho que é muito raro ter nos teclados (inclusive o meu por isso seleciono no teclado virtual) isso faria com que vinculasse o botão ou tecla ou etc, e poderia bindar no jogo ou software só de clicar no midi ou executar a ação necessária pra bindar, como comobinação de tecla midi, sei lá.
16- não é necessário usar o mouse para vincuar, apenas ações que ele faz, tipo o clique direito ou esquerdo, scroll, duplo clique e etc, arrastar pela posição não.
17- O desenho do teclado do perfil escolhido, posição e botões nos lugares corretos
18- tela principal, mas aceito colocar como aba nova que depois aparece na tela principal o modelo editado, assim o usuario não arrasta algo sem querer.
19- uma tela nova é legal pra editar, assim deixamos mais clean, e separado, SOLID, cada parte cuida de algo proprio e separa bem dando mais opções de configurações e deixando visual e nada poluido visualmente
20- quero
21- Dark mode com um azul bem foda, estilo mais premium e lindo, gosto de algo mais limpo como o MOISES do que como um ableton, pois no moises há uma modernidade e limpeza melhor, taa um fluxo mais visual e auto explicativo, o usuario entende o que pode fazer, como fazer e o que poderia inventar.
22- D
23- na tela e no MIDI se possivel
24- precisa funcionar sem aparecer o feedback visual do MIDI é pro usuario saber da troca
25- C
26- SIM
27- sim
pode mandar mais perguntas sobre as coisas que não falamos ainda ou não destrinjamos tanto

# Bloco 8 — Automações e Scripts

Você abriu um escopo grande aqui. Preciso entender os limites.

**28.** Quando fala em **executar script**, você pensa em:
- (A) Scripts `.bat` / `.ps1` / `.py` que já existem no seu PC
- (B) Um editor interno no app onde você escreve o script
- (C) Os dois — importar externos E escrever dentro do app
- (D) Só chamar o arquivo, o conteúdo é responsabilidade do usuário

**29.** **Digitar texto** — casos de uso que você imagina:
- Digitar uma frase/resposta pronta (ex: pad = digita "Volto em 5 minutos")
- Preencher formulários automaticamente
- Digitar comandos de terminal
- Tudo isso?

**30.** Sobre os **loops** — quando um pad está sendo segurado e repete uma ação:
- O intervalo de repetição é fixo (ex: sempre 500ms) ou o usuário configura por ação?
- Existe um limite máximo de repetições ou para só quando soltar?

**31.** Sobre **condicionais** — qual o nível de complexidade que faz sentido para você?
- (A) Simples: "se o app X estiver em foco, faz Y"
- (B) Médio: "se o app X estiver aberto (mesmo sem foco), faz Y"
- (C) Avançado: condições encadeadas com AND/OR
- (D) Você prefere deixar isso para scripts externos e o app foca no simples

**32.** As automações complexas (sequência, loop, condicional) seriam configuradas visualmente no app ou você aceita uma sintaxe simples de texto/YAML para usuários avançados?

---

# Bloco 9 — Tela Principal e Navegação

**33.** Na tela principal você vê o desenho do teclado. Como você imagina a **hierarquia de navegação**?
```
Tela principal (mapa do teclado)
    └── clica num pad → abre tela de edição do pad
    └── troca de perfil → mapa muda
    └── ??? o que mais fica na tela principal?
```

**34.** A **barra superior** (topbar) — o que é essencial estar sempre visível?
- Status de conexão do MIDI?
- Perfil ativo?
- Botão de iniciar/parar escuta?
- Notificações de ativação em tempo real?

**35.** Você quer uma **sidebar** ou tudo flui verticalmente numa tela só?

**36.** Quando um pad **não tem nenhuma ação mapeada**, como ele aparece no mapa visual?
- Cinza/apagado?
- Com um "+" para convidar o clique?
- Invisível até o hover?

**37.** Quando um pad **tem ação mapeada**, o que aparece nele visualmente?
- Só um ícone do tipo de ação?
- O nome que o usuário deu?
- Um preview da ação (ex: "Ctrl+C")?
- Uma cor diferente por tipo de ação?

---

# Bloco 10 — Tela de Edição de Controle

**38.** Na tela de edição de um pad/knob, você imagina **abas por tipo de ação** (Tecla | Volume | Mídia | Script | etc) ou um dropdown de seleção de tipo?

**39.** Um controle pode ter **mais de uma ação ao mesmo tempo**? Ex: apertar o pad faz `Ctrl+M` E aumenta o volume?

**40.** Você quer distinguir **pressionar** vs **soltar** vs **segurar** para o mesmo controle? Ex:
- Pressionar pad = muta mic
- Soltar pad = desmuta mic
- Segurar pad 2s = troca perfil

**41.** Para knobs especificamente — você quer definir **zonas**? Ex:
- 0–30% = volume baixo (faz algo)
- 30–70% = normal
- 70–100% = volume alto (faz algo diferente)

**42.** O usuário vai **nomear** cada controle com um nome amigável? Ex: PAD_A1 → "Mute Discord"

---

# Bloco 11 — Sistema de Dispositivos

**43.** No editor de layout (drag and drop), o usuário está montando a **posição visual** dos controles numa grade. Qual o formato dessa grade?
- Grade livre (posiciona em qualquer lugar como pixels)?
- Grade por slots (ex: 4×2 para pads, linha para knobs)?
- Misto: seções fixas (área de pads, área de knobs) mas reorganizável dentro de cada seção?

**44.** Quando o usuário **arrasta um controle** para uma posição, isso muda só o visual ou também muda a ordem de captura MIDI?

**45.** O sistema precisa suportar **controles que não existem fisicamente** no teclado mas o usuário quer reservar no layout? (ex: "vou adicionar um pedal de sustain no futuro")

**46.** Um mesmo dispositivo físico pode ter **múltiplos layouts salvos**? Ex: StarryKey com layout padrão e layout "modo live"?

---

# Bloco 12 — Perfis em Profundidade

**47.** Um perfil é vinculado a **um dispositivo específico** ou pode funcionar com qualquer dispositivo conectado?

**48.** Você quer **importar/exportar perfis** para compartilhar com outras pessoas ou fazer backup?

**49.** Perfis podem ter **sub-perfis ou camadas**? Ex: perfil "Jogos" tem dentro dele "CS2", "Valorant" cada um com seus próprios mapeamentos?

**50.** Quando nenhum perfil específico está ativo, existe um **perfil padrão/global** que sempre funciona como fallback?

---

# Bloco 13 — Feedback e Notificações

**51.** Quando uma ação é executada, você quer algum **log** de atividade? (ex: "14:32:05 — PAD_A1 → Ctrl+M executado")

**52.** Você quer **notificações do sistema** (toast do Windows) para eventos importantes? Ex: MIDI desconectado, perfil trocado?

**53.** O app tem algum **modo de teste/debug** onde você aperta um controle e vê exatamente o que seria executado sem executar de verdade?

**54.** Para o feedback no MIDI quando troca perfil — você sabe se o StarryKey 25 suporta receber sinais MIDI de volta (MIDI out) para acender LEDs?

---

# Bloco 14 — Técnico e Distribuição

**55.** O app precisa funcionar **sem instalar Python** no PC do usuário final? (executável `.exe` standalone)

**56.** Você quer que o app tenha **atualização automática** ou o usuário baixa manualmente versões novas?

**57.** Dados do usuário (perfis, layouts, configurações) ficam:
- Na pasta do app (portátil, pode copiar para outro PC)
- Em `AppData` do Windows (padrão de apps Windows)
- Sincronizado na nuvem (requer conta)

**58.** Você pensa em ter uma **conta de usuário** no futuro para sincronizar perfis entre PCs ou compartilhar layouts publicamente?

**59.** O app precisa funcionar em **macOS ou Linux** também, ou só Windows por enquanto?

28- C e D
29- pensava mais em uma ação, "texto digitado" espera 1 ms  da enter, ou preencher formularios, tab pro próximo e etc, não sei, quero decidir as usabuilidades na hora, mas quero liberdade pra brincar com isso.
30- o usuario define, mas de opções, e o limite o usuario determina
31- gosto da liberdade, mas se um sript por fora resolver, não precisa deixaar complexo de mais, aaté o médio é legal, mais complexo o usuario cria o script
32- os dois, o simples a gente cria visualmente, complexo de mais o usuario cria por texto
33- sugira
34- sugira
35- na vertical, sidebar só de edição de algo direto e simples talvez, não quero parecer um saas e sim um sistema foda de mapeamento de MIDI's
36- sugira
37- semelhante a imagem enviado agora, mas não igual, apenas clean e direto assim, da especificação detalhada mas também aprimora as coisas deixando organizado e não poluido
38- depende o que faz sentido pro input feito, knob não faz sentido ter macro, pad não faz sentido ter nivel de seleção como volume de 0 a 100, afinal é clique, no maximo faria um +5 ou menos -5 por exemplo, sódeve aparecer o que é permitido.
39- só por automação ou script, mas sim
40- não, apenas clicar ou pressionar, mas cuidado, as vezes o clique rapido pode dar muito clique por ms não sei, mas não parece ser muuuito fiel de fato, o pressionado me sugere mais o botão debaixo do kinob do que pad
41- não, apenas o sistema deve reconhecer a posição e agir da maneira correta com base nisso
42- pode mas deve se manter o nome do pad para não fazer confusão
43- o usuario define se é algo isolado, um grupo de linha, um grupo de 4x2 e etc
44- só o visual
45- era no sentido de usar um f13 ou f24 em vez de A ou B, não de pedais do midi
46- sim, se o reconhecimento estiver errado o usuario pode reorganizar
47-a um dispositivo
48- sim 
49- não, isso eu organizo em pasta no meu pc
50- poderia ter
51- sim
52- precisa não
53- sim
54-  não sei
 55- a primeiro momento não
56- ele baixa
57- na pasta do app
58- não
59- windows por enquanto

