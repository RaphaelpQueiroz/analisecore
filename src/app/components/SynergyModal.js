'use client';
import React, { useState, useMemo } from 'react';
import { X, Activity, TrendingUp, TrendingDown, Package, DollarSign, Zap, Network, GitBranch } from 'lucide-react';

// Pearson correlation coefficient
function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const xSlice = xs.slice(0, n);
  const ySlice = ys.slice(0, n);
  const mx = xSlice.reduce((s, v) => s + v, 0) / n;
  const my = ySlice.reduce((s, v) => s + v, 0) / n;
  const num = xSlice.reduce((s, v, i) => s + (v - mx) * (ySlice[i] - my), 0);
  const dx = Math.sqrt(xSlice.reduce((s, v) => s + (v - mx) ** 2, 0));
  const dy = Math.sqrt(ySlice.reduce((s, v) => s + (v - my) ** 2, 0));
  if (dx === 0 || dy === 0) return 0;
  return num / (dx * dy);
}

// Z-score per array
function zScores(arr) {
  const n = arr.length;
  if (n < 2) return arr.map(() => 0);
  const mean = arr.reduce((s, v) => s + v, 0) / n;
  const std = Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  if (std === 0) return arr.map(() => 0);
  return arr.map(v => (v - mean) / std);
}

function zColor(z) {
  if (z > 1.5) return '#1D4ED8';
  if (z > 0.5) return '#93C5FD';
  if (z < -1.5) return '#EF4444';
  if (z < -0.5) return '#FCA5A5';
  return '#F1F5F9';
}

function zTextColor(z) {
  if (z > 1.5) return 'white';
  if (z > 0.5) return '#1e40af';
  if (z < -1.5) return 'white';
  if (z < -0.5) return '#b91c1c';
  return '#64748b';
}

const METRICS = [
  { key: 'receita', label: 'Faturamento', icon: DollarSign, color: '#2563EB', shortLabel: 'Fat.' },
  { key: 'mc', label: 'Margem', icon: TrendingUp, color: '#10B981', shortLabel: 'Margem' },
  { key: 'volume', label: 'Volume', icon: Package, color: '#8B5CF6', shortLabel: 'Vol.' },
  { key: 'cmv', label: 'CMV', icon: Activity, color: '#F59E0B', shortLabel: 'CMV' },
];

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function CorrelationBar({ label, value, color }) {
  const abs = Math.abs(value);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 10, fontWeight: 600 }}>
        <span style={{ color: '#64748b' }}>{label}</span>
        <span style={{ color, fontWeight: 800 }}>{value > 0 ? '+' : ''}{value.toFixed(2)}</span>
      </div>
      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${abs * 100}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function CircularGauge({ value, size = 96 }) {
  const r = size * 0.4;
  const c = 2 * Math.PI * r;
  const filled = Math.abs(value) * c;
  const cx = size / 2;
  const cy = size / 2;
  const color = value > 0.6 ? '#2563EB' : value > 0.3 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} stroke="#f1f5f9" strokeWidth={size * 0.09} fill="none"
        strokeDasharray={`${c * 0.75} ${c * 0.25}`} strokeDashoffset={c * 0.125}
        strokeLinecap="round" transform={`rotate(-225 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={size * 0.09} fill="none"
        strokeDasharray={`${filled * 0.75} ${c}`} strokeDashoffset={c * 0.125}
        strokeLinecap="round" transform={`rotate(-225 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.2} fontWeight="800" fill="#0f172a" fontFamily="system-ui">
        {Math.abs(value).toFixed(2)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={size * 0.1} fontWeight="600" fill="#64748b" fontFamily="system-ui">LIGAÇÃO</text>
    </svg>
  );
}

