'use client';
import React, { useState } from 'react';

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  if (endAngle - startAngle >= 360) endAngle = startAngle + 359.99;
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M${s.x.toFixed(2)},${s.y.toFixed(2)} A${r},${r} 0 ${largeArc},1 ${e.x.toFixed(2)},${e.y.toFixed(2)}`;
}

export default function MultiRingDonut({ inner = [], outer = [], total = 0, label = 'Total', size = 180 }) {
  const [hov, setHov] = useState(null);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.30;
  const strokeOuter = size * 0.09;
  const strokeInner = size * 0.08;

  const renderRing = (segments, radius, strokeW, ringId) => {
    const total = segments.reduce((s, seg) => s + (seg.value || 0), 0) || 1;
    let angle = -90;
    return segments.map((seg, i) => {
      const sweep = ((seg.value || 0) / total) * 360;
      const start = angle;
      angle += sweep;
      const end = angle;
      const circumference = 2 * Math.PI * radius;
      return (
        <path
          key={`${ringId}-${i}`}
          d={describeArc(cx, cy, radius, start, end - 0.5)}
          stroke={seg.color || '#2563eb'}
          strokeWidth={strokeW}
          fill="none"
          strokeLinecap="round"
          opacity={hov && hov.id !== `${ringId}-${i}` ? 0.35 : 1}
          style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={() => setHov({ seg, id: `${ringId}-${i}` })}
          onMouseLeave={() => setHov(null)}
        />
      );
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track rings */}
          <circle cx={cx} cy={cy} r={outerR} stroke="#f1f5f9" strokeWidth={strokeOuter} fill="none" />
          <circle cx={cx} cy={cy} r={innerR} stroke="#f1f5f9" strokeWidth={strokeInner} fill="none" />
          {/* Outer ring */}
          {renderRing(outer, outerR, strokeOuter, 'out')}
          {/* Inner ring */}
          {renderRing(inner, innerR, strokeInner, 'inn')}
          {/* Center label */}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize={size * 0.15} fontWeight="800" fill="#0f172a" fontFamily="system-ui">
            {total.toLocaleString('pt-BR')}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={size * 0.075} fontWeight="600" fill="#64748b" fontFamily="system-ui">
            {label}
          </text>
        </svg>
        {/* Hover tooltip */}
        {hov && (
          <div style={{
            position: 'absolute', top: '50%', left: '110%',
            transform: 'translateY(-50%)',
            background: '#1e293b', color: 'white',
            borderRadius: 8, padding: '8px 12px',
            fontSize: 11, fontWeight: 600,
            whiteSpace: 'nowrap', pointerEvents: 'none',
            zIndex: 10
          }}>
            <div style={{ fontWeight: 700 }}>{hov.seg.label}</div>
            <div style={{ color: hov.seg.color, fontWeight: 800 }}>{(hov.seg.pct || 0).toFixed(0)}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
