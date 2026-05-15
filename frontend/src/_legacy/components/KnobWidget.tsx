type Props = {
  value: number;   // 0..127
  size?: number;
  selected?: boolean;
  mapped?: boolean;
};

export function KnobWidget({ value, size = 52, selected = false, mapped = false }: Props) {
  // -135deg a +135deg (270deg de range total)
  const angle = -135 + (value / 127) * 270;
  const r = (size / 2) - 4;
  const cx = size / 2;
  const cy = size / 2;

  // Arco de fundo
  const startAngle = -135;
  const endAngle = angle;
  const arcPath = describeArc(cx, cy, r, startAngle, endAngle);

  const trackPath = describeArc(cx, cy, r, -135, 135);

  // Posição do indicador (linha)
  const rad = (angle - 90) * (Math.PI / 180);
  const ix = cx + (r - 4) * Math.cos(rad);
  const iy = cy + (r - 4) * Math.sin(rad);

  const accent = selected ? "#60d4ff" : mapped ? "#47b8ff" : "#3a7db8";
  const trackColor = selected ? "rgba(96,212,255,0.15)" : "rgba(58,125,184,0.2)";

  return (
    <svg
      className="knob-svg"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Track de fundo */}
      <path
        d={trackPath}
        fill="none"
        stroke={trackColor}
        strokeLinecap="round"
        strokeWidth="3"
      />
      {/* Arco de valor */}
      {value > 0 && (
        <path
          d={arcPath}
          fill="none"
          stroke={accent}
          strokeLinecap="round"
          strokeWidth="3"
        />
      )}
      {/* Corpo do knob */}
      <circle
        cx={cx}
        cy={cy}
        fill={selected ? "url(#knob-sel)" : "url(#knob-bg)"}
        r={r - 6}
        stroke={accent}
        strokeWidth="1"
      />
      {/* Indicador de posição */}
      <line
        stroke={selected ? "#fff" : "#c8e6ff"}
        strokeLinecap="round"
        strokeWidth="2"
        x1={cx}
        x2={ix}
        y1={cy}
        y2={iy}
      />
      <defs>
        <radialGradient cx="40%" cy="35%" id="knob-bg" r="60%">
          <stop offset="0%" stopColor="#2a4a6e" />
          <stop offset="100%" stopColor="#0d1e30" />
        </radialGradient>
        <radialGradient cx="40%" cy="35%" id="knob-sel" r="60%">
          <stop offset="0%" stopColor="#2d6a9f" />
          <stop offset="100%" stopColor="#0e2a45" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}