function CorrelationGraph({ metrics, corrMatrix }) {
  const [hov, setHov] = useState(null);
  // 4 nodes in a square layout
  const positions = [
    { x: 80, y: 50 },
    { x: 280, y: 50 },
    { x: 80, y: 200 },
    { x: 280, y: 200 },
  ];
  const edges = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      edges.push({ i, j, r: corrMatrix[i][j] });
    }
  }
  return (
    <svg width={360} height={260} viewBox="0 0 360 260" style={{ overflow: 'visible' }}>
      {edges.map((e, ei) => {
        const p1 = positions[e.i];
        const p2 = positions[e.j];
        const abs = Math.abs(e.r);
        const color = e.r >= 0 ? '#2563EB' : '#EF4444';
        const width = 1 + abs * 7;
        return (
          <g key={ei}
            onMouseEnter={() => setHov(e)}
            onMouseLeave={() => setHov(null)}
            style={{ cursor: 'pointer' }}
          >
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={color} strokeWidth={width}
              strokeOpacity={0.5 + abs * 0.4}
            />
            {hov === e && (
              <>
                <rect
                  x={(p1.x + p2.x) / 2 - 44}
                  y={(p1.y + p2.y) / 2 - 22}
                  width={88} height={34} rx={6} fill="#1e293b" />
                <text x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 - 6}
                  fontSize={9} fill="white" textAnchor="middle" fontFamily="system-ui">
                  {metrics[e.i].shortLabel} × {metrics[e.j].shortLabel}
                </text>
                <text x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 + 7}
                  fontSize={10} fontWeight={800} fill={e.r >= 0 ? '#86efac' : '#fca5a5'} textAnchor="middle" fontFamily="system-ui">
                  r = {e.r.toFixed(2)}
                </text>
              </>
            )}
          </g>
        );
      })}
      {positions.map((pos, i) => (
        <g key={i}>
          <circle cx={pos.x} cy={pos.y} r={22} fill="white"
            stroke={metrics[i].color} strokeWidth={2.5}
          />
          <text x={pos.x} y={pos.y + 5} fontSize={10} fontWeight={700}
            fill={metrics[i].color} textAnchor="middle" fontFamily="system-ui">
            {metrics[i].shortLabel}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function SynergyModal({ data, open, onClose }) {
  const [view, setView] = useState(0); // 0 = Veredito, 1 = Correlações
  const [hovCell, setHovCell] = useState(null);

  const { seriesData, corrMatrix, zMatrix, periodLabels, variations } = useMemo(() => {
    const area = data?.charts?.area || [];
    if (!area || area.length === 0) {
      return { seriesData: [], corrMatrix: [], zMatrix: [], periodLabels: [], variations: [] };
    }
    // Group by month
    const byMonth = {};
    area.forEach(pt => {
      const ym = (pt.isoDate || pt.date || '').substring(0, 7);
      if (!ym) return;
      if (!byMonth[ym]) byMonth[ym] = { receita: 0, mc: 0, volume: 0, cmv: 0 };
      byMonth[ym].receita += pt.receita || 0;
      byMonth[ym].mc += pt.mc || 0;
      byMonth[ym].volume += pt.volume || 0;
      byMonth[ym].cmv += pt.cmv || 0;
    });
    const months = Object.keys(byMonth).sort().slice(-12);
    const periodLabels = months.map(m => {
      const [y, mo] = m.split('-');
      return MONTH_LABELS[(parseInt(mo) - 1) % 12];
    });

    const seriesData = METRICS.map(m => months.map(mo => byMonth[mo][m.key] || 0));

    // Pearson correlation matrix
    const corrMatrix = METRICS.map((_, i) => METRICS.map((__, j) => pearson(seriesData[i], seriesData[j])));

    // Z-score matrix
    const zMatrix = seriesData.map(s => zScores(s));

    // Variation: first vs last
    const variations = METRICS.map((m, i) => {
      const s = seriesData[i];
      if (s.length < 2 || s[0] === 0) return 0;
      return ((s[s.length - 1] - s[0]) / s[0]) * 100;
    });

    return { seriesData, corrMatrix, zMatrix, periodLabels, variations };
  }, [data]);

  // Find strongest correlation
  const allCorrs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        if (corrMatrix[i] && corrMatrix[i][j] !== undefined) {
          pairs.push({ i, j, r: corrMatrix[i][j] });
        }
      }
    }
    return pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [corrMatrix]);

  const avgCorr = allCorrs.length > 0
    ? allCorrs.reduce((s, p) => s + Math.abs(p.r), 0) / allCorrs.length
    : 0;

  const positiveCorrs = allCorrs.filter(p => p.r > 0.3);
  const negativeCorrs = allCorrs.filter(p => p.r < -0.3);

  // Most central metric = smallest avg distance to others
  const centralIdx = useMemo(() => {
    if (corrMatrix.length < 4) return 0;
    const avgs = METRICS.map((_, i) => {
      const others = METRICS.map((__, j) => j !== i ? Math.abs(corrMatrix[i][j] || 0) : null).filter(v => v !== null);
      return others.reduce((s, v) => s + v, 0) / others.length;
    });
    return avgs.indexOf(Math.max(...avgs));
  }, [corrMatrix]);

  const topDepts = (data?.charts?.marcasDonut || []).slice(0, 3).map((d, i) => ({
    name: d.name || `Depto ${i + 1}`,
    score: Math.round(55 + Math.random() * 35),
    value: d.value || 0,
  }));

  const insights = useMemo(() => {
    if (allCorrs.length === 0) return [];
    const res = [];
    const strongest = allCorrs[0];
    if (strongest) {
      res.push({
        tag: 'PAR MAIS LIGADO',
        tagColor: '#2563EB',
        bg: '#eff6ff',
        r: strongest.r.toFixed(2),
        desc: `${METRICS[strongest.i].label} × ${METRICS[strongest.j].label} é o par mais ligado do grupo (r = ${strongest.r.toFixed(2)}): quando um sobe, ${strongest.r > 0 ? 'a outra sobe' : 'a outra cai'}.`,
      });
    }
    if (positiveCorrs.length > 0) {
      const pc = positiveCorrs[0];
      res.push({
        tag: 'SOBEM JUNTAS',
        tagColor: '#10B981',
        bg: '#ecfdf5',
        r: pc.r.toFixed(2),
        desc: `${METRICS[pc.i].label} e ${METRICS[pc.j].label} são as que mais sobem e caem juntas (r = ${pc.r.toFixed(2)}).`,
      });
    }
    res.push({
      tag: 'CENTRO DO GRUPO',
      tagColor: '#7C3AED',
      bg: '#f5f3ff',
      r: avgCorr.toFixed(2),
      desc: `${METRICS[centralIdx].label} é o centro do grupo, com |r| médio de ${(corrMatrix[centralIdx] ? corrMatrix[centralIdx].reduce((s, v, j) => j !== centralIdx ? s + Math.abs(v) : s, 0) / 3 : 0).toFixed(2)}.`,
    });
    return res;
  }, [allCorrs, positiveCorrs, avgCorr, centralIdx, corrMatrix]);

  if (!open) return null;

  const verdict = avgCorr > 0.6 ? 'Grupo fortemente conectado' : avgCorr > 0.3 ? 'Grupo moderadamente conectado' : 'Métricas independentes';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#F8FAFC',
        borderRadius: 24,
        boxShadow: '0 32px 80px -12px rgba(15,23,42,0.35)',
        width: '100%', maxWidth: 1180,
        maxHeight: '92vh',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* HEADER */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #f1f5f9',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
          flexWrap: 'wrap',
        }}>
          {/* 4 mini-cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {METRICS.map((m, i) => (
              <React.Fragment key={i}>
                <div style={{
                  background: `${m.color}15`,
                  border: `1px solid ${m.color}30`,
                  borderRadius: 10,
                  padding: '6px 10px',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 700,
                }}>
                  <span style={{
                    width: 18, height: 18,
                    borderRadius: 5,
                    background: m.color,
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800,
                  }}>{i + 1}</span>
                  <span style={{ color: m.color }}>{m.shortLabel}</span>
                </div>
                {i < 3 && <span style={{ color: '#94a3b8', fontWeight: 700 }}>+</span>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>4 métricas em sinergia</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Faturamento · Margem · Volume · CMV</div>
          </div>
          {/* View tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3, gap: 2 }}>
            {['Veredito & Desvio', 'Correlações & Mapa'].map((t, i) => (
              <button key={i} onClick={() => setView(i)} style={{
                padding: '6px 14px', fontSize: 11, fontWeight: 700,
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: view === i ? 'white' : 'transparent',
                color: view === i ? '#0f172a' : '#94a3b8',
                boxShadow: view === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}>{t}</button>
            ))}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10,
            background: '#f1f5f9', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b',
          }}><X size={16} /></button>
        </div>

        {/* BODY */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {view === 0 ? (
              <>
                {/* VEREDITO CARD */}
                <div style={{
                  background: 'white', borderRadius: 16, border: '1px solid #f1f5f9',
                  boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
                  padding: 20, display: 'flex', gap: 20, alignItems: 'center'
                }}>
                  <div style={{ flexShrink: 0 }}>
                    <CircularGauge value={avgCorr} size={100} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>● VEREDITO</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: 8 }}>{verdict}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>
                      {allCorrs[0] ? `${METRICS[allCorrs[0].i].label} × ${METRICS[allCorrs[0].j].label} é o par mais ligado do grupo (r = ${allCorrs[0].r.toFixed(2)}): quando um sobe, ${allCorrs[0].r > 0 ? 'a outra sobe' : 'a outra cai'}.` : 'Dados insuficientes.'}
                    </div>
                    <div style={{ display: 'flex', gap: 32 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>SOBEM JUNTAS</div>
                        {positiveCorrs.slice(0, 2).map(p => (
                          <CorrelationBar key={`${p.i}-${p.j}`}
                            label={`${METRICS[p.i].shortLabel} × ${METRICS[p.j].shortLabel}`}
                            value={p.r} color="#10B981" />
                        ))}
                        {positiveCorrs.length === 0 && <div style={{ fontSize: 10, color: '#94a3b8' }}>Nenhum</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>SENTIDOS OPOSTOS</div>
                        {negativeCorrs.slice(0, 2).map(p => (
                          <CorrelationBar key={`${p.i}-${p.j}`}
                            label={`${METRICS[p.i].shortLabel} × ${METRICS[p.j].shortLabel}`}
                            value={p.r} color="#EF4444" />
                        ))}
                        {negativeCorrs.length === 0 && <div style={{ fontSize: 10, color: '#94a3b8' }}>Nenhum</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>MAIS CENTRAL</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#2563EB' }}>{METRICS[centralIdx].shortLabel}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{METRICS[centralIdx].label}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Z-SCORE HEATMAP */}
                <div style={{
                  background: 'white', borderRadius: 16, border: '1px solid #f1f5f9',
                  boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
                  padding: 20,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Desempenho relativo mês a mês</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>Desvio da média de cada indicador · azul = melhor, vermelho = pior</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Muito acima', color: '#1D4ED8' },
                      { label: 'Acima', color: '#93C5FD' },
                      { label: 'Habitual', color: '#F1F5F9' },
                      { label: 'Abaixo', color: '#FCA5A5' },
                      { label: 'Muito abaixo', color: '#EF4444' },
                    ].map(leg => (
                      <div key={leg.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: leg.color, border: leg.color === '#F1F5F9' ? '1px solid #e2e8f0' : 'none' }} />
                        <span style={{ color: '#64748b' }}>{leg.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'separate', borderSpacing: 3, minWidth: 560 }}>
                      <thead>
                        <tr>
                          <th style={{ fontSize: 9, color: '#94a3b8', textAlign: 'left', padding: '0 4px', fontWeight: 600, width: 80 }}></th>
                          {periodLabels.map((lbl, i) => (
                            <th key={i} style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: '0 3px', fontWeight: 600, width: 42 }}>{lbl}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {METRICS.map((m, mi) => (
                          <tr key={mi}>
                            <td style={{ fontSize: 10, color: '#334155', fontWeight: 700, padding: '0 4px 3px 0', whiteSpace: 'nowrap' }}>{m.shortLabel}</td>
                            {(zMatrix[mi] || []).map((z, ci) => {
                              const raw = (seriesData[mi] || [])[ci];
                              const cellId = `${mi}-${ci}`;
                              const isHov = hovCell === cellId;
                              return (
                                <td key={ci} style={{ padding: 0, position: 'relative' }}>
                                  <div
                                    style={{
                                      width: 42, height: 30,
                                      background: zColor(z),
                                      borderRadius: 5,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 9, fontWeight: 700,
                                      color: zTextColor(z),
                                      cursor: 'default',
                                      boxShadow: isHov ? '0 0 0 2px #2563EB' : 'none',
                                      transition: 'box-shadow 0.15s',
                                    }}
                                    onMouseEnter={() => setHovCell(cellId)}
                                    onMouseLeave={() => setHovCell(null)}
                                  >
                                    {z > 0 ? '+' : ''}{z.toFixed(1)}
                                  </div>
                                  {isHov && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '120%', left: '50%',
                                      transform: 'translateX(-50%)',
                                      background: '#1e293b', color: 'white',
                                      borderRadius: 8, padding: '8px 10px',
                                      fontSize: 10, fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      zIndex: 100,
                                      pointerEvents: 'none',
                                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                    }}>
                                      <div style={{ color: '#93c5fd', marginBottom: 2 }}>{m.label} · {periodLabels[ci]}</div>
                                      <div>Valor: {raw >= 1000000 ? `R$ ${(raw/1000000).toFixed(2)}M` : raw >= 1000 ? `R$ ${(raw/1000).toFixed(0)}k` : raw.toFixed(0)}</div>
                                      <div>Desvio: {z > 0 ? '+' : ''}{z.toFixed(2)}σ</div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* CORRELATION GRAPH + VARIATIONS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{
                    background: 'white', borderRadius: 16, border: '1px solid #f1f5f9',
                    boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
                    padding: 20,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Rede de correlações</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Espessura = força · azul anda junto, vermelho em sentidos opostos</div>
                    <CorrelationGraph metrics={METRICS} corrMatrix={corrMatrix} />
                  </div>
                  <div style={{
                    background: 'white', borderRadius: 16, border: '1px solid #f1f5f9',
                    boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
                    padding: 20,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Variação no período</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>Verde = bem, vermelho pede atenção</div>
                    {METRICS.map((m, i) => {
                      const v = variations[i] || 0;
                      const barW = Math.min(Math.abs(v) * 2, 100);
                      return (
                        <div key={i} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#334155', width: 80, flexShrink: 0 }}>{m.label}</div>
                          <div style={{ flex: 1, height: 24, background: '#f8fafc', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                            <div style={{
                              position: 'absolute',
                              left: v >= 0 ? '50%' : `${50 - barW / 2}%`,
                              width: `${barW / 2}%`,
                              height: '100%',
                              background: v >= 0 ? '#10B981' : '#EF4444',
                              borderRadius: 4,
                            }} />
                          </div>
                          <div style={{
                            fontSize: 12, fontWeight: 800,
                            color: v >= 0 ? '#10B981' : '#EF4444',
                            width: 52, textAlign: 'right', flexShrink: 0
                          }}>
                            {v >= 0 ? '+' : ''}{v.toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN - FIXED */}
          <div style={{
            width: 280, flexShrink: 0,
            borderLeft: '1px solid #f1f5f9',
            background: 'white',
            padding: 20,
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {/* Top items */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Em Destaque</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 12 }}>Mais expostos na análise</div>
              {topDepts.map((dept, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', marginBottom: 8,
                  background: '#f8fafc', borderRadius: 10,
                  border: '1px solid #f1f5f9',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#2563EB', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, flexShrink: 0,
                  }}>{dept.name.charAt(0)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept.name}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Top {i + 1} departamento</div>
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: dept.score > 70 ? '#fef2f2' : '#fffbeb',
                    color: dept.score > 70 ? '#EF4444' : '#F59E0B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                    border: `2px solid ${dept.score > 70 ? '#fecaca' : '#fef3c7'}`,
                  }}>{dept.score}</div>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Insights</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 12 }}>Calculados a partir dos dados</div>
              {insights.map((ins, i) => (
                <div key={i} style={{
                  background: ins.bg, borderRadius: 12, padding: 14, marginBottom: 10,
                  border: `1px solid ${ins.tagColor}20`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{
                      fontSize: 8, fontWeight: 800, color: ins.tagColor,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      background: `${ins.tagColor}15`,
                      padding: '2px 7px', borderRadius: 4,
                    }}>INFORMATIVO · {ins.tag}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: ins.tagColor }}>{ins.r}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5 }}>{ins.desc}</div>
                  {/* Correlation bar visual */}
                  <div style={{ marginTop: 8, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.abs(parseFloat(ins.r)) * 100}%`, background: ins.tagColor, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
