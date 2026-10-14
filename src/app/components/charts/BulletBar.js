'use client';
import React from 'react';

export default function BulletBar({ value = 2.6, target = 3.0, max = 6.0, color = '#0ea5e9', width = 120, height = 28 }) {
  const fillPct = Math.min(value / max, 1);
  const targetPct = Math.min(target / max, 1);
  const barH = 8;
  const barY = (height - barH) / 2;
  return (
    <div style={{ width: width + 'px' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="bbar-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {/* Track */}
        <rect x={0} y={barY} width={width} height={barH} rx={4} fill="#f1f5f9" />
        {/* Fill */}
        <rect x={0} y={barY} width={fillPct * width} height={barH} rx={4} fill={`url(#bbar-grad)`} />
        {/* Target marker */}
        <rect x={targetPct * width - 1} y={barY - 3} width={2} height={barH + 6} rx={1} fill="#1e293b" />
        {/* Value label */}
        <text x={fillPct * width - 2} y={barY - 5} fontSize="9" fontWeight="700" fill={color} textAnchor="end" fontFamily="system-ui">{value.toFixed(1)}%</text>
        {/* Target label */}
        <text x={targetPct * width} y={height - 1} fontSize="8" fontWeight="600" fill="#64748b" textAnchor="middle" fontFamily="system-ui">Meta {target}%</text>
      </svg>
    </div>
  );
}
