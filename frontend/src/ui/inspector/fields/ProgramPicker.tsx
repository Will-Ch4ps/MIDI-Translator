import { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { bridge } from "../../../lib/bridge";
import type { ProgramCatalog, ProgramItem } from "../../../lib/types";

type Props = { value: string; onPick: (program: ProgramItem) => void };

/** Guardado entre aberturas do painel: mostra na hora e atualiza por trás. */
let cached: ProgramCatalog | null = null;

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Escolher um programa aberto agora, ou buscar entre os instalados, sem caçar caminho. */
export function ProgramPicker({ value, onPick }: Props) {
  const [catalog, setCatalog] = useState<ProgramCatalog | null>(cached);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const refresh = () => {
    setLoading(true);
    setFailed(false);
    bridge.listPrograms()
      .then((fresh) => { cached = fresh; setCatalog(fresh); })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const q = normalize(query.trim());
  const match = (program: ProgramItem) => !q || normalize(program.name).includes(q);
  const running = catalog?.running.filter(match) ?? [];
  const installed = q ? (catalog?.installed.filter(match).slice(0, 40) ?? []) : [];

  const item = (program: ProgramItem, open: boolean) => (
    <button
      key={`${open}:${program.target}`}
      type="button"
      className={`program${program.target === value ? " is-on" : ""}`}
      aria-pressed={program.target === value}
      title={program.path || program.target}
      onClick={() => onPick(program)}
    >
      <span className="program__avatar" aria-hidden="true">{program.name.charAt(0).toUpperCase()}</span>
      <span className="program__name">{program.name}</span>
      {open && <span className="program__open">aberto</span>}
    </button>
  );

  return (
    <div className="picker">
      <div className="picker__search">
        <Search size={16} aria-hidden="true" className="picker__icon" />
        <input
          className="input picker__input"
          aria-label="Buscar programa"
          placeholder="Buscar programa aberto ou instalado…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="btn btn--tall" aria-label="Atualizar lista de programas" disabled={loading} onClick={refresh}>
          <RefreshCw size={15} aria-hidden="true" className={loading ? "spin" : undefined} />
        </button>
      </div>

      <div className="picker__list">
        {!catalog && !failed && <p className="hint picker__msg">Procurando programas…</p>}
        {failed && !catalog && <p className="hint picker__msg">Não consegui listar os programas. Use “Procurar…” abaixo.</p>}
        {catalog && (
          <>
            <div className="picker__group">Abertos agora</div>
            {running.length ? running.map((p) => item(p, true)) : <p className="hint picker__msg">{q ? "Nenhum aberto com esse nome." : "Nenhuma janela aberta."}</p>}
            {q ? (
              <>
                <div className="picker__group">Instalados</div>
                {installed.length ? installed.map((p) => item(p, false)) : <p className="hint picker__msg">Nada encontrado.</p>}
              </>
            ) : (
              <p className="hint picker__msg">Digite para buscar entre {catalog.installed.length} programas instalados.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
