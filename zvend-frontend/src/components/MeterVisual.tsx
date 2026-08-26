import type { CSSProperties } from 'react'

const DISC_CX = 164
const DISC_CY = 84
const DISC_R = 24

export function MeterVisual({
  number,
  label = 'Zvend',
  className = '',
}: {
  number?: string
  label?: string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 220 130"
      className={className}
      role="img"
      aria-label={`Electricity meter ${number ?? ''}`}
    >
      <defs>
        <linearGradient id="zvBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="zvScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1220" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <filter id="zvSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#00000040" />
        </filter>
        <filter id="zvGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#zvSoft)">
        <rect x="10" y="10" width="200" height="110" rx="22" fill="url(#zvBody)" stroke="#64748b44" />
        <rect x="16" y="16" width="188" height="98" rx="17" fill="none" stroke="#ffffff66" />
      </g>

      <rect x="30" y="28" width="122" height="54" rx="9" fill="url(#zvScreen)" stroke="#334155" />

      <text x="42" y="45" fontSize="9" fontWeight="700" letterSpacing="1.5" fill="#7dd3fc">
        {label.toUpperCase()} · METER
      </text>

      <text
        x="42"
        y="70"
        fontSize="19"
        fontWeight="800"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#4ade80"
        className="meter-digit"
        filter="url(#zvGlow)"
      >
        {number ?? '······'}
      </text>

      <g className="meter-scanline" transform="translate(30 0)">
        <rect x="0" y="0" width="122" height="2" rx="1" fill="#38bdf8" opacity="0" />
      </g>

      <circle cx="164" cy="46" r="5" fill="#f59e0b" className="meter-led" filter="url(#zvGlow)" />

      <g>
        <circle cx={DISC_CX} cy={DISC_CY} r={DISC_R} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
        <circle cx={DISC_CX} cy={DISC_CY} r={DISC_R - 4} fill="none" stroke="#cbd5e1" strokeWidth="1" />
        <g
          className="meter-disc-spin"
          style={{ transformOrigin: `${DISC_CX}px ${DISC_CY}px` } as CSSProperties}
        >
          <path
            d={`M ${DISC_CX} ${DISC_CY} L ${DISC_CX + DISC_R} ${DISC_CY} A ${DISC_R} ${DISC_R} 0 0 1 ${DISC_CX} ${DISC_CY + DISC_R} Z`}
            fill="#64748b"
            opacity="0.85"
          />
          <path
            d={`M ${DISC_CX} ${DISC_CY} L ${DISC_CX} ${DISC_CY - DISC_R} A ${DISC_R} ${DISC_R} 0 0 1 ${DISC_CX + DISC_R * 0.7} ${DISC_CY - DISC_R * 0.7} Z`}
            fill="#334155"
            opacity="0.9"
          />
        </g>
        <circle cx={DISC_CX} cy={DISC_CY} r="3" fill="#475569" />
      </g>

      <g stroke="#64748b" strokeWidth="1.5">
        <rect x="31" y="96" width="120" height="10" rx="2" fill="#0f172a" opacity="0.9" />
        <path d="M33 99h7v4h-7zM42 97h5v8h-5zM49 99h6v4h-6zM57 96h4v10h-4zM63 99h7v4h-7zM72 97h5v8h-5zM79 100h6v2h-6zM87 96h4v10h-4zM93 99h7v4h-7zM102 97h5v8h-5zM109 100h6v2h-6zM117 96h5v10h-5z" fill="#cbd5e1" />
      </g>
    </svg>
  )
}
