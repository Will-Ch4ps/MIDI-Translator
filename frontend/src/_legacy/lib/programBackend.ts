import { callBackend } from "./backend";

const isTauri = () => "__TAURI_INTERNALS__" in window;

export type RunningProgram = {
  pid: number;
  name: string;
  path: string;
  display: string;
  target: string;
};

export async function listRunningPrograms(): Promise<RunningProgram[]> {
  if (!isTauri()) {
    return [
      { pid: 1001, name: "leagueclientuxrender.exe", path: "D:/Riot Games/League of Legends/LeagueClientUxRender.exe", display: "LeagueClientUxRender", target: "D:/Riot Games/League of Legends/LeagueClientUxRender.exe" },
      { pid: 2002, name: "msedge.exe", path: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", display: "Microsoft Edge", target: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" },
    ];
  }
  const data = await callBackend<{ apps: RunningProgram[] }>("list_running_programs");
  return data.apps || [];
}
