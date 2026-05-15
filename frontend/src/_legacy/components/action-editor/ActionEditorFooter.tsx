import { Check, PlayCircle, Trash2 } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type TestStatus = "idle" | "running" | "done" | "error";

type Props = {
  saveStatus: SaveStatus;
  testStatus: TestStatus;
  errorMsg: string;
  onTest: () => void;
  onSave: () => void;
  onDelete: () => void | Promise<void>;
};

export function ActionEditorFooter({ saveStatus, testStatus, errorMsg, onTest, onSave, onDelete }: Props) {
  return (
    <div className="editor-actions">
      <button className={`ghost-button ${testStatus === "done" ? "active" : ""}`} disabled={testStatus === "running"} type="button" onClick={onTest}>
        <PlayCircle size={13} />{testStatus === "running" ? "Testando..." : "Testar acao"}
      </button>
      <button className={`ae-save-btn ${saveStatus}`} disabled={saveStatus === "saving"} type="button" onClick={onSave}>
        {saveStatus === "saving" && <span className="ae-spinner" />}
        {saveStatus === "saved" && <Check size={13} />}
        {saveStatus === "saving" ? "Salvando..." : saveStatus === "saved" ? "Salvo!" : "Salvar"}
      </button>
      <button className="ae-delete-btn" disabled={saveStatus === "saving"} type="button" onClick={onDelete}><Trash2 size={13} />Limpar</button>
      {saveStatus === "error" && <span className="ae-error">{errorMsg}</span>}
    </div>
  );
}
