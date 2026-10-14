'use client';
import React, { useState } from 'react';

export default function SankeyFlow({ stages = [], width = 600, height = 260 }) {
  const [hovered, setHovered] = useState(null);
  // stages: array of 3 arrays of nodes { label, value, color }
  // Normalize and compute positions
  const PAD = { top: 12, right: 16, bottom: 12, left: 16 };
  const nodeW = 18;
  const stageCount = stages.length;
  const stageXs = stages.map((_, i) =>
    PAD.left + (i / Math.max(stageCount - 1, 1)) * (width - PAD.left - PAD.right - nodeW)
  );

  // Assign Y positions per stage
  const stageNodes = stages.map((nodes, si) => {
    const total = nodes.reduce((s, n) => s + (n.value || 0), 1);
    const H = height - PAD.top - PAD.bottom;
    let y = PAD.top;
    return nodes.map(n => {
      const h = ((n.value || 0) / total) * H;
      const node = { ...n, x: stageXs[si], y, h };
      y += h + 4;
      return node;
    });
  });

  // Build flows between adjacent stages
  const flows = [];
  for (let si = 0; si < stageNodes.length - 1; si++) {
    const srcNodes = stageNodes[si];
    const dstNodes = stageNodes[si + 1];
    const srcTotal = srcNodes.reduce((s, n) => s + n.value, 0);
    dstNodes.forEach((dst, di) => {
      srcNodes.forEach((src, sri) => {
        const ratio = dst.value / (srcTotal || 1);
        const flowVal = src.value * ratio;
        const flowH = (flowVal / srcTotal) * (src.h || 0);
        const srcX = src.x + nodeW;
        const dstX = dst.x;
        const srcY = src.y + src.h * (di / dstNodes.length);
        const dstY = dst.y + dst.h * (sri / srcNodes.length);
        const cx1 = srcX + (dstX - srcX) * 0.4;
        const cx2 = srcX + (dstX - srcX) * 0.6;
        flows.push({
          path: `M${srcX},${srcY} C${cx1},${srcY} ${cx2},${dstY} ${dstX},${dstY}`,
          src, dst, flowH: Math.max(flowH, 1),
          gradId: `sk-${si}-${sri}-${di}`,
          color: src.color || '#2563eb'
        });
      });
    });
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        {flows.map(f => (
          <linearGradient key={f.gradId} id={f.gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={f.color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={f.dst.color || '#6366f1'} stopOpacity="0.3" />
          </linearGradient>
        ))}
      </defs>

      {/* Flow paths */}
      {flows.map((f, fi) => (
        <path
          key={fi}
          d={f.path}
          stroke={`url(#${f.gradId})`}
          strokeWidth={Math.max(f.flowH * 0.4, 1.5)}
          fill="none"
          strokeOpacity={hovered === fi ? 0.9 : 0.5}
          onMouseEnter={() => setHovered(fi)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }}
        />
      ))}

      {/* Stage nodes (bars) */}
      {stageNodes.map((nodes, si) =>
        nodes.map((n, ni) => (
          <g key={`${si}-${ni}`}>
            <rect
              x={n.x} y={n.y}
              width={nodeW} height={Math.max(n.h - 4, 4)}
              rx={3}
              fill={n.color || '#2563eb'}
              opacity={0.92}
            />
            {/* Label */}
            {si === 0 && (
              <text x={n.x - 4} y={n.y + (n.h / 2) + 4} fontSize={9} fill="#334155" textAnchor="end" fontFamily="system-ui" fontWeight={600}>
                {n.label}
              </text>
            )}
            {si === stageNodes.length - 1 && (
              <text x={n.x + nodeW + 4} y={n.y + (n.h / 2) + 4} fontSize={9} fill="#334155" textAnchor="start" fontFamily="system-ui" fontWeight={600}>
                {n.label}
              </text>
            )}
            {si === 1 && (
              <text x={n.x + nodeW / 2} y={n.y - 2} fontSize={8} fill="#334155" textAnchor="middle" fontFamily="system-ui" fontWeight={600}>
                {n.label}
              </text>
            )}
          </g>
        ))
      )}
    </svg>
  );
}
