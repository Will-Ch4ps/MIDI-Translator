import { Field } from '../../design';
import type { Mapping } from '../../types/models';
import type { ActionDef, ParamField } from '../../types/models';
import { KeyComboField } from './fields/KeyComboField';
import { TextField } from './fields/TextField';
import { NumberField } from './fields/NumberField';
import { ChoiceField } from './fields/ChoiceField';
import { BoolField } from './fields/BoolField';
import { AudioTargetField } from './fields/AudioTargetField';
import { PathField } from './fields/PathField';
import { MacroStepsField } from './fields/MacroStepsField';
import './ActionParamsForm.css';

export function ActionParamsForm({
  mapping,
  definition,
  mode,
}: {
  mapping: Mapping;
  definition: ActionDef | undefined;
  mode: 'basic' | 'advanced' | 'expert';
}) {
  if (!definition) {
    return <p className="form__empty">Defina uma ação para configurar parâmetros.</p>;
  }
  const fields = definition.params_schema.fields;
  if (fields.length === 0) {
    return <p className="form__empty">Esta ação não precisa de parâmetros.</p>;
  }
  return (
    <div className="form">
      {fields.map((field) => (
        <FieldRenderer
          key={field.name}
          field={field}
          value={mapping.action.params[field.name] ?? field.default}
          onChange={(value) => {
            mapping.action.params[field.name] = value;
          }}
        />
      ))}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: ParamField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <Field
      label={field.label || field.name}
      hint={field.description}
      required={field.required}
    >
      {renderControl(field, value, onChange)}
    </Field>
  );
}

function renderControl(field: ParamField, value: unknown, onChange: (value: unknown) => void) {
  switch (field.type) {
    case 'key_combo':
      return <KeyComboField value={String(value ?? '')} onChange={onChange} />;
    case 'string':
      return <TextField value={String(value ?? '')} onChange={onChange} placeholder={field.description} />;
    case 'text':
      return <TextField value={String(value ?? '')} onChange={onChange} multiline />;
    case 'int':
      return <NumberField value={Number(value ?? 0)} onChange={onChange} integer min={field.min ?? undefined} max={field.max ?? undefined} />;
    case 'float':
      return <NumberField value={Number(value ?? 0)} onChange={onChange} min={field.min ?? undefined} max={field.max ?? undefined} step={0.01} />;
    case 'bool':
      return <BoolField value={Boolean(value)} onChange={onChange} />;
    case 'choice':
      return <ChoiceField value={String(value ?? '')} onChange={onChange} choices={field.choices.map(String)} />;
    case 'audio_target':
      return <AudioTargetField value={String(value ?? 'master')} onChange={onChange} />;
    case 'path':
      return <PathField value={String(value ?? '')} onChange={onChange} />;
    case 'macro_steps':
      return <MacroStepsField value={Array.isArray(value) ? value : []} onChange={onChange} />;
    case 'kv':
      return <TextField value={String(value ?? '')} onChange={onChange} multiline placeholder="key=value por linha" />;
    default:
      return <TextField value={String(value ?? '')} onChange={onChange} />;
  }
}
