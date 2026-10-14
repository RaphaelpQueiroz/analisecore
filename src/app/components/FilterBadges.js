'use client';
import React from 'react';
import { useSearchParams } from 'next/navigation';

export default function FilterBadges() {
  const params = useSearchParams();
  const badges = [];

  const loja = params.get('loja');
  if (loja) badges.push({ label: 'Loja', value: loja });

  const depto = params.get('departamento');
  if (depto) badges.push({ label: 'Depto', value: depto });

  const cliente = params.get('cliente');
  if (cliente) badges.push({ label: 'Cliente', value: cliente });

  const selectedDay = params.get('selectedDay');
  if (selectedDay) badges.push({ label: 'Dia', value: selectedDay });

  if (badges.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
      {badges.map(f => (
        <span 
          key={f.label} 
          style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'hsl(var(--primary)/0.15)',
            color: 'hsl(var(--primary))',
            border: '1px solid hsl(var(--primary)/0.3)',
            whiteSpace: 'nowrap',
            fontWeight: 'normal'
          }}
        >
          {f.label}: <strong>{f.value}</strong>
        </span>
      ))}
    </div>
  );
}
