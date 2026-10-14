'use client';
import React, { useState } from 'react';

function movingAvg(arr, n = 3) {
  return arr.map((_, i) => {
    const slice = arr.slice(Math.max(0, i - n + 1), i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

export default function StackedBarMovingAvg({ data = [], width = 340, height = 80 }) {
  const [tooltip, setTooltip] = useState(null);
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => (d.base || 0) + (d.top || 0)), 1);
  const barW = Math.floor((width - 8) / data.length) - 2;
  const barGap = Math.floor((width - 8) / data.length);
  const avgVals = movingAvg(data.map(d => (d.base || 0) + (d.top || 0)));

  const toY = (v) => height - 16 - (v / maxVal) * (height - 24);

  const linePts = avgVals.map((v, i) => [
    4 + i * barGap + barW / 2,
    toY(v)
  ]);
  const linePath = linePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="sb-amber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="sb-purple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const base = d.base || 0;
          const top = d.top || 0;
          const total = base + top;
          const baseH = ((base / maxVal) * (height - 24));
          const topH = ((top / maxVal) * (height - 24));
          const x = 4 + i * barGap;
          const baseY = toY(base);
          const topY = toY(total);
          return (
            <g key={i}
              onMouseEnter={() => setTooltip({ i, d, x: x + barW / 2 })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect x={x} y={baseY} width={barW} height={baseH} rx={2} fill="url(#sb-amber)" />
              <rect x={x} y={topY} width={barW} height={topH} rx={2} fill="url(#sb-purple)" />
              {d.label && <text x={x + barW / 2} y={height - 2} fontSize="8" fill="#94a3b8" textAnchor="middle" fontFamily="system-ui">{d.label}</text>}
            </g>
          );
        })}
        {/* Moving Average Line */}
        <path d={linePath} stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {linePts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="1.5" fill="#1E293B" />
        ))}
      </svg>
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: 0,
          transform: 'translateX(-50%)',
          background: '#1e293b',
          color: 'white',
          borderRadius: 6,
          padding: '4px 8px',
          fontSize: 10,
          fontWeight: 600,
          pointerEvents: 'none',
          zIndex: 10,
          whiteSpace: 'nowrap'
        }}>
          {tooltip.d.label}: {((tooltip.d.base || 0) + (tooltip.d.top || 0)).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
