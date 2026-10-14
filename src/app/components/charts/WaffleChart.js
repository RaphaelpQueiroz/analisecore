'use client';
import React from 'react';

export default function WaffleChart({ segments = [], size = 220 }) {
  // segments: [{ label, value, pct, color, gradId }]
  // Build 100 cells array
  const cells = [];
  let filled = 0;
  segments.forEach((seg, si) => {
    const count = Math.round(seg.pct || 0);
    for (let j = 0; j < count && cells.length < 100; j++) {
      cells.push(si);
    }
  });
  while (cells.length < 100) cells.push(segments.length - 1);

  const gap = 3;
  const cellSize = (size - gap * 11) / 10;

  const GRAD_DEFS = [
    { id: 'wf0', c1: '#3B82F6', c2: '#2563EB' },
    { id: 'wf1', c1: '#22D3EE', c2: '#0891B2' },
    { id: 'wf2', c1: '#A78BFA', c2: '#7C3AED' },
    { id: 'wf3', c1: '#FCD34D', c2: '#F59E0B' },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        {GRAD_DEFS.map(g => (
          <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={g.c1} />
            <stop offset="100%" stopColor={g.c2} />
          </linearGradient>
        ))}
      </defs>
      {cells.map((segIdx, ci) => {
        const col = ci % 10;
        const row = Math.floor(ci / 10);
        const x = col * (cellSize + gap);
        const y = row * (cellSize + gap);
        const gId = GRAD_DEFS[segIdx % GRAD_DEFS.length]?.id || 'wf0';
        return (
          <rect
            key={ci}
            x={x} y={y}
            width={cellSize} height={cellSize}
            rx={3}
            fill={`url(#${gId})`}
            opacity={segments[segIdx] ? 1 : 0.2}
          />
        );
      })}
    </svg>
  );
}
