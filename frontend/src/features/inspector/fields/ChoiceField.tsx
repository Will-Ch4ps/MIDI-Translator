import clsx from 'clsx';
import { motion } from 'framer-motion';
import './ChoiceField.css';

export function ChoiceField({
  value,
  onChange,
  choices,
}: {
  value: string;
  onChange: (value: string) => void;
  choices: string[];
}) {
  return (
    <div className="choice">
      {choices.map((choice) => (
        <button
          key={choice}
          type="button"
          className={clsx('choice__btn', value === choice && 'choice__btn--active')}
          onClick={() => onChange(choice)}
        >
          <span>{choice}</span>
          {value === choice ? (
            <motion.span layoutId="choice-active" className="choice__active" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
