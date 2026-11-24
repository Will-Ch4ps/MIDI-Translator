import { KIND_TAG, kindOf } from "../../lib/actions";
import { primary } from "../../lib/layout";
import type { Mapping } from "../../lib/types";

type Props = {
  id: string;
  name: string;
  mappings: Mapping[];
  selected: boolean;
  hit: boolean;
  compact?: boolean;
  onSelect: (id: string) => void;
};

/** Um pad ou botão: número/nome em cima, o que ele faz embaixo. */
export function ControlTile({ id, name, mappings, selected, hit, compact, onSelect }: Props) {
  const main = primary(mappings);
  const kind = kindOf(main);
  const extra = mappings.length - 1;
  const cls = ["tile", compact && "tile--compact", !main && "tile--free", selected && "is-selected", hit && "is-hit"]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cls}
      aria-pressed={selected}
      aria-label={`${name}: ${main ? main.label || "sem nome" : "livre"}`}
      onClick={() => onSelect(id)}
    >
      <span className="tile__top">
        <span className="tile__name">{name}</span>
        {kind && <span className="tag">{KIND_TAG[kind]}</span>}
      </span>
      {main ? (
        <span className="tile__label">{main.label || "Sem nome"}</span>
      ) : (
        <span className="tile__free">{compact ? "Livre" : "+ Vincular"}</span>
      )}
      {extra > 0 && <span className="tile__more">+{extra} gatilho{extra > 1 ? "s" : ""}</span>}
    </button>
  );
}
