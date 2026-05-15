import type { OptionGroup } from "./actionUtils";

type Props = {
  groups: OptionGroup[];
  actionType: string;
  onChange: (type: string) => void;
};

export function ActionTypeGroups({ groups, actionType, onChange }: Props) {
  return (
    <>
      {groups.map((group) => (
        <div className="ae-group" key={group.id}>
          <span className="ae-group-label">{group.label}</span>
          <div className="ae-chips">
            {group.items.map((item) => (
              <button className={`ae-chip ${actionType === item.type ? "selected" : ""}`} key={item.type} type="button" onClick={() => onChange(item.type)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
