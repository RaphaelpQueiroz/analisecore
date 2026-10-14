'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Store, TrendingUp, TrendingDown, Target, Activity, Users, ShoppingCart } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import ModalKpiDetail from '../components/ModalKpiDetail';
import AnimatedNumber from '../components/AnimatedNumber';

export default function LojasPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModalKpi, setSelectedModalKpi] = useState(null);
  const [cardOrigin, setCardOrigin] = useState(null);
  const handleOpenModal = (kpiKey, e, storeName) => {
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = window.innerHeight / 2;
      setCardOrigin({ x: Math.round(cardCenterX - screenCenterX), y: Math.round(cardCenterY - screenCenterY) });
    }
    setSelectedModalKpi({ key: kpiKey, storeName });
  };

  // Mock data for immediate WOW effect
  useEffect(() => {
    setTimeout(() => {
      setData({
        stores: [
          { nome: 'Loja 01', faturamento: 49309116, meta: 50000000, cmv: 72.1, margem: 27.9, fluxo: 450120, ticket: 109.5 },
          { nome: 'Loja 02', faturamento: 23943401, meta: 22000000, cmv: 68.4, margem: 31.6, fluxo: 210000, ticket: 114.0 },
          { nome: 'Loja 03', faturamento: 11741990, meta: 15000000, cmv: 75.2, margem: 24.8, fluxo: 130000, ticket: 90.3 },
          { nome: 'Loja 04', faturamento: 11200747, meta: 10000000, cmv: 69.1, margem: 30.9, fluxo: 115000, ticket: 97.4 }
        ],
        trend: [
          { name: 'Seg', l1: 1.2, l2: 0.8 },
          { name: 'Ter', l1: 1.1, l2: 0.7 },
          { name: 'Qua', l1: 1.4, l2: 0.9 },
          { name: 'Qui', l1: 1.6, l2: 1.0 },
          { name: 'Sex', l1: 2.1, l2: 1.4 },
          { name: 'Sab', l1: 2.8, l2: 1.9 },
          { name: 'Dom', l1: 3.2, l2: 2.1 },
        ]
      });
      setLoading(false);
    }, 400);
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' }}>Carregando dados das filiais...</div>;
  }

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store style={{ color: '#2563eb' }} /> Desempenho de Lojas & Unidades
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Comparativo de faturamento, margem e fluxo de clientes entre as filiais.</p>
        </div>
      </div>

      <div className="kpi-row-grid" style={{ marginBottom: '24px' }}>
        {data.stores.map((store, i) => {
          const atingimento = (store.faturamento / store.meta) * 100;
          return (
            <div key={i} className="kpi-card-clickable theme-blue kpi-card-entrance-1" onClick={(e) => handleOpenModal('faturamento', e, store.nome)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{store.nome}</h3> <span className="kpi-secret-hint" style={{position:'absolute', top:'20px', right:'20px', opacity:0.5}}>Detalhar</span>
                <span style={{ 
                  background: atingimento >= 100 ? '#ecfdf5' : '#fef2f2', 
                  color: atingimento >= 100 ? '#059669' : '#dc2626', 
                  padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 
                }}>
                  {atingimento.toFixed(1)}% da Meta
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: '16px', color: '#64748b', marginRight: '4px', fontWeight: 600 }}>R$</span>
                <AnimatedNumber value={store.faturamento} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Margem</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: store.margem > 25 ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'baseline' }}>
                    <AnimatedNumber value={store.margem} decimals={1} suffix="%" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Ticket Médio</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', marginRight: '2px' }}>R$</span>
                    <AnimatedNumber value={store.ticket} decimals={2} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Fluxo de Clientes na Semana (Picos)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="colorL1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorL2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(val) => [`${val}k clientes`, 'Fluxo']}
                />
                <Area type="monotone" dataKey="l1" name="Loja 01" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorL1)" />
                <Area type="monotone" dataKey="l2" name="Loja 02" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorL2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Share de Faturamento por Unidade</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stores} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 600, fill: '#475569' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(val) => [formatCurrency(val), 'Faturamento']}
                />
                <Bar dataKey="faturamento" radius={[0, 6, 6, 0]} barSize={32}>
                  {data.stores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : index === 1 ? '#3b82f6' : '#93c5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {selectedModalKpi && (
        <ModalKpiDetail
          isOpen={!!selectedModalKpi}
          onClose={() => { setSelectedModalKpi(null); setCardOrigin(null); }}
          kpiKey={selectedModalKpi.key}
          originOffset={cardOrigin}
          value={data.stores.find(s => s.nome === selectedModalKpi.storeName)?.faturamento}
          delta={5.7}
          label={"Faturamento - " + selectedModalKpi.storeName}
          period="No periodo"
        />
      )}
    </div>
  );
}
