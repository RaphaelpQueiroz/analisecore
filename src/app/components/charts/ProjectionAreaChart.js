'use client';
import React, { useState } from 'react';

export default function ProjectionAreaChart({ data = [], meta = 0, todayIdx = -1, width = 380, height = 160 }) {
  const [tooltip, setTooltip] = useState(null);
  if (!data || data.length === 0) return null;

  const PAD = { top: 24, right: 16, bottom: 28, left: 48 };
  const W = width - PAD.left - PAD.right;
  const H = height - PAD.top - PAD.bottom;

  const allVals = [
    ...data.map(d => d.value || 0),
    ...data.map(d => d.prevValue || 0),
    meta
  ].filter(v => v > 0);
  const minV = Math.min(...allVals) * 0.92;
  const maxV = Math.max(...allVals) * 1.06;
  const range = maxV - minV || 1;

  const toX = (i) => PAD.left + (i / Math.max(data.length - 1, 1)) * W;
  const toY = (v) => PAD.top + H - ((v - minV) / range) * H;

  const realizedData = todayIdx >= 0 ? data.slice(0, todayIdx + 1) : data;
  const projectedData = todayIdx >= 0 ? data.slice(todayIdx) : [];

  const realLine = realizedData
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.value || 0).toFixed(1)}`)
    .join(' ');
  const realArea = realLine + ` L${toX(realizedData.length - 1).toFixed(1)},${(PAD.top + H).toFixed(1)} L${PAD.left.toFixed(1)},${(PAD.top + H).toFixed(1)} Z`;

  const prevLine = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.prevValue || minV).toFixed(1)}`)
    .join(' ');

  const metaY = toY(meta);
  const metaX1 = PAD.left;
  const metaX2 = PAD.left + W;

  // Projection cone polygon
  let conePath = '';
  if (projectedData.length > 1) {
    const coneUpper = projectedData.map((d, i) => [toX(todayIdx + i), toY((d.value || 0) * 1.05)]);
    const coneLower = [...projectedData].reverse().map((d, i) => [toX(todayIdx + (projectedData.length - 1 - i)), toY((d.value || 0) * 0.95)]);
    conePath = [...coneUpper, ...coneLower].map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
  }

  const todayX = todayIdx >= 0 ? toX(todayIdx) : null;

  // Tick labels
  const labels = data.map(d => d.label || '');
  const step = Math.max(1, Math.floor(data.length / 8));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="proj-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="proj-cone-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PAD.top + t * H;
        const v = maxV - t * range;
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={PAD.left + W} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} fontSize={9} fill="#94a3b8" textAnchor="end" fontFamily="system-ui">
              {v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Previous year dashed line */}
      {prevLine && (
        <path d={prevLine} stroke="#cbd5e1" strokeWidth={1.2} fill="none" strokeDasharray="4 3" />
      )}

      {/* META line */}
      {meta > 0 && (
        <g>
          <line x1={metaX1} y1={metaY} x2={metaX2} y2={metaY} stroke="#7c3aed" strokeWidth={1.2} strokeDasharray="5 3" />
          <rect x={metaX2 - 36} y={metaY - 10} width={34} height={16} rx={4} fill="#7c3aed" />
          <text x={metaX2 - 19} y={metaY + 4} fontSize={8} fontWeight={700} fill="white" textAnchor="middle" fontFamily="system-ui">META</text>
        </g>
      )}

      {/* Projection cone */}
      {conePath && (
        <path d={conePath} fill="url(#proj-cone-grad)" />
      )}

      {/* Projection dashed line */}
      {projectedData.length > 1 && (
        <path
          d={projectedData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(todayIdx + i).toFixed(1)},${toY(d.value || 0).toFixed(1)}`).join(' ')}
          stroke="#2563eb" strokeWidth={1.5} fill="none" strokeDasharray="4 3" strokeOpacity={0.6}
        />
      )}

      {/* Realized area fill */}
      <path d={realArea} fill="url(#proj-area-grad)" />
      {/* Realized line */}
      <path d={realLine} stroke="#2563eb" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* TODAY marker */}
      {todayX !== null && (
        <g>
          <line x1={todayX} y1={PAD.top} x2={todayX} y2={PAD.top + H} stroke="#1e293b" strokeWidth={1} strokeDasharray="3 2" />
          <rect x={todayX - 14} y={PAD.top + H + 4} width={28} height={13} rx={3} fill="#1e293b" />
          <text x={todayX} y={PAD.top + H + 14} fontSize={8} fontWeight={700} fill="white" textAnchor="middle" fontFamily="system-ui">HOJE</text>
        </g>
      )}

      {/* X axis labels */}
      {labels.map((lbl, i) => {
        if (i % step !== 0 && i !== data.length - 1) return null;
        return (
          <text key={i} x={toX(i)} y={PAD.top + H + 22} fontSize={9} fill="#94a3b8" textAnchor="middle" fontFamily="system-ui">{lbl}</text>
        );
      })}

      {/* Hover targets */}
      {data.map((d, i) => (
        <rect key={i}
          x={toX(i) - 12} y={PAD.top}
          width={24} height={H}
          fill="transparent"
          onMouseEnter={(e) => setTooltip({ d, x: toX(i), y: toY(d.value || 0), i })}
          onMouseLeave={() => setTooltip(null)}
          style={{ cursor: 'crosshair' }}
        />
      ))}

      {/* Tooltip */}
      {tooltip && (
        <g>
          <circle cx={tooltip.x} cy={tooltip.y} r={3.5} fill="white" stroke="#2563eb" strokeWidth={1.5} />
          <rect x={tooltip.x + 6} y={tooltip.y - 18} width={72} height={32} rx={5} fill="#1e293b" />
          <text x={tooltip.x + 42} y={tooltip.y - 6} fontSize={9} fontWeight={700} fill="white" textAnchor="middle" fontFamily="system-ui">
            {tooltip.d.label}
          </text>
          <text x={tooltip.x + 42} y={tooltip.y + 7} fontSize={9} fill="#93c5fd" textAnchor="middle" fontFamily="system-ui">
            {(tooltip.d.value >= 1000000 ? `R$ ${(tooltip.d.value/1000000).toFixed(1)}M` : `R$ ${(tooltip.d.value/1000).toFixed(0)}k`)}
          </text>
        </g>
      )}
    </svg>
  );
}
