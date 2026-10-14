'use client';

import React, { useEffect, useState, useRef } from 'react';

/**
 * AnimatedNumber - Micro-Glide Contínuo a 60fps (180ms)
 * - Ao carregar a página pela primeira vez: roda a animação suave partindo do zero até o valor real.
 * - Ao filtrar/mudar valor: transiciona de forma sedosa e contínua do valor anterior para o novo em 180ms.
 * - Zero sensação de "craquelado", zero saltos discretos ou engasgos.
 */
export default function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, duration = 180 }) {
  const targetVal = Number(value) || 0;
  // Inicia em 0 para animar no primeiro carregamento da página
  const [displayVal, setDisplayVal] = useState(0);
  const animRef = useRef(null);
  const startValRef = useRef(0);
  const startTimeRef = useRef(null);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    // Se o valor for idêntico e não for a primeira montagem, não re-anima
    if (!isFirstMountRef.current && displayVal === targetVal) {
      return;
    }

    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }

    const start = isFirstMountRef.current ? 0 : displayVal;
    startValRef.current = start;
    startTimeRef.current = null;
    isFirstMountRef.current = false;

    // Se for montagem inicial (de 0 ao valor final), dá uma duração ligeiramente maior (~450ms) para percepção elegante de entrada;
    // se for troca de filtro, roda super rápida (180ms) para resposta instantânea.
    const effectiveDuration = start === 0 ? 450 : duration;

    // Curva ease-out quadrática suave (sem saltos secos)
    const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / effectiveDuration, 1);
      const eased = easeOutQuad(progress);

      const current = startValRef.current + (targetVal - startValRef.current) * eased;
      setDisplayVal(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplayVal(targetVal);
      }
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [targetVal, duration]);

  const formatted = displayVal.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return (
    <span
      style={{
        display: 'inline-block',
        fontVariantNumeric: 'tabular-nums',
        willChange: 'contents'
      }}
    >
      {prefix}{formatted}{suffix}
    </span>
  );
}
