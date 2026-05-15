type Props = {
  value: string;
  onChange: (value: string) => void;
};

type KeyDef = { token: string; w?: "sm" | "md" | "lg" | "xl" | "space"; tone?: "main" | "mod" | "fn" };
type RowDef = { label: string; keys: KeyDef[] };

const rows: RowDef[] = [
  { label: "Function", keys: ["esc", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12"].map((item) => tokenize(item, "fn")) },
  { label: "Extended", keys: ["f13", "f14", "f15", "f16", "f17", "f18", "f19", "f20", "f21", "f22", "f23", "f24", "f25"].map((item) => tokenize(item, "fn")) },
  { label: "Linha 1", keys: [w("tab", "md", "mod"), "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", w("backspace", "xl", "mod")].map((item) => tokenize(item, "main")) },
  { label: "Linha 2", keys: [w("caps", "md", "mod"), "a", "s", "d", "f", "g", "h", "j", "k", "l", w("enter", "lg", "mod")].map((item) => tokenize(item, "main")) },
  { label: "Linha 3", keys: [w("shift", "lg", "mod"), "z", "x", "c", "v", "b", "n", "m", w("shift", "md", "mod"), w("up", "sm", "mod")].map((item) => tokenize(item, "main")) },
  { label: "Mods", keys: [w("ctrl", "md", "mod"), w("alt", "sm", "mod"), w("windows", "sm", "mod"), w("space", "space", "main"), w("left", "sm", "mod"), w("down", "sm", "mod"), w("right", "sm", "mod")].map((item) => tokenize(item, "main")) },
];

const order = [
  "ctrl", "shift", "alt", "windows", "tab", "esc", "space", "enter", "backspace",
  ...Array.from({ length: 25 }, (_, i) => `f${i + 1}`),
  ..."qwertyuiopasdfghjklzxcvbnm0123456789".split(""),
  "left", "down", "up", "right", "caps",
];

export function ShortcutKeyboard({ value, onChange }: Props) {
  const selected = new Set(tokens(value));
  const preview = sortTokens([...selected]);

  function toggle(token: string) {
    if (selected.has(token)) selected.delete(token);
    else selected.add(token);
    onChange(sortTokens([...selected]).join("+"));
  }

  return (
    <div className="shortcut-keyboard modern">
      <div className="shortcut-preview">
        {preview.length > 0 ? preview.map((token) => <span key={token}>{label(token)}</span>) : <em>Clique nas teclas para compor o atalho</em>}
      </div>
      {rows.map((row) => (
        <div className="shortcut-row-wrap" key={row.label}>
          <label>{row.label}</label>
          <div className="shortcut-row">
            {row.keys.map((key, itemIndex) => (
            <button
              className={`shortcut-key ${size(key.w)} ${key.tone || "main"} ${selected.has(key.token) ? "selected" : ""}`}
              key={`${key.token}-${itemIndex}`}
              type="button"
              onClick={() => toggle(key.token)}
            >
              {label(key.token)}
            </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function tokenize(item: string | KeyDef, tone: KeyDef["tone"]) {
  return typeof item === "string" ? { token: item, tone } : { ...item, tone: item.tone || tone };
}

function w(token: string, width: KeyDef["w"], tone: KeyDef["tone"]): KeyDef {
  return { token, w: width, tone };
}

function size(width: KeyDef["w"]) {
  return width ? `w-${width}` : "";
}

function tokens(value: string) {
  return value.split("+").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function sortTokens(items: string[]) {
  const bucket = new Map(order.map((token, index) => [token, index]));
  return [...new Set(items)].sort((a, b) => (bucket.get(a) ?? 999) - (bucket.get(b) ?? 999) || a.localeCompare(b));
}

function label(token: string) {
  if (token === "windows") return "Win";
  if (token === "space") return "Space";
  if (token.startsWith("f")) return token.toUpperCase();
  if (token.length === 1) return token.toUpperCase();
  if (["up", "down", "left", "right"].includes(token)) return token[0].toUpperCase() + token.slice(1);
  return token[0].toUpperCase() + token.slice(1);
}
