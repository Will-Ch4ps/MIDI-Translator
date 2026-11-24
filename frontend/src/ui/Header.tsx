import type { ListenerState } from "../state/useListener";

export type View = "map" | "settings";

type Props = { view: View; onView: (view: View) => void; listener: ListenerState };

/** "STARRYKEY 25 0" → "STARRYKEY 25" (o Windows põe um índice no fim do nome da porta). */
const portName = (port: string | null) => (port ?? "teclado").replace(/\s+\d+$/, "");

export function Header({ view, onView, listener }: Props) {
  const tab = (id: View, label: string) => (
    <button
      type="button"
      className={`nav__tab${view === id ? " is-on" : ""}`}
      aria-current={view === id ? "page" : undefined}
      onClick={() => onView(id)}
    >
      {label}
    </button>
  );

  return (
    <header className="header">
      <div className="brand">
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
          <rect width="28" height="28" rx="8" fill="#4DA3FF" />
          <path d="M8 19V9l6 6 6-6v10" fill="none" stroke="#06111E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        MIDITranslate
      </div>
      <nav className="nav" aria-label="Principal">
        {tab("map", "Mapear")}
        {tab("settings", "Configurações")}
      </nav>
      <div className="header__spacer" />
      <div className={`status${listener.running ? " is-on" : ""}`} role="status">
        <span className="status__dot" />
        {listener.running ? `Ouvindo · ${portName(listener.port)}` : "Parado"}
      </div>
      <button
        type="button"
        className={listener.running ? "btn" : "btn btn--primary"}
        disabled={listener.busy}
        onClick={() => void listener.toggle()}
      >
        {listener.busy ? "Aguarde…" : listener.running ? "Parar" : "Ouvir teclado"}
      </button>
    </header>
  );
}
