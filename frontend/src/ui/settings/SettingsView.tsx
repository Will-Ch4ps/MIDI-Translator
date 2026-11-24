import type { ReactNode } from "react";
import type { Bootstrap } from "../../lib/types";
import type { AppState } from "../../state/useApp";
import { Switch } from "./Switch";
import "./settings.css";

type Props = { app: AppState; data: Bootstrap };

export function SettingsView({ app, data }: Props) {
  const { listener } = app;
  const ports = data.midiPorts;

  return (
    <main className="settings">
      <div>
        <h1>Configurações</h1>
        <p className="muted">Coisas que você ajusta uma vez e esquece.</p>
      </div>

      <section className="card settings__section" aria-labelledby="s-boot">
        <h2 id="s-boot" className="card__title">Inicialização</h2>
        <Row title="Iniciar com o Windows" desc="Abre minimizado na bandeja quando o PC liga.">
          <Switch label="Iniciar com o Windows" on={listener.autostart} disabled={listener.busy} onChange={(on) => void listener.setAutostart(on)} />
        </Row>
        <Row title="Já começar ouvindo o teclado" desc="Quando abrir junto com o Windows, liga o listener sozinho.">
          <Switch label="Já começar ouvindo o teclado" on={listener.autoListen} onChange={listener.setAutoListen} />
        </Row>
      </section>

      <section className="card settings__section" aria-labelledby="s-midi">
        <h2 id="s-midi" className="card__title">Teclado MIDI</h2>
        <Row title="Porta usada" desc={ports.length ? "Detectada automaticamente pelo nome do StarryKey." : "Nenhuma porta MIDI encontrada. Conecte o teclado e reabra o app."}>
          <span className="settings__value">{data.preferredPort || ports[0] || "—"}</span>
        </Row>
        {ports.length > 1 && (
          <Row title="Outras portas encontradas" desc={ports.filter((p) => p !== data.preferredPort).join(" · ")}>
            <span />
          </Row>
        )}
        <Row title="Mapa do controlador" desc={`${data.layout.name} · ${data.layout.controls.filter((c) => c.type === "pad_bank").length} pads, 4 knobs, 4 botões, 25 teclas`}>
          <span />
        </Row>
      </section>

      <section className="card settings__section" aria-labelledby="s-data">
        <h2 id="s-data" className="card__title">Seus dados</h2>
        <Row title="Vínculos salvos" desc={`${data.profile.mappings.length} vínculos no perfil “${data.profile.name}”. Ficam no arquivo abaixo; copie-o para fazer backup.`}>
          <span />
        </Row>
        <code className="settings__path">profiles\{data.profile.name}.json</code>
      </section>
    </main>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="settings__row">
      <div className="settings__text">
        <div className="settings__title">{title}</div>
        <div className="muted">{desc}</div>
      </div>
      {children}
    </div>
  );
}
