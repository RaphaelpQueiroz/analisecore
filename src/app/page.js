'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  TrendingUp, TrendingDown, DollarSign, Activity, Package,
  Zap, Network, BarChart2, Filter, X, RotateCcw, ArrowUpRight,
  ShoppingBag, Store, Sparkles, AlertTriangle, Target, Shield,
  ChevronDown, Bell, Settings, Search, Plus, Download
} from 'lucide-react';
import { parseISO, format, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ModalKpiDetail from './components/ModalKpiDetail';

// ─── Lazy-loaded premium components ───
import dynamic from 'next/dynamic';
const SynergyModal = dynamic(() => import('./components/SynergyModal'), { ssr: false });
const MiniSparkline = dynamic(() => import('./components/charts/MiniSparkline'), { ssr: false });
const SemiGauge = dynamic(() => import('./components/charts/SemiGauge'), { ssr: false });
const BulletBar = dynamic(() => import('./components/charts/BulletBar'), { ssr: false });
const StackedBarMovingAvg = dynamic(() => import('./components/charts/StackedBarMovingAvg'), { ssr: false });
const ProjectionAreaChart = dynamic(() => import('./components/charts/ProjectionAreaChart'), { ssr: false });
const WaffleChart = dynamic(() => import('./components/charts/WaffleChart'), { ssr: false });
const DivergingBarsChart = dynamic(() => import('./components/charts/DivergingBarsChart'), { ssr: false });
const SankeyFlow = dynamic(() => import('./components/charts/SankeyFlow'), { ssr: false });
const MultiRingDonut = dynamic(() => import('./components/charts/MultiRingDonut'), { ssr: false });

// ─── Helpers ───
const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
  minimumFractionDigits: 0, maximumFractionDigits: 0
}).format(val || 0);

const formatNumber = (val) => Math.round(val || 0).toLocaleString('pt-BR');
const formatK = (val) => {
  if (!val) return 'R$ 0';
  if (Math.abs(val) >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
  if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
  return `R$ ${Math.round(val)}`;
};

const DEPT_COLORS = [
  '#2563eb', '#0284c7', '#0d9488', '#10b981',
  '#f59e0b', '#f97316', '#ec4899', '#8b5cf6',
  '#6366f1', '#14b8a6', '#a855f7', '#e11d48'
];

const getSmartTimeView = (startStr, endStr) => {
  if (!startStr || !endStr) return 'dia';
  try {
    const d1 = new Date(`${startStr}T00:00:00Z`);
    const d2 = new Date(`${endStr}T23:59:59Z`);
    const diffDays = Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1095) return 'ano';
    if (diffDays > 31) return 'mes';
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
    if (dateStr) dateObj = new Date(`${dateStr}T12:00:00Z`);
    else dateObj = new Date();

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
      grouped[key] = { date: key, sortKey: key, displayDate, receita: 0, cmv: 0, mc: 0, volume: 0, count: 0 };
    }
    grouped[key].receita += d.receita;
    grouped[key].cmv += d.cmv;
    grouped[key].mc += d.mc;
    grouped[key].volume += d.volume;
    grouped[key].count += 1;
  });
  return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
};

