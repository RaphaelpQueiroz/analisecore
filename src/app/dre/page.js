'use client';
import React, { useEffect, useState } from 'react';
import { DollarSign, Download, ChevronRight, ChevronDown } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';

export default function DrePage() {
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState({ 1: true, 4: true });

  useEffect(() => {
    // Mocking DRE data
    setTimeout(() => {
      setData([
        { id: 1, type: 'header', nome: '1. Receita Bruta de Vendas', valor: 120500000 },
        { id: 2, type: 'item', parent: 1, nome: 'Venda de Mercadorias', valor: 115000000 },
        { id: 3, type: 'item', parent: 1, nome: 'Serviços Prestados', valor: 5500000 },
        { id: 4, type: 'header', nome: '2. Deduções da Receita Bruta', valor: -19280000, color: '#dc2626' },
        { id: 5, type: 'item', parent: 4, nome: 'ICMS', valor: -12050000 },
        { id: 6, type: 'item', parent: 4, nome: 'PIS / COFINS', valor: -4458500 },
        { id: 7, type: 'item', parent: 4, nome: 'Devoluções / Cancelamentos', valor: -2771500 },
        { id: 8, type: 'total', nome: '3. Receita Líquida de Vendas', valor: 101220000, color: '#2563eb' },
        { id: 9, type: 'header', nome: '4. Custos dos Produtos Vendidos (CMV)', valor: -72970000, color: '#dc2626' },
        { id: 10, type: 'total', nome: '5. Lucro Bruto', valor: 28250000, color: '#10b981' },
        { id: 11, type: 'header', nome: '6. Despesas Operacionais', valor: -18500000, color: '#dc2626' },
        { id: 12, type: 'total', nome: '7. EBITDA', valor: 9750000, color: '#2563eb' },
        { id: 13, type: 'header', nome: '8. Depreciação / Amortização', valor: -1200000, color: '#dc2626' },
        { id: 14, type: 'total', nome: '9. Lucro Operacional (EBIT)', valor: 8550000, color: '#10b981' },
        { id: 15, type: 'header', nome: '10. Resultado Financeiro', valor: -2100000, color: '#dc2626' },
        { id: 16, type: 'total', nome: '11. Lucro Antes do IR/CSLL', valor: 6450000, color: '#10b981' },
        { id: 17, type: 'header', nome: '12. IR / CSLL', valor: -2193000, color: '#dc2626' },
        { id: 18, type: 'total', nome: '13. Lucro Líquido do Exercício', valor: 4257000, color: '#059669', isGrandTotal: true },
      ]);
    }, 400);
  }, []);

  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' }}>Carregando DRE Contábil...</div>;

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign style={{ color: '#2563eb' }} /> DRE Contábil e Financeiro
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Demonstrativo do Resultado do Exercício consolidado.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <Download size={14} /> Exportar Excel
        </button>
      </div>

      <div className="kpi-card" style={{ padding: 0, overflow: 'hidden' }}>
        {data.map((row) => {
          if (row.type === 'item' && !expanded[row.parent]) return null;

          let bg = '#ffffff';
          let fw = 500;
          let color = '#334155';
          let fontSize = '14px';
          let paddingLeft = '24px';
          let borderBottom = '1px solid #f1f5f9';

          if (row.type === 'header') {
            fw = 700;
            color = '#1e293b';
          } else if (row.type === 'total') {
            bg = '#f8fafc';
            fw = 800;
            color = row.color || '#0f172a';
            if (row.isGrandTotal) {
              bg = '#ecfdf5';
              fontSize = '16px';
            }
          } else if (row.type === 'item') {
            paddingLeft = '48px';
            color = '#64748b';
            fontSize = '13px';
          }

          return (
            <div 
              key={row.id} 
              onClick={() => row.type === 'header' && toggleExpand(row.id)}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: `12px 24px 12px ${paddingLeft}`, 
                background: bg, 
                borderBottom,
                cursor: row.type === 'header' ? 'pointer' : 'default',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (row.type === 'header') e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = bg;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: fw, color, fontSize }}>
                {row.type === 'header' && (
                  expanded[row.id] ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />
                )}
                {row.nome}
              </div>
              <div style={{ fontWeight: fw, color: row.type === 'item' ? color : (row.valor < 0 ? '#dc2626' : color), fontSize, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: row.isGrandTotal ? '14px' : '12px', opacity: 0.8 }}>{row.valor < 0 ? '- R$' : 'R$'}</span>
                <AnimatedNumber value={Math.abs(row.valor)} decimals={0} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
