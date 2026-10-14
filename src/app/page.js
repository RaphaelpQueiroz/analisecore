'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ReferenceLine, BarChart, Bar, Cell, LabelList,
  PieChart, Pie, Treemap
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Package, ArrowUpRight, 
  DollarSign, Sparkles, Store, ShoppingBag, ShieldCheck,
  BarChart2, PieChart as PieIcon, LayoutGrid, Filter, X, RotateCcw,
  Award, Trophy, Medal
} from 'lucide-react';
import { parseISO, format, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ModalKpiDetail from './components/ModalKpiDetail';

const DEPT_COLORS = [
  '#2563eb', // Azul Royal
  '#0284c7', // Azul Céu
  '#0d9488', // Verde Petróleo
  '#10b981', // Verde Esmeralda
  '#f59e0b', // Âmbar / Dourado
  '#f97316', // Laranja
  '#ec4899', // Rosa
  '#8b5cf6', // Violeta
  '#6366f1', // Índigo
  '#14b8a6', // Ciano
  '#a855f7', // Púrpura
  '#e11d48'  // Rubi
];

const CustomAreaTooltip = ({ active, payload, label, timeView }) => {
  if (!active || !payload || !payload.length) return null;
  const pData = payload[0]?.payload || {};
  const receita = Number(pData.receita || 0);
  const cmv = Number(pData.cmv || 0);
  const mc = Number(pData.mc || 0);
  const volume = Number(pData.volume || 0);
  const mcPerc = receita > 0 ? (mc / receita) * 100 : 0;
  const cmvPerc = receita > 0 ? (cmv / receita) * 100 : 0;

  let periodLabel = 'Dia';
  if (timeView === 'mes') periodLabel = 'Mês';
  else if (timeView === 'semana') periodLabel = 'Semana';
  else if (timeView === 'ano') periodLabel = 'Ano';

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.15), 0 4px 8px -2px rgba(15, 23, 42, 0.06)',
      padding: '12px 16px',
      fontSize: '12px',
      minWidth: '230px',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
          {label}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px' }}>
          {periodLabel}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span>
            Faturamento:
          </span>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(receita)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
            Custo (CMV):
          </span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 600, color: '#d97706' }}>{formatCurrency(cmv)}</span>
            <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px' }}>({cmvPerc.toFixed(1)}%)</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            Margem Bruta:
          </span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(mc)}</span>
            <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700, marginLeft: '4px', background: '#ecfdf5', padding: '1px 5px', borderRadius: '3px' }}>
              {mcPerc.toFixed(1)}%
            </span>
          </div>
        </div>

        {volume > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed #f1f5f9', marginTop: '2px', fontSize: '11px' }}>
            <span style={{ color: '#94a3b8' }}>Volume Vendido:</span>
            <span style={{ fontWeight: 600, color: '#475569' }}>{formatNumber(volume)} un.</span>
          </div>
        )}
      </div>
    </div>
  );
};

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { 
  style: 'currency', 
  currency: 'BRL', 
  minimumFractionDigits: 0, 
  maximumFractionDigits: 0 
}).format(val || 0);

const DONUT_OUTER_R = 110; // must match the outerRadius prop on <Pie>

const CustomDonutTooltip = ({ active, payload, crossDepto, mouseX, mouseY, containerRef }) => {
  if (!active || !payload || !payload.length || !mouseX) return null;
  const dept = payload[0]?.payload || payload[0];
  if (!dept) return null;

  const receita = Number(dept.value || 0);
  const cmv = Number(dept.cmv || 0);
  const mc = Number(dept.mc || 0);
  const mcPerc = Number(dept.margemContribuicaoPerc || (receita > 0 ? (mc / receita) * 100 : 0));
  const cmvPerc = receita > 0 ? (cmv / receita) * 100 : 0;
  const isSelected = crossDepto && (dept.fullName || dept.name) && crossDepto.toUpperCase() === (dept.fullName || dept.name).toUpperCase();

  const TW = 246;
  const TH = cmv > 0 ? 178 : 148;

  let left = mouseX + 16;
  let top = mouseY - TH / 2;

  // Use donut chart center + cursor angle to always place tooltip outside the ring
  if (containerRef?.current && typeof window !== 'undefined') {
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    // Check if cursor is roughly inside or close to the donut chart area
    const isOverChart = mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom;
    
    if (isOverChart) {
      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const angle = Math.atan2(dy, dx);
      // Anchor point just beyond the outer ring edge
      const anchorX = cx + Math.cos(angle) * (DONUT_OUTER_R + 14);
      const anchorY = cy + Math.sin(angle) * (DONUT_OUTER_R + 14);
      // Tooltip goes in the direction of the cursor from center
      left = dx >= 0 ? anchorX + 6 : anchorX - TW - 6;
      top = anchorY - TH / 2;
    } else {
      // If hovering from the legend on the right, place tooltip nicely beside the cursor
      left = mouseX + 16;
      top = mouseY - TH / 2;
    }

    // Clamp to viewport
    if (left < 8) left = 8;
    if (left + TW > window.innerWidth - 8) left = window.innerWidth - TW - 8;
    if (top < 8) top = 8;
    if (top + TH > window.innerHeight - 8) top = window.innerHeight - TH - 8;
  }

  return (
    <div style={{
      position: 'fixed',
      left,
      top,
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.18), 0 4px 10px -2px rgba(15, 23, 42, 0.08)',
      padding: '12px 16px',
      fontSize: '12px',
      width: `${TW}px`,
      pointerEvents: 'none',
      zIndex: 99999
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dept.color || '#2563eb', flexShrink: 0 }}></span>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dept.fullName || dept.name}
          </span>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 7px', borderRadius: '4px', flexShrink: 0 }}>
          {dept.pctFormatted}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span>
            Faturamento:
          </span>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(receita)}</span>
        </div>

        {cmv > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
              Custo (CMV):
            </span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 600, color: '#d97706' }}>{formatCurrency(cmv)}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px' }}>({cmvPerc.toFixed(1)}%)</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            Margem Bruta:
          </span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(mc)}</span>
            <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700, marginLeft: '4px', background: '#ecfdf5', padding: '1px 5px', borderRadius: '3px' }}>
              {mcPerc.toFixed(1)}%
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed #f1f5f9', marginTop: '2px', fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
          {isSelected ? 'Clique para remover o filtro' : (dept.fullName === 'Outros' ? 'Clique para filtrar por Outros departamentos' : 'Clique para filtrar por este departamento')}
        </div>
      </div>
    </div>
  );
};


const formatNumber = (val) => Math.round(val || 0).toLocaleString('pt-BR');
const formatK = (val) => {
  if (!val) return 'R$\u00A00';
  if (Math.abs(val) >= 1000000) return `R$\u00A0${(val / 1000000).toFixed(1)}M`;
  if (Math.abs(val) >= 1000) return `R$\u00A0${(val / 1000).toFixed(0)}k`;
  return `R$\u00A0${Math.round(val)}`;
};

const getSmartTimeView = (startStr, endStr) => {
  if (!startStr || !endStr) return 'dia';
  try {
    const d1 = new Date(`${startStr}T00:00:00Z`);
    const d2 = new Date(`${endStr}T23:59:59Z`);
    const diffDays = Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    // Mais de 3 anos: abre no ano
    if (diffDays > 1095) return 'ano';
    // Mais de 1 mês (aprox 31 dias): abre no mês
    if (diffDays > 31) return 'mes';
    // Fora isso: abre no dia
    return 'dia';
  } catch (e) {
    return 'dia';
  }
};

const aggregateChartData = (rawData, view) => {
  if (!rawData || rawData.length === 0) return [];

  const grouped = {};
  rawData.forEach(d => {
    let dateStr = d.isoDate;
    if (!dateStr && d.sortKey && d.sortKey.length >= 8) {
      dateStr = `${d.sortKey.slice(0, 4)}-${d.sortKey.slice(4, 6)}-${d.sortKey.slice(6, 8)}`;
    } else if (!dateStr && d.date && d.date.includes('-')) {
      dateStr = d.date;
    }

    let dateObj;
    if (dateStr) {
      dateObj = new Date(`${dateStr}T12:00:00Z`);
    } else {
      dateObj = new Date();
    }

    let key = '';
    let displayDate = '';

    if (view === 'dia') {
      key = dateStr || d.sortKey || d.date;
      displayDate = dateStr ? format(dateObj, 'dd/MM') : d.date;
    } else if (view === 'semana') {
      const start = startOfWeek(dateObj, { weekStartsOn: 1 });
      key = format(start, 'yyyy-MM-dd');
      displayDate = 'Sem. ' + format(start, 'dd/MM');
    } else if (view === 'mes') {
      const start = startOfMonth(dateObj);
      key = format(start, 'yyyy-MM');
      const mStr = format(start, 'MMM/yy', { locale: ptBR });
      displayDate = mStr.charAt(0).toUpperCase() + mStr.slice(1);
    } else if (view === 'ano') {
      const start = startOfYear(dateObj);
      key = format(start, 'yyyy');
      displayDate = format(start, 'yyyy');
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        sortKey: key,
        displayDate,
        receita: 0,
        cmv: 0,
        mc: 0,
        volume: 0,
        count: 0
      };
    }
    grouped[key].receita += d.receita;
    grouped[key].cmv += d.cmv;
    grouped[key].mc += d.mc;
    grouped[key].volume += d.volume;
    grouped[key].count += 1;
  });

  return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
};

