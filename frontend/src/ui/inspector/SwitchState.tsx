type Props = { on: boolean | undefined };

/** Estado atual de um botão liga/desliga e ideias do que fazer com ele. */
export function SwitchState({ on }: Props) {
  return (
    <div className="switch-state">
      <div className="switch-state__now">
        <span className={`tile__led${on ? " is-on" : ""}`} aria-hidden="true" />
        {on === undefined
          ? "Estado desconhecido: mude o botão uma vez com o listener ligado."
          : on ? "Agora: ligado" : "Agora: desligado"}
      </div>
      <p className="hint">
        Este botão fica ligado ou desligado, então tem duas regras separadas. Ideias: ao ligar, abrir os
        programas do trabalho; ao desligar, um comando que fecha eles. Para algo que já alterna sozinho
        (mudo, play/pause), configure uma vez e marque “fazer o mesmo”.
      </p>
    </div>
  );
}
