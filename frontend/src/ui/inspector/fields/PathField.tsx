import { useEffect, useState } from "react";
import { bridge } from "../../../lib/bridge";
import type { Form } from "../../../lib/actions";
import type { TargetInspection } from "../../../lib/types";

type Props = {
  kind: "app_launch" | "script";
  label: string;
  form: Form;
  set: (patch: Partial<Form>) => void;
};

/** Caminho de programa/script com "Procurar…" e verificação se o arquivo existe. */
export function PathField({ kind, label, form, set }: Props) {
  const check = useInspection(kind, form.path);

  const browse = async () => {
    const picked = kind === "app_launch" ? await bridge.pickProgram() : await bridge.pickFile("script");
    if (picked) set({ path: picked });
  };

  return (
    <div className="field">
      <label htmlFor="path-input">{label}</label>
      <span className="field__row">
        <input
          id="path-input"
          className="input input--mono"
          value={form.path}
          placeholder={kind === "script" ? ".vbs, .ps1, .bat ou .py" : "Caminho do .exe, atalho .lnk ou shell:AppsFolder\\…"}
          onChange={(e) => set({ path: e.target.value })}
        />
        <button type="button" className="btn btn--tall" onClick={() => void browse()}>Procurar…</button>
      </span>
      {check && <span className={`field__check field__check--${check.status}`}>{check.message}</span>}
    </div>
  );
}

function useInspection(kind: string, value: string) {
  const [result, setResult] = useState<TargetInspection | null>(null);
  useEffect(() => {
    if (!value.trim()) {
      setResult(null);
      return;
    }
    let alive = true;
    const timer = window.setTimeout(() => {
      bridge.inspectTarget(kind, value).then((r) => alive && setResult(r.message ? r : null)).catch(() => {});
    }, 400);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [kind, value]);
  return result;
}
