'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Sparkles, X, TrendingUp, TrendingDown, AlertTriangle, 
  Store, Package, ChevronRight, HelpCircle, Send, RotateCcw,
  Bot, User, ArrowUpRight, CheckCircle2, Filter, Layers, DollarSign
} from 'lucide-react';

export default function ExecutiveBriefingDrawer({ 
  isOpen, 
  onClose, 
  kpis,
  allDeptsData = [],
  storesData = [],
  topProdutos = [],
  crossDepto, 
  crossLoja,
  crossPeriod,
  onApplyFilter,
  onAiHover
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);

  const parseAiText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        
        let targetType = null;
        let targetValue = null;
        
        const lower = content.toLowerCase();
        if (lower.includes('faturamento') || lower.includes('receita') || lower.includes('r$')) {
          targetType = 'kpi-receita';
        } else if (lower.includes('cmv') || lower.includes('custo')) {
          targetType = 'kpi-cmv';
        } else if (lower.includes('margem')) {
          targetType = 'kpi-margem';
        } else if (lower.includes('loja ') || lower.includes('filial ')) {
          targetType = 'loja';
          targetValue = content; 
        } else if (lower.length > 2) {
          targetType = 'depto';
          targetValue = content;
        }
        
        if (targetType) {
          return (
            <span 
              key={i}
              onMouseEnter={() => onAiHover && onAiHover({ type: targetType, value: targetValue })}
              onMouseLeave={() => onAiHover && onAiHover(null)}
              style={{
                fontWeight: 800,
                color: '#1d4ed8',
                borderBottom: '1px dashed #93c5fd',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '0 2px',
                borderRadius: '4px',
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {content}
            </span>
          );
        }
        return <strong key={i} style={{ color: '#0f172a' }}>{content}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Análise Estratégica Executiva Multidimensional Real
  const intel = useMemo(() => {
    if (!kpis) return null;

    const rec = Number(kpis.receitaLiquida || 0);
    const cmv = Number(kpis.cmvGeral || 0);
    const mc = Number(kpis.margemContribuicao || 0);
    const mcPerc = Number(kpis.margemContribuicaoPerc || 0);
    const cmvPerc = rec > 0 ? (cmv / rec) * 100 : 0;

    // Departamentos
    const validDepts = allDeptsData.filter(d => (d.value || 0) > 0);
    const deptsByRevenue = [...validDepts].sort((a, b) => (b.value || 0) - (a.value || 0));
    const deptsByMargem = [...validDepts].sort((a, b) => (b.margemContribuicaoPerc || 0) - (a.margemContribuicaoPerc || 0));

    const topVolumeDepto = deptsByRevenue[0] || null;
    const topMarginDepto = deptsByMargem[0] || null;
    const worstMarginDepto = deptsByMargem[deptsByMargem.length - 1] || null;

    // Lojas
    const sortedStores = [...storesData].sort((a, b) => (b.receita || 0) - (a.receita || 0));
    const topStore = sortedStores[0] || null;
    const lowestStore = sortedStores[sortedStores.length - 1] || null;

    // Produtos Curva A com margem crítica (< 20%)
    const lowMarginProducts = (topProdutos || []).filter(p => {
      const margem = Number(p.margem || p.margemContribuicaoPerc || 0);
      return margem < 20 && margem > 0;
    }).slice(0, 3);

    return {
      rec,
      cmv,
      mc,
      mcPerc,
      cmvPerc,
      topVolumeDepto,
      topMarginDepto,
      worstMarginDepto,
      topStore,
      lowestStore,
      sortedStores: sortedStores.slice(0, 4),
      deptsByRevenue: deptsByRevenue.slice(0, 4),
      lowMarginProducts
    };
  }, [kpis, allDeptsData, storesData, topProdutos]);

  // Inicialização com Diagnóstico Proativo Executivo (Efeito WOW imediato)
  useEffect(() => {
    if (isOpen && messages.length === 0 && intel) {
      setMessages([
        {
          id: 1,
          sender: 'assistant',
          type: 'proactive_briefing',
          data: intel
        }
      ]);
    }
  }, [isOpen, intel, messages.length]);

  // Scroll suave ao receber novas mensagens
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleActionClick = (action) => {
    if (!action) return;
    if (onApplyFilter) {
      onApplyFilter(action);
    }
  };

  const handleSend = (textToSend) => {
    const qText = (textToSend || inputValue).trim();
    if (!qText || !intel) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: qText
    };

    const q = qText.toLowerCase();
    let replyMsg = null;

    if (q.includes('loja') || q.includes('faturou mais') || q.includes('filial') || q.includes('unidade')) {
      const isFraca = q.includes('fraca') || q.includes('pior') || q.includes('menor');
      const targetStore = isFraca ? intel.lowestStore : intel.topStore;
      
      replyMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        type: 'store_matrix',
        title: isFraca ? 'Atenção: Unidades com Menor Desempenho' : 'Desempenho Comparativo por Loja',
        summary: targetStore 
          ? (isFraca 
              ? `A **${targetStore.nome}** apresenta o menor faturamento da rede com **R$ ${Math.round(targetStore.receita).toLocaleString('pt-BR')}** (${((targetStore.receita / intel.rec) * 100).toFixed(1)}% de share). É necessário investigar os ofensores.`
              : `A **${targetStore.nome}** lidera a operação com faturamento de **R$ ${Math.round(targetStore.receita).toLocaleString('pt-BR')}** (${((targetStore.receita / intel.rec) * 100).toFixed(1)}% de share).`
            )
          : 'Dados das lojas consolidados.',
        stores: intel.sortedStores,
        totalRec: intel.rec,
        action: targetStore ? { type: 'loja', value: targetStore.nome, label: `Investigar ${targetStore.nome} no Dashboard` } : null
      };
    } else if (q.includes('margem') || q.includes('cmv') || q.includes('custo') || q.includes('lucro') || q.includes('otimizar')) {
      replyMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        type: 'margin_diagnostic',
        title: 'Diagnóstico de Rentabilidade & CMV',
        summary: `A rede opera com **CMV de ${intel.cmvPerc.toFixed(1)}%** e **Margem de Contribuição de ${intel.mcPerc.toFixed(1)}%**. O departamento **${intel.worstMarginDepto?.fullName || intel.worstMarginDepto?.name || 'crítico'}** puxa a margem consolidada para baixo (${(intel.worstMarginDepto?.margemContribuicaoPerc || 0).toFixed(1)}%).`,
        worstDepto: intel.worstMarginDepto,
        topMarginDepto: intel.topMarginDepto,
        lowMarginProducts: intel.lowMarginProducts,
        action: intel.worstMarginDepto ? { type: 'depto', value: intel.worstMarginDepto.fullName || intel.worstMarginDepto.name, label: `Investigar ${intel.worstMarginDepto.fullName || intel.worstMarginDepto.name}` } : null
      };
    } else if (q.includes('produto') || q.includes('item') || q.includes('curva a') || q.includes('carro-chefe') || q.includes('volume') || q.includes('departamento') || q.includes('depto') || q.includes('setor')) {
      const isFraco = q.includes('fraco') || q.includes('pior') || q.includes('menor') || q.includes('critico');
      const targetDepto = isFraco ? intel.worstMarginDepto : intel.topVolumeDepto;
      
      replyMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        type: 'product_mix',
        title: isFraco ? 'Atenção: Departamentos Críticos' : 'Carro-Chefe em Volume vs Margem',
        summary: targetDepto
          ? (isFraco 
              ? `O departamento **${targetDepto.fullName || targetDepto.name}** apresenta o menor desempenho da rede com **R$ ${Math.round(targetDepto.value).toLocaleString('pt-BR')}** e margem crítica de **${(targetDepto.margemContribuicaoPerc || 0).toFixed(1)}%**.`
              : `O departamento **${targetDepto.fullName || targetDepto.name}** concentra o maior volume de vendas (**R$ ${Math.round(targetDepto.value).toLocaleString('pt-BR')}**).`
            )
          : 'Mix de produtos analisado.',
        depts: intel.deptsByRevenue,
        totalRec: intel.rec,
        action: targetDepto ? { type: 'depto', value: targetDepto.fullName || targetDepto.name, label: `Filtrar ${targetDepto.fullName || targetDepto.name}` } : null
      };
    } else {
      replyMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        type: 'general_insight',
        title: 'Resumo Estratégico Executivo',
        summary: `Faturamento consolidado em **R$ ${Math.round(intel.rec).toLocaleString('pt-BR')}** com margem líquida média de **${intel.mcPerc.toFixed(1)}%**. A rede apresenta forte tração na **${intel.topStore?.nome || 'Loja Líder'}** e maior rentabilidade no departamento de **${intel.topMarginDepto?.fullName || intel.topMarginDepto?.name || 'Padaria/Frios'}**.`,
        action: intel.topStore ? { type: 'loja', value: intel.topStore.nome, label: `Ver detalhes da ${intel.topStore.nome}` } : null
      };
    }

    setMessages((prev) => [...prev, userMsg, replyMsg]);
    setInputValue('');
  };

  const handleClearHistory = () => {
    if (intel) {
      setMessages([
        {
          id: Date.now(),
          sender: 'assistant',
          type: 'proactive_briefing',
          data: intel
        }
      ]);
    } else {
      setMessages([]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop transparente para interceptar clique fora sem bloquear a visibilidade */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'transparent',
          zIndex: 1000
        }}
      />

      {/* Drawer Lateral Executivo */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '420px',
          background: '#f8fafc',
          boxShadow: '-10px 0 35px -5px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Cabeçalho do Drawer */}
        <div style={{
          padding: '16px 20px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Briefing Executivo</span>
                <span style={{ 
                  fontSize: '9px', 
                  fontWeight: 700, 
                  background: '#eff6ff', 
                  color: '#2563eb', 
                  padding: '1px 6px', 
                  borderRadius: '4px',
                  border: '1px solid #dbeafe',
                  letterSpacing: '0.3px'
                }}>
                  SMART COPILOT
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                {crossLoja || crossDepto || crossPeriod 
                  ? `Cruzando: ${[crossLoja, crossDepto, crossPeriod].filter(Boolean).join(' • ')}`
                  : 'Análise multidimensional em tempo real'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleClearHistory}
              title="Reiniciar conversa"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Área Central: Conversa Interativa e Cards Estratégicos */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Mensagem do Usuário */}
              {msg.sender === 'user' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '14px 14px 2px 14px',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 500,
                    maxWidth: '85%',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
                  }}>
                    {msg.text}
                  </div>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#0f172a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <User size={13} />
                  </div>
                </div>
              )}

              {/* Mensagens do Assistente (Cards Ricos e Visuais) */}
              {msg.sender === 'assistant' && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                  }}>
                    <Bot size={15} />
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {/* 1. CARD PROATIVO INICIAL (Efeito WOW ao abrir) */}
                    {msg.type === 'proactive_briefing' && (
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '16px',
                        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={14} style={{ color: '#2563eb' }} />
                            Diagnóstico Executivo do Período
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 7px', borderRadius: '4px' }}>
                            ATUALIZADO
                          </span>
                        </div>

                        {/* 3 Métricas Estratégicas em Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, display: 'block' }}>Faturamento</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>R$ {(msg.data.rec / 1000000).toFixed(2)}M</span>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, display: 'block' }}>Margem Média</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>{msg.data.mcPerc.toFixed(1)}%</span>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, display: 'block' }}>Custo CMV</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#d97706' }}>{msg.data.cmvPerc.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* Destaques Estratégicos */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '12px', color: '#334155' }}>
                          {msg.data.topStore && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Store size={13} style={{ color: '#2563eb' }} />
                                <strong>Loja Líder:</strong> {msg.data.topStore.nome}
                              </span>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                                R$ {Math.round(msg.data.topStore.receita).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          )}

                          {msg.data.worstMarginDepto && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309' }}>
                                <AlertTriangle size={13} />
                                <strong>Atenção de Margem:</strong> {msg.data.worstMarginDepto.fullName || msg.data.worstMarginDepto.name}
                              </span>
                              <span style={{ fontWeight: 700, color: '#b45309' }}>
                                {(msg.data.worstMarginDepto.margemContribuicaoPerc || 0).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Botão de Ação Imediata */}
                        {msg.data.topStore && (
                          <button
                            onClick={() => handleActionClick({ type: 'loja', value: msg.data.topStore.nome })}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                          >
                            <Filter size={12} />
                            Filtrar {msg.data.topStore.nome} no Dashboard
                            <ArrowUpRight size={12} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* 2. CARD MATRIZ DE LOJAS COM BARRAS INLINE */}
                    {msg.type === 'store_matrix' && (
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '16px',
                        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                          <Store size={15} style={{ color: '#2563eb' }} />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{msg.title}</span>
                        </div>

                        <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                          {parseAiText(msg.summary)}
                        </p>

                        {/* Barras de Desempenho Inline */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {msg.stores.map((s, idx) => {
                            const pct = msg.totalRec > 0 ? (s.receita / msg.totalRec) * 100 : 0;
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                  <span style={{ fontWeight: 700, color: '#334155' }}>{s.nome}</span>
                                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                    R$ {Math.round(s.receita).toLocaleString('pt-BR')} <span style={{ color: '#64748b' }}>({pct.toFixed(1)}%)</span>
                                  </span>
                                </div>
                                <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ 
                                    width: `${Math.min(pct * 2, 100)}%`, 
                                    height: '100%', 
                                    background: idx === 0 ? 'linear-gradient(90deg, #2563eb, #3b82f6)' : '#94a3b8', 
                                    borderRadius: '3px' 
                                  }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {msg.action && (
                          <button
                            onClick={() => handleActionClick(msg.action)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              marginTop: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                          >
                            <Filter size={12} />
                            {msg.action.label}
                            <ArrowUpRight size={12} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* 3. CARD DIAGNÓSTICO DE MARGEM & CMV */}
                    {msg.type === 'margin_diagnostic' && (
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '16px',
                        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                          <AlertTriangle size={15} style={{ color: '#d97706' }} />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{msg.title}</span>
                        </div>

                        <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                          {parseAiText(msg.summary)}
                        </p>

                        {/* Curva A com Margem Crítica */}
                        {msg.lowMarginProducts && msg.lowMarginProducts.length > 0 && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block', marginBottom: '6px' }}>
                              Itens de Alto Giro com Margem Frágil:
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {msg.lowMarginProducts.map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#991b1b' }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                                    • {p.nome || p.descricao}
                                  </span>
                                  <span style={{ fontWeight: 700 }}>
                                    {(p.margem || p.margemContribuicaoPerc || 0).toFixed(1)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {msg.action && (
                          <button
                            onClick={() => handleActionClick(msg.action)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              color: '#b45309',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fef3c7'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fffbeb'; }}
                          >
                            <Filter size={12} />
                            {msg.action.label}
                            <ArrowUpRight size={12} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* 4. CARD MIX DE PRODUTOS & VOLUME */}
                    {msg.type === 'product_mix' && (
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '16px',
                        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                          <Package size={15} style={{ color: '#2563eb' }} />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{msg.title}</span>
                        </div>

                        <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                          {parseAiText(msg.summary)}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {msg.depts.map((d, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}>
                              <span style={{ fontWeight: 600, color: '#334155' }}>{d.fullName || d.name}</span>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>R$ {Math.round(d.value).toLocaleString('pt-BR')}</span>
                                <span style={{ fontSize: '10px', color: '#059669', marginLeft: '6px', fontWeight: 700 }}>
                                  ({(d.margemContribuicaoPerc || 0).toFixed(1)}% margem)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {msg.action && (
                          <button
                            onClick={() => handleActionClick(msg.action)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                          >
                            <Filter size={12} />
                            {msg.action.label}
                            <ArrowUpRight size={12} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* 5. RESUMO GERAL */}
                    {msg.type === 'general_insight' && (
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '16px',
                        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{msg.title}</span>
                        <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                          {parseAiText(msg.summary)}
                        </p>
                        {msg.action && (
                          <button
                            onClick={() => handleActionClick(msg.action)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Filter size={12} />
                            {msg.action.label}
                            <ArrowUpRight size={12} />
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Rodapé: Chips Inteligentes + Input de Pergunta */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flexShrink: 0
        }}>
          {/* Chips com Perguntas Estratégicas Pré-Mapeadas */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {[
              'Qual loja faturou mais?',
              'Onde está o vazamento de margem?',
              'Carro-chefe em volume',
              'Como otimizar o CMV consolidado?'
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.color = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          
        </div>
      </div>
    </>
  );
}
