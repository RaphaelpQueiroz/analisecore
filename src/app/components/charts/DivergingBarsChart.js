'use client';
import React, { useState } from 'react';

export default function DivergingBarsChart({ data = [], width = 380, height = 180 }) {
  const [tooltip, setTooltip] = useState(null);
  if (!data || data.length === 0) return null;

  const PAD = { top: 16, right: 16, bottom: 24, left: 36 };
  const W = width - PAD.left - PAD.right;
  const H = height - PAD.top - PAD.bottom;

  const maxAbs = Math.max(...data.map(d => Math.max(Math.abs(d.positive || 0), Math.abs(d.negative || 0))), 1);
  const midY = PAD.top + H / 2;

  const barW = Math.max(4, Math.floor(W / data.length) - 3);
  const barGap = W / data.length;

  const toBarH = (v) => (Math.abs(v) / maxAbs) * (H / 2 - 4);
  const toX = (i) => PAD.left + i * barGap + barGap / 2 - barW / 2;

  // Net accumulated line
  let cumulative = 0;
  const netPts = data.map((d, i) => {
    cumulative += (d.positive || 0) - (d.negative || 0);
    return [PAD.left + i * barGap + barGap / 2, midY - (cumulative / (maxAbs * data.length / 3)) * (H / 2 - 4)];
  });
  const netLine = netPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="div-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="div-red" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#F87171" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* Zero axis */}
      <line x1={PAD.left} y1={midY} x2={PAD.left + W} y2={midY} stroke="#cbd5e1" strokeWidth={1} />
      <text x={PAD.left - 4} y={midY + 4} fontSize={8} fill="#94a3b8" textAnchor="end" fontFamily="system-ui">0</text>

      {/* Bars */}
      {data.map((d, i) => {
        const posH = toBarH(d.positive || 0);
        const negH = toBarH(d.negative || 0);
        const x = toX(i);
        return (
          <g key={i}
            onMouseEnter={() => setTooltip({ d, x: x + barW / 2, i })}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Positive bar (up) */}
            <rect x={x} y={midY - posH} width={barW} height={posH} rx={2} fill="url(#div-blue)" />
            {/* Negative bar (down) */}
            <rect x={x} y={midY} width={barW} height={negH} rx={2} fill="url(#div-red)" />
            {/* X label */}
            {d.label && <text x={x + barW / 2} y={height - 2} fontSize={8} fill="#94a3b8" textAnchor="middle" fontFamily="system-ui">{d.label}</text>}
          </g>
        );
      })}

      {/* Net accumulated line */}
      <path d={netLine} stroke="#10B981" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {netPts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={1.5} fill="#10B981" />
      ))}

      {/* Tooltip */}
      {tooltip && (
        <g>
          <rect x={Math.min(tooltip.x - 32, width - 80)} y={PAD.top} width={78} height={48} rx={5} fill="#1e293b" />
          <text x={Math.min(tooltip.x - 32, width - 80) + 39} y={PAD.top + 14} fontSize={9} fontWeight={700} fill="white" textAnchor="middle" fontFamily="system-ui">{tooltip.d.label}</text>
          <text x={Math.min(tooltip.x - 32, width - 80) + 39} y={PAD.top + 27} fontSize={8} fill="#86efac" textAnchor="middle" fontFamily="system-ui">+{(tooltip.d.positive || 0).toFixed(0)}</text>
          <text x={Math.min(tooltip.x - 32, width - 80) + 39} y={PAD.top + 40} fontSize={8} fill="#fca5a5" textAnchor="middle" fontFamily="system-ui">-{(tooltip.d.negative || 0).toFixed(0)}</text>
        </g>
      )}
    </svg>
  );
}
