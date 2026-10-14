'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, TrendingUp, TrendingDown, Store, 
  Layers, Package, ShieldCheck, AlertOctagon, UserCheck, Users,
  DollarSign, Activity, Percent, Trophy, Medal, Award,
  ArrowUpRight, ShoppingBag, Zap, CheckCircle2, Flame, BarChart2
} from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(value || 0);
};

const formatPercent = (value) => `${(value || 0).toFixed(1)}%`;
const formatNumber = (value) => Math.round(value || 0).toLocaleString('pt-BR');

// ── COMPONENTE EXCLUSIVO E ESPECIALIZADO: MODAL DE FATURAMENTO LÍQUIDO ──
function ModalFaturamentoContent({ kpiData, drilldownData, chartData, allDeptsData, storesData, crossLoja, crossDepto, crossPeriod }) {
  const totalFat = Number(kpiData?.receitaLiquida || 0);
  const delta = kpiData?.receitaLiquidaDeltaPct;
  const deltaLabel = kpiData?.periodDeltaLabel || 'vs anterior';
  
  // Períodos ativos / Média Diária (Run Rate)
  const daysCount = Math.max(chartData?.length || 1, 1);
  const dailyAvg = totalFat / daysCount;

  // Lojas ordenadas por Faturamento decrescente
  const rawStores = drilldownData?.faturamento?.stores || storesData || [];
  const stores = [...rawStores].sort((a, b) => (b.faturamento || b.receita || 0) - (a.faturamento || a.receita || 0));
  const totalNetworkFat = stores.reduce((sum, s) => sum + (s.faturamento || s.receita || 0), 0);
  const networkRevenue = totalNetworkFat > 0 ? totalNetworkFat : totalFat;
  const avgStoreFat = stores.length > 0 ? (networkRevenue / stores.length) : 0;
  
  const activeStore = crossLoja ? stores.find(s => (s.name || s.loja || s.nome || '').toUpperCase() === crossLoja.toUpperCase()) : null;
  const top1Loja = activeStore || stores[0] || {};
  const top1LojaFat = activeStore ? totalFat : (top1Loja.faturamento || top1Loja.receita || 0);
  const top1LojaShare = networkRevenue > 0 ? (top1LojaFat / networkRevenue) * 100 : 0;
  
  const top3LojasFat = stores.slice(0, 3).reduce((sum, s) => sum + (s.faturamento || s.receita || 0), 0);
  const top3LojasShare = networkRevenue > 0 ? (top3LojasFat / networkRevenue) * 100 : 0;

  // Departamentos ordenados com Curva ABC
  const rawDepts = drilldownData?.faturamento?.departments || allDeptsData || [];
  const departments = [...rawDepts].sort((a, b) => (b.faturamento || b.value || 0) - (a.faturamento || a.value || 0));
  
  let cumulativePct = 0;
  const deptsWithABC = departments.map((d, idx) => {
    const val = Number(d.faturamento || d.value || 0);
    const pct = totalFat > 0 ? (val / totalFat) * 100 : 0;
    cumulativePct += pct;
    let abc = 'C';
    if (cumulativePct <= 80 || idx < 3) abc = 'A';
    else if (cumulativePct <= 95) abc = 'B';
    return {
      ...d,
      val,
      pct,
      abc
    };
  });

  const top1Depto = deptsWithABC[0] || {};

  // Top SKUs por Faturamento
  const topProducts = (drilldownData?.faturamento?.topProducts || []).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── FAIXA SUPERIOR: 4 MINI-KPIS ESTRATÉGICOS DE FATURAMENTO ── */}
      <div className="modal-stagger-1" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
        gap: '12px' 
      }}>
        
        {/* KPI 1: Ritmo de Vendas (Run Rate Diário) */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Média por Período
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {formatCurrency(dailyAvg)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Ritmo em {daysCount} intervalos</span>
          </div>
        </div>

        {/* KPI 2: Unidade Âncora Líder */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {crossLoja ? 'Loja Selecionada' : 'Loja Líder em Vendas'}
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {top1Loja.name || top1Loja.loja || 'Loja 01'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            <strong style={{ color: '#2563eb' }}>{top1LojaShare.toFixed(1)}%</strong> da receita da rede
          </div>
        </div>

        {/* KPI 3: Departamento Campeão de Mix */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Departamento Líder
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {top1Depto.name || 'Mercearia'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {formatCurrency(top1Depto.val || 0)} (<strong style={{ color: '#059669' }}>{top1Depto.pct ? top1Depto.pct.toFixed(1) : 0}%</strong>)
          </div>
        </div>

        {/* KPI 4: Concentração Comercial (Top 3 Lojas) */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Share Top 3 Lojas
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {top3LojasShare.toFixed(1)}%
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {formatCurrency(top3LojasFat)} em 3 lojas
          </div>
        </div>

      </div>

      {/* ── SEÇÃO 1: DESEMPENHO DE FATURAMENTO POR LOJA (SHARE & RANKING) ── */}
      <div className="modal-section-card modal-stagger-2">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div className="modal-section-title" style={{ margin: 0 }}>
              Desempenho Comercial por Unidade Operacional
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Participação de cada loja no faturamento consolidado e comparação vs média da rede
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
            Média por Loja: <strong>{formatCurrency(avgStoreFat)}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '12px' }}>
          {stores.map((st, idx) => {
            const stFat = st.faturamento || st.receita || 0;
            const sharePct = networkRevenue > 0 ? (stFat / networkRevenue) * 100 : 0;
            const diffVsAvg = avgStoreFat > 0 ? (((stFat - avgStoreFat) / avgStoreFat) * 100) : 0;
            const isFilteredStore = crossLoja && (st.name || st.loja || '').toUpperCase() === crossLoja.toUpperCase();
            const isHighlighted = isFilteredStore || (!crossLoja && idx === 0);

            const renderRankBadge = () => {
              if (idx === 0) {
                return (
                  <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
                    <Trophy size={13} />
                  </span>
                );
              }
              if (idx === 1) {
                return (
                  <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
                    <Medal size={13} />
                  </span>
                );
              }
              if (idx === 2) {
                return (
                  <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#fff7ed', border: '1px solid #fdba74', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
                    <Award size={13} />
                  </span>
                );
              }
              return (
                <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>
                  {idx + 1}
                </span>
              );
            };

            return (
              <div key={idx} className="modal-store-card" style={{ 
                background: isHighlighted ? '#f0f7ff' : '#ffffff', 
                border: isHighlighted ? '2px solid #3b82f6' : '1px solid #e2e8f0', 
                borderRadius: '10px', 
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {renderRankBadge()}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {st.name || st.loja}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        TM: {formatCurrency(st.ticketMedio || 0)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: idx === 0 ? '#1d4ed8' : '#0f172a' }}>
                      {formatCurrency(stFat)}
                    </div>
                    <div>
                      {diffVsAvg >= 0 ? (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                          +{diffVsAvg.toFixed(0)}% vs média
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                          {diffVsAvg.toFixed(0)}% vs média
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barra Visual de Share no Faturamento Total */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="progress-bar-smooth" style={{ 
                      width: `${Math.min(sharePct * 2.2, 100)}%`, 
                      height: '100%', 
                      background: idx === 0 ? 'linear-gradient(90deg, #2563eb, #1d4ed8)' : '#3b82f6', 
                      borderRadius: '3px' 
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', minWidth: '42px', textAlign: 'right' }}>
                    {sharePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SEÇÃO 2: GRID COM 2 COLUNAS (MIX DEPARTAMENTAL ABC + TOP SKUS) ── */}
      <div className="modal-stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* COLUNA 1: MIX DEPARTAMENTAL COM CURVA ABC */}
        <div className="modal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div className="modal-section-title" style={{ margin: 0 }}>
                Mix por Departamento & Curva ABC
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Classificação por relevância na receita líquida
              </div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
              {deptsWithABC.length} Deptos
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deptsWithABC.slice(0, 7).map((dept, idx) => {
              const maxVal = deptsWithABC[0]?.val || 1;
              const barPct = maxVal > 0 ? (dept.val / maxVal) * 100 : 0;

              return (
                <div key={idx} className="modal-row-interactive" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '95px 1fr 42px 78px 85px',
                  alignItems: 'center', 
                  padding: '7px 10px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  gap: '8px'
                }}>
                  {/* 1. Nome do Depto com largura fixa */}
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: '#1e293b', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    width: '95px'
                  }} title={dept.name}>
                    {dept.name}
                  </span>

                  {/* 2. Barra Relativa ocupando 1fr */}
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="progress-bar-smooth" style={{ width: `${barPct}%`, height: '100%', background: '#2563eb', borderRadius: '3px' }} />
                  </div>

                  {/* 3. Percentual alinhado à direita */}
                  <span style={{ 
                    fontSize: '10.5px', 
                    fontWeight: 600, 
                    color: '#64748b', 
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap'
                  }}>
                    {dept.pct.toFixed(1)}%
                  </span>

                  {/* 4. Badge Curva ABC logo após o percentual */}
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    fontSize: '9px', 
                    fontWeight: 800, 
                    padding: '2px 4px', 
                    borderRadius: '4px',
                    background: dept.abc === 'A' ? '#fef3c7' : (dept.abc === 'B' ? '#e0f2fe' : '#f1f5f9'),
                    color: dept.abc === 'A' ? '#b45309' : (dept.abc === 'B' ? '#0369a1' : '#64748b'),
                    border: dept.abc === 'A' ? '1px solid #fde68a' : (dept.abc === 'B' ? '1px solid #bae6fd' : '1px solid #e2e8f0'),
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}>
                    Curva {dept.abc}
                  </span>

                  {/* 5. Valor R$ alinhado à direita */}
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: '#0f172a', 
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatCurrency(dept.val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUNA 2: PRODUTOS LÍDERES EM FATURAMENTO (CURVA A DE SKUS) */}
        <div className="modal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div className="modal-section-title" style={{ margin: 0 }}>
                Top 5 Produtos em Faturamento
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Os maiores geradores de volume financeiro
              </div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: '4px' }}>
              Curva A
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topProducts.slice(0, 5).map((prod, idx) => {
              const pFat = prod.receita || prod.faturamento || 0;
              const pQtde = prod.volume || prod.qtde || 0;
              const avgPrice = pQtde > 0 ? (pFat / pQtde) : 0;
              const prodShare = totalFat > 0 ? (pFat / totalFat) * 100 : 0;

              return (
                <div key={idx} className="modal-row-interactive" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px', overflow: 'hidden' }}>
                    <span style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '5px', 
                      background: idx === 0 ? '#fef3c7' : '#f1f5f9', 
                      color: idx === 0 ? '#b45309' : '#64748b', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '10px', 
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </span>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prod.descricao || prod.produto}>
                        {prod.descricao || prod.produto}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {prod.depto || 'Geral'} • {formatNumber(pQtde)} un.
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      {formatCurrency(pFat)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: 600 }}>
                      {prodShare.toFixed(1)}% da rede • PM: {formatCurrency(avgPrice)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── SEÇÃO 3: SÍNTESE ESTRATÉGICA DE RECEITA (PARETO & TRAÇÃO) ── */}
      <div className="modal-section-card modal-stagger-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderColor: '#e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Zap size={15} color="#2563eb" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Diagnóstico Comercial de Receita (Concentração & Tração)
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '12px', color: '#475569' }}>
          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Concentração Comercial (Pareto)</strong>
            As 3 maiores unidades respondem por <strong style={{ color: '#2563eb' }}>{top3LojasShare.toFixed(1)}%</strong> de todo o faturamento da rede. A <strong>{top1Loja.name || top1Loja.loja || 'Loja 01'}</strong> {crossLoja ? 'responde por' : 'é a âncora principal gerando'} <strong style={{ color: '#2563eb' }}>{top1LojaShare.toFixed(1)}%</strong> da receita da rede.
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Motor Departamental</strong>
            O departamento de <strong>{top1Depto.name || 'Mercearia'}</strong> é o maior tracionador de faturamento com <strong>{top1Depto.pct ? top1Depto.pct.toFixed(1) : 0}%</strong> do mix, mantendo o volume de fluxo em todas as lojas.
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Ritmo Operacional</strong>
            Com média de <strong>{formatCurrency(dailyAvg)}/período</strong> e evolução de <strong style={{ color: delta >= 0 ? '#059669' : '#dc2626' }}>{delta >= 0 ? '+' : ''}{(delta || 0).toFixed(1)}% {deltaLabel}</strong>, a meta de vendas mantém tração consistente.
          </div>
        </div>
      </div>

    </div>
  );
}

// ── COMPONENTE EXCLUSIVO E ESPECIALIZADO: MODAL DE CUSTO DE MERCADORIAS (CMV) ──
function ModalCmvContent({ kpiData, drilldownData, chartData, allDeptsData, storesData, crossLoja, crossDepto, crossPeriod }) {
  const totalCmv = Number(kpiData?.cmvGeral || 0);
  const totalFat = Number(kpiData?.receitaLiquida || 0);
  const deltaCmv = kpiData?.cmvGeralDeltaPct;
  const deltaLabel = kpiData?.periodDeltaLabel || 'vs anterior';
  
  // Taxa de absorção de custo
  const cmvPctFat = totalFat > 0 ? (totalCmv / totalFat) * 100 : 0;
  const margemRemanescente = Math.max(100 - cmvPctFat, 0);

  // Períodos ativos / Custo Médio Diário
  const daysCount = crossPeriod ? 1 : Math.max(chartData?.length || 1, 1);
  const dailyCmv = totalCmv / daysCount;

  // Lojas ordenadas por CMV decrescente
  const rawStores = drilldownData?.cmv?.stores || storesData || [];
  const stores = [...rawStores].sort((a, b) => (b.cmv || 0) - (a.cmv || 0));
  const totalNetworkCmv = stores.reduce((sum, s) => sum + (s.cmv || 0), 0);
  const networkCmv = totalNetworkCmv > 0 ? totalNetworkCmv : totalCmv;
  const avgStoreCmv = stores.length > 0 ? (networkCmv / stores.length) : 0;
  
  const activeStore = crossLoja ? stores.find(s => (s.name || s.loja || s.nome || '').toUpperCase() === crossLoja.toUpperCase()) : null;
  const top1Loja = activeStore || stores[0] || {};
  const top1LojaCmv = activeStore ? totalCmv : (top1Loja.cmv || 0);
  const top1LojaShare = networkCmv > 0 ? (top1LojaCmv / networkCmv) * 100 : 0;
  
  const top3LojasCmv = stores.slice(0, 3).reduce((sum, s) => sum + (s.cmv || 0), 0);
  const top3LojasShare = networkCmv > 0 ? (top3LojasCmv / networkCmv) * 100 : 0;

  // Departamentos ordenados por CMV decrescente
  const rawDepts = drilldownData?.cmv?.departments || allDeptsData || [];
  const departments = [...rawDepts].sort((a, b) => (b.cmv || 0) - (a.cmv || 0));
  const top1Depto = departments[0] || {};
  const top1DeptoCmv = Number(top1Depto.cmv || 0);
  const top1DeptoShare = totalCmv > 0 ? (top1DeptoCmv / totalCmv) * 100 : 0;

  // Top SKUs de Maior Custo Acumulado (Vilões de CMV)
  const topCostProducts = (drilldownData?.cmv?.topCostProducts || []).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── FAIXA SUPERIOR: 4 MINI-KPIS ESTRATÉGICOS DE CUSTO OPERACIONAL ── */}
      <div className="modal-stagger-1" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
        gap: '12px' 
      }}>
        
        {/* KPI 1: Taxa de Absorção de Custo (% sobre a Receita) */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Absorção de Custo (CMV)
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Percent size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {cmvPctFat.toFixed(1)}% <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>da receita</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>R$ {cmvPctFat.toFixed(1)} a cada R$ 100 vendidos</span>
          </div>
        </div>

        {/* KPI 2: Centro de Custo Líder (Loja) */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {crossLoja ? 'Loja Selecionada' : 'Maior Custo por Loja'}
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {top1Loja.name || top1Loja.loja || 'Loja 01'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            <strong style={{ color: '#d97706' }}>{top1LojaShare.toFixed(1)}%</strong> do custo da rede ({formatCurrency(top1LojaCmv)})
          </div>
        </div>

        {/* KPI 3: Departamento com Maior Pressão de Custo */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Depto Maior Custo
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {top1Depto.name || 'Mercearia'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {formatCurrency(top1DeptoCmv)} (<strong style={{ color: '#dc2626' }}>{top1DeptoShare.toFixed(1)}%</strong> do CMV)
          </div>
        </div>

        {/* KPI 4: Queima Operacional / Custo Diário */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {crossPeriod ? 'Custo do Dia' : 'Custo Médio / Dia'}
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {formatCurrency(dailyCmv)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {crossPeriod ? 'Total do dia selecionado' : `Ritmo de compras em ${daysCount} dias`}
          </div>
        </div>

      </div>

      {/* ── SEÇÃO 1: DESEMPENHO E ESTRUTURA DE CUSTO POR UNIDADE OPERACIONAL ── */}
      <div className="modal-section-card modal-stagger-2">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div className="modal-section-title" style={{ margin: 0 }}>
              Consumo de Mercadorias (CMV) por Unidade Operacional
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Distribuição do custo total de estoque, proporção local de CMV vs faturamento e desvio vs média
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
            Média de CMV por Loja: <strong>{formatCurrency(avgStoreCmv)}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '12px' }}>
          {stores.map((st, idx) => {
            const stCmv = st.cmv || 0;
            const stFat = st.faturamento || st.receita || 0;
            const localCmvPct = stFat > 0 ? (stCmv / stFat) * 100 : 0;
            const sharePct = networkCmv > 0 ? (stCmv / networkCmv) * 100 : 0;
            const diffVsAvg = avgStoreCmv > 0 ? (((stCmv - avgStoreCmv) / avgStoreCmv) * 100) : 0;
            const isFilteredStore = crossLoja && (st.name || st.loja || '').toUpperCase() === crossLoja.toUpperCase();
            const isHighlighted = isFilteredStore || (!crossLoja && idx === 0);

            return (
              <div key={idx} className="modal-store-card" style={{ 
                background: isHighlighted ? '#fffbeb' : '#ffffff', 
                border: isHighlighted ? '2px solid #f59e0b' : '1px solid #e2e8f0', 
                borderRadius: '10px', 
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      width: '26px', 
                      height: '26px', 
                      borderRadius: '7px', 
                      background: idx === 0 ? '#fef3c7' : '#f8fafc', 
                      border: idx === 0 ? '1px solid #f59e0b' : '1px solid #e2e8f0', 
                      color: idx === 0 ? '#b45309' : '#64748b', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '11px', 
                      flexShrink: 0 
                    }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {st.name || st.loja}
                      </div>
                      <div style={{ fontSize: '11px', color: localCmvPct > 75 ? '#dc2626' : '#d97706', fontWeight: 600 }}>
                        CMV Local: {localCmvPct.toFixed(1)}% da receita
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: idx === 0 ? '#b45309' : '#0f172a' }}>
                      {formatCurrency(stCmv)}
                    </div>
                    <div>
                      {diffVsAvg >= 0 ? (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                          +{diffVsAvg.toFixed(0)}% vs média
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                          {diffVsAvg.toFixed(0)}% vs média
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barra Visual de Peso no CMV Total */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="progress-bar-smooth" style={{ 
                      width: `${Math.min(sharePct * 2.2, 100)}%`, 
                      height: '100%', 
                      background: idx === 0 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : '#f59e0b', 
                      borderRadius: '3px' 
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', minWidth: '42px', textAlign: 'right' }}>
                    {sharePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SEÇÃO 2: GRID COM 2 COLUNAS (DEPARTAMENTOS COM MAIOR CMV + TOP SKUS DE CUSTO) ── */}
      <div className="modal-stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* COLUNA 1: MAPA DEPARTAMENTAL DE ABSORÇÃO DE CUSTOS */}
        <div className="modal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div className="modal-section-title" style={{ margin: 0 }}>
                Pressão de Custo por Departamento
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Centros de custo e impacto na composição geral do CMV
              </div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: '4px' }}>
              {departments.length} Deptos
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {departments.slice(0, 7).map((dept, idx) => {
              const dCmv = Number(dept.cmv || 0);
              const maxCmv = Number(departments[0]?.cmv || 1);
              const barPct = maxCmv > 0 ? (dCmv / maxCmv) * 100 : 0;
              const shareInCmv = totalCmv > 0 ? (dCmv / totalCmv) * 100 : 0;
              
              // Nível de severidade de custo
              let severityLabel = 'Controlado';
              let badgeBg = '#ecfdf5';
              let badgeColor = '#059669';
              let badgeBorder = '#a7f3d0';

              if (shareInCmv >= 20) {
                severityLabel = 'Crítico';
                badgeBg = '#fef2f2';
                badgeColor = '#dc2626';
                badgeBorder = '#fecaca';
              } else if (shareInCmv >= 8) {
                severityLabel = 'Atenção';
                badgeBg = '#fffbeb';
                badgeColor = '#b45309';
                badgeBorder = '#fde68a';
              }

              return (
                <div key={idx} className="modal-row-interactive" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '95px 1fr 42px 78px 85px',
                  alignItems: 'center', 
                  padding: '7px 10px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  gap: '8px'
                }}>
                  {/* 1. Nome do Depto com largura fixa */}
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: '#1e293b', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    width: '95px'
                  }} title={dept.name}>
                    {dept.name}
                  </span>

                  {/* 2. Barra de Progresso ocupando 1fr */}
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="progress-bar-smooth" style={{ 
                      width: `${barPct}%`, 
                      height: '100%', 
                      background: idx === 0 ? '#d97706' : '#f59e0b', 
                      borderRadius: '3px' 
                    }} />
                  </div>

                  {/* 3. Percentual alinhado à direita */}
                  <span style={{ 
                    fontSize: '10.5px', 
                    fontWeight: 600, 
                    color: '#64748b', 
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap'
                  }}>
                    {shareInCmv.toFixed(1)}%
                  </span>

                  {/* 4. Badge com largura fixa logo após o percentual */}
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    fontSize: '9px', 
                    fontWeight: 800, 
                    padding: '2px 4px', 
                    borderRadius: '4px',
                    background: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}>
                    {severityLabel}
                  </span>

                  {/* 5. Valor monetário alinhado à direita */}
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: '#0f172a', 
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatCurrency(dCmv)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUNA 2: TOP SKUS VILÕES DE CUSTO (MAIOR CMV ACUMULADO) */}
        <div className="modal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div className="modal-section-title" style={{ margin: 0 }}>
                Produtos com Maior Custo Acumulado
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Itens com maior peso financeiro no reabastecimento de estoque
              </div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px' }}>
              Top 5 SKUs
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topCostProducts.length > 0 ? (
              topCostProducts.map((prod, idx) => {
                const pCmv = Number(prod.cmv || 0);
                const pReceita = Number(prod.receita || prod.faturamento || 0);
                const pMarkup = prod.markupReal || (pCmv > 0 ? ((pReceita - pCmv) / pCmv) * 100 : 0);

                return (
                  <div key={idx} className="modal-row-interactive" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #f1f5f9',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', flex: 1, overflow: 'hidden' }}>
                      <span style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '6px', 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        color: '#d97706', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '10px', 
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prod.descricao || prod.produto}>
                          {prod.descricao || prod.produto}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          Depto: <strong>{prod.depto || 'Geral'}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(pCmv)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                        MKP: <strong style={{ color: pMarkup >= 30 ? '#059669' : '#d97706' }}>{pMarkup.toFixed(0)}%</strong>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                Nenhum produto com CMV registrado no período
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── SEÇÃO 3: DIAGNÓSTICO EXECUTIVO DE CUSTOS & COMPRAS ── */}
      <div className="modal-section-card modal-stagger-4" style={{ 
        background: '#f8fafc', 
        borderRadius: '12px', 
        padding: '16px', 
        border: '1px solid #e2e8f0' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Zap size={15} color="#d97706" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Diagnóstico Executivo de Gestão de Custos & Compras
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '12px', color: '#475569' }}>
          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Taxa de Absorção de Custo</strong>
            O custo de mercadorias consome <strong style={{ color: '#d97706' }}>{cmvPctFat.toFixed(1)}%</strong> da receita bruta, restando <strong>{margemRemanescente.toFixed(1)}%</strong> de margem para cobrir despesas e gerar lucro líquido.
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Concentração Operacional</strong>
            As 3 maiores unidades respondem por <strong style={{ color: '#d97706' }}>{top3LojasShare.toFixed(1)}%</strong> de todo o custo de mercadorias da rede. A unidade <strong>{top1Loja.name || top1Loja.loja || 'Loja 01'}</strong> representa {top1LojaShare.toFixed(1)}% das compras totais.
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Variação de CMV</strong>
            O custo geral variou <strong style={{ color: deltaCmv <= 0 ? '#059669' : '#dc2626' }}>{deltaCmv >= 0 ? '+' : ''}{(deltaCmv || 0).toFixed(1)}% {deltaLabel}</strong>. O departamento de <strong>{top1Depto.name || 'Mercearia'}</strong> demanda atenção prioritária em negociações com fornecedores.
          </div>
        </div>
      </div>

    </div>
  );
}

// ── COMPONENTE EXCLUSIVO E ESPECIALIZADO: MODAL DE MARGEM DE CONTRIBUIÇÃO / BRUTA ──
function ModalMargemContent({ kpiData, drilldownData, chartData, allDeptsData, storesData, crossLoja, crossDepto, crossPeriod }) {
  const [marginSkuTab, setMarginSkuTab] = React.useState('alavancas'); // 'alavancas' | 'viloes'

  const totalMc = Number(kpiData?.margemContribuicao || 0);
  const totalFat = Number(kpiData?.receitaLiquida || 0);
  const deltaMc = kpiData?.margemContribuicaoDeltaPct;
  const deltaLabel = kpiData?.periodDeltaLabel || 'vs anterior';
  
  // Margem % efetiva
  const margemPerc = totalFat > 0 ? (totalMc / totalFat) * 100 : (kpiData?.margemContribuicaoPerc || 0);

  // Períodos ativos / Geração Diária de Margem
  const daysCount = crossPeriod ? 1 : Math.max(chartData?.length || 1, 1);
  const dailyMc = totalMc / daysCount;

  // Lojas ordenadas por Margem de Contribuição decrescente
  const rawStores = drilldownData?.margem?.stores || storesData || [];
  const stores = [...rawStores].sort((a, b) => (b.mc || 0) - (a.mc || 0));
  const totalNetworkMc = stores.reduce((sum, s) => sum + (s.mc || 0), 0);
  const networkMc = totalNetworkMc > 0 ? totalNetworkMc : totalMc;
  const avgStoreMc = stores.length > 0 ? (networkMc / stores.length) : 0;
  
  const activeStore = crossLoja ? stores.find(s => (s.name || s.loja || s.nome || '').toUpperCase() === crossLoja.toUpperCase()) : null;
  const top1Loja = activeStore || stores[0] || {};
  const top1LojaMc = activeStore ? totalMc : (top1Loja.mc || 0);
  const top1LojaShare = networkMc > 0 ? (top1LojaMc / networkMc) * 100 : 0;
  
  const top3LojasMc = stores.slice(0, 3).reduce((sum, s) => sum + (s.mc || 0), 0);
  const top3LojasShare = networkMc > 0 ? (top3LojasMc / networkMc) * 100 : 0;

  // Departamentos ordenados por Margem de Contribuição decrescente
  const rawDepts = drilldownData?.margem?.departments || allDeptsData || [];
  const departments = [...rawDepts].sort((a, b) => (b.mc || 0) - (a.mc || 0));
  
  // Depto mais rentável por Margem % (com receita representativa > 1000)
  const deptsByPct = [...rawDepts].filter(d => (d.faturamento || d.value || 0) > 1000).sort((a, b) => (b.margemPct || b.margemContribuicaoPerc || 0) - (a.margemPct || a.margemContribuicaoPerc || 0));
  const topRentavelDepto = deptsByPct[0] || departments[0] || {};
  const topRentavelDeptoPct = topRentavelDepto.margemPct || topRentavelDepto.margemContribuicaoPerc || 0;

  // Produtos: Alavancas de Lucro vs Vilões de Margem
  const topLucrativos = (drilldownData?.margem?.topLucrativos || []).slice(0, 5);
  const viloesMargem = (drilldownData?.margem?.viloesMargem || []).slice(0, 5);
  const displayedSkus = marginSkuTab === 'alavancas' ? topLucrativos : viloesMargem;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── FAIXA SUPERIOR: 4 MINI-KPIS ESTRATÉGICOS DE RENTABILIDADE ── */}
      <div className="modal-stagger-1" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
        gap: '12px' 
      }}>
        
        {/* KPI 1: Margem % Efetiva */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Margem Bruta Efetiva
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: margemPerc >= 30 ? '#ecfdf5' : '#fffbeb', color: margemPerc >= 30 ? '#059669' : '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {margemPerc.toFixed(1)}% <span style={{ fontSize: '12px', fontWeight: 600, color: margemPerc >= 30 ? '#059669' : '#b45309' }}>{margemPerc >= 30 ? 'Meta atingida' : 'Abaixo da meta'}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Meta mínima: 30.0% ({margemPerc >= 30 ? `+${(margemPerc - 30).toFixed(1)} p.p.` : `${(margemPerc - 30).toFixed(1)} p.p.`})</span>
          </div>
        </div>

        {/* KPI 2: Unidade Âncora de Rentabilidade (Loja) */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {crossLoja ? 'Loja Selecionada' : 'Loja Líder em Rentabilidade'}
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {top1Loja.name || top1Loja.loja || 'Loja 01'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            <strong style={{ color: '#059669' }}>{top1LojaShare.toFixed(1)}%</strong> do lucro da rede ({formatCurrency(top1LojaMc)})
          </div>
        </div>

        {/* KPI 3: Departamento Mais Rentável */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Depto Mais Rentável
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topRentavelDepto.name || 'Padaria'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Margem de <strong style={{ color: '#059669' }}>{topRentavelDeptoPct.toFixed(1)}%</strong> ({formatCurrency(topRentavelDepto.mc || 0)})
          </div>
        </div>

        {/* KPI 4: Geração Média Diária de Lucro */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {crossPeriod ? 'Lucro do Dia' : 'Geração de Margem / Dia'}
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {formatCurrency(dailyMc)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {crossPeriod ? 'Total do dia selecionado' : `Média em ${daysCount} períodos`}
          </div>
        </div>

      </div>

      {/* ── SEÇÃO 1: GERAÇÃO DE MARGEM POR UNIDADE OPERACIONAL ── */}
      <div className="modal-section-card modal-stagger-2">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div className="modal-section-title" style={{ margin: 0 }}>
              Geração de Margem de Contribuição por Loja
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Lucro bruto absoluto gerado por unidade, margem percentual local e participação no lucro da rede
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
            Média de Lucro por Loja: <strong>{formatCurrency(avgStoreMc)}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '12px' }}>
          {stores.map((st, idx) => {
            const stMc = st.mc || 0;
            const stFat = st.faturamento || st.receita || 0;
            const localMargemPct = stFat > 0 ? (stMc / stFat) * 100 : 0;
            const sharePct = networkMc > 0 ? (stMc / networkMc) * 100 : 0;
            const diffVsAvg = avgStoreMc > 0 ? (((stMc - avgStoreMc) / avgStoreMc) * 100) : 0;
            const isFilteredStore = crossLoja && (st.name || st.loja || '').toUpperCase() === crossLoja.toUpperCase();
            const isHighlighted = isFilteredStore || (!crossLoja && idx === 0);

            return (
              <div key={idx} className="modal-store-card" style={{ 
                background: isHighlighted ? '#ecfdf5' : '#ffffff', 
                border: isHighlighted ? '2px solid #10b981' : '1px solid #e2e8f0', 
                borderRadius: '10px', 
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      width: '26px', 
                      height: '26px', 
                      borderRadius: '7px', 
                      background: idx === 0 ? '#d1fae5' : '#f8fafc', 
                      border: idx === 0 ? '1px solid #10b981' : '1px solid #e2e8f0', 
                      color: idx === 0 ? '#047857' : '#64748b', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '11px', 
                      flexShrink: 0 
                    }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {st.name || st.loja}
                      </div>
                      <div style={{ fontSize: '11px', color: localMargemPct >= 30 ? '#059669' : '#d97706', fontWeight: 600 }}>
                        Margem: {localMargemPct.toFixed(1)}% {localMargemPct >= 30 ? '(≥30% Meta)' : '(<30% Alerta)'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: idx === 0 ? '#059669' : '#0f172a' }}>
                      {formatCurrency(stMc)}
                    </div>
                    <div>
                      {diffVsAvg >= 0 ? (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                          +{diffVsAvg.toFixed(0)}% vs média
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                          {diffVsAvg.toFixed(0)}% vs média
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barra Visual de Participação no Lucro Total */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="progress-bar-smooth" style={{ 
                      width: `${Math.min(sharePct * 2.2, 100)}%`, 
                      height: '100%', 
                      background: idx === 0 ? 'linear-gradient(90deg, #10b981, #059669)' : '#10b981', 
                      borderRadius: '3px' 
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', minWidth: '42px', textAlign: 'right' }}>
                    {sharePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SEÇÃO 2: GRID COM 2 COLUNAS (DEPTOS RENTÁVEIS + ALAVANCAS VS VILÕES DE MARGEM) ── */}
      <div className="modal-stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* COLUNA 1: MAPA DEPARTAMENTAL DE RENTABILIDADE */}
        <div className="modal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div className="modal-section-title" style={{ margin: 0 }}>
                Rentabilidade por Departamento
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Classificação por margem percentual e geração de lucro líquido
              </div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
              {departments.length} Deptos
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {departments.slice(0, 7).map((dept, idx) => {
              const dMc = Number(dept.mc || 0);
              const maxMc = Number(departments[0]?.mc || 1);
              const barPct = maxMc > 0 ? (dMc / maxMc) * 100 : 0;
              const dFat = Number(dept.faturamento || dept.value || 0);
              const dMargemPct = dFat > 0 ? (dMc / dFat) * 100 : 0;
              
              // Meta mínima de margem corporativa: 30.0%
              let rentLabel = '≥ 30% Meta';
              let badgeBg = '#ecfdf5';
              let badgeColor = '#059669';
              let badgeBorder = '#a7f3d0';
              let barColor = '#059669';

              if (dMargemPct < 20) {
                rentLabel = '< 20% Crítico';
                badgeBg = '#fef2f2';
                badgeColor = '#dc2626';
                badgeBorder = '#fecaca';
                barColor = '#ef4444';
              } else if (dMargemPct < 30) {
                rentLabel = '< 30% Alerta';
                badgeBg = '#fffbeb';
                badgeColor = '#b45309';
                badgeBorder = '#fde68a';
                barColor = '#f59e0b';
              }

              return (
                <div key={idx} className="modal-row-interactive" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '95px 1fr 42px 78px 85px',
                  alignItems: 'center', 
                  padding: '7px 10px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  gap: '8px'
                }}>
                  {/* 1. Nome do Depto com largura fixa */}
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: '#1e293b', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    width: '95px'
                  }} title={dept.name}>
                    {dept.name}
                  </span>

                  {/* 2. Barra de Progresso ocupando 1fr */}
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="progress-bar-smooth" style={{ 
                      width: `${barPct}%`, 
                      height: '100%', 
                      background: barColor, 
                      borderRadius: '3px' 
                    }} />
                  </div>

                  {/* 3. Percentual alinhado à direita */}
                  <span style={{ 
                    fontSize: '10.5px', 
                    fontWeight: 700, 
                    color: dMargemPct >= 30 ? '#059669' : (dMargemPct >= 20 ? '#d97706' : '#dc2626'), 
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap'
                  }}>
                    {dMargemPct.toFixed(1)}%
                  </span>

                  {/* 4. Badge com largura fixa logo após o percentual */}
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    fontSize: '9px', 
                    fontWeight: 800, 
                    padding: '2px 4px', 
                    borderRadius: '4px',
                    background: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}>
                    {rentLabel}
                  </span>

                  {/* 5. Valor monetário alinhado à direita */}
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: '#0f172a', 
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatCurrency(dMc)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUNA 2: ALAVANCAS DE LUCRO VS VILÕES DE MARGEM (COM ABAS INTERATIVAS) */}
        <div className="modal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
            <div className="modal-section-title" style={{ margin: 0 }}>
              Análise de Precisão de Produtos
            </div>

            {/* Alternador de Abas: Alavancas vs Vilões */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px', gap: '2px' }}>
              <button 
                onClick={() => setMarginSkuTab('alavancas')}
                style={{
                  border: 'none',
                  background: marginSkuTab === 'alavancas' ? '#ffffff' : 'transparent',
                  color: marginSkuTab === 'alavancas' ? '#059669' : '#64748b',
                  fontWeight: marginSkuTab === 'alavancas' ? 700 : 500,
                  fontSize: '10px',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  boxShadow: marginSkuTab === 'alavancas' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Alavancas de Lucro
              </button>
              <button 
                onClick={() => setMarginSkuTab('viloes')}
                style={{
                  border: 'none',
                  background: marginSkuTab === 'viloes' ? '#ffffff' : 'transparent',
                  color: marginSkuTab === 'viloes' ? '#dc2626' : '#64748b',
                  fontWeight: marginSkuTab === 'viloes' ? 700 : 500,
                  fontSize: '10px',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  boxShadow: marginSkuTab === 'viloes' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Vilões de Margem
              </button>
            </div>
          </div>

          <div key={marginSkuTab} className="tab-panel-animated" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayedSkus.length > 0 ? (
              displayedSkus.map((prod, idx) => {
                const pMc = Number(prod.mc || 0);
                const pReceita = Number(prod.receita || prod.faturamento || 0);
                const pMargemPct = prod.margemContribuicaoPerc != null ? prod.margemContribuicaoPerc : (pReceita > 0 ? (pMc / pReceita) * 100 : 0);

                return (
                  <div key={idx} className="modal-row-interactive" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: marginSkuTab === 'viloes' && pMargemPct < 10 ? '#fef2f2' : '#f8fafc',
                    borderRadius: '8px',
                    border: marginSkuTab === 'viloes' && pMargemPct < 10 ? '1px solid #fee2e2' : '1px solid #f1f5f9',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', flex: 1, overflow: 'hidden' }}>
                      <span style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '6px', 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        color: marginSkuTab === 'alavancas' ? '#059669' : '#dc2626', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '10px', 
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prod.descricao || prod.produto}>
                          {prod.descricao || prod.produto}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          Depto: <strong>{prod.depto || 'Geral'}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: marginSkuTab === 'alavancas' ? '#059669' : '#dc2626' }}>
                        {formatCurrency(pMc)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                        Margem: <strong style={{ color: pMargemPct >= 30 ? '#059669' : (pMargemPct >= 20 ? '#d97706' : '#dc2626') }}>{pMargemPct.toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                Nenhum produto registrado para esta categoria
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── SEÇÃO 3: DIAGNÓSTICO EXECUTIVO DE RENTABILIDADE & PRICING ── */}
      <div className="modal-section-card modal-stagger-4" style={{ 
        background: '#f8fafc', 
        borderRadius: '12px', 
        padding: '16px', 
        border: '1px solid #e2e8f0' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <TrendingUp size={15} color="#059669" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Diagnóstico Executivo de Rentabilidade & Blindagem de Margem
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '12px', color: '#475569' }}>
          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Meta de Rentabilidade (Alvo: 30%)</strong>
            A rede opera com <strong style={{ color: margemPerc >= 30 ? '#059669' : '#d97706' }}>{margemPerc.toFixed(1)}%</strong> de margem de contribuição (meta mínima: 30,0%). {margemPerc >= 30 ? 'Operação rentabilizando com folga saudável sobre a meta.' : 'Necessário ajuste no mix promocional e precificação para atingir o piso de 30%.'}
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Concentração de Rentabilidade</strong>
            As 3 maiores unidades geram <strong style={{ color: '#059669' }}>{top3LojasShare.toFixed(1)}%</strong> de todo o lucro bruto da empresa. A <strong>{top1Loja.name || top1Loja.loja || 'Loja 01'}</strong> é a unidade mais relevante na composição do resultado financeiro.
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Dinâmica de Precificação</strong>
            A margem de contribuição evoluiu <strong style={{ color: deltaMc >= 0 ? '#059669' : '#dc2626' }}>{deltaMc >= 0 ? '+' : ''}{(deltaMc || 0).toFixed(1)}% {deltaLabel}</strong>. Ajustes de markups em produtos de baixa margem podem elevar a rentabilidade média da rede.
          </div>
        </div>
      </div>

    </div>
  );
}

// ── COMPONENTE EXCLUSIVO E ESPECIALIZADO: MODAL DE VOLUME & TICKET MÉDIO ──
function ModalVolumeTicketContent({ kpiData, drilldownData, chartData, allDeptsData, storesData, crossLoja, crossDepto, crossPeriod }) {
  const [volumeTab, setVolumeTab] = useState('produtos');

  const totalVolume = Number(kpiData?.volumeTotal || 0);
  const totalFat = Number(kpiData?.receitaLiquida || 0);
  const deltaVol = kpiData?.volumeTotalDeltaPct;
  const deltaLabel = kpiData?.periodDeltaLabel || 'vs anterior';
  const ticketMedio = Number(kpiData?.ticketMedio || 0);
  const deltaTicket = kpiData?.ticketMedioDeltaPct;
  const itensPorCupom = Number(kpiData?.itensPorCupom || 0);
  const ticketCount = Number(kpiData?.ticketCount || 0);

  // Média Diária de Volume (Run Rate)
  const daysCount = Math.max(chartData?.length || 1, 1);
  const dailyVolume = totalVolume / daysCount;

  // Lojas ordenadas por Volume decrescente
  const rawStores = drilldownData?.volumeTicket?.stores || storesData || [];
  const stores = [...rawStores].sort((a, b) => (b.volume || 0) - (a.volume || 0));
  const totalNetworkVol = stores.reduce((sum, s) => sum + (s.volume || 0), 0) || totalVolume;
  const avgStoreVol = stores.length > 0 ? (totalNetworkVol / stores.length) : 0;

  const activeStore = crossLoja ? stores.find(s => (s.name || s.loja || s.nome || '').toUpperCase() === crossLoja.toUpperCase()) : null;
  const top1Loja = activeStore || stores[0] || {};
  const top1LojaVol = activeStore ? totalVolume : (top1Loja.volume || 0);
  const top1LojaShare = totalNetworkVol > 0 ? (top1LojaVol / totalNetworkVol) * 100 : 0;

  const top3LojasVol = stores.slice(0, 3).reduce((sum, s) => sum + (s.volume || 0), 0);
  const top3LojasShare = totalNetworkVol > 0 ? (top3LojasVol / totalNetworkVol) * 100 : 0;

  // Departamentos ordenados por Volume decrescente
  const rawDepartments = drilldownData?.volumeTicket?.departments || allDeptsData || [];
  const departments = [...rawDepartments].sort((a, b) => (b.volume || 0) - (a.volume || 0));
  const maxDeptVol = Number(departments[0]?.volume || 1);

  // SKUs Líderes em Giro e Clientes
  const topVolumeProducts = drilldownData?.volumeTicket?.topVolumeProducts || drilldownData?.faturamento?.topProducts || [];
  const topClientes = drilldownData?.volumeTicket?.topClientes || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── BARRA SUPERIOR: 4 MINI-KPIS ESTRATÉGICOS ── */}
      <div className="modal-stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        
        {/* KPI 1: Volume Total de Unidades */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Volume Total Movimentado
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {formatNumber(totalVolume)} <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1' }}>unidades</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Giro médio: ~{formatNumber(dailyVolume)} un./dia</span>
          </div>
        </div>

        {/* KPI 2: Ticket Médio Consolidado */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Ticket Médio Geral
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {formatCurrency(ticketMedio)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {deltaTicket != null ? (
              <span style={{ color: deltaTicket >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                {deltaTicket >= 0 ? '+' : ''}{deltaTicket.toFixed(1)}% {deltaLabel}
              </span>
            ) : (
              <span>Gasto médio por cupom / checkout</span>
            )}
          </div>
        </div>

        {/* KPI 3: Loja Líder em Volume */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {crossLoja ? 'Loja Selecionada' : 'Loja Líder em Giro'}
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {top1Loja.name || top1Loja.loja || 'Loja 01'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            <strong style={{ color: '#4f46e5' }}>{top1LojaShare.toFixed(1)}%</strong> do giro ({formatNumber(top1LojaVol)} un.)
          </div>
        </div>

        {/* KPI 4: Itens por Cupom / Intensidade de Cesta */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '14px 16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Intensidade de Cesta
            </span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f3e8ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={13} />
            </div>
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {itensPorCupom > 0 ? itensPorCupom.toFixed(1) : (ticketCount > 0 ? (totalVolume / ticketCount).toFixed(1) : '3.8')} <span style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6' }}>un./cesta</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            <span>{ticketCount > 0 ? `${formatNumber(ticketCount)} cupons emitidos` : 'Profundidade média de checkout'}</span>
          </div>
        </div>

      </div>

      {/* ── SEÇÃO 1: RANKING E DISTRIBUIÇÃO DE VOLUME POR LOJA ── */}
      <div className="modal-section-card modal-stagger-2">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div className="modal-section-title" style={{ margin: 0 }}>
              Ranking de Volume de Vendas & Ticket Médio por Loja
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Distribuição de fluxo físico e valor médio por atendimento em cada unidade
            </div>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
            {stores.length} Lojas Ativas
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {stores.map((st, idx) => {
            const stVol = Number(st.volume || 0);
            const sharePct = totalNetworkVol > 0 ? (stVol / totalNetworkVol) * 100 : 0;
            const diffVsAvg = avgStoreVol > 0 ? ((stVol - avgStoreVol) / avgStoreVol) * 100 : 0;
            const storeTM = Number(st.ticketMedio || (st.linhas > 0 ? st.faturamento / st.linhas : ticketMedio));

            return (
              <div key={idx} className="modal-store-card" style={{ 
                background: idx === 0 ? '#f5f3ff' : '#f8fafc', 
                border: idx === 0 ? '1px solid #c7d2fe' : '1px solid #e2e8f0', 
                borderRadius: '10px', 
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      width: '26px', 
                      height: '26px', 
                      borderRadius: '7px', 
                      background: idx === 0 ? '#e0e7ff' : '#ffffff', 
                      border: idx === 0 ? '1px solid #818cf8' : '1px solid #e2e8f0', 
                      color: idx === 0 ? '#4338ca' : '#64748b', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '11px', 
                      flexShrink: 0 
                    }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {st.name || st.loja}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                        TM: {formatCurrency(storeTM)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: idx === 0 ? '#4f46e5' : '#0f172a' }}>
                      {formatNumber(stVol)} un.
                    </div>
                    <div>
                      {diffVsAvg >= 0 ? (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '1px 6px', borderRadius: '4px' }}>
                          +{diffVsAvg.toFixed(0)}% vs média
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                          {diffVsAvg.toFixed(0)}% vs média
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barra Visual de Participação no Volume Total */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="progress-bar-smooth" style={{ 
                      width: `${Math.min(sharePct * 2.2, 100)}%`, 
                      height: '100%', 
                      background: idx === 0 ? 'linear-gradient(90deg, #818cf8, #4f46e5)' : '#6366f1', 
                      borderRadius: '3px' 
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', minWidth: '42px', textAlign: 'right' }}>
                    {sharePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SEÇÃO 2: GRID COM 2 COLUNAS (DEPTOS EM GIRO + SKUS / CLIENTES) ── */}
      <div className="modal-stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* COLUNA 1: MAPA DEPARTAMENTAL DE GIRO */}
        <div className="modal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div className="modal-section-title" style={{ margin: 0 }}>
                Giro por Departamento
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Classificação por velocidade de escoamento e unidades vendidas
              </div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
              {departments.length} Deptos
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {departments.slice(0, 7).map((dept, idx) => {
              const dVol = Number(dept.volume || 0);
              const barPct = maxDeptVol > 0 ? (dVol / maxDeptVol) * 100 : 0;
              const shareInVol = totalNetworkVol > 0 ? (dVol / totalNetworkVol) * 100 : 0;
              
              // Classificação de Giro
              let turnoverLabel = 'Giro Normal';
              let badgeBg = '#f1f5f9';
              let badgeColor = '#475569';
              let badgeBorder = '#e2e8f0';
              let barColor = '#818cf8';

              if (shareInVol >= 20) {
                turnoverLabel = 'Alto Giro';
                badgeBg = '#eef2ff';
                badgeColor = '#4f46e5';
                badgeBorder = '#c7d2fe';
                barColor = '#4f46e5';
              } else if (shareInVol >= 8) {
                turnoverLabel = 'Médio Giro';
                badgeBg = '#ede9fe';
                badgeColor = '#6d28d9';
                badgeBorder = '#ddd6fe';
                barColor = '#6366f1';
              } else {
                turnoverLabel = 'Giro Focado';
                badgeBg = '#f8fafc';
                badgeColor = '#64748b';
                badgeBorder = '#e2e8f0';
                barColor = '#a5b4fc';
              }

              return (
                <div key={idx} className="modal-row-interactive" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '95px 1fr 42px 78px 85px',
                  alignItems: 'center', 
                  padding: '7px 10px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  gap: '8px'
                }}>
                  {/* 1. Nome do Depto com largura fixa */}
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: '#1e293b', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    width: '95px'
                  }} title={dept.name}>
                    {dept.name}
                  </span>

                  {/* 2. Barra de Progresso ocupando 1fr */}
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="progress-bar-smooth" style={{ 
                      width: `${barPct}%`, 
                      height: '100%', 
                      background: barColor, 
                      borderRadius: '3px' 
                    }} />
                  </div>

                  {/* 3. Percentual alinhado à direita */}
                  <span style={{ 
                    fontSize: '10.5px', 
                    fontWeight: 700, 
                    color: '#4f46e5', 
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap'
                  }}>
                    {shareInVol.toFixed(1)}%
                  </span>

                  {/* 4. Badge com largura fixa logo após o percentual */}
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    fontSize: '9px', 
                    fontWeight: 800, 
                    padding: '2px 4px', 
                    borderRadius: '4px',
                    background: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}>
                    {turnoverLabel}
                  </span>

                  {/* 5. Valor em unidades alinhado à direita */}
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: '#0f172a', 
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatNumber(dVol)} un.
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUNA 2: SKUS EM GIRO VS CLIENTES FREQUENTES (COM ABAS INTERATIVAS) */}
        <div className="modal-section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
            <div className="modal-section-title" style={{ margin: 0 }}>
              Giro de SKUs & Clientes
            </div>

            {/* Alternador de Abas */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '7px', padding: '2px', border: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setVolumeTab('produtos')}
                style={{
                  border: 'none',
                  background: volumeTab === 'produtos' ? '#ffffff' : 'transparent',
                  color: volumeTab === 'produtos' ? '#4f46e5' : '#64748b',
                  fontWeight: volumeTab === 'produtos' ? 700 : 500,
                  fontSize: '10px',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  boxShadow: volumeTab === 'produtos' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Top SKUs em Giro
              </button>
              <button
                type="button"
                onClick={() => setVolumeTab('clientes')}
                style={{
                  border: 'none',
                  background: volumeTab === 'clientes' ? '#ffffff' : 'transparent',
                  color: volumeTab === 'clientes' ? '#4f46e5' : '#64748b',
                  fontWeight: volumeTab === 'clientes' ? 700 : 500,
                  fontSize: '10px',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  boxShadow: volumeTab === 'clientes' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Clientes Frequentes
              </button>
            </div>
          </div>

          <div key={volumeTab} className="tab-panel-animated" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {volumeTab === 'produtos' ? (
              topVolumeProducts.length > 0 ? (
                topVolumeProducts.slice(0, 5).map((prod, idx) => {
                  const pVol = Number(prod.volume || prod.quantidade || 0);
                  const pReceita = Number(prod.receita || prod.faturamento || 0);
                  const pPrecoMedio = pVol > 0 ? pReceita / pVol : 0;

                  return (
                    <div key={idx} className="modal-row-interactive" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '8px 10px', 
                      background: '#f8fafc', 
                      borderRadius: '8px', 
                      border: '1px solid #f1f5f9', 
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', flex: 1, overflow: 'hidden' }}>
                        <span style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '6px', 
                          background: '#ffffff', 
                          border: '1px solid #e2e8f0', 
                          color: '#4f46e5', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '10px', 
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prod.descricao || prod.produto}>
                            {prod.descricao || prod.produto}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            Depto: <strong>{prod.depto || 'Geral'}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#4f46e5' }}>
                          {formatNumber(pVol)} un.
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                          PM: {formatCurrency(pPrecoMedio)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  Nenhum produto com giro registrado
                </div>
              )
            ) : (
              topClientes.length > 0 ? (
                topClientes.slice(0, 5).map((cli, idx) => {
                  const cVol = Number(cli.volume || 0);
                  const cCompras = Number(cli.compras || 1);
                  const cTM = cCompras > 0 ? Number(cli.receita || 0) / cCompras : 0;

                  return (
                    <div key={idx} className="modal-row-interactive" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '8px 10px', 
                      background: '#f8fafc', 
                      borderRadius: '8px', 
                      border: '1px solid #f1f5f9', 
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', flex: 1, overflow: 'hidden' }}>
                        <span style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '6px', 
                          background: '#ffffff', 
                          border: '1px solid #e2e8f0', 
                          color: '#2563eb', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '10px', 
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cli.cliente || cli.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            Unidade: <strong>{cli.loja || 'Rede'}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb' }}>
                          {formatNumber(cVol)} un.
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                          {cCompras} compras · TM: {formatCurrency(cTM)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  Nenhum cliente registrado no recorte
                </div>
              )
            )}
          </div>
        </div>

      </div>

      {/* ── SEÇÃO 3: DIAGNÓSTICO EXECUTIVO DE VOLUME & TICKET MÉDIO ── */}
      <div className="modal-section-card modal-stagger-4" style={{ 
        background: '#f8fafc', 
        borderRadius: '12px', 
        padding: '16px', 
        border: '1px solid #e2e8f0' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Package size={15} color="#4f46e5" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Diagnóstico Executivo de Volume, Giro & Eficiência de Ticket
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '12px', color: '#475569' }}>
          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Elasticidade Volume × Preço</strong>
            A rede movimentou <strong style={{ color: '#4f46e5' }}>{formatNumber(totalVolume)} unidades</strong> gerando um ticket médio consolidado de <strong style={{ color: '#059669' }}>{formatCurrency(ticketMedio)}</strong>. Manter monitoramento sobre promoções de alto giro para evitar perda de valor agregado na cesta.
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Concentração do Fluxo Físico</strong>
            As 3 maiores unidades escoam <strong style={{ color: '#4f46e5' }}>{top3LojasShare.toFixed(1)}%</strong> de todas as mercadorias vendidas pela rede. A unidade <strong>{top1Loja.name || top1Loja.loja || 'Loja 01'}</strong> representa a principal âncora de tráfego de clientes.
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>Alavancagem de Cesta (Cross-Selling)</strong>
            Com média estimada em <strong style={{ color: '#8b5cf6' }}>{itensPorCupom > 0 ? itensPorCupom.toFixed(1) : '3.8'} itens por cupom</strong>, ações nos pontos de checkout e vendas casadas entre departamentos são o caminho mais veloz para elevar o faturamento sem necessidade de expandir a base de clientes.
          </div>
        </div>
      </div>

    </div>
  );
}

// ── COMPONENTE PADRÃO PARA O MODAL RESTANTE ──
function ModalDefaultContent({ type, currentConfig, stores, departments, topProducts, kpiData, maxDeptVal, crossLoja, crossDepto, crossPeriod }) {
  return (
    <>
      <div className="modal-section-card modal-stagger-2">
        <div className="modal-section-title">{currentConfig.chartLabel}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {stores.map((st, idx) => {
            const maxVal = Math.max(...(stores.map(s => s[currentConfig.barKey] || 0)), 1);
            const pct = ((st[currentConfig.barKey] || 0) / maxVal) * 100;
            return (
              <div key={idx} className="modal-store-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{st.name}</span>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>{formatNumber(st[currentConfig.barKey])} un.</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── MODAL CONTAINER PRINCIPAL ──
export default function ModalKpiDetail({ 
  isOpen, 
  onClose, 
  type, 
  kpiData, 
  drilldownData, 
  chartData, 
  allDeptsData, 
  storesData,
  crossLoja,
  crossDepto,
  crossPeriod,
  cardOrigin
}) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 220);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || !drilldownData) return null;

  const configs = {
    faturamento: {
      title: 'Faturamento Líquido Consolidado',
      subtitle: 'Inteligência de Receita • Análise Comercial por Unidade, Mix Departamental e Produtos Curva A',
      color: '#2563eb',
      bgColor: '#eff6ff',
      mainValue: formatCurrency(kpiData?.receitaLiquida),
      delta: kpiData?.receitaLiquidaDeltaPct,
      icon: DollarSign,
      barKey: 'faturamento',
      chartLabel: 'Faturamento por Unidade'
    },
    cmv: {
      title: 'Custo da Mercadoria Vendida (CMV)',
      subtitle: 'Estrutura de custo operacional por unidade, departamentos e produtos',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      mainValue: formatCurrency(kpiData?.cmvGeral),
      delta: kpiData?.cmvGeralDeltaPct,
      icon: Activity,
      barKey: 'cmv',
      chartLabel: 'Custo de Mercadorias por Unidade'
    },
    margem: {
      title: 'Margem de Contribuição & Lucratividade',
      subtitle: 'Rentabilidade líquida real, alavancas de lucro e vilões da margem',
      color: '#10b981',
      bgColor: '#ecfdf5',
      mainValue: `${formatCurrency(kpiData?.margemContribuicao)} (${(kpiData?.margemContribuicaoPerc || 0).toFixed(1)}%)`,
      delta: kpiData?.margemContribuicaoDeltaPct,
      icon: TrendingUp,
      barKey: 'mc',
      chartLabel: 'Margem de Contribuição por Unidade'
    },
    volumeTicket: {
      title: 'Volume de Vendas & Ticket Médio',
      subtitle: 'Inteligência de Tráfego • Giro de Produtos, Comportamento de Compra e Eficiência por Loja',
      color: '#6366f1',
      bgColor: '#eef2ff',
      mainValue: `${formatNumber(kpiData?.volumeTotal)} un. · TM: ${formatCurrency(kpiData?.ticketMedio)}`,
      delta: kpiData?.volumeTotalDeltaPct,
      icon: Package,
      barKey: 'volume',
      chartLabel: 'Volume de Vendas (Unidades) por Loja'
    }
  };

  const currentConfig = configs[type] || configs.faturamento;
  const currentDrill = drilldownData[type] || {};
  const IconComponent = currentConfig.icon;

  const stores = currentDrill.stores || [];
  const departments = currentDrill.departments || [];
  const topProducts = currentDrill.topProducts || currentDrill.topLucrativos || currentDrill.topCostProducts || [];
  const maxDeptVal = Math.max(...(departments.map(d => d.faturamento || d.cmv || d.volume || 0)), 1);

  return (
    <div className={`executive-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div 
        className={`executive-modal-container ${isClosing ? 'closing' : ''}`} 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '1040px',
          '--origin-x': cardOrigin ? `${cardOrigin.x}px` : '0px',
          '--origin-y': cardOrigin ? `${cardOrigin.y}px` : '0px',
          '--start-scale-x': cardOrigin ? cardOrigin.scaleX : 0.35,
          '--start-scale-y': cardOrigin ? cardOrigin.scaleY : 0.25,
        }}
      >
        
        {/* ── HEADER MODAL ── */}
        <div className="executive-modal-header">
          <div className="modal-header-info">
            <div className="modal-header-icon-box" style={{ background: currentConfig.bgColor, color: currentConfig.color }}>
              <IconComponent size={22} />
            </div>
            <div>
              <div className="modal-kpi-headline">{currentConfig.title}</div>
              <div className="modal-kpi-bigval">
                {currentConfig.mainValue}
                {currentConfig.delta != null && (
                  <span className={currentConfig.delta >= 0 ? 'kpi-badge-positive' : 'kpi-badge-negative'}>
                    {currentConfig.delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {currentConfig.delta >= 0 ? '+' : ''}{currentConfig.delta.toFixed(1)}% {kpiData?.periodDeltaLabel || 'vs anterior'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                {currentConfig.subtitle}
              </div>
            </div>
          </div>

          <button onClick={handleClose} className="modal-close-btn" title="Fechar (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* ── CORPO DO MODAL ── */}
        <div className="executive-modal-body">
          {type === 'faturamento' && (
            <ModalFaturamentoContent 
              kpiData={kpiData}
              drilldownData={drilldownData}
              chartData={chartData}
              allDeptsData={allDeptsData}
              storesData={storesData}
              crossLoja={crossLoja}
              crossDepto={crossDepto}
              crossPeriod={crossPeriod}
            />
          )}
          {type === 'cmv' && (
            <ModalCmvContent 
              kpiData={kpiData}
              drilldownData={drilldownData}
              chartData={chartData}
              allDeptsData={allDeptsData}
              storesData={storesData}
              crossLoja={crossLoja}
              crossDepto={crossDepto}
              crossPeriod={crossPeriod}
            />
          )}
          {type === 'margem' && (
            <ModalMargemContent 
              kpiData={kpiData}
              drilldownData={drilldownData}
              chartData={chartData}
              allDeptsData={allDeptsData}
              storesData={storesData}
              crossLoja={crossLoja}
              crossDepto={crossDepto}
              crossPeriod={crossPeriod}
            />
          )}
          {type === 'volumeTicket' && (
            <ModalVolumeTicketContent 
              kpiData={kpiData}
              drilldownData={drilldownData}
              chartData={chartData}
              allDeptsData={allDeptsData}
              storesData={storesData}
              crossLoja={crossLoja}
              crossDepto={crossDepto}
              crossPeriod={crossPeriod}
            />
          )}
          {type !== 'faturamento' && type !== 'cmv' && type !== 'margem' && type !== 'volumeTicket' && (
            <ModalDefaultContent 
              type={type}
              currentConfig={currentConfig}
              stores={stores}
              departments={departments}
              topProducts={topProducts}
              kpiData={kpiData}
              maxDeptVal={maxDeptVal}
              crossLoja={crossLoja}
              crossDepto={crossDepto}
              crossPeriod={crossPeriod}
            />
          )}
        </div>

      </div>
    </div>
  );
}
