'use client';
import React from 'react';

export default function SemiGauge({ value = 72, min = 0, max = 100, size = 80 }) {
  const cx = size / 2;
  const cy = size * 0.72;
  const r = size * 0.42;
  const stroke = size * 0.09;
  const circumference = Math.PI * r;
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  // Segments: red 0-40%, yellow 40-70%, green 70-100%
  const segLen = circumference / 3;
  // Pointer angle: -180deg (0%) to 0deg (100%)
  const angle = -180 + pct * 180;
  const rad = (angle * Math.PI) / 180;
  const px = cx + r * Math.cos(rad);
  const py = cy + r * Math.sin(rad);
  return (
    <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
      {/* Track */}
      <path
        d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none" stroke="#f1f5f9" strokeWidth={stroke} strokeLinecap="butt"
      />
      {/* Red segment */}
      <path
        d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx - r + (2 * r * 0.4)},${cy - Math.sin(Math.acos((-r + r * 0.8) / r)) * r}`}
        fill="none" stroke="#ef4444" strokeWidth={stroke} strokeLinecap="butt"
        strokeDasharray={`${segLen} ${circumference}`} strokeDashoffset="0"
      />
      {/* Render via stroke-dasharray trick on full arc */}
      <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`} fill="none" stroke="#ef4444" strokeWidth={stroke}
        strokeDasharray={`${circumference*0.33} ${circumference*0.67}`} strokeDashoffset="0" strokeLinecap="butt"/>
      <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`} fill="none" stroke="#f59e0b" strokeWidth={stroke}
        strokeDasharray={`${circumference*0.3} ${circumference*0.7}`} strokeDashoffset={`${-circumference*0.33}`} strokeLinecap="butt"/>
      <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`} fill="none" stroke="#10b981" strokeWidth={stroke}
        strokeDasharray={`${circumference*0.37} ${circumference*0.63}`} strokeDashoffset={`${-circumference*0.63}`} strokeLinecap="butt"/>
      {/* Pointer */}
      <circle cx={px} cy={py} r={stroke * 0.65} fill="#1e293b" />
      {/* Center value */}
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize={size * 0.18} fontWeight="800" fill="#0f172a" fontFamily="system-ui">
        {Math.round(value)}
      </text>
    </svg>
  );
}
