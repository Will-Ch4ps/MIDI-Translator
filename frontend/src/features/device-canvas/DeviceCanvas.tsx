import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Disc3, Music2, ToggleRight, Sliders } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApp, useActiveDevice } from '../../state/store';
import type { Control, ControlKind } from '../../types/models';
import './DeviceCanvas.css';

const GRID = 56;

const KIND_ICONS: Partial<Record<ControlKind, LucideIcon>> = {
  pad: Disc3,
  key: Music2,
  knob_abs: Sliders,
  knob_rel: Sliders,
  fader: Sliders,
  button_toggle: ToggleRight,
  button_momentary: ToggleRight,
};

export function DeviceCanvas() {
  const device = useActiveDevice();
  const profile = useApp((s) => s.profile);
  const selectedId = useApp((s) => s.selectedControlId);
  const selectControl = useApp((s) => s.selectControl);
  const [size, setSize] = useState({ w: 800, h: 480 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  if (!device) {
    return <div className="canvas canvas--empty">Nenhum controlador ativo. Adicione um em Controladores.</div>;
  }

  const bounds = device.controls.reduce(
    (acc, c) => ({
      maxX: Math.max(acc.maxX, c.position.x + c.position.w),
      maxY: Math.max(acc.maxY, c.position.y + c.position.h),
    }),
    { maxX: 0, maxY: 0 },
  );
  const padX = 1;
  const padY = 1;
  const worldW = (bounds.maxX + padX * 2) * GRID;
  const worldH = (bounds.maxY + padY * 2) * GRID;
  const scale = Math.min(size.w / worldW, size.h / worldH, 1.5);

  return (
    <div className="canvas" ref={stageRef}>
      <div
        className="canvas__stage"
        style={{
          width: worldW,
          height: worldH,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {device.controls.map((control) => (
          <ControlBlock
            key={control.id}
            control={control}
            selected={selectedId === control.id}
            mapped={profile?.mappings.some((m) => m.control_id === control.id) ?? false}
            onSelect={() => selectControl(control.id)}
          />
        ))}
      </div>
      <CanvasGrid scale={scale} />
    </div>
  );
}

function ControlBlock({
  control,
  selected,
  mapped,
  onSelect,
}: {
  control: Control;
  selected: boolean;
  mapped: boolean;
  onSelect: () => void;
}) {
  const Icon = KIND_ICONS[control.kind] ?? Disc3;
  return (
    <motion.button
      type="button"
      className={clsx(
        'canvas__ctrl',
        `canvas__ctrl--${control.kind}`,
        selected && 'canvas__ctrl--selected',
        mapped && 'canvas__ctrl--mapped',
      )}
      style={{
        left: control.position.x * GRID,
        top: control.position.y * GRID,
        width: control.position.w * GRID,
        height: control.position.h * GRID,
      }}
      onClick={onSelect}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
    >
      <span className="canvas__ctrl-icon">
        <Icon size={14} strokeWidth={1.8} />
      </span>
      <span className="canvas__ctrl-label">{control.name}</span>
      {mapped ? <span className="canvas__ctrl-dot" /> : null}
    </motion.button>
  );
}

function CanvasGrid({ scale }: { scale: number }) {
  const spacing = GRID * scale;
  return (
    <svg className="canvas__grid" aria-hidden>
      <defs>
        <pattern id="dotgrid" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
          <circle cx={1} cy={1} r={1} fill="rgba(255,255,255,0.06)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>
  );
}
