import { callBackend } from "./backend";

const isTauri = () => "__TAURI_INTERNALS__" in window;

export type AudioTargetApp = {
  pid: number;
  name: string;
  path: string;
  display: string;
  target: string;
  volume: number | null;
};

export type AudioTargetCatalog = {
  targets: string[];
  apps: AudioTargetApp[];
};

export type TargetInspection = {
  status: "ok" | "warn" | "error" | "info";
  exists: boolean;
  resolved: string;
  name: string;
  args: string;
  message: string;
  matches?: AudioTargetApp[];
};

export async function listAudioTargetCatalog(): Promise<AudioTargetCatalog> {
  if (!isTauri()) {
    return {
      targets: ["master", "lol", "browser", "youtube", "discord", "spotify", "obs", "chrome.exe", "msedge.exe"],
      apps: [
        { pid: 1024, name: "leagueclientuxrender.exe", path: "D:/Riot Games/League of Legends/LeagueClientUxRender.exe", display: "LeagueClientUxRender", target: "leagueclientuxrender.exe", volume: 0.8 },
        { pid: 2048, name: "msedge.exe", path: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", display: "Microsoft Edge", target: "msedge.exe", volume: 0.5 },
      ],
    };
  }
  const data = await callBackend<AudioTargetCatalog>("list_audio_targets");
  return { targets: data.targets || [], apps: data.apps || [] };
}

export async function listAudioTargets(): Promise<string[]> {
  const data = await listAudioTargetCatalog();
  return data.targets;
}

export function inspectTarget(action_type: string, value: string): Promise<TargetInspection> {
  return callBackend<TargetInspection>("inspect_target", { action_type, value });
}
