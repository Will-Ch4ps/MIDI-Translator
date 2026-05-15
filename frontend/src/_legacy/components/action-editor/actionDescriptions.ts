import type { ActionExample } from "./actionUtils";

export function valueLabel(type: string) {
  if (type === "key") return "Atalho";
  if (type === "macro") return "Sequencia da macro";
  if (type === "app_launch") return "Programa";
  if (type === "script") return "Script";
  if (type === "command") return "Comando";
  if (type === "volume_set") return "Alvo de volume";
  if (type.startsWith("volume")) return "Passo em %";
  return "Valor";
}

export function placeholderFor(type: string) {
  if (type === "key") return "ctrl+shift+p";
  if (type === "macro") return "ctrl+c\nctrl+v";
  if (type === "app_launch") return "C:\\Program Files\\App\\App.exe";
  if (type === "script") return "D:\\scripts\\acao.ps1";
  if (type === "command") return "nircmd.exe mutesysvolume 2";
  if (type === "volume_set") return "master ou nome do processo (.exe)";
  if (type.startsWith("volume")) return "5";
  return "Digite o valor";
}

export function actionHelp(type: string) {
  if (type === "key") return "Use um unico atalho. Exemplo: ctrl+shift+p ou F13.";
  if (type === "macro") return "Uma linha por atalho. O sistema executa na ordem.";
  if (type === "app_launch") return "Use vinculo global, programa aberto ou caminho completo.";
  if (type === "script") return "Escolha um script e, se quiser, passe argumentos separados por espaco.";
  if (type === "command") return "Comando executado no shell do Windows. Use com cuidado.";
  if (type === "volume_set") return "Use vinculo global ou escolha um app de audio aberto.";
  if (type.startsWith("volume")) return "Valor em porcentagem para cada passo de volume.";
  return "Configure o valor da acao.";
}

export function actionExamples(type: string): ActionExample[] {
  if (type === "key") return [{ label: "F13", value: "f13" }, { label: "Ctrl+Shift+P", value: "ctrl+shift+p" }];
  if (type === "macro") return [{ label: "Copiar e colar", value: "ctrl+c\nctrl+v" }, { label: "Salvar e build", value: "ctrl+s\nf5" }];
  if (type === "command") return [{ label: "Mute volume", value: "nircmd.exe mutesysvolume 2" }, { label: "Alt tab", value: "nircmd.exe sendkeypress alt+tab" }];
  return [];
}

export function optionLabel(type: string) {
  if (type === "key") return "Atalho";
  if (type === "macro") return "Macro";
  if (type === "media_play") return "Play/Pause";
  if (type === "media_next") return "Midia +";
  if (type === "media_prev") return "Midia -";
  if (type === "volume_up") return "Volume +";
  if (type === "volume_down") return "Volume -";
  if (type === "volume_mute") return "Mute";
  if (type === "volume_set") return "Volume continuo";
  if (type === "app_launch") return "Abrir programa";
  if (type === "command") return "Comando";
  return "Script";
}
