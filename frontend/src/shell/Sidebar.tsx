import { motion } from 'framer-motion';
import {
  Home,
  Cpu,
  PenLine,
  Plug,
  Layers,
  Wand,
  Activity,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Tooltip } from '../design';
import type { Route } from '../state/store';
import { useApp } from '../state/store';
import './Sidebar.css';

type Item = { id: Route; label: string; icon: LucideIcon; shortcut?: string };

const ITEMS: Item[] = [
  { id: 'home', label: 'Início', icon: Home, shortcut: '⌘ 1' },
  { id: 'devices', label: 'Controladores', icon: Cpu, shortcut: '⌘ 2' },
  { id: 'editor', label: 'Editor', icon: PenLine, shortcut: '⌘ 3' },
  { id: 'connections', label: 'Conexões', icon: Plug, shortcut: '⌘ 4' },
  { id: 'profiles', label: 'Perfil & Camadas', icon: Layers, shortcut: '⌘ 5' },
  { id: 'macros', label: 'Macros & Recipes', icon: Wand, shortcut: '⌘ 6' },
  { id: 'live', label: 'Live Monitor', icon: Activity, shortcut: '⌘ 7' },
];

export function Sidebar() {
  const route = useApp((s) => s.route);
  const setRoute = useApp((s) => s.setRoute);
  return (
    <aside className="sidebar glass">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden>
          <span className="sidebar__logo-dot" />
          <span className="sidebar__logo-dot" />
          <span className="sidebar__logo-dot" />
        </div>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">MIDI Studio</span>
          <span className="sidebar__brand-sub">v0.2 · multi-device</span>
        </div>
      </div>
      <nav className="sidebar__nav">
        {ITEMS.map((item) => (
          <Tooltip key={item.id} content={item.label} side="right" shortcut={item.shortcut}>
            <button
              type="button"
              className={`sidebar__item${route === item.id ? ' sidebar__item--active' : ''}`}
              onClick={() => setRoute(item.id)}
            >
              <span className="sidebar__icon">
                <item.icon size={18} strokeWidth={1.75} />
              </span>
              <span className="sidebar__label">{item.label}</span>
              {route === item.id ? (
                <motion.span layoutId="sidebar-active" className="sidebar__active-bg" />
              ) : null}
            </button>
          </Tooltip>
        ))}
      </nav>
      <div className="sidebar__footer">
        <Tooltip content="Configurações" side="right" shortcut="⌘ ,">
          <button
            type="button"
            className={`sidebar__item${route === 'settings' ? ' sidebar__item--active' : ''}`}
            onClick={() => setRoute('settings')}
          >
            <span className="sidebar__icon">
              <Settings size={18} strokeWidth={1.75} />
            </span>
            <span className="sidebar__label">Configurações</span>
            {route === 'settings' ? (
              <motion.span layoutId="sidebar-active" className="sidebar__active-bg" />
            ) : null}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