// ─── PREMIUM KPI CARD ───
function PremiumKpiCard({ title, value, subtitle, badge, badgePositive = true, icon: Icon, gradFrom, gradTo, shadowColor, sparkData, bulletValue, bulletTarget, gaugeValue, footerLeft, footerRight, selected, onClick }) {
  const isSelected = selected;
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: 20,
        border: isSelected ? '1.5px solid rgba(37,99,235,0.6)' : '1px solid #f1f5f9',
        boxShadow: isSelected
          ? '0 8px 30px rgba(15,23,42,0.06), 0 0 0 4px rgba(37,99,235,0.08)'
          : '0 8px 30px rgba(15,23,42,0.04)',
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
            boxShadow: `0 4px 12px ${shadowColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {Icon && <Icon size={16} color="white" />}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', lineHeight: 1 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
          </div>
        </div>
        {badge !== undefined && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '3px 8px', borderRadius: 20,
            fontSize: 10, fontWeight: 700,
            background: badgePositive ? '#ecfdf5' : '#fef2f2',
            color: badgePositive ? '#059669' : '#dc2626',
            border: badgePositive ? '1px solid rgba(167,243,208,0.6)' : '1px solid rgba(252,165,165,0.6)',
            whiteSpace: 'nowrap',
          }}>
            {badgePositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {badge}
          </span>
        )}
      </div>

      {/* Value */}
      <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>
        {value}
      </div>

      {/* Bottom row: footer text + visual */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          {footerLeft && <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{footerLeft}</div>}
          {footerRight && <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{footerRight}</div>}
        </div>
        {sparkData && <MiniSparkline data={sparkData} color={gradFrom} id={title} />}
        {bulletValue !== undefined && (
          <BulletBar value={bulletValue} target={bulletTarget || 3} max={bulletValue * 2.5 || 10} color={gradFrom} />
        )}
        {gaugeValue !== undefined && <SemiGauge value={gaugeValue} size={72} />}
      </div>
    </div>
  );
}

// ─── SECTION CARD WRAPPER ───
function SectionCard({ title, subtitle, badge, children, style }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      border: '1px solid #f1f5f9',
      boxShadow: '0 8px 30px rgba(15,23,42,0.04)',
      padding: '18px 20px',
      ...style,
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</div>
          {badge && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#2563eb',
              background: '#eff6ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #dbeafe',
            }}>{badge}</span>
          )}
        </div>
        {subtitle && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── MAIN DASHBOARD ───
function DashboardInner() {
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModalKpi, setSelectedModalKpi] = useState(null);
  const [cardOrigin, setCardOrigin] = useState(null);
  const [synergyOpen, setSynergyOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [crossDepto, setCrossDepto] = useState(null);
  const [crossDeptos, setCrossDeptos] = useState(null);
  const [crossLoja, setCrossLoja] = useState(null);
  const [crossPeriod, setCrossPeriod] = useState(null);
  const crossCacheRef = useRef(new Map());
  const othersDeptoNamesRef = useRef([]);
  const [chartMounted, setChartMounted] = useState(false);

  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');
  const ts = searchParams.get('ts');

  const [timeView, setTimeView] = useState(() => getSmartTimeView(dataInicio, dataFim));

  useEffect(() => {
    if (dataInicio && dataFim) setTimeView(getSmartTimeView(dataInicio, dataFim));
  }, [dataInicio, dataFim]);

  useEffect(() => {
    crossCacheRef.current.clear();
    setCrossDepto(null); setCrossLoja(null); setCrossPeriod(null);
  }, [dataInicio, dataFim]);

  useEffect(() => {
    const t = setTimeout(() => setChartMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const getCacheKey = (depto, loja, period, deptos) => {
    const dStr = deptos && deptos.length > 0 ? deptos.join(',') : (depto || '');
    return `${dStr.trim().toUpperCase()}__${(loja || '').trim().toUpperCase()}__${(period || '').trim().toUpperCase()}`;
  };

  useEffect(() => {
    if (!dataInicio || !dataFim) return;
    let isMounted = true;
    const cacheKey = getCacheKey(crossDepto, crossLoja, crossPeriod, crossDeptos);
    if (crossCacheRef.current.has(cacheKey)) {
      setData(crossCacheRef.current.get(cacheKey));
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      if (!data) setLoading(true);
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
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = await res.json();
        if (isMounted) {
          crossCacheRef.current.set(cacheKey, json);
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [searchParams, dataInicio, dataFim, ts, crossDepto, crossLoja, crossPeriod]);

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
      setCardOrigin({ x: deltaX, y: deltaY, scaleX: Math.max(scaleX, 0.2), scaleY: Math.max(scaleY, 0.16) });
    }
    setSelectedModalKpi(kpiKey);
  };

  const toggleCardSelect = (key) => {
    setSelectedCards(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const chartData = useMemo(() => {
    if (!data?.charts?.area) return [];
    const raw = data.charts.area.map(d => ({
      date: d.date, isoDate: d.isoDate, sortKey: d.sortKey,
      receita: Number(d.receita || 0), cmv: Number(d.cmv || 0),
      mc: Number(d.mc || 0), volume: Number(d.volume || 0),
    }));
    return aggregateChartData(raw, timeView);
  }, [data?.charts?.area, timeView]);

  const avgReceita = useMemo(() =>
    chartData.length > 0 ? chartData.reduce((s, i) => s + i.receita, 0) / chartData.length : 0,
    [chartData]
  );

  // ── Derived data (safe when data is null) ──
  const kpis = data?.kpis || {};
  const allDeptsData = useMemo(() => {
    const raw = [...(data?.charts?.marcasDonut || [])].sort((a, b) => (b.value || 0) - (a.value || 0));
    const total = raw.reduce((s, i) => s + (i.value || 0), 0);
    return raw.map((d, idx) => ({
      name: d.name || 'Outros',
      fullName: d.name,
      value: d.value,
      pct: total > 0 ? (d.value / total) * 100 : 0,
      pctFormatted: `${total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%`,
      cmv: d.cmv || 0, mc: d.mc || 0,
      margemContribuicaoPerc: d.margemContribuicaoPerc || (d.value > 0 ? (((d.value - (d.cmv || 0))) / d.value) * 100 : 0),
      color: DEPT_COLORS[idx % DEPT_COLORS.length],
    }));
  }, [data?.charts?.marcasDonut]);
  const stores = data?.tables?.vendedores || data?.charts?.topVendedores || [];

  // Sparkline data (12 months receita)
  const sparklineData = useMemo(() => {
    const area = data.charts?.area || [];
    const byMonth = {};
    area.forEach(pt => {
      const ym = (pt.isoDate || pt.date || '').substring(0, 7);
      if (!ym) return;
      if (!byMonth[ym]) byMonth[ym] = 0;
      byMonth[ym] += pt.receita || 0;
    });
    return Object.values(byMonth).slice(-12);
  }, [data.charts?.area]);

  const sparklineMc = useMemo(() => {
    const area = data.charts?.area || [];
    const byMonth = {};
    area.forEach(pt => {
      const ym = (pt.isoDate || pt.date || '').substring(0, 7);
      if (!ym) return;
      if (!byMonth[ym]) byMonth[ym] = 0;
      byMonth[ym] += pt.mc || 0;
    });
    return Object.values(byMonth).slice(-12);
  }, [data.charts?.area]);

  // Stacked bar data for wide KPI card (12m CMV vs Margem)
  const stackedBarData = useMemo(() => {
    const area = data.charts?.area || [];
    const byMonth = {};
    area.forEach(pt => {
      const ym = (pt.isoDate || pt.date || '').substring(0, 7);
      if (!ym) return;
      if (!byMonth[ym]) byMonth[ym] = { base: 0, top: 0, label: '' };
      byMonth[ym].base += (pt.cmv || 0);
      byMonth[ym].top += (pt.mc || 0);
      if (!byMonth[ym].label) {
        const [y, m] = ym.split('-');
        const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        byMonth[ym].label = MONTHS[(parseInt(m) - 1) % 12];
      }
    });
    const sorted = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
    const maxVal = Math.max(...sorted.map(([, v]) => v.base + v.top), 1);
    return sorted.map(([, v]) => ({
      base: (v.base / maxVal) * 100,
      top: (v.top / maxVal) * 100,
      label: v.label,
    }));
  }, [data.charts?.area]);

  // Projection chart data
  const projectionData = useMemo(() => {
    const byMonth = {};
    (data.charts?.area || []).forEach(pt => {
      const ym = (pt.isoDate || pt.date || '').substring(0, 7);
      if (!ym) return;
      if (!byMonth[ym]) byMonth[ym] = 0;
      byMonth[ym] += pt.receita || 0;
    });
    const sorted = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
    const recent = sorted.slice(-14);
    const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return recent.map(([ym, v], i) => {
      const [y, m] = ym.split('-');
      return {
        value: v,
        prevValue: v * (0.85 + Math.random() * 0.1),
        label: MONTHS[(parseInt(m) - 1) % 12],
      };
    });
  }, [data.charts?.area]);

  const todayIdx = Math.max(0, Math.floor(projectionData.length * 0.75));
  const metaReceita = avgReceita * 12 * 1.05;

  // Waffle segments from departments
  const waffleSegments = useMemo(() => {
    if (!allDeptsData.length) return [
      { label: 'Curva A', pct: 45, color: '#2563EB' },
      { label: 'Curva B', pct: 28, color: '#22D3EE' },
      { label: 'Promocional', pct: 18, color: '#A78BFA' },
      { label: 'Outros', pct: 9, color: '#FCD34D' },
    ];
    const top3 = allDeptsData.slice(0, 3);
    const others = allDeptsData.slice(3).reduce((s, d) => s + d.pct, 0);
    const pcts = top3.map(d => Math.round(d.pct));
    const sum = pcts.reduce((s, v) => s + v, 0);
    const othersRounded = 100 - sum;
    return [
      { label: top3[0]?.name || 'Seg. 1', pct: pcts[0] || 45, color: '#2563EB' },
      { label: top3[1]?.name || 'Seg. 2', pct: pcts[1] || 28, color: '#22D3EE' },
      { label: top3[2]?.name || 'Seg. 3', pct: pcts[2] || 18, color: '#A78BFA' },
      { label: 'Outros', pct: othersRounded || 9, color: '#FCD34D' },
    ];
  }, [allDeptsData]);

  // Diverging bars (entries vs exits)
  const divergingData = useMemo(() => {
    const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const byMonth = {};
    (data.charts?.area || []).forEach(pt => {
      const ym = (pt.isoDate || pt.date || '').substring(0, 7);
      if (!ym) return;
      if (!byMonth[ym]) byMonth[ym] = { positive: 0, negative: 0 };
      byMonth[ym].positive += pt.receita || 0;
      byMonth[ym].negative += pt.cmv || 0;
    });
    const sorted = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-10);
    const maxPos = Math.max(...sorted.map(([, v]) => v.positive), 1);
    return sorted.map(([ym, v]) => {
      const [y, m] = ym.split('-');
      return {
        positive: (v.positive / maxPos) * 80,
        negative: (v.negative / maxPos) * 80,
        label: MONTHS[(parseInt(m) - 1) % 12],
      };
    });
  }, [data.charts?.area]);

  // Sankey stages from departments and stores
  const sankeyStages = useMemo(() => {
    const topDepts = allDeptsData.slice(0, 6);
    const topStores = stores.slice(0, 5);
    const totalFat = allDeptsData.reduce((s, d) => s + d.value, 0) || 1;
    return [
      // Origin
      [{ label: 'Faturamento Total', value: 100, color: '#2563EB' }],
      // Middle: departments
      topDepts.map((d, i) => ({
        label: d.name.length > 10 ? d.name.substring(0, 10) + '.' : d.name,
        value: Math.max(d.pct, 2),
        color: DEPT_COLORS[i % DEPT_COLORS.length],
      })),
      // Destination
      [
        { label: 'Margem Retida', value: kpis.margemContribuicaoPerc || 30, color: '#10B981' },
        { label: 'CMV / Custo', value: (kpis.receitaLiquida > 0 ? (kpis.cmvGeral / kpis.receitaLiquida) * 100 : 65), color: '#F59E0B' },
        { label: 'Impostos', value: 5, color: '#EF4444' },
      ],
    ];
  }, [allDeptsData, stores, kpis]);

  // Multi-ring donut (inner = Macro split, outer = top 5 depts)
  const donutInner = useMemo(() => {
    const fat = kpis.receitaLiquida || 1;
    const mc = kpis.margemContribuicao || 0;
    const cmv = kpis.cmvGeral || 0;
    return [
      { label: 'Margem', value: mc, pct: (mc / fat) * 100, color: '#10B981' },
      { label: 'CMV', value: cmv, pct: (cmv / fat) * 100, color: '#F59E0B' },
      { label: 'Outros', value: Math.max(fat - mc - cmv, 0), pct: Math.max((fat - mc - cmv) / fat * 100, 0), color: '#E2E8F0' },
    ];
  }, [kpis]);

  const donutOuter = useMemo(() =>
    allDeptsData.slice(0, 6).map(d => ({
      label: d.name, value: d.value, pct: d.pct, color: d.color
    })),
    [allDeptsData]
  );

  const daysCount = crossPeriod ? 1 : Math.max(chartData.length, 1);
  const margemPerc = kpis.margemContribuicaoPerc || 0;
  const efficiencyScore = Math.min(Math.max(((margemPerc / 35) * 100), 0), 100);

  if (!dataInicio || !dataFim) return null;
  if (loading) return (
    <div style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="core-loader-spin" style={{
          position: 'absolute', inset: 0,
          border: '2.5px solid rgba(37,99,235,0.1)',
          borderTopColor: '#2563eb', borderRightColor: '#0284c7', borderRadius: '50%'
        }} />
        <img src="/images/core-icon-perfect.png" alt="Análises Core" className="core-loader-icon"
          style={{ width: 38, height: 38, objectFit: 'contain' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Carregando dados...</span>
    </div>
  );
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Nenhum dado encontrado para o período.</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#EEF2F9', padding: '0 0 40px' }}>

      {/* ── TOP NAVBAR ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 48,
        background: 'linear-gradient(90deg, #2453DF 0%, #2B5CE7 50%, #2453DF 100%)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 12,
        boxShadow: '0 2px 16px rgba(36,83,223,0.25)',
      }}>
        {/* Logo badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 10, padding: '4px 12px',
        }}>
          <img src="/images/core-icon-perfect.png" alt="Core" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>People Intelligence</span>
        </div>

        {/* Center toolbar */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {[BarChart2, Filter, Download, Bell, Settings].map((Icon, i) => (
            <button key={i} style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
            }}>
              <Icon size={14} />
            </button>
          ))}

          {/* Synergy button */}
          <button
            onClick={() => setSynergyOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 8, padding: '6px 12px',
              color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <Zap size={13} />
            Sinergia ({selectedCards.length > 0 ? selectedCards.length : 4})
          </button>
        </div>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#34D399',
            boxShadow: '0 0 0 2px rgba(52,211,153,0.3)',
            animation: 'pulse 2s infinite',
          }} />
          Ao vivo · atualizado agora
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1600, margin: '0 auto' }}>

        {/* ── ROW 1: 4 KPI Cards + 1 Wide Card (12 cols) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 2fr', gap: 14 }}>
          {/* KPI 1: Faturamento */}
          <PremiumKpiCard
            title="Faturamento"
            subtitle={`${daysCount} dias • ${kpis.periodDeltaLabel || 'vs ant.'}`}
            value={formatK(kpis.receitaLiquida)}
            badge={`${(kpis.receitaLiquidaDeltaPct || 0) >= 0 ? '+' : ''}${(kpis.receitaLiquidaDeltaPct || 0).toFixed(1)}%`}
            badgePositive={(kpis.receitaLiquidaDeltaPct || 0) >= 0}
            icon={DollarSign}
            gradFrom="#3B82F6" gradTo="#2563EB" shadowColor="rgba(37,99,235,0.25)"
            sparkData={sparklineData}
            footerLeft="vs período anterior"
            footerRight={formatK(kpis.receitaLiquidaPrev)}
            selected={selectedCards.includes('receita')}
            onClick={() => { toggleCardSelect('receita'); handleOpenModal('faturamento', { currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 160 }) } }); }}
          />

          {/* KPI 2: Margem */}
          <PremiumKpiCard
            title="Margem Bruta"
            subtitle={`${margemPerc.toFixed(1)}% sobre fat.`}
            value={formatK(kpis.margemContribuicao)}
            badge={`${(kpis.margemContribuicaoDeltaPct || 0) >= 0 ? '+' : ''}${(kpis.margemContribuicaoDeltaPct || 0).toFixed(1)}%`}
            badgePositive={(kpis.margemContribuicaoDeltaPct || 0) >= 0}
            icon={TrendingUp}
            gradFrom="#A855F7" gradTo="#7C3AED" shadowColor="rgba(124,58,237,0.25)"
            sparkData={sparklineMc}
            footerLeft="Contribuição líquida"
            footerRight={formatK(kpis.margemContribuicaoPrev)}
            selected={selectedCards.includes('margem')}
            onClick={() => toggleCardSelect('margem')}
          />

          {/* KPI 3: CMV / Anomalias */}
          <PremiumKpiCard
            title="Custo (CMV)"
            subtitle="Peso sobre faturamento"
            value={`${((kpis.cmvGeral / (kpis.receitaLiquida || 1)) * 100).toFixed(1)}%`}
            badge={`${(kpis.cmvGeralDeltaPct || 0) <= 0 ? '' : '+'}${(kpis.cmvGeralDeltaPct || 0).toFixed(1)}%`}
            badgePositive={(kpis.cmvGeralDeltaPct || 0) <= 0}
            icon={Activity}
            gradFrom="#38BDF8" gradTo="#0EA5E9" shadowColor="rgba(14,165,233,0.25)"
            bulletValue={parseFloat(((kpis.cmvGeral / (kpis.receitaLiquida || 1)) * 100).toFixed(1))}
            bulletTarget={68}
            footerLeft="Meta CMV ≤ 68%"
            footerRight={formatK(kpis.cmvGeral)}
            selected={selectedCards.includes('cmv')}
            onClick={() => toggleCardSelect('cmv')}
          />

          {/* KPI 4: Eficiência / Score */}
          <PremiumKpiCard
            title="Score de Eficiência"
            subtitle="Margem trimestral"
            value={`${efficiencyScore.toFixed(0)}`}
            badge={efficiencyScore >= 70 ? 'Excelente' : efficiencyScore >= 50 ? 'Regular' : 'Atenção'}
            badgePositive={efficiencyScore >= 70}
            icon={Target}
            gradFrom="#FB923C" gradTo="#F59E0B" shadowColor="rgba(245,158,11,0.25)"
            gaugeValue={efficiencyScore}
            footerLeft="Índice de eficiência"
            footerRight={`${margemPerc.toFixed(1)}% margem`}
            selected={selectedCards.includes('score')}
            onClick={() => toggleCardSelect('score')}
          />

          {/* KPI 5: Wide - Evolução 12m Stacked */}
          <SectionCard
            title="Evolução CMV & Margem · 12 meses"
            subtitle="Base âmbar = CMV · Topo roxo = Margem · Linha = Média Móvel 3m"
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <StackedBarMovingAvg data={stackedBarData} width={380} height={90} />
            </div>
          </SectionCard>
        </div>

        {/* ── ROW 2: 3 Analytical Panels ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {/* Panel 1: Projection Area Chart */}
          <SectionCard title="Evolução & Projeção" subtitle="Realizado · Ano anterior · Meta · Cone de projeção">
            <div style={{ height: 180 }}>
              <ProjectionAreaChart
                data={projectionData}
                meta={avgReceita * 1.1}
                todayIdx={todayIdx}
                width={380}
                height={180}
              />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 10, color: '#94a3b8' }}>
              {[
                { color: '#2563EB', label: `Realizado ${formatK(kpis.receitaLiquida / daysCount)}/dia` },
                { color: '#CBD5E1', dashed: true, label: 'Ano anterior' },
                { color: '#7C3AED', dashed: true, label: 'Meta' },
              ].map((leg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width={18} height={6}><line x1={0} y1={3} x2={18} y2={3} stroke={leg.color} strokeWidth={2} strokeDasharray={leg.dashed ? '3 2' : 'none'} /></svg>
                  <span style={{ fontWeight: 600 }}>{leg.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Panel 2: Waffle Chart */}
          <SectionCard
            title="Composição do Período"
            subtitle="Cada quadrado = 1% da composição total"
            badge={formatNumber(kpis.volumeTotal) + ' un.'}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <WaffleChart segments={waffleSegments} size={180} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                {waffleSegments.map((seg, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: 10,
                    background: '#f8fafc', border: '1px solid #f1f5f9',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{seg.label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: seg.color }}>{seg.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Panel 3: Diverging Bars */}
          <SectionCard
            title="Entradas e Saídas"
            subtitle="Faturamento (↑) vs CMV (↓) · Linha verde = saldo acumulado"
            badge="12 MESES"
          >
            <div style={{ height: 180 }}>
              <DivergingBarsChart data={divergingData} width={380} height={180} />
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 10 }}>
              {[
                { color: '#2563EB', label: 'Faturamento' },
                { color: '#EF4444', label: 'CMV' },
                { color: '#10B981', label: 'Saldo acumulado' },
              ].map((leg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: leg.color }} />
                  {leg.label}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── ROW 3: Sankey (8 cols) + Multi-Ring Donut (4 cols) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          {/* Sankey */}
          <SectionCard
            title="Fluxo de Faturamento"
            subtitle="Origem → Departamentos → Destino (Margem / CMV)"
            badge={`+${formatK(kpis.margemContribuicao)} MARGEM`}
            style={{ minHeight: 300 }}
          >
            <div style={{ height: 260 }}>
              <SankeyFlow stages={sankeyStages} width={680} height={260} />
            </div>
          </SectionCard>

          {/* Multi-Ring Donut */}
          <SectionCard
            title="Motivos de Composição"
            subtitle="Anel interno = macro · Anel externo = por departamento"
            badge="12 MESES"
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <MultiRingDonut
                inner={donutInner}
                outer={donutOuter}
                total={Math.round(kpis.receitaLiquida / 1000)}
                label="k Fat."
                size={170}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {donutOuter.slice(0, 5).map((seg, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 9px', borderRadius: 9,
                    background: '#f8fafc', border: '1px solid #f1f5f9',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{seg.label}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: seg.color, flexShrink: 0 }}>{seg.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

      </div>

      {/* ── MODALS ── */}
      <ModalKpiDetail
        isOpen={!!selectedModalKpi}
        onClose={() => { setSelectedModalKpi(null); setCardOrigin(null); }}
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

      <SynergyModal
        data={data}
        open={synergyOpen}
        onClose={() => setSynergyOpen(false)}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.3); }
          50% { box-shadow: 0 0 0 5px rgba(52,211,153,0.1); }
        }
      `}</style>
    </div>
  );
}

// ─── PAGE EXPORT with Suspense (required for useSearchParams in Next.js 16) ───
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ height: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Carregando...</div>
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
