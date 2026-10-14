

'use client';



import React, { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { Users, Receipt, ArrowDown, ArrowUp, ArrowUpDown, Target, ChevronDown, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis, ReferenceLine, ReferenceDot, BarChart, Bar, Cell, LabelList } from 'recharts';
import LastUpdateBadge from '../components/LastUpdateBadge';
import FilterBadges from '../components/FilterBadges';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{point.name || point.nome}</p>
        <p>Fat. Real: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(point.z || point.receita)}</p>
        <p>Desconto: {new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((point.x || point.percDesc || point.descontoPerc) / 100)}</p>
        <p>Margem Contrib.: {new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((point.y || point.margemContribuicaoPerc) / 100)}</p>
        <p>Markup Real: {new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((point.markupReal) / 100)}</p>
      </div>
    );
  }
  return null;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const formatPercent = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);
};

export default function Vendedores() {

  const searchParams = useSearchParams();

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  

  const [sortConfig, setSortConfig] = useState({ key: 'receita', direction: 'desc' });

  const [expandedVendedores, setExpandedVendedores] = useState({});



  useEffect(() => {

    async function fetchData() {

      setLoading(true);

      try {

        const query = new URLSearchParams(searchParams.toString());

        const res = await fetch(`/api/dashboard?${query.toString()}`);

        if (res.ok) {

          const json = await res.json();

          setData(json);

        }

      } finally {

        setLoading(false);

      }

    }

    fetchData();

  }, [searchParams]);



  if (!data) return (
    <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
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
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Carregando dados...</span>
    </div>
  );



  const handleSort = (key) => {

    let direction = 'desc';

    if (sortConfig.key === key && sortConfig.direction === 'desc') {

      direction = 'asc';

    }

    setSortConfig({ key, direction });
  };

  const sortedVendedores = [...data.tables.vendedores].sort((a, b) => {

    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (key) => {

    if (sortConfig.key !== key) return null;

    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';

  };



  const toggleVendedor = (nome) => {

    setExpandedVendedores(prev => ({ ...prev, [nome]: !prev[nome] }));

  };



  const scatterData = data.tables.vendedores.map(v => ({

    name: v.nome,

    x: v.percDesc,

    y: v.margemContribuicaoPerc,

    z: v.receita,

    markupReal: v.markupReal,

    markupIdeal: v.markupIdeal

  }));



  const top10Vendedores = [...data.tables.vendedores].sort((a,b) => b.receita - a.receita).slice(0, 10);

  // Totais da tabela
  const totaisTabela = sortedVendedores.reduce((acc, v) => {
    acc.fatPadrao += v.fatPadrao || 0;
    acc.desconto += v.desconto || 0;
    acc.receita += v.receita || 0;
    acc.cmv += v.cmv || 0;
    acc.impostos += v.impostos || 0;
    acc.mc += v.mc || 0;
    acc.qtde += v.qtde || 0;
    acc.verba += v.verba || 0;
    return acc;
  }, { fatPadrao: 0, desconto: 0, receita: 0, cmv: 0, impostos: 0, mc: 0, qtde: 0, verba: 0 });
  totaisTabela.percDesc = totaisTabela.fatPadrao > 0 ? (totaisTabela.desconto / totaisTabela.fatPadrao) * 100 : 0;
  totaisTabela.markupIdeal = totaisTabela.cmv > 0 ? ((totaisTabela.fatPadrao - totaisTabela.cmv) / totaisTabela.cmv) * 100 : 0;
  totaisTabela.markupReal = totaisTabela.cmv > 0 ? ((totaisTabela.receita - totaisTabela.cmv) / totaisTabela.cmv) * 100 : 0;
  totaisTabela.margemContribuicaoPerc = totaisTabela.receita > 0 ? (totaisTabela.mc / totaisTabela.receita) * 100 : 0;


  

  const highlightedVendedorParam = searchParams.get('vendedor');

  const highlightedVendedores = highlightedVendedorParam ? highlightedVendedorParam.split(',') : [];

  const activeScatterPoints = highlightedVendedores.length > 0 ? scatterData.filter(m => highlightedVendedores.includes(m.name) && m.z > 0) : [];



  const getBg = (k) => sortConfig.key === k ? 'hsl(var(--muted))' : undefined;



  return (

    <div style={{ position: 'relative' }}>
      {loading && data && (
        <div className="loading-overlay" style={{ borderRadius: '8px' }}>
          <div className="loading-overlay-content">
            <div className="spinner"></div>
            <span>Atualizando painel...</span>
          </div>
        </div>
      )}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Equipe Comercial</h1>
          <p className="page-subtitle">Desempenho de vendas, rentabilidade verdadeira (Contribuição) e política de descontos por vendedor.</p>
        </div>
        <LastUpdateBadge lastUpdate={data.lastUpdate} />
      </div>



      <div className="grid-tables" style={{ alignItems: 'start', gridTemplateColumns: '1fr 1fr', marginBottom: '2rem' }}>

        

        <div className="card">

          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={20} /> Matriz de Desempenho (Receita vs Margem)
            </div>
            <FilterBadges />
          </div>

          <p className="text-muted" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>Eixo X: % Desconto | Eixo Y: % Margem de Contribuição | Tamanho: Receita</p>

          <div style={{ width: '100%', height: '300px' }}>

            <ResponsiveContainer width="100%" height="100%">

              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>

                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

                <XAxis type="number" dataKey="x" name="Desconto" unit="%" stroke="hsl(var(--muted-foreground))" domain={['dataMin - 5', 'dataMax + 5']} tick={{fontSize: 10}} tickFormatter={(v) => Math.round(v)} label={{ value: '% Desconto', position: 'insideBottom', offset: -15, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />

                <YAxis type="number" dataKey="y" name="Margem" unit="%" stroke="hsl(var(--muted-foreground))" domain={['dataMin - 5', 'dataMax + 5']} tick={{fontSize: 10}} tickFormatter={(v) => Math.round(v)} label={{ value: '% Margem', angle: -90, position: 'insideLeft', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />

                <ZAxis type="number" dataKey="z" range={[30, 400]} name="Faturamento" />

                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />

                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" label={{ value: "R$ 0", position: 'left', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />

                

                {activeScatterPoints.map((pt, i) => (

                  <ReferenceDot 

                    key={`refdot-${i}`}

                    x={pt.x} 

                    y={pt.y} 

                    r={5} 

                    fill="transparent" 

                    stroke="none"

                  />

                ))}

                

                <Scatter data={scatterData.filter(d => d.z > 0)} fill="hsl(var(--primary))" opacity={0.7} isAnimationActive={false}>

                  {scatterData.filter(d => d.z > 0).map((entry, index) => {

                    const isSelected = highlightedVendedores.includes(entry.name);

                    const isFaded = highlightedVendedores.length > 0 && !isSelected;

                    return <Cell key={`cell-${index}`} fill={isSelected ? 'hsl(var(--warning))' : 'hsl(var(--primary))'} opacity={isFaded ? 0.2 : 0.8} />;

                  })}

                  <LabelList 

                    dataKey="name" 

                    position="top" 

                    content={(props) => {

                      const { x, y, value, index } = props;

                      const pt = scatterData.filter(d => d.z > 0)[index];

                      const isHighlighted = highlightedVendedores.length > 0 && highlightedVendedores.includes(pt.name);

                      if (!isHighlighted) return null;

                      return (

                        <text x={x} y={y - 15} textAnchor="middle" fill="hsl(var(--warning))" fontSize={12} fontWeight="bold">

                          {value}

                        </text>

                      );

                    }}

                  />

                </Scatter>

              </ScatterChart>

            </ResponsiveContainer>

          </div>

        </div>



        <div className="card">

          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} /> Top 10 Vendedores por Faturamento
            </div>
            <FilterBadges />
          </div>

          <div style={{ width: '100%', height: '320px' }}>

            <ResponsiveContainer width="100%" height="100%">

              <BarChart data={top10Vendedores} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>

                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />

                <XAxis type="number" tick={{fontSize: 10}} tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} stroke="hsl(var(--muted-foreground))"/>

                <YAxis dataKey="nome" type="category" width={100} tick={{fontSize: 10}} stroke="hsl(var(--muted-foreground))"/>

                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.1)' }}/>

                <Bar dataKey="receita" radius={[0, 4, 4, 0]}>

                  {top10Vendedores.map((entry, index) => {

                    const isSelected = highlightedVendedores.includes(entry.nome);

                    const isFaded = highlightedVendedores.length > 0 && !isSelected;

                    return <Cell key={`cell-${index}`} fill={isSelected ? 'hsl(var(--warning))' : `hsl(220, 70%, ${50 + index * 3}%)`} opacity={isFaded ? 0.3 : 1} />;

                  })}

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>



      <div className="grid-kpis" style={{marginBottom: '2rem'}}>

        {(() => {

          const marketplaces = ['MERCADO LIVRE', 'SHOPEE', 'MAGALU', 'AMAZON', 'B2W', 'ALIEXPRESS', 'SHEIN', 'AMERICANAS', 'VIA VAREJO'];

          const kpiMap = {};

          const vendedoresForKPI = highlightedVendedores.length > 0 ? data.tables.vendedores.filter(v => highlightedVendedores.includes(v.nome)) : data.tables.vendedores;

          vendedoresForKPI.forEach(v => {
            const isMarketplace = marketplaces.includes((v.nome || '').toUpperCase());
            const key = isMarketplace ? 'E-COMMERCE' : v.nome;

            if (!kpiMap[key]) {

              kpiMap[key] = {

                nome: key, receita: 0, mc: 0, cmv: 0, qtdeNotas: 0,

                markupIdeal: 0, markupReal: 0, margemContribuicaoPerc: 0, ticketMedio: 0

              };

            }

            kpiMap[key].receita += v.receita || 0;

            kpiMap[key].mc += v.mc || 0;

            kpiMap[key].cmv += v.cmv || 0;

            kpiMap[key].qtdeNotas += v.qtdeNotas || 0;

          });

          

          return Object.values(kpiMap).map(v => {

            v.margemContribuicaoPerc = v.receita > 0 ? (v.mc / v.receita) * 100 : 0;

            v.markupReal = v.cmv > 0 ? ((v.receita - v.cmv) / v.cmv) * 100 : 0;

            v.ticketMedio = v.qtdeNotas > 0 ? v.receita / v.qtdeNotas : 0;

            return v;

          }).sort((a, b) => b.receita - a.receita).slice(0, 3);

        })().map((v, i) => (

          <div key={v.nome} className="card" style={{ borderColor: i === 0 ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>

            <div className="card-title text-primary"><Users size={18} /> {i + 1}º Lugar: {v.nome}</div>

            <div className="card-value">{formatCurrency(v.receita)}</div>

            <div className="card-trend text-muted" style={{display:'flex', gap:'8px', flexWrap: 'wrap'}}>

              <span>Markup: <span className={v.markupReal > 10 ? 'text-green' : 'text-red'} style={{fontWeight: 'bold'}}>{formatPercent(v.markupReal)}</span></span>

              <span>| MC: <span className={v.margemContribuicaoPerc > 5 ? 'text-green' : 'text-red'} style={{fontWeight: 'bold'}}>{formatPercent(v.margemContribuicaoPerc)}</span></span>

            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>

              <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Receipt size={14}/> {v.qtdeNotas} Notas</span>

              <span>Ticket: {formatCurrency(v.ticketMedio)}</span>

            </div>

          </div>

        ))}

      </div>

      <div className="card table-card" style={{ marginBottom: '2rem' }}>

        <div className="table-container">

          <table className="data-table">

            <thead>
              <tr>
                <th colSpan={13} style={{ padding: 0, borderBottom: 'none', backgroundColor: 'hsl(var(--card))' }}>
                  <div className="card-title" style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '1.25rem', margin: 0, paddingBottom: '1rem', borderBottom: '1px solid hsl(var(--border))' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Target size={24} /> Performance da Equipe (Padrão ERP)
                    </div>
                    <FilterBadges />
                  </div>
                </th>
              </tr>
              <tr>
                <th style={{cursor: 'pointer', backgroundColor: getBg('nome')}} onClick={() => handleSort('nome')}>VENDEDOR{renderSortIcon('nome')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('qtde')}} onClick={() => handleSort('qtde')}>QTDE.{renderSortIcon('qtde')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('fatPadrao')}} onClick={() => handleSort('fatPadrao')}>FAT. PADRÃO{renderSortIcon('fatPadrao')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('desconto')}} onClick={() => handleSort('desconto')}>DESCONTO{renderSortIcon('desconto')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('percDesc')}} onClick={() => handleSort('percDesc')}>% DESC.{renderSortIcon('percDesc')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('receita')}} onClick={() => handleSort('receita')}>FAT. REAL{renderSortIcon('receita')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('markupIdeal')}} onClick={() => handleSort('markupIdeal')}>MARKUP IDEAL{renderSortIcon('markupIdeal')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('markupReal')}} onClick={() => handleSort('markupReal')}>MARKUP REAL{renderSortIcon('markupReal')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('cmv')}} onClick={() => handleSort('cmv')}>CMV{renderSortIcon('cmv')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('verba'), color: 'hsl(190, 90%, 40%)'}} onClick={() => handleSort('verba')}>VERBA{renderSortIcon('verba')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('impostos')}} onClick={() => handleSort('impostos')}>IMPOSTOS{renderSortIcon('impostos')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('mc')}} onClick={() => handleSort('mc')}>MARGEM R${renderSortIcon('mc')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('margemContribuicaoPerc')}} onClick={() => handleSort('margemContribuicaoPerc')}>MARGEM %{renderSortIcon('margemContribuicaoPerc')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedVendedores.map((v) => {
                const isExpanded = expandedVendedores[v.nome];

                return (
                <React.Fragment key={v.nome}>
                  <tr style={{ transition: 'opacity 0.2s', backgroundColor: isExpanded ? 'hsl(var(--muted)/0.3)' : 'transparent' }}>
                    <td style={{fontWeight: 600, backgroundColor: getBg('nome'), display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none'}} onClick={() => toggleVendedor(v.nome)}>
                      <div style={{ flexShrink: 0 }}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                      <span title={v.nome} style={{ maxWidth: '250px', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {v.nome}
                      </span>
                    </td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('qtde')}}>{v.qtde ? v.qtde.toLocaleString('pt-BR') : 0}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('fatPadrao')}}>{formatCurrency(v.fatPadrao)}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('desconto')}} className="text-red">{formatCurrency(v.desconto)}</td>
                    <td style={{textAlign: 'center', backgroundColor: getBg('percDesc')}} className="text-red">{formatPercent(v.percDesc)}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('receita')}}>{formatCurrency(v.receita)}</td>
                    <td style={{textAlign: 'center', backgroundColor: getBg('markupIdeal')}}>{formatPercent(v.markupIdeal)}</td>
                    <td style={{textAlign: 'center', fontWeight: 'bold', backgroundColor: getBg('markupReal')}} className={v.markupReal >= v.markupIdeal ? 'text-green' : 'text-red'}>{formatPercent(v.markupReal)}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('cmv')}}>{formatCurrency(v.cmv)}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('verba'), color: 'hsl(190, 90%, 40%)', fontWeight: 'bold'}}>{formatCurrency(v.verba)}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('impostos')}} className="text-red">{formatCurrency(v.impostos)}</td>
                    <td style={{textAlign: 'right', fontWeight: 'bold', backgroundColor: getBg('mc')}} className={v.mc > 0 ? 'text-green' : 'text-red'}>{formatCurrency(v.mc)}</td>
                    <td style={{textAlign: 'center', fontWeight: 'bold', backgroundColor: getBg('margemContribuicaoPerc')}} className={v.margemContribuicaoPerc > 0 ? 'text-green' : 'text-red'}>{formatPercent(v.margemContribuicaoPerc)}</td>
                  </tr>
                  {isExpanded && v.produtos && [...v.produtos].map(p => ({
                    ...p,
                    receita: p.fatReal,
                    markupIdeal: p.cmv > 0 ? ((p.fatPadrao - p.cmv) / p.cmv) * 100 : 0,
                    markupReal: p.cmv > 0 ? ((p.fatReal - p.cmv) / p.cmv) * 100 : 0,
                    percDesc: p.fatPadrao > 0 ? (p.desconto / p.fatPadrao) * 100 : 0,
                    margemContribuicaoPerc: p.fatReal > 0 ? (p.mc / p.fatReal) * 100 : 0
                  })).sort((a, b) => {
                    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                  }).map(p => (
                    <tr key={v.nome + p.produto} style={{ backgroundColor: 'hsl(var(--background))', fontSize: '0.75rem' }}>
                      <td title={p.produto} style={{ paddingLeft: '2.5rem', backgroundColor: getBg('nome'), color: 'hsl(var(--muted-foreground))', maxWidth: '300px' }}>
                        <div style={{ whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.produto}
                        </div>
                      </td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('qtde'), color: 'hsl(var(--muted-foreground))'}}>{p.qtde ? p.qtde.toLocaleString('pt-BR') : 0}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('fatPadrao'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.fatPadrao)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('desconto'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.desconto)}</td>
                      <td style={{textAlign: 'center', backgroundColor: getBg('percDesc'), color: 'hsl(var(--muted-foreground))'}}>{formatPercent(p.percDesc)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('receita')}}>{formatCurrency(p.fatReal)}</td>
                      <td style={{textAlign: 'center', backgroundColor: getBg('markupIdeal'), color: 'hsl(var(--muted-foreground))'}}>{formatPercent(p.markupIdeal)}</td>
                      <td style={{textAlign: 'center', backgroundColor: getBg('markupReal')}} className={p.markupReal >= p.markupIdeal ? 'text-green' : 'text-warning'}>{formatPercent(p.markupReal)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('cmv'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.cmv)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('verba'), color: 'hsl(190, 90%, 40%)'}}>{formatCurrency(p.verba)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('impostos'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.impostos)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('mc')}} className={p.mc > 0 ? 'text-green' : 'text-red'}>{formatCurrency(p.mc)}</td>
                      <td style={{textAlign: 'center', backgroundColor: getBg('margemContribuicaoPerc')}} className={p.margemContribuicaoPerc > 0 ? 'text-green' : 'text-red'}>{formatPercent(p.margemContribuicaoPerc)}</td>

                    </tr>

                  ))}

                </React.Fragment>

                );

              })}

            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'hsl(var(--muted)/0.5)', fontWeight: 'bold' }}>
                <td style={{backgroundColor: getBg('nome')}}>TOTAIS ({sortedVendedores.length})</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('qtde')}}>{totaisTabela.qtde ? totaisTabela.qtde.toLocaleString('pt-BR') : 0}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('fatPadrao')}}>{formatCurrency(totaisTabela.fatPadrao)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('desconto')}} className="text-red">{formatCurrency(totaisTabela.desconto)}</td>
                <td style={{textAlign: 'center', backgroundColor: getBg('percDesc')}} className="text-red">{formatPercent(totaisTabela.percDesc)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('receita')}}>{formatCurrency(totaisTabela.receita)}</td>
                <td style={{textAlign: 'center', backgroundColor: getBg('markupIdeal')}}>{formatPercent(totaisTabela.markupIdeal)}</td>
                <td style={{textAlign: 'center', backgroundColor: getBg('markupReal')}} className={totaisTabela.markupReal >= totaisTabela.markupIdeal ? 'text-green' : 'text-red'}>{formatPercent(totaisTabela.markupReal)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('cmv')}}>{formatCurrency(totaisTabela.cmv)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('verba'), color: 'hsl(190, 90%, 40%)'}}>{formatCurrency(totaisTabela.verba)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('impostos')}} className="text-red">{formatCurrency(totaisTabela.impostos)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('mc')}} className={totaisTabela.mc > 0 ? 'text-green' : 'text-red'}>{formatCurrency(totaisTabela.mc)}</td>
                <td style={{textAlign: 'center', backgroundColor: getBg('margemContribuicaoPerc')}} className={totaisTabela.margemContribuicaoPerc > 0 ? 'text-green' : 'text-red'}>{formatPercent(totaisTabela.margemContribuicaoPerc)}</td>
              </tr>
            </tfoot>

          </table>

        </div>

      </div>

    </div>

  );

}
