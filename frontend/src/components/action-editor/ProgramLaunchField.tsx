import type { RunningProgram } from "../../lib/programBackend";

type Option = { value: string; label: string };

const GLOBAL_PROGRAM_OPTIONS: Option[] = [
  { value: "explorer.exe", label: "Explorador de Arquivos" },
  { value: "notepad.exe", label: "Bloco de Notas" },
  { value: "calc.exe", label: "Calculadora" },
  { value: "mspaint.exe", label: "Paint" },
  { value: "taskmgr.exe", label: "Gerenciador de Tarefas" },
  { value: "cmd.exe", label: "Prompt de Comando" },
  { value: "powershell.exe", label: "PowerShell" },
  { value: "wt.exe", label: "Windows Terminal" },
];

type Props = {
  actionType: string;
  value: string;
  runningApps: RunningProgram[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onValueChange: (value: string) => void;
};

export function ProgramLaunchField(props: Props) {
  const { actionType, value, runningApps, loading, onRefresh, onValueChange } = props;
  if (actionType !== "app_launch") return null;

  return (
    <div className="field">
      <label>Vinculo global</label>
      <select value={globalValue(value)} onChange={(event) => onValueChange(event.target.value)}>
        <option value="">Selecione uma opcao</option>
        {GLOBAL_PROGRAM_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
      <small className="field-help">Use opcoes globais para abrir apps comuns rapidamente.</small>

      <div className="capture-row">
        <button className="ghost-button fit" type="button" onClick={() => void onRefresh()}>
          {loading ? "Atualizando apps..." : "Atualizar apps abertos"}
        </button>
      </div>

      {runningApps.length > 0 && (
        <>
          <label>Programas abertos</label>
          <div className="volume-app-grid">
            {runningApps.slice(0, 10).map((app) => (
              <button
                className={`volume-app-chip ${isSelected(value, app) ? "selected" : ""}`}
                key={`${app.name}-${app.pid}`}
                type="button"
                onClick={() => onValueChange(app.target || app.path || app.name)}
              >
                <strong>{app.display || app.name}</strong>
                <span>{app.name} - pid {app.pid}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function globalValue(value: string) {
  const raw = value.trim().toLowerCase();
  if (!raw) return "";
  const leaf = raw.replace(/\\/g, "/").split("/").pop() || raw;
  return GLOBAL_PROGRAM_OPTIONS.some((item) => item.value === leaf) ? leaf : "";
}

function isSelected(value: string, app: RunningProgram) {
  const raw = value.trim().toLowerCase();
  if (!raw) return false;
  const leaf = raw.replace(/\\/g, "/").split("/").pop() || raw;
  return (
    leaf === app.name.toLowerCase()
    || raw === String(app.path || "").toLowerCase()
    || raw === String(app.target || "").toLowerCase()
  );
}
