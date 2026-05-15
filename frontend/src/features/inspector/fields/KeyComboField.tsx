import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, RotateCcw } from 'lucide-react';
import { Button } from '../../../design';
import './KeyComboField.css';

const COMMON_SUGGESTIONS = [
  'ctrl+c',
  'ctrl+v',
  'ctrl+s',
  'ctrl+z',
  'ctrl+shift+z',
  'alt+tab',
  'windows+d',
  'windows+shift+s',
  'ctrl+t',
  'ctrl+w',
];

const MODIFIER_LABELS: Record<string, string> = {
  ctrl: 'Ctrl',
  control: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  windows: 'Win',
  meta: 'Win',
  command: 'Cmd',
};

export function KeyComboField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [capturing, setCapturing] = useState(false);
  const [draft, setDraft] = useState('');
  const tokens = parseTokens(value);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!capturing) return;
    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const combo = buildCombo(event);
      if (combo) {
        setDraft(combo);
      }
    };
    const handleUp = (event: KeyboardEvent) => {
      if (draft && !isModifier(event.key)) {
        onChange(draft);
        setCapturing(false);
        setDraft('');
      }
    };
    window.addEventListener('keydown', handler, true);
    window.addEventListener('keyup', handleUp, true);
    return () => {
      window.removeEventListener('keydown', handler, true);
      window.removeEventListener('keyup', handleUp, true);
    };
  }, [capturing, draft, onChange]);

  const currentTokens = capturing && draft ? parseTokens(draft) : tokens;

  return (
    <div className="kc" ref={wrapper}>
      <div className={`kc__capture ${capturing ? 'kc__capture--live' : ''}`}>
        <div className="kc__keys">
          <AnimatePresence>
            {currentTokens.length === 0 ? (
              <motion.span
                key="empty"
                className="kc__placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {capturing ? 'Aperte uma combinação…' : 'Nenhuma tecla definida'}
              </motion.span>
            ) : (
              currentTokens.map((token, idx) => (
                <motion.span
                  key={`${token}-${idx}`}
                  className="kbd kc__key"
                  layout
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 700, damping: 28 }}
                >
                  {prettyToken(token)}
                </motion.span>
              ))
            )}
          </AnimatePresence>
        </div>
        <div className="kc__capture-actions">
          {capturing ? (
            <Button
              size="sm"
              variant="danger"
              icon={<Square size={12} />}
              onClick={() => {
                setCapturing(false);
                setDraft('');
              }}
            >
              Parar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="subtle"
              icon={<Mic size={12} />}
              onClick={() => {
                setCapturing(true);
                wrapper.current?.focus();
              }}
            >
              Capturar
            </Button>
          )}
          {value ? (
            <Button size="sm" variant="ghost" icon={<RotateCcw size={12} />} onClick={() => onChange('')}>
              Limpar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="kc__suggestions">
        <span className="kc__sug-label">Sugestões</span>
        <div className="kc__sug-row">
          {COMMON_SUGGESTIONS.map((combo) => (
            <button
              key={combo}
              type="button"
              className={`kc__sug ${value === combo ? 'kc__sug--active' : ''}`}
              onClick={() => onChange(combo)}
            >
              {parseTokens(combo).map((t) => prettyToken(t)).join(' + ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function parseTokens(combo: string): string[] {
  return combo
    .split('+')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function prettyToken(token: string): string {
  if (MODIFIER_LABELS[token]) return MODIFIER_LABELS[token];
  if (token.length === 1) return token.toUpperCase();
  if (token === 'arrowleft') return '←';
  if (token === 'arrowright') return '→';
  if (token === 'arrowup') return '↑';
  if (token === 'arrowdown') return '↓';
  if (token === 'enter') return '⏎';
  if (token === 'space') return 'Space';
  if (token === 'tab') return 'Tab';
  if (token === 'escape') return 'Esc';
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function buildCombo(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (event.metaKey) parts.push('windows');
  const key = event.key.toLowerCase();
  if (!isModifier(event.key)) {
    parts.push(normalizeKey(key));
  }
  if (parts.length === 0 || (parts.every(isModifier))) return '';
  return parts.join('+');
}

function isModifier(key: string): boolean {
  const k = key.toLowerCase();
  return k === 'control' || k === 'ctrl' || k === 'alt' || k === 'shift' || k === 'meta' || k === 'windows';
}

function normalizeKey(key: string): string {
  if (key === ' ') return 'space';
  if (key === 'escape') return 'esc';
  return key;
}