const TrendAreaChartCard = React.memo(function TrendAreaChartCard({
  chartData,
  timeView,
  setTimeView,
  crossPeriod,
  crossDepto,
  crossLoja,
  handleTogglePeriod,
  avgReceita
}) {
  return (
    <div className="executive-card chart-card-entrance-1">
      <div className="card-header-flex">
        <div>
          <div className="card-title-executive">
            <span>Tendência de Faturamento & Margem</span>
          </div>
          <div className="card-subtitle-executive">
            {crossDepto || crossLoja || crossPeriod
              ? `Evolução temporal filtrada (${[crossDepto && `Depto: ${crossDepto}`, crossLoja && `Loja: ${crossLoja}`, crossPeriod && `Data: ${crossPeriod}`].filter(Boolean).join(' • ')})`
              : 'Evolução temporal da receita vs margem de contribuição'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* TOGGLE TEMPORAL */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {['dia', 'semana', 'mes', 'ano'].map(v => (
              <button 
                key={v}
                onClick={() => setTimeView(v)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: timeView === v ? '#ffffff' : 'transparent',
                  color: timeView === v ? '#0f172a' : '#64748b',
                  boxShadow: timeView === v ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  textTransform: 'capitalize',
                  transition: 'all 0.18s ease'
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* LEGENDAS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span> Faturamento
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Margem
            </span>
          </div>
        </div>
      </div>

      <div className="chart-container-responsive">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            key={`area-chart-${timeView}`}
            data={chartData} 
            margin={{ top: 16, right: 16, left: 0, bottom: 6 }}
            onClick={(e) => {
              if (e && e.activeLabel) {
                handleTogglePeriod(e.activeLabel);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="colorMargem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="colorReceitaMuted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="colorMargemMuted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              axisLine={{ stroke: '#e2e8f0' }} 
              tickLine={false} 
              dy={6}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              tickFormatter={formatK} 
              axisLine={false} 
              tickLine={false} 
              width={78}
            />
            {avgReceita > 0 && (
              <ReferenceLine 
                y={avgReceita} 
                stroke="#94a3b8" 
                strokeDasharray="4 4" 
                strokeOpacity={0.6}
                label={{ value: `Média:\u00A0${formatK(avgReceita)}/${timeView}`, position: 'insideTopLeft', fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
              />
            )}
            {crossPeriod && (
              <ReferenceLine 
                x={crossPeriod} 
                stroke="#2563eb" 
                strokeWidth={1.5} 
                strokeDasharray="3 3" 
                label={{ value: `${crossPeriod} (Ativo)`, position: 'top', fill: '#1d4ed8', fontSize: 10, fontWeight: 700 }} 
              />
            )}
            <RechartsTooltip 
              content={<CustomAreaTooltip timeView={timeView} />}
              cursor={false} 
            />
            <Area 
              type="monotone" 
              dataKey="receita" 
              name="receita" 
              stroke={crossPeriod ? '#94a3b8' : '#2563eb'} 
              strokeOpacity={crossPeriod ? 0.38 : 1} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={crossPeriod ? 'url(#colorReceitaMuted)' : 'url(#colorReceita)'} 
              dot={(dotProps) => {
                const isSelected = crossPeriod && dotProps.payload?.displayDate === crossPeriod;
                if (isSelected) {
                  return (
                    <circle 
                      key={`dot-rec-${dotProps.index}`}
                      cx={dotProps.cx} 
                      cy={dotProps.cy} 
                      r={5.5} 
                      fill="#2563eb" 
                      stroke="#ffffff" 
                      strokeWidth={2.5} 
                      style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 6px rgba(37,99,235,0.55))' }}
                    />
                  );
                }
                if (chartData.length > 25 && dotProps.index % 2 !== 0) return null;
                return (
                  <circle 
                    key={`dot-rec-${dotProps.index}`}
                    cx={dotProps.cx} 
                    cy={dotProps.cy} 
                    r={crossPeriod ? 2 : 2.4} 
                    fill={crossPeriod ? '#94a3b8' : '#2563eb'} 
                    opacity={crossPeriod ? 0.35 : 0.85}
                    style={{ cursor: 'pointer' }}
                  />
                );
              }}
              activeDot={{ 
                r: 4.8, 
                strokeWidth: 2.2, 
                fill: '#2563eb', 
                stroke: '#ffffff',
                style: { filter: 'drop-shadow(0 2px 5px rgba(37,99,235,0.5))', cursor: 'pointer' }
              }}
              isAnimationActive={true}
              animationDuration={275}
              animationEasing="ease-out"
              animationBegin={0}
            />
            <Area 
              type="monotone" 
              dataKey="mc" 
              name="mc" 
              stroke={crossPeriod ? '#94a3b8' : '#10b981'} 
              strokeOpacity={crossPeriod ? 0.38 : 1} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={crossPeriod ? 'url(#colorMargemMuted)' : 'url(#colorMargem)'} 
              dot={(dotProps) => {
                const isSelected = crossPeriod && dotProps.payload?.displayDate === crossPeriod;
                if (isSelected) {
                  return (
                    <circle 
                      key={`dot-mc-${dotProps.index}`}
                      cx={dotProps.cx} 
                      cy={dotProps.cy} 
                      r={5} 
                      fill="#10b981" 
                      stroke="#ffffff" 
                      strokeWidth={2.5} 
                      style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 5px rgba(16,185,129,0.55))' }}
                    />
                  );
                }
                if (chartData.length > 25 && dotProps.index % 2 !== 0) return null;
                return (
                  <circle 
                    key={`dot-mc-${dotProps.index}`}
                    cx={dotProps.cx} 
                    cy={dotProps.cy} 
                    r={crossPeriod ? 1.8 : 2.2} 
                    fill={crossPeriod ? '#94a3b8' : '#10b981'} 
                    opacity={crossPeriod ? 0.35 : 0.85}
                    style={{ cursor: 'pointer' }}
                  />
                );
              }}
              activeDot={{ 
                r: 4.4, 
                strokeWidth: 2, 
                fill: '#10b981', 
                stroke: '#ffffff',
                style: { filter: 'drop-shadow(0 2px 5px rgba(16,185,129,0.5))', cursor: 'pointer' }
              }}
              isAnimationActive={true}
              animationDuration={275}
              animationEasing="ease-out"
              animationBegin={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Cache em memória de alta velocidade (0ms de latência para filtros cruzados)
  const crossCacheRef = useRef(new Map());
  
  // Cross-filtering states for interactive charts
  const [crossDepto, setCrossDepto] = useState(null);
  const [crossDeptos, setCrossDeptos] = useState(null);
  const othersDeptoNamesRef = useRef([]);
  const [crossLoja, setCrossLoja] = useState(null);
  const [crossPeriod, setCrossPeriod] = useState(null);

  // Interactive modal drilldown ('faturamento' | 'cmv' | 'margem' | 'volumeTicket')
  const [selectedModalKpi, setSelectedModalKpi] = useState(null);
  // Vetor de coordenadas do card clicado para zoom direto e fluido do card ao modal
  const [cardOrigin, setCardOrigin] = useState(null);

  const handleOpenModal = (kpiKey, e) => {
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = window.innerHeight / 2;
      
      const deltaX = Math.round(cardCenterX - screenCenterX);
      const deltaY = Math.round(cardCenterY - screenCenterY);
      const targetModalWidth = Math.min(1040, window.innerWidth - 32);
      const targetModalHeight = Math.min(window.innerHeight * 0.9, 720);
      
      const scaleX = +(rect.width / targetModalWidth).toFixed(3);
      const scaleY = +(rect.height / targetModalHeight).toFixed(3);
      
      setCardOrigin({
        x: deltaX,
        y: deltaY,
        scaleX: Math.max(scaleX, 0.2),
        scaleY: Math.max(scaleY, 0.16)
      });
    }

    // Abre instantaneamente sem atraso ou engasgo de 130ms
    setSelectedModalKpi(kpiKey);
  };

  // Custom floating tooltip for department bars
  const [hoveredDept, setHoveredDept] = useState(null);
  const [deptMousePos, setDeptMousePos] = useState({ x: 0, y: 0 });

  // Premium floating tooltips for Lojas and Top Produtos (identicos ao grafico de linhas)
  const [hoveredStore, setHoveredStore] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [floatingMousePos, setFloatingMousePos] = useState({ x: 0, y: 0 });
  // Mouse position tracked over the donut chart for the external tooltip
  const [donutMousePos, setDonutMousePos] = useState({ x: 0, y: 0 });
  const [isDonutHovered, setIsDonutHovered] = useState(false);
  const donutRef = useRef(null);

  // Controla entrada animada dos gráficos e barras em cascata
  const [chartMounted, setChartMounted] = useState(false);
  // isAnimationActive sempre true → Recharts morfará automaticamente quando os dados mudarem (ex: seleção de data)
  // Sem donutPulseKey: não forçamos remontagem que reseta toda a animação de varredura

  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');
  const ts = searchParams.get('ts');

  // Time aggregation for Area Chart ('dia' | 'semana' | 'mes' | 'ano')
  // Abre automaticamente em Ano (> 3 anos), Mês (> 1 mês) ou Dia (demais)
  const [timeView, setTimeView] = useState(() => getSmartTimeView(dataInicio, dataFim));

  useEffect(() => {
    if (dataInicio && dataFim) {
      setTimeView(getSmartTimeView(dataInicio, dataFim));
    }
  }, [dataInicio, dataFim]);

  // Reset cross-filters and clear memory cache when the global date range changes
  useEffect(() => {
    crossCacheRef.current.clear();
    setCrossDepto(null);
    setCrossLoja(null);
    setCrossPeriod(null);
  }, [dataInicio, dataFim]);

  // Entrada animada dos gráficos apenas no carregamento inicial da página
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartMounted(true);
    }, 80);
    return () => clearTimeout(timer);
  }, []);


  const getCacheKey = (depto, loja, period, deptos) => {
    const dStr = deptos && deptos.length > 0 ? deptos.join(',') : (depto || '');
    return `${dStr.trim().toUpperCase()}__${(loja || '').trim().toUpperCase()}__${(period || '').trim().toUpperCase()}`;
  };

  useEffect(() => {
    if (!dataInicio || !dataFim) return;
    let isMounted = true;

    const cacheKey = getCacheKey(crossDepto, crossLoja, crossPeriod, crossDeptos);

    // 1. SE JÁ ESTÁ NO CACHE EM MEMÓRIA: ATUALIZAÇÃO INSTANTÂNEA EM 0ms (SEM REDE, SEM ESPERA)
    if (crossCacheRef.current.has(cacheKey)) {
      setData(crossCacheRef.current.get(cacheKey));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!data) {
        setLoading(true);
      }
      try {
        const queryParams = new URLSearchParams(searchParams.toString());
        if (crossDeptos && crossDeptos.length > 0) {
          queryParams.set('crossDeptos', crossDeptos.join(','));
          queryParams.set('crossDepto', 'Outros');
        } else if (crossDepto) {
          queryParams.set('crossDepto', crossDepto);
          queryParams.delete('crossDeptos');
        } else {
          queryParams.delete('crossDepto');
          queryParams.delete('crossDeptos');
        }

        if (crossLoja) queryParams.set('crossLoja', crossLoja);
        else queryParams.delete('crossLoja');

        if (crossPeriod) queryParams.set('crossPeriod', crossPeriod);
        else queryParams.delete('crossPeriod');

        const res = await fetch(`/api/dashboard?${queryParams.toString()}`);
        if (!res.ok) throw new Error('API Error');
        const json = await res.json();
        
        if (isMounted) {
          // Armazena no cache local de alta velocidade
          crossCacheRef.current.set(cacheKey, json);
          setData(json);

          // Se acabou de carregar a visão geral base (sem filtros ativos), pré-aquece as lojas e departamentos em background
          if (!crossDepto && !crossDeptos && !crossLoja && !crossPeriod && json.filters) {
            const lojas = json.filters.lojas || [];
            const deptos = (json.filters.departamentos || []).slice(0, 6);

            setTimeout(() => {
              if (!isMounted) return;
              lojas.forEach(lojaName => {
                const k = getCacheKey(null, lojaName, null);
                if (!crossCacheRef.current.has(k)) {
                  const q = new URLSearchParams(searchParams.toString());
                  q.set('crossLoja', lojaName);
                  fetch(`/api/dashboard?${q.toString()}`)
                    .then(r => r.ok ? r.json() : null)
                    .then(j => { if (j) crossCacheRef.current.set(k, j); })
                    .catch(() => {});
                }
              });
              deptos.forEach(dName => {
                const k = getCacheKey(dName, null, null);
                if (!crossCacheRef.current.has(k)) {
                  const q = new URLSearchParams(searchParams.toString());
                  q.set('crossDepto', dName);
                  fetch(`/api/dashboard?${q.toString()}`)
                    .then(r => r.ok ? r.json() : null)
                    .then(j => { if (j) crossCacheRef.current.set(k, j); })
                    .catch(() => {});
                }
              });
            }, 100);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [searchParams, dataInicio, dataFim, ts, crossDepto, crossLoja, crossPeriod]);

  // Garante que tooltips e estados suspensos nunca fiquem travados ao rolar a página ou mudar de foco
  useEffect(() => {
    if (!hoveredDept && !hoveredStore && !hoveredProduct) return;

    const handleClearTooltips = () => {
      setHoveredDept(null);
      setHoveredStore(null);
      setHoveredProduct(null);
      setIsDonutHovered(false);
    };

    window.addEventListener('scroll', handleClearTooltips, true);
    window.addEventListener('blur', handleClearTooltips);

    return () => {
      window.removeEventListener('scroll', handleClearTooltips, true);
      window.removeEventListener('blur', handleClearTooltips);
    };
  }, [hoveredDept, hoveredStore, hoveredProduct]);

  const handleToggleDepto = (dName) => {
    setHoveredDept(null);
    setHoveredStore(null);
    setHoveredProduct(null);
    const isOutros = dName?.toUpperCase() === 'OUTROS';
    const isCurrentlyActive = crossDepto?.toUpperCase() === dName?.toUpperCase();

    let nextDepto = null;
    let nextDeptos = null;

    if (!isCurrentlyActive) {
      if (isOutros) {
        nextDepto = 'Outros';
        nextDeptos = othersDeptoNamesRef.current || [];
      } else {
        nextDepto = dName;
        nextDeptos = null;
      }
    }

    const k = getCacheKey(nextDepto, crossLoja, crossPeriod, nextDeptos);
    if (crossCacheRef.current.has(k)) {
      setData(crossCacheRef.current.get(k));
    }
    setCrossDepto(nextDepto);
    setCrossDeptos(nextDeptos);
  };

  const handleToggleLoja = (sName) => {
    setHoveredDept(null);
    setHoveredStore(null);
    setHoveredProduct(null);
    const nextLoja = crossLoja?.toUpperCase() === sName?.toUpperCase() ? null : sName;
    const k = getCacheKey(crossDepto, nextLoja, crossPeriod, crossDeptos);
    if (crossCacheRef.current.has(k)) {
      setData(crossCacheRef.current.get(k));
    }
    setCrossLoja(nextLoja);
  };

  const handleTogglePeriod = useCallback((period) => {
    setHoveredDept(null);
    setHoveredStore(null);
    setHoveredProduct(null);
    setCrossPeriod(prev => {
      const nextPeriod = prev === period ? null : period;
      const k = getCacheKey(crossDepto, crossLoja, nextPeriod, crossDeptos);
      if (crossCacheRef.current.has(k)) {
        setData(crossCacheRef.current.get(k));
      }
      return nextPeriod;
    });
    // Recharts morfará os dados automaticamente pois isAnimationActive={true} sempre
  }, [crossDepto, crossLoja, crossDeptos]);

  const handleClearAllFilters = () => {
    setHoveredDept(null);
    setHoveredStore(null);
    setHoveredProduct(null);
    const k = getCacheKey(null, null, null, null);
    if (crossCacheRef.current.has(k)) {
      setData(crossCacheRef.current.get(k));
    }
    setCrossDepto(null);
    setCrossDeptos(null);
    setCrossLoja(null);
    setCrossPeriod(null);
  };

  // ── 1. DADOS DO GRÁFICO DE EVOLUÇÃO (MEMOIZADO: data.charts.area) ──
  const chartData = useMemo(() => {
    if (!data?.charts?.area) return [];
    const raw = data.charts.area.map(d => ({
      date: d.date,
      isoDate: d.isoDate,
      sortKey: d.sortKey,
      receita: Number(d.receita || 0),
      cmv: Number(d.cmv || 0),
      mc: Number(d.mc || 0),
      volume: Number(d.volume || 0)
    }));
    return aggregateChartData(raw, timeView);
  }, [data?.charts?.area, timeView]);

  const avgReceita = useMemo(() => {
    return chartData.length > 0 ? (chartData.reduce((s, i) => s + i.receita, 0) / chartData.length) : 0;
  }, [chartData]);

  if (!dataInicio || !dataFim) return null;
  if (loading) return (
    <div style={{ height: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div 
          className="core-loader-spin"
          style={{ 
            position: 'absolute', 
            inset: 0, 
            border: '2.5px solid rgba(37, 99, 235, 0.1)', 
            borderTopColor: '#2563eb', 
            borderRightColor: '#0284c7', 
            borderRadius: '50%' 
          }} 
        />
        <img 
          src="/images/core-icon-perfect.png" 
          alt="Análises Core" 
          className="core-loader-icon"
          style={{ width: '38px', height: '38px', objectFit: 'contain' }} 
        />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', letterSpacing: '0.2px' }}>
        Carregando dados...
      </span>
    </div>
  );
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Nenhum dado encontrado para o período.</div>;

  // ── 2. DADOS DO GRÁFICO DE DEPARTAMENTOS (ORDENADOS DO MAIOR PARA O MENOR) ──
  const rawDepts = [...(data.charts?.marcasDonut || [])].sort((a, b) => (b.value || 0) - (a.value || 0));
  const totalDeptsVal = rawDepts.reduce((s, i) => s + (i.value || 0), 0);
  const maxDeptValue = Math.max(...rawDepts.map(d => d.value || 0), 1);
  const allDeptsData = rawDepts.map((d, idx) => {
    const pct = totalDeptsVal > 0 ? (d.value / totalDeptsVal) * 100 : 0;
    const barFillPct = maxDeptValue > 0 ? (d.value / maxDeptValue) * 100 : 0;
    return {
      name: d.name || 'Outros',
      fullName: d.name,
      value: d.value,
      pctFormatted: `${pct.toFixed(1)}%`,
      pct: pct,
      barFillPct: barFillPct,
      cmv: d.cmv || 0,
      mc: d.mc || 0,
      margemContribuicaoPerc: d.margemContribuicaoPerc || (d.value > 0 ? (((d.value - (d.cmv || 0))) / d.value) * 100 : 0),
      color: DEPT_COLORS[idx % DEPT_COLORS.length]
    };
  });

  const stores = data.tables?.vendedores || data.charts?.topVendedores || [];
  const maxStoreRevenue = Math.max(...(stores.map(s => s.receita || 0)), 1);
  const topProdutos = (data.tables?.topProdutosPorFaturamento || data.tables?.topProdutos || [])
    .slice()
    .sort((a, b) => (b.receita || b.faturamento || 0) - (a.receita || a.faturamento || 0));

  const donutDepts = (() => {
    if (!allDeptsData || allDeptsData.length === 0) return [];
    if (allDeptsData.length <= 7) return allDeptsData;
    const top = allDeptsData.slice(0, 6);
    const others = allDeptsData.slice(6);
    const othersNames = others.map(d => d.fullName || d.name).filter(Boolean);
    if (!crossDepto || crossDepto.toUpperCase() !== 'OUTROS') {
      othersDeptoNamesRef.current = othersNames;
    }
    const othersVal = others.reduce((s, d) => s + d.value, 0);
    const othersCmv = others.reduce((s, d) => s + d.cmv, 0);
    const othersMc = others.reduce((s, d) => s + d.mc, 0);
    const totalVal = allDeptsData.reduce((s, d) => s + d.value, 0);
    const othersPct = totalVal > 0 ? (othersVal / totalVal) * 100 : 0;

    const list = [
      ...top,
      {
        name: 'OUTROS',
        fullName: 'Outros',
        value: othersVal,
        pctFormatted: `${othersPct.toFixed(1)}%`,
        cmv: othersCmv,
        mc: othersMc,
        margemContribuicaoPerc: othersVal > 0 ? (othersMc / othersVal) * 100 : 0,
        color: '#8b5cf6' // Violeta executivo sem cinza!
      }
    ];
    return list.sort((a, b) => (b.value || 0) - (a.value || 0));
  })();

  // ── DADOS DERIVADOS ESTRATÉGICOS PARA OS 4 CARDS DE KPI (COM SUPORTE A FILTRO ATIVO) ──
  const totalNetworkRevenue = stores.reduce((sum, s) => sum + (s.receita || 0), 0);
  const totalNetworkCmv = stores.reduce((sum, s) => sum + (s.cmv || 0), 0);
  const totalNetworkMc = stores.reduce((sum, s) => sum + (s.mc || 0), 0);
  const totalNetworkVol = stores.reduce((sum, s) => sum + (s.volume || s.qtde || 0), 0);

  // Se houver filtro de Loja ativo (crossLoja), os cards refletem a loja filtrada
  const activeFilteredStore = crossLoja ? stores.find(s => s.nome?.toUpperCase() === crossLoja.toUpperCase()) : null;

  // 1. Faturamento
  const topFatLoja = activeFilteredStore || stores[0] || {};
  const topFatLojaPct = crossLoja
    ? (totalNetworkRevenue > 0 ? ((data.kpis?.receitaLiquida || 0) / totalNetworkRevenue) * 100 : 0)
    : (data.kpis?.receitaLiquida > 0 ? ((topFatLoja.receita || 0) / data.kpis.receitaLiquida) * 100 : 0);

  const topFatDepto = allDeptsData[0] || {};
  const topFatDeptoName = topFatDepto.name ? (topFatDepto.name.charAt(0).toUpperCase() + topFatDepto.name.slice(1).toLowerCase()) : 'Mercearia';
  const topFatDeptoPct = topFatDepto.pct || 0;

  // 2. CMV (Custo de Mercadorias)
  const deptsByCmv = [...allDeptsData].sort((a, b) => (b.cmv || 0) - (a.cmv || 0));
  const topCmvDepto = deptsByCmv[0] || {};
  const topCmvDeptoName = topCmvDepto.name ? (topCmvDepto.name.charAt(0).toUpperCase() + topCmvDepto.name.slice(1).toLowerCase()) : 'Açougue';
  const topCmvDeptoPct = data.kpis?.cmvGeral > 0 ? ((topCmvDepto.cmv || 0) / data.kpis.cmvGeral) * 100 : 0;
  const cmvPctFat = data.kpis?.receitaLiquida > 0 ? ((data.kpis.cmvGeral / data.kpis.receitaLiquida) * 100) : 0;

  const storesByCmv = [...stores].sort((a, b) => (b.cmv || 0) - (a.cmv || 0));
  const topCmvLoja = activeFilteredStore || storesByCmv[0] || {};
  const topCmvLojaPct = crossLoja
    ? (totalNetworkCmv > 0 ? ((data.kpis?.cmvGeral || 0) / totalNetworkCmv) * 100 : 0)
    : (data.kpis?.cmvGeral > 0 ? ((topCmvLoja.cmv || 0) / data.kpis.cmvGeral) * 100 : 0);

  // 3. Margem Bruta
  const deptsByMargemPerc = [...allDeptsData].filter(d => (d.value || 0) > 1000).sort((a, b) => (b.margemContribuicaoPerc || 0) - (a.margemContribuicaoPerc || 0));
  const topRentavelDepto = deptsByMargemPerc[0] || allDeptsData[0] || {};
  const topRentavelDeptoName = topRentavelDepto.name ? (topRentavelDepto.name.charAt(0).toUpperCase() + topRentavelDepto.name.slice(1).toLowerCase()) : 'Padaria';
  
  const storesByMc = [...stores].sort((a, b) => (b.mc || 0) - (a.mc || 0));
  const topMcLoja = activeFilteredStore || storesByMc[0] || {};
  const topMcLojaPct = crossLoja
    ? (totalNetworkMc > 0 ? ((data.kpis?.margemContribuicao || 0) / totalNetworkMc) * 100 : 0)
    : (data.kpis?.margemContribuicao > 0 ? ((topMcLoja.mc || 0) / data.kpis.margemContribuicao) * 100 : 0);

  // 4. Volume & Ticket Médio
  const daysCount = crossPeriod ? 1 : Math.max(chartData.length, 1);
  const dailyVolume = (data.kpis?.volumeTotal || 0) / daysCount;
  const storesByVol = [...stores].sort((a, b) => (b.volume || b.qtde || 0) - (a.volume || a.qtde || 0));
  const topVolLoja = activeFilteredStore || storesByVol[0] || {};
  const topVolLojaPct = crossLoja
    ? (totalNetworkVol > 0 ? ((data.kpis?.volumeTotal || 0) / totalNetworkVol) * 100 : 0)
    : (data.kpis?.volumeTotal > 0 ? (((topVolLoja.volume || topVolLoja.qtde || 0)) / data.kpis.volumeTotal) * 100 : 0);

  return (
    <div className="dashboard-container">

      {/* ── ROW 1: OS 4 CARDS DE KPI (COM O 'SEGREDO' DO CLIQUE) ── */}
      <div className="kpi-row-grid">
        
        {/* 1. FATURAMENTO */}
        <div 
          className="kpi-card-clickable theme-blue kpi-card-entrance-1" 
          onClick={(e) => handleOpenModal('faturamento', e)}
        >
          <div className="kpi-card-header">
            <div className="kpi-label-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: '#eff6ff', color: '#2563eb' }}>
                <DollarSign size={14} />
              </div>
              <span style={{ color: '#475569', fontWeight: 600 }}>Faturamento Líquido</span>
            </div>
            <span className="kpi-secret-hint">Detalhar <ArrowUpRight size={12} /></span>
          </div>

          {/* Valor Principal com R$ refinado em tipografia executiva */}
          <div style={{ display: 'flex', alignItems: 'baseline', margin: '4px 0 6px 0', lineHeight: 1.1 }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>R$</span>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px' }}>
              {Number(data.kpis.receitaLiquida || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Média Diária e Delta (Posicionados ACIMA - Sem quebra de linha) */}
          <div className="kpi-footer-flex" style={{ marginBottom: '8px' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '3px', 
              background: '#f8fafc', 
              color: '#334155', 
              border: '1px solid #e2e8f0', 
              padding: '2px 6px', 
              borderRadius: '6px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              <span style={{ color: '#94a3b8', fontWeight: 500 }}>{crossPeriod ? 'Dia:' : 'Média:'}</span>
              <strong style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(data.kpis.receitaLiquida / daysCount)}{crossPeriod ? '' : '/dia'}</strong>
            </span>
            <span className={(data.kpis.receitaLiquidaDeltaPct || 0) >= 0 ? 'kpi-badge-positive' : 'kpi-badge-negative'}>
              {(data.kpis.receitaLiquidaDeltaPct || 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {(data.kpis.receitaLiquidaDeltaPct || 0) >= 0 ? '+' : ''}{(data.kpis.receitaLiquidaDeltaPct || 0).toFixed(1)}% {data.kpis.periodDeltaLabel || 'vs ant.'}
            </span>
          </div>

          {/* Micro-faixa executiva de Liderança & Mix (Posicionada ABAIXO no rodapé) */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '6px', 
            padding: '5px 8px', 
            background: '#f8fafc', 
            borderRadius: '7px', 
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                {crossLoja ? 'Loja' : 'Líder'}
              </span>
              <strong style={{ color: '#0f172a', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>{topFatLoja.nome || 'Loja 01'}</strong>
              <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                ({topFatLojaPct.toFixed(0)}%)
              </span>
            </div>

            <div style={{ width: '1px', height: '12px', background: '#cbd5e1', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Mix</span>
              <strong style={{ color: '#0f172a', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                {topFatDeptoName}
              </strong>
              <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                ({allDeptsData[0]?.pctFormatted || ''})
              </span>
            </div>
          </div>
        </div>

        {/* 2. CMV */}
        <div 
          className="kpi-card-clickable theme-amber kpi-card-entrance-2" 
          onClick={(e) => handleOpenModal('cmv', e)}
        >
          <div className="kpi-card-header">
            <div className="kpi-label-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: '#fffbeb', color: '#d97706' }}>
                <Activity size={14} />
              </div>
              <span style={{ color: '#475569', fontWeight: 600 }}>Custo de Mercadorias</span>
            </div>
            <span className="kpi-secret-hint" style={{ color: '#d97706', background: '#fffbeb' }}>Detalhar <ArrowUpRight size={12} /></span>
          </div>

          {/* Valor Principal com R$ refinado em tipografia executiva */}
          <div style={{ display: 'flex', alignItems: 'baseline', margin: '4px 0 6px 0', lineHeight: 1.1 }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>R$</span>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', whiteSpace: 'nowrap' }}>
              {Number(data.kpis.cmvGeral || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Impacto no Faturamento e Delta de Custo (Posicionados ACIMA - Sem quebra de linha) */}
          <div className="kpi-footer-flex" style={{ marginBottom: '8px' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '3px', 
              background: '#fffbeb', 
              color: '#b45309', 
              border: '1px solid #fef3c7', 
              padding: '2px 6px', 
              borderRadius: '6px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              <span style={{ color: '#d97706', fontWeight: 500 }}>Peso:</span>
              <strong style={{ fontWeight: 700, color: '#b45309' }}>{cmvPctFat.toFixed(1)}%</strong>
            </span>
            <span className={(data.kpis.cmvGeralDeltaPct || 0) <= 0 ? 'kpi-badge-positive' : 'kpi-badge-negative'}>
              {(data.kpis.cmvGeralDeltaPct || 0) <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
              {(data.kpis.cmvGeralDeltaPct || 0) >= 0 ? '+' : ''}{(data.kpis.cmvGeralDeltaPct || 0).toFixed(1)}% {data.kpis.periodDeltaLabel || 'vs ant.'}
            </span>
          </div>

          {/* Micro-faixa executiva de Custo: Depto & Loja (Sem quebra de linha) */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '6px', 
            padding: '5px 8px', 
            background: '#f8fafc', 
            borderRadius: '7px', 
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Depto</span>
              <strong style={{ color: '#0f172a', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>{topCmvDeptoName}</strong>
              <span style={{ color: '#d97706', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                ({topCmvDeptoPct.toFixed(0)}%)
              </span>
            </div>

            <div style={{ width: '1px', height: '12px', background: '#cbd5e1', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Loja</span>
              <strong style={{ color: '#0f172a', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                {topCmvLoja.nome || 'Loja 01'}
              </strong>
              <span style={{ color: '#d97706', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                ({topCmvLojaPct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* 3. MARGEM BRUTA */}
        <div 
          className="kpi-card-clickable theme-emerald kpi-card-entrance-3" 
          onClick={(e) => handleOpenModal('margem', e)}
        >
          <div className="kpi-card-header">
            <div className="kpi-label-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: '#ecfdf5', color: '#059669' }}>
                <TrendingUp size={14} />
              </div>
              <span style={{ color: '#475569', fontWeight: 600 }}>Margem Bruta</span>
            </div>
            <span className="kpi-secret-hint" style={{ color: '#059669', background: '#ecfdf5' }}>Detalhar <ArrowUpRight size={12} /></span>
          </div>

          {/* Valor Principal com R$ refinado em tipografia executiva */}
          <div style={{ display: 'flex', alignItems: 'baseline', margin: '4px 0 6px 0', lineHeight: 1.1 }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>R$</span>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', whiteSpace: 'nowrap' }}>
              {Number(data.kpis.margemContribuicao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Margem % Efetiva e Delta de Margem (Posicionados ACIMA - Sem quebra de linha) */}
          <div className="kpi-footer-flex" style={{ marginBottom: '8px' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '3px', 
              background: '#ecfdf5', 
              color: '#065f46', 
              border: '1px solid #a7f3d0', 
              padding: '2px 6px', 
              borderRadius: '6px', 
              fontSize: '11px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              <span style={{ color: '#059669', fontWeight: 500 }}>Margem:</span>
              <strong style={{ fontWeight: 700, color: '#047857' }}>{(data.kpis.margemContribuicaoPerc || 0).toFixed(1)}%</strong>
            </span>
            <span className={(data.kpis.margemContribuicaoDeltaPct || 0) >= 0 ? 'kpi-badge-positive' : 'kpi-badge-negative'}>
              {(data.kpis.margemContribuicaoDeltaPct || 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {(data.kpis.margemContribuicaoDeltaPct || 0) >= 0 ? '+' : ''}{(data.kpis.margemContribuicaoDeltaPct || 0).toFixed(1)}% {data.kpis.periodDeltaLabel || 'vs ant.'}
            </span>
          </div>

          {/* Micro-faixa executiva de Rentabilidade: Depto & Loja (Sem quebra de linha) */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '6px', 
            padding: '5px 8px', 
            background: '#f8fafc', 
            borderRadius: '7px', 
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Top</span>
              <strong style={{ color: '#0f172a', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>{topRentavelDeptoName}</strong>
              <span style={{ color: '#059669', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                ({(topRentavelDepto.margemContribuicaoPerc || 0).toFixed(0)}%)
              </span>
            </div>

            <div style={{ width: '1px', height: '12px', background: '#cbd5e1', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Loja</span>
              <strong style={{ color: '#0f172a', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                {topMcLoja.nome || 'Loja 01'}
              </strong>
              <span style={{ color: '#059669', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                ({topMcLojaPct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* 4. VOLUME & TICKET */}
        <div 
          className="kpi-card-clickable theme-indigo kpi-card-entrance-4" 
          onClick={(e) => handleOpenModal('volumeTicket', e)}
        >
          <div className="kpi-card-header">
            <div className="kpi-label-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: '#eef2ff', color: '#4f46e5' }}>
                <Package size={14} />
              </div>
              <span style={{ color: '#475569', fontWeight: 600 }}>Volume Total</span>
            </div>
            <span className="kpi-secret-hint" style={{ color: '#4f46e5', background: '#eef2ff' }}>Detalhar <ArrowUpRight size={12} /></span>
          </div>

          {/* Valor Principal com unidade refinada em tipografia executiva */}
          <div style={{ display: 'flex', alignItems: 'baseline', margin: '4px 0 6px 0', lineHeight: 1.1 }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', whiteSpace: 'nowrap' }}>
              {Math.round(data.kpis.volumeTotal || 0).toLocaleString('pt-BR')}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginLeft: '4px', whiteSpace: 'nowrap' }}>un.</span>
          </div>

          {/* Ticket Médio e Delta de Volume (Posicionados ACIMA - Sem quebra de linha) */}
          <div className="kpi-footer-flex" style={{ marginBottom: '8px' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '3px', 
              background: '#eef2ff', 
              color: '#3730a3', 
              border: '1px solid #c7d2fe', 
              padding: '2px 6px', 
              borderRadius: '6px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              <span style={{ color: '#4f46e5', fontWeight: 500 }}>TM:</span>
              <strong style={{ fontWeight: 700, color: '#312e81' }}>{formatCurrency(data.kpis.ticketMedio)}</strong>
            </span>
            <span className={(data.kpis.volumeTotalDeltaPct || 0) >= 0 ? 'kpi-badge-positive' : 'kpi-badge-negative'}>
              {(data.kpis.volumeTotalDeltaPct || 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {(data.kpis.volumeTotalDeltaPct || 0) >= 0 ? '+' : ''}{(data.kpis.volumeTotalDeltaPct || 0).toFixed(1)}% {data.kpis.periodDeltaLabel ? data.kpis.periodDeltaLabel : 'vs ant.'}
            </span>
          </div>

          {/* Micro-faixa executiva de Giro & Loja (Sem quebra de linha) */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '6px', 
            padding: '5px 8px', 
            background: '#f8fafc', 
            borderRadius: '7px', 
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Giro</span>
              <strong style={{ color: '#0f172a', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                {formatNumber(dailyVolume)}{crossPeriod ? ' un.' : '/dia'}
              </strong>
            </div>

            <div style={{ width: '1px', height: '12px', background: '#cbd5e1', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Loja</span>
              <strong style={{ color: '#0f172a', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                {topVolLoja.nome || 'Loja 01'}
              </strong>
              <span style={{ color: '#4f46e5', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                ({topVolLojaPct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── MODAL EXECUTIVO DE DETALHAMENTO (O SEGREDO DO CLIQUE - VÍDEO 2 00:04) ── */}
      <ModalKpiDetail 
        isOpen={!!selectedModalKpi} 
        onClose={() => {
          setSelectedModalKpi(null);
          setCardOrigin(null);
        }} 
        type={selectedModalKpi} 
        kpiData={data.kpis} 
        drilldownData={data.drilldown} 
        chartData={chartData}
        allDeptsData={allDeptsData}
        storesData={stores}
        crossLoja={crossLoja}
        crossDepto={crossDepto}
        crossPeriod={crossPeriod}
        cardOrigin={cardOrigin}
      />

      {/* ── ROW 2: GRÁFICO PRINCIPAL (EVOLUÇÃO) + COMPOSIÇÃO DEPARTAMENTO (ESTILO VÍDEO 2) ── */}
      <div className="dashboard-grid-main">
        
        {/* GRÁFICO DE LINHA / ÁREA SUAVE (MEMOIZADO - ZERO RE-RENDER NO HOVER) */}
        <TrendAreaChartCard 
          chartData={chartData}
          timeView={timeView}
          setTimeView={setTimeView}
          crossPeriod={crossPeriod}
          crossDepto={crossDepto}
          crossLoja={crossLoja}
          handleTogglePeriod={handleTogglePeriod}
          avgReceita={avgReceita}
        />

        {/* COMPOSIÇÃO POR DEPARTAMENTO (DONUT EXECUTIVO COM NÚCLEO ATIVO) */}
        <div className="executive-card chart-card-entrance-2">
          <div className="card-header-flex">
            <div>
              <div className="card-title-executive" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieIcon size={16} color="#2563eb" />
                <span>Composição por Departamento</span>
              </div>
              <div className="card-subtitle-executive">
                {crossDepto ? 'Clique no departamento selecionado para limpar o filtro' : 'Mix de vendas consolidado • Clique para cruzar dados'}
              </div>
            </div>
          </div>

          <div 
            className="department-container-responsive"
            style={{ display: 'flex', width: '100%', height: '300px', gap: '12px', alignItems: 'stretch' }}
          >
            {/* ─ CHART (esquerda, largura fixa) ─ */}
            <div 
              ref={donutRef}
              onMouseMove={(e) => {
                setDonutMousePos({ x: e.clientX, y: e.clientY });
                setIsDonutHovered(true);
              }}
              onMouseEnter={(e) => {
                setDonutMousePos({ x: e.clientX, y: e.clientY });
                setIsDonutHovered(true);
              }}
              onMouseLeave={() => { 
                setHoveredDept(null); 
                setIsDonutHovered(false); 
              }}
              style={{ position: 'relative', flex: '0 0 260px', height: '100%' }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart 
                  onMouseMove={(e) => {
                    if (e && e.chartX !== undefined && e.nativeEvent) {
                      setDonutMousePos({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
                      setIsDonutHovered(true);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredDept(null);
                    setIsDonutHovered(false);
                  }}
                >
                  <Pie
                    data={donutDepts}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={72}
                    outerRadius={DONUT_OUTER_R}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    isAnimationActive={true}
                    animationDuration={420}
                    animationEasing="ease-in-out"
                    animationBegin={0}
                    cursor="pointer"
                    onMouseEnter={(entry, index, e) => {
                      if (e && e.clientX) setDonutMousePos({ x: e.clientX, y: e.clientY });
                      setIsDonutHovered(true);
                      if (entry) setHoveredDept(entry.payload || entry);
                    }}
                    onMouseMove={(entry, index, e) => {
                      if (e && e.clientX) setDonutMousePos({ x: e.clientX, y: e.clientY });
                      setIsDonutHovered(true);
                      if (entry) setHoveredDept(entry.payload || entry);
                    }}
                    onMouseLeave={() => {
                      setHoveredDept(null);
                      setIsDonutHovered(false);
                    }}
                    onClick={(entry) => {
                      if (!entry) return;
                      const d = entry.payload || entry;
                      const deptName = d?.fullName || d?.name;
                      if (deptName) handleToggleDepto(deptName);
                    }}
                  >
                    {donutDepts.map((entry, index) => {
                      const isSelected = crossDepto && crossDepto.toUpperCase() === entry.fullName.toUpperCase();
                      const isDimmed = crossDepto && !isSelected;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={isDimmed ? 0.28 : 1}
                          style={{ cursor: 'pointer', outline: 'none', transition: 'opacity 0.15s ease' }}
                          onMouseEnter={(e) => {
                            if (e && e.clientX) setDonutMousePos({ x: e.clientX, y: e.clientY });
                            setIsDonutHovered(true);
                            setHoveredDept(entry);
                          }}
                          onMouseMove={(e) => {
                            if (e && e.clientX) setDonutMousePos({ x: e.clientX, y: e.clientY });
                            setIsDonutHovered(true);
                            setHoveredDept(entry);
                          }}
                          onClick={(e) => {
                            e?.stopPropagation?.();
                            const deptName = entry.fullName || entry.name;
                            if (deptName) handleToggleDepto(deptName);
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Miolo central */}
              {(() => {
                const activeDeptObj = crossDepto ? allDeptsData.find(d => d.fullName?.toUpperCase() === crossDepto.toUpperCase()) : null;
                const currentDept = hoveredDept || activeDeptObj;
                const label = currentDept ? (currentDept.fullName || currentDept.name) : (crossDepto ? 'Filtro Ativo' : 'Mix Geral');
                const percentage = currentDept ? currentDept.pctFormatted : '100%';
                const subtitle = currentDept ? formatCurrency(currentDept.value) : formatCurrency(data.kpis?.receitaLiquida);
                const labelColor = currentDept ? (currentDept.color || '#2563eb') : (crossDepto ? '#2563eb' : '#64748b');
                return (
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center', pointerEvents: 'none',
                    width: '136px', padding: '0 6px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', userSelect: 'none'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '128px', transition: 'color 0.15s ease' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, margin: '2px 0', transition: 'all 0.15s ease' }}>
                      {percentage}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', transition: 'all 0.15s ease' }}>
                      {subtitle}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ─ LEGENDA HTML (direita) ─ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', overflowY: 'auto', padding: '4px 0' }}>
              {donutDepts.map((dept, i) => {
                const isSelected = crossDepto && crossDepto.toUpperCase() === dept.fullName?.toUpperCase();
                const isDimmed = crossDepto && !isSelected;
                const isHovered = hoveredDept && (hoveredDept.fullName || hoveredDept.name) === (dept.fullName || dept.name);
                return (
                  <div
                    key={i}
                    onClick={() => handleToggleDepto(dept.fullName)}
                    onMouseEnter={() => {
                      setIsDonutHovered(false);
                      setHoveredDept(dept);
                    }}
                    onMouseLeave={() => {
                      setHoveredDept(null);
                      setIsDonutHovered(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '5px 10px 5px 0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      opacity: isDimmed ? 0.3 : 1,
                      transition: 'opacity 0.15s ease',
                      borderLeft: `3px solid ${isSelected || isHovered ? dept.color : dept.color + '55'}`,
                      paddingLeft: '8px',
                      background: isSelected ? `${dept.color}12` : (isHovered ? `${dept.color}08` : 'transparent'),
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: isSelected ? dept.color : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase', letterSpacing: '0.3px', transition: 'color 0.15s' }}>
                        {dept.fullName || dept.name}
                      </div>
                      <div style={{ marginTop: '4px', height: '3px', borderRadius: '2px', background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${dept.pct || 0}%`, background: dept.color, borderRadius: '2px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: dept.color, flexShrink: 0, letterSpacing: '-0.3px', minWidth: '38px', textAlign: 'right' }}>
                      {dept.pctFormatted}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      {/* ── ROW 3: UNIDADES / LOJAS + TOP PRODUTOS (TABELA LEADERBOARD) ── */}
      <div className="dashboard-grid-secondary">
        
        {/* DESEMPENHO POR UNIDADE / LOJA (GRÁFICO PIRULITO / LOLLIPOP) */}
        <div className="executive-card chart-card-entrance-3">
          <div className="card-header-flex">
            <div>
              <div className="card-title-executive" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={16} color="#2563eb" />
                <span>Desempenho por Unidade / Loja</span>
              </div>
              <div className="card-subtitle-executive">
                {crossLoja ? 'Clique na unidade selecionada para limpar o filtro' : 'Clique em uma unidade para cruzar com todos os gráficos'}
              </div>
            </div>
          </div>

          <div 
            className="department-container-responsive premium-scrollbar"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              overflowY: 'auto',
              padding: '4px 6px 4px 2px',
              gap: '4px'
            }}
          >
            {stores.map((st, idx) => {
              const pct = maxStoreRevenue > 0 ? (st.receita / maxStoreRevenue) * 100 : 0;
              const isAnyLoja = Boolean(crossLoja);
              const isThisLojaSelected = isAnyLoja && crossLoja.toUpperCase() === st.nome.toUpperCase();
              const isThisLojaDimmed = isAnyLoja && !isThisLojaSelected;

              return (
                <div 
                  key={`${st.nome || 'st'}-${idx}`}
                  onClick={() => handleToggleLoja(st.nome)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    padding: '5px 8px', 
                    borderRadius: '8px', 
                    background: isThisLojaSelected ? '#eff6ff' : 'transparent',
                    border: isThisLojaSelected ? '1px solid #93c5fd' : '1px solid transparent',
                    opacity: isThisLojaDimmed ? 0.35 : 1,
                    filter: isThisLojaDimmed ? 'grayscale(0.95)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { 
                    setHoveredStore(st);
                    setFloatingMousePos({ x: e.clientX, y: e.clientY });
                    if (isThisLojaDimmed) {
                      e.currentTarget.style.opacity = '0.75';
                      e.currentTarget.style.filter = 'grayscale(0.3)';
                    } else if (!isThisLojaSelected) {
                      e.currentTarget.style.background = '#f8fafc'; 
                      e.currentTarget.style.borderColor = '#e2e8f0'; 
                    }
                  }}
                  onMouseMove={(e) => {
                    setFloatingMousePos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={(e) => { 
                    setHoveredStore(null);
                    if (isThisLojaDimmed) {
                      e.currentTarget.style.opacity = '0.35';
                      e.currentTarget.style.filter = 'grayscale(0.95)';
                    } else if (!isThisLojaSelected) {
                      e.currentTarget.style.background = 'transparent'; 
                      e.currentTarget.style.borderColor = 'transparent'; 
                    }
                  }}
                >
                  {/* Identificador / Loja */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '76px', flexShrink: 0 }}>
                    <span style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '5px', 
                      background: isThisLojaSelected ? '#2563eb' : '#f1f5f9', 
                      border: isThisLojaSelected ? '1px solid #2563eb' : '1px solid #e2e8f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      color: isThisLojaSelected ? '#ffffff' : '#64748b',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: isThisLojaSelected ? 800 : 700, 
                      color: isThisLojaSelected ? '#1d4ed8' : '#0f172a',
                      whiteSpace: 'nowrap'
                    }}>
                      {st.nome}
                    </span>
                  </div>

                  {/* Eixo / Pirulito (Haste + Ponto Circular) */}
                  <div style={{ flex: 1, position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
                    {/* Linha guia suave */}
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: isThisLojaDimmed ? '#f1f5f9' : '#e2e8f0', borderRadius: '1px' }} />
                    {/* Haste do pirulito */}
                    <div style={{ 
                      position: 'absolute', 
                      left: 0, 
                      width: chartMounted ? `${pct}%` : '0%', 
                      height: '2.5px', 
                      background: isThisLojaSelected 
                        ? '#1d4ed8' 
                        : (isThisLojaDimmed ? '#94a3b8' : 'linear-gradient(90deg, #93c5fa, #2563eb)'), 
                      borderRadius: '2px', 
                      transition: 'width 0.20s cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: `${idx * 10}ms`
                    }} />
                    {/* Ponto / Cabeça do pirulito */}
                    <div style={{ 
                      position: 'absolute', 
                      left: chartMounted ? `calc(${Math.max(pct, 2)}% - 6px)` : '-6px', 
                      opacity: chartMounted ? (isThisLojaDimmed ? 0.35 : 1) : 0,
                      transform: chartMounted ? 'scale(1)' : 'scale(0.35)',
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: isThisLojaSelected ? '#1d4ed8' : (isThisLojaDimmed ? '#94a3b8' : '#2563eb'), 
                      border: '2.5px solid #ffffff', 
                      boxShadow: isThisLojaSelected ? '0 0 0 2px #bfdbfe, 0 2px 6px rgba(37,99,235,0.4)' : '0 1px 4px rgba(37,99,235,0.3)', 
                      transition: 'left 0.20s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: `${idx * 10}ms`
                    }} />
                  </div>

                  {/* Faturamento e Margem */}
                  <div style={{ textAlign: 'right', minWidth: '88px', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: isThisLojaSelected ? 800 : 700, color: isThisLojaSelected ? '#1d4ed8' : '#0f172a' }}>
                      {formatCurrency(st.receita)}
                    </div>
                    <div style={{ fontSize: '10px', color: (st.margemContribuicaoPerc || 0) >= 15 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                      {(st.margemContribuicaoPerc || 0).toFixed(1)}% mg
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOP PRODUTOS POR FATURAMENTO (TABELA LEADERBOARD SVG PREMIUM) */}
        <div className="executive-card chart-card-entrance-4">
          <div className="card-header-flex">
            <div>
              <div className="card-title-executive" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={16} color="#d97706" /> 
                <span>Top Produtos por Faturamento</span>
              </div>
              <div className="card-subtitle-executive">
                {crossDepto ? `Ranking dos produtos líderes em ${crossDepto}` : 'Classificação Curva ABC e margem • Clique para filtrar pelo departamento'}
              </div>
            </div>
          </div>

          <div 
            className="department-container-responsive premium-scrollbar"
            style={{ 
              marginTop: '8px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ textAlign: 'center', padding: '6px 6px', width: '38px' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Produto / SKU & Departamento</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', width: '75px' }}>Margem</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', width: '95px' }}>Receita</th>
                </tr>
              </thead>
              <tbody>
                {topProdutos.slice(0, 6).map((p, idx) => {
                  const pReceita = p.receita || p.faturamento || 0;
                  const isThisProdSelected = crossDepto && p.depto && crossDepto.toUpperCase() === p.depto.toUpperCase();
                  const isProdDimmed = crossDepto && !isThisProdSelected;

                  const renderSvgBadge = () => {
                    if (idx === 0) {
                      return (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '26px', 
                          height: '26px', 
                          borderRadius: '7px', 
                          background: isThisProdSelected ? '#f59e0b' : 'linear-gradient(135deg, #fef3c7, #fde68a)', 
                          border: '1px solid #f59e0b',
                          boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
                          flexShrink: 0
                        }}>
                          <Trophy size={13} color={isThisProdSelected ? '#ffffff' : '#b45309'} strokeWidth={2.4} />
                        </span>
                      );
                    }
                    if (idx === 1) {
                      return (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '26px', 
                          height: '26px', 
                          borderRadius: '7px', 
                          background: isThisProdSelected ? '#f59e0b' : 'linear-gradient(135deg, #f8fafc, #e2e8f0)', 
                          border: '1px solid #cbd5e1',
                          flexShrink: 0
                        }}>
                          <Medal size={13} color={isThisProdSelected ? '#ffffff' : '#475569'} strokeWidth={2.4} />
                        </span>
                      );
                    }
                    if (idx === 2) {
                      return (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '26px', 
                          height: '26px', 
                          borderRadius: '7px', 
                          background: isThisProdSelected ? '#f59e0b' : 'linear-gradient(135deg, #fffbeb, #fed7aa)', 
                          border: '1px solid #f97316',
                          flexShrink: 0
                        }}>
                          <Award size={13} color={isThisProdSelected ? '#ffffff' : '#c2410c'} strokeWidth={2.4} />
                        </span>
                      );
                    }
                    return (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '7px', 
                        background: isThisProdSelected ? '#f59e0b' : '#f8fafc', 
                        border: isThisProdSelected ? '1px solid #f59e0b' : '1px solid #e2e8f0', 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        color: isThisProdSelected ? '#ffffff' : '#64748b',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                    );
                  };

                  return (
                    <tr 
                      key={`${p.codigo || 'prod'}-${p.descricao || ''}-${idx}`}
                      className="dashboard-row-animate"
                      onClick={() => p.depto && handleToggleDepto(p.depto)}
                      style={{ 
                        borderBottom: idx < 5 ? '1px solid #f1f5f9' : 'none',
                        background: isThisProdSelected ? '#fffbeb' : 'transparent',
                        opacity: isProdDimmed ? 0.35 : 1,
                        filter: isProdDimmed ? 'grayscale(0.95)' : 'none',
                        cursor: 'pointer',
                        animationDelay: `${idx * 45 + 180}ms`,
                        transition: 'background 0.15s ease, opacity 0.15s ease, filter 0.15s ease'
                      }}
                      onMouseEnter={(e) => { 
                        setHoveredProduct(p);
                        setFloatingMousePos({ x: e.clientX, y: e.clientY });
                        if (isProdDimmed) {
                          e.currentTarget.style.opacity = '0.75';
                          e.currentTarget.style.filter = 'grayscale(0.3)';
                        } else if (!isThisProdSelected) {
                          e.currentTarget.style.background = '#f8fafc'; 
                        }
                      }}
                      onMouseMove={(e) => {
                        setFloatingMousePos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={(e) => { 
                        setHoveredProduct(null);
                        if (isProdDimmed) {
                          e.currentTarget.style.opacity = '0.35';
                          e.currentTarget.style.filter = 'grayscale(0.95)';
                        } else if (!isThisProdSelected) {
                          e.currentTarget.style.background = 'transparent'; 
                        }
                      }}
                    >
                      {/* Posição com SVG Badge */}
                      <td style={{ textAlign: 'center', padding: '7px 4px' }}>
                        {renderSvgBadge()}
                      </td>

                      {/* Descrição, Departamento e Curva ABC */}
                      <td style={{ textAlign: 'left', padding: '7px 8px' }}>
                        <div style={{ 
                          fontWeight: isThisProdSelected ? 800 : 700, 
                          color: isThisProdSelected ? '#b45309' : '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '240px',
                          fontSize: '12px'
                        }}>
                          {p.descricao || p.produto}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                            {p.depto}
                          </span>
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 700, 
                            background: '#ecfdf5', 
                            color: '#059669', 
                            border: '1px solid #a7f3d0', 
                            padding: '1px 5px', 
                            borderRadius: '3px',
                            letterSpacing: '0.2px'
                          }}>
                            Curva A
                          </span>
                        </div>
                      </td>

                      {/* Margem */}
                      <td style={{ textAlign: 'right', padding: '7px 8px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          color: (p.mc || 0) >= 0 ? '#059669' : '#dc2626',
                          background: (p.mc || 0) >= 0 ? '#ecfdf5' : '#fef2f2',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {(p.margemContribuicaoPerc || 0).toFixed(1)}%
                        </span>
                      </td>

                      {/* Faturamento */}
                      <td style={{ textAlign: 'right', padding: '7px 8px' }}>
                        <div style={{ 
                          fontWeight: 800, 
                          color: isThisProdSelected ? '#b45309' : '#0f172a',
                          fontSize: '12px'
                        }}>
                          {formatCurrency(pReceita)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── ROW 4: AI EXECUTIVE SUMMARY CARD ── */}
      {data.insights && data.insights.length > 0 && (
        <div className="executive-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="card-header-flex" style={{ marginBottom: '8px' }}>
            <div className="card-title-executive" style={{ color: '#2563eb' }}>
              <Sparkles size={16} /> Resumo Operacional Executivo
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginTop: '6px' }}>
            {data.insights.slice(0, 3).map((insight, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  {insight.titulo}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  {insight.texto}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BARRA FLUTUANTE PREMIUM DE FILTROS CRUZADOS (ZERO-SHIFT / NÃO DESLOCA A TELA) ── */}
      {(crossDepto || crossLoja || crossPeriod) && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          <div className="floating-filter-bar" style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '7px 16px',
            borderRadius: '999px',
            boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.12)',
            color: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#94a3b8', paddingRight: '4px' }}>
              <Filter size={13} color="#60a5fa" />
              <span>Filtros ativos:</span>
            </div>

            {crossDepto && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(37, 99, 235, 0.25)',
                border: '1px solid rgba(96, 165, 250, 0.35)',
                color: '#bfdbfe',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: '999px'
              }}>
                <span>Depto: <strong style={{ color: '#ffffff' }}>{crossDepto}</strong></span>
                <button
                  onClick={(e) => { e.stopPropagation(); setCrossDepto(null); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#93c5fd', display: 'flex', alignItems: 'center', padding: '0' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#93c5fd'}
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {crossLoja && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(37, 99, 235, 0.25)',
                border: '1px solid rgba(96, 165, 250, 0.35)',
                color: '#bfdbfe',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: '999px'
              }}>
                <span>Loja: <strong style={{ color: '#ffffff' }}>{crossLoja}</strong></span>
                <button
                  onClick={(e) => { e.stopPropagation(); setCrossLoja(null); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#93c5fd', display: 'flex', alignItems: 'center', padding: '0' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#93c5fd'}
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {crossPeriod && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(37, 99, 235, 0.25)',
                border: '1px solid rgba(96, 165, 250, 0.35)',
                color: '#bfdbfe',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: '999px'
              }}>
                <span>Data: <strong style={{ color: '#ffffff' }}>{crossPeriod}</strong></span>
                <button
                  onClick={(e) => { e.stopPropagation(); setCrossPeriod(null); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#93c5fd', display: 'flex', alignItems: 'center', padding: '0' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#93c5fd'}
                >
                  <X size={12} />
                </button>
              </span>
            )}

            <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.2)', margin: '0 2px' }} />

            <button
              onClick={handleClearAllFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f1f5f9',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; e.currentTarget.style.color = '#fca5a5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.color = '#f1f5f9'; }}
            >
              <RotateCcw size={11} /> Limpar todos
            </button>
          </div>
        </div>
      )}

      {/* ── TOOLTIP FLUTUANTE PREMIUM PARA LOJAS (IDENTICO AO GRAFICO DE LINHAS) ── */}
      {hoveredStore && (
        (() => {
          const tooltipWidth = 240;
          const tooltipHeight = 150;
          const x = floatingMousePos.x;
          const y = floatingMousePos.y;
          const safeX = typeof window !== 'undefined' && x + tooltipWidth + 20 > window.innerWidth ? x - tooltipWidth - 10 : x + 15;
          const safeY = typeof window !== 'undefined' && y + tooltipHeight + 20 > window.innerHeight ? y - tooltipHeight - 10 : y - 10;
          const totalRec = stores.reduce((sum, s) => sum + (s.receita || 0), 0);
          const storePct = totalRec > 0 ? ((hoveredStore.receita || 0) / totalRec) * 100 : 0;
          const isThisLojaSelected = crossLoja && crossLoja.toUpperCase() === hoveredStore.nome.toUpperCase();

          return (
            <div className="floating-tooltip-premium" style={{
              position: 'fixed',
              left: safeX,
              top: safeY,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.18), 0 4px 10px -2px rgba(15, 23, 42, 0.08)',
              padding: '12px 16px',
              fontSize: '12px',
              width: `${tooltipWidth}px`,
              pointerEvents: 'none',
              zIndex: 99999
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                  {hoveredStore.nome}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 7px', borderRadius: '4px' }}>
                  {storePct.toFixed(1)}% do total
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span>
                    Faturamento:
                  </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(hoveredStore.receita)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                    Margem:
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      color: (hoveredStore.margemContribuicaoPerc || 0) >= 15 ? '#059669' : '#d97706', 
                      fontWeight: 700, 
                      background: (hoveredStore.margemContribuicaoPerc || 0) >= 15 ? '#ecfdf5' : '#fffbeb', 
                      padding: '1px 6px', 
                      borderRadius: '3px' 
                    }}>
                      {(hoveredStore.margemContribuicaoPerc || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed #f1f5f9', marginTop: '2px', fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                  {isThisLojaSelected ? 'Clique para remover o filtro' : 'Clique para filtrar por esta unidade'}
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* ── TOOLTIP FLUTUANTE PREMIUM PARA PRODUTOS (IDENTICO AO GRAFICO DE LINHAS) ── */}
      {hoveredProduct && (
        (() => {
          const tooltipWidth = 260;
          const tooltipHeight = 155;
          const x = floatingMousePos.x;
          const y = floatingMousePos.y;
          const safeX = typeof window !== 'undefined' && x + tooltipWidth + 20 > window.innerWidth ? x - tooltipWidth - 10 : x + 15;
          const safeY = typeof window !== 'undefined' && y + tooltipHeight + 20 > window.innerHeight ? y - tooltipHeight - 10 : y - 10;
          const pReceita = hoveredProduct.receita || hoveredProduct.faturamento || 0;
          const isThisProdSelected = crossDepto && hoveredProduct.depto && crossDepto.toUpperCase() === hoveredProduct.depto.toUpperCase();

          return (
            <div className="floating-tooltip-premium" style={{
              position: 'fixed',
              left: safeX,
              top: safeY,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.18), 0 4px 10px -2px rgba(15, 23, 42, 0.08)',
              padding: '12px 16px',
              fontSize: '12px',
              width: `${tooltipWidth}px`,
              pointerEvents: 'none',
              zIndex: 99999
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
                <span style={{ 
                  fontWeight: 700, 
                  color: '#0f172a', 
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '180px'
                }}>
                  {hoveredProduct.descricao || hoveredProduct.produto}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '1px 5px', borderRadius: '3px' }}>
                  Curva A
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Departamento:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{hoveredProduct.depto || 'Geral'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span>
                    Faturamento:
                  </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(pReceita)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                    Margem:
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      color: (hoveredProduct.margemContribuicaoPerc || 0) >= 15 ? '#059669' : '#d97706', 
                      fontWeight: 700, 
                      background: (hoveredProduct.margemContribuicaoPerc || 0) >= 15 ? '#ecfdf5' : '#fffbeb', 
                      padding: '1px 6px', 
                      borderRadius: '3px' 
                    }}>
                      {(hoveredProduct.margemContribuicaoPerc || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed #f1f5f9', marginTop: '2px', fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                  {isThisProdSelected ? 'Clique para remover o filtro' : `Clique para filtrar por ${hoveredProduct.depto}`}
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* ── TOOLTIP FLUTUANTE PARA DEPARTAMENTOS — renderizado na raiz, apenas ao passar o mouse na rosca ── */}
      {isDonutHovered && hoveredDept && donutMousePos.x > 0 && (
        <CustomDonutTooltip
          active={true}
          payload={[{ payload: hoveredDept }]}
          crossDepto={crossDepto}
          mouseX={donutMousePos.x}
          mouseY={donutMousePos.y}
          containerRef={donutRef}
        />
      )}

    </div>
  );
}
