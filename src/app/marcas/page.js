

'use client';



import React, { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { PackageSearch, AlertOctagon, TrendingUp, TrendingDown, Target, Activity, ChevronDown, ChevronRight, Trophy, Gem, AlertTriangle } from 'lucide-react';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine, ReferenceDot
} from 'recharts';

import LastUpdateBadge from '../components/LastUpdateBadge';
import FilterBadges from '../components/FilterBadges';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{point.name || point.marca}</p>
        <p>Fat. Real: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(point.z || point.fatReal)}</p>
        <p>Desconto: {new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((point.x || point.percDesc) / 100)}</p>
        <p>Markup Real: {new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((point.y || point.markupReal) / 100)}</p>
      </div>
    );
  }
  return null;
};

const formatCurrency = (value) => {

  if (value === undefined || value === null) return 'R$ 0';

  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

};

const formatPercent = (value) => {

  if (value === undefined || value === null) return '0%';

  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value / 100);

};



export default function Marcas() {

  const searchParams = useSearchParams();

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState({ key: 'fatReal', direction: 'desc' });

  const [expandedMarcas, setExpandedMarcas] = useState({});



  const toggleMarca = (marcaName) => {

    setExpandedMarcas(prev => ({ ...prev, [marcaName]: !prev[marcaName] }));

  };



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
    <div className="loading-container" style={{ height: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
      <p style={{ marginTop: '1rem', color: 'hsl(var(--muted-foreground))' }}>Carregando Inteligência de Marcas...</p>
    </div>
  );



  const handleSort = (key) => {

    let direction = 'desc';

    if (sortConfig.key === key && sortConfig.direction === 'desc') {

      direction = 'asc';

    }

    setSortConfig({ key, direction });

  };



  const renderSortIcon = (key) => {

    if (sortConfig.key !== key) return null;

    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';

  };



  // 1. Tabela de Marcas Ordenada

  const sortedMarcas = [...data.marcas].sort((a, b) => {

    let valA = a[sortConfig.key] || 0;

    let valB = b[sortConfig.key] || 0;

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;

    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;

    return 0;

  });



  // 2. Gráfico de Dispersão (Bolhas)

  // X = Desconto %, Y = Markup Real %, Z (Tamanho) = Receita Real

  const scatterData = data.marcas.map(m => ({

    name: m.marca,

    x: m.percDesc, // Desconto %

    x: m.percDesc,

    y: m.markupReal,

    z: m.fatReal,

    markupIdeal: m.markupIdeal

  }));



  // 3. Gráfico de Barras (Top 10 Marcas)

  const top10Marcas = [...data.marcas].sort((a,b) => b.fatReal - a.fatReal).slice(0, 10);

  

  // Totais da tabela

  const totaisTabela = sortedMarcas.reduce((acc, m) => {
    acc.fatPadrao += m.fatPadrao || 0;
    acc.desconto += m.desconto || 0;
    acc.fatReal += m.fatReal || 0;
    acc.cmv += m.cmv || 0;
    acc.impostos += m.impostos || 0;
    acc.mc += m.mc || 0;
    acc.qtde += m.qtde || 0;
    acc.verba += m.verba || 0;
    return acc;
  }, { fatPadrao: 0, desconto: 0, fatReal: 0, cmv: 0, impostos: 0, mc: 0, qtde: 0, verba: 0 });

  totaisTabela.percDesc = totaisTabela.fatPadrao > 0 ? (totaisTabela.desconto / totaisTabela.fatPadrao) * 100 : 0;

  totaisTabela.markupIdeal = totaisTabela.cmv > 0 ? ((totaisTabela.fatPadrao - totaisTabela.cmv) / totaisTabela.cmv) * 100 : 0;

  totaisTabela.markupReal = totaisTabela.cmv > 0 ? ((totaisTabela.fatReal - totaisTabela.cmv) / totaisTabela.cmv) * 100 : 0;

  totaisTabela.margemContribuicaoPerc = totaisTabela.fatReal > 0 ? (totaisTabela.mc / totaisTabela.fatReal) * 100 : 0;



  const highlightedMarcaParam = searchParams.get('marca');

  const highlightedMarcas = highlightedMarcaParam ? highlightedMarcaParam.split(',') : [];



  const getBg = (key, isHeader = false) => {
    if (sortConfig.key === key) return isHeader ? 'hsl(var(--muted))' : 'hsl(var(--muted)/0.5)';
    return isHeader ? undefined : 'transparent';
  };



  const marcasScatter = scatterData.filter(d => d.z > 0);

  const activeScatterPoints = highlightedMarcas.length > 0 ? marcasScatter.filter(m => highlightedMarcas.includes(m.name)) : [];



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
          <h1 className="page-title">Marcas e Produtos</h1>
          <p className="page-subtitle">Análise executiva de performance, matriz de precificação e vazamento de margem.</p>
        </div>
        <LastUpdateBadge lastUpdate={data.lastUpdate} />
      </div>





      {/* ATO 1: GRÁFICOS LADO A LADO */}

      <div className="grid-tables" style={{ alignItems: 'start', gridTemplateColumns: '1fr 1fr' }}>

        

        <div className="card">

          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingDown size={20} /> Matriz de Precificação: Risco vs Retorno
            </div>
            <FilterBadges />
          </div>

          <p className="text-muted" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>Eixo X: % Desconto | Eixo Y: % Markup Real | Tamanho: Receita</p>

          <div style={{ width: '100%', height: '300px' }}>

            <ResponsiveContainer width="100%" height="100%">

              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>

                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

                <XAxis type="number" dataKey="x" name="Desconto" unit="%" stroke="hsl(var(--muted-foreground))" domain={['dataMin - 5', 'dataMax + 5']} tick={{fontSize: 10}} tickFormatter={(v) => Math.round(v)} label={{ value: '% Desconto', position: 'insideBottom', offset: -15, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />

                <YAxis type="number" dataKey="y" name="Markup Real" unit="%" stroke="hsl(var(--muted-foreground))" domain={['dataMin - 5', 'dataMax + 5']} tick={{fontSize: 10}} tickFormatter={(v) => Math.round(v)} label={{ value: 'Markup Real', angle: -90, position: 'insideLeft', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />

                <ZAxis type="number" dataKey="z" range={[30, 400]} name="Faturamento" />

                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />

                <ReferenceLine y={data.kpis.markupIdeal} stroke="hsl(152, 60%, 45%)" strokeDasharray="3 3" />

                <ReferenceLine x={data.kpis.percDesc} stroke="hsl(0, 84%, 60%)" strokeDasharray="3 3" />

                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" label={{ value: "R$ 0", position: 'left', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />

                

                {activeScatterPoints.map((pt, i) => (

                  <ReferenceDot 

                    key={`refdot-${i}`}

                    x={pt.x} 

                    y={pt.y} 

                    r={0} 

                    stroke="none"

                    label={{ position: 'top', value: pt.name, fill: 'hsl(var(--warning))', fontSize: 12, fontWeight: 'bold' }} 

                  />

                ))}



                <Scatter 

                  data={marcasScatter} 

                  fill="hsl(var(--primary))"

                  label={(props) => {

                    const { x, y, payload } = props;

                    if (highlightedMarcas.length > 0 && payload && highlightedMarcas.includes(payload.name)) {

                      return (

                        <text x={x} y={y - 12} fill="hsl(var(--warning))" fontSize={13} fontWeight="bold" textAnchor="middle" stroke="hsl(var(--background))" strokeWidth={3} paintOrder="stroke" style={{ pointerEvents: 'none' }}>

                          {payload.name}

                        </text>

                      );

                    }

                    return null;

                  }}

                >

                  {marcasScatter.map((entry, index) => {

                    const isSelected = highlightedMarcas.includes(entry.name);

                    const isFaded = highlightedMarcas.length > 0 && !isSelected;

                    return <Cell key={`cell-${index}`} fill={isSelected ? 'hsl(var(--warning))' : 'hsl(var(--primary))'} opacity={isFaded ? 0.2 : 0.8} />;

                  })}

                </Scatter>

              </ScatterChart>

            </ResponsiveContainer>

          </div>

        </div>



        <div className="card">

          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PackageSearch size={20} /> Top 10 Marcas por Faturamento
            </div>
            <FilterBadges />
          </div>

          <p className="text-muted" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>Maiores geradoras de receita no período selecionado</p>

          <div style={{ width: '100%', height: '300px' }}>

            <ResponsiveContainer width="100%" height="100%">

              <BarChart data={top10Marcas} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>

                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false}/>

                <XAxis type="number" hide />

                <YAxis type="category" dataKey="marca" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 10, fontWeight: 500}} width={80} interval={0}/>

                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.1)' }}/>

                <Bar dataKey="fatReal" radius={[0, 4, 4, 0]}>

                  {top10Marcas.map((entry, index) => {

                    const isSelected = highlightedMarcas.includes(entry.marca);

                    const isFaded = highlightedMarcas.length > 0 && !isSelected;

                    return <Cell key={`cell-${index}`} fill={isSelected ? 'hsl(var(--warning))' : `hsl(220, 70%, ${50 + index * 3}%)`} opacity={isFaded ? 0.2 : 1} />;

                  })}

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>



      {/* ATO 1.5: CARDS DE DESTAQUES (Valores Absolutos) */}

      <div className="grid-kpis" style={{marginBottom: '2rem'}}>

        {(() => {

          if (!data || !data.marcas || data.marcas.length === 0) return null;

          

          const marcasArray = data.marcas;
          
          const marcasForKPI = highlightedMarcas.length > 0 ? marcasArray.filter(m => highlightedMarcas.includes(m.marca)) : marcasArray;
          
          const maiorFaturamento = [...marcasForKPI].sort((a, b) => b.fatReal - a.fatReal)[0];
          const maiorVolume = [...marcasForKPI].sort((a, b) => b.qtde - a.qtde)[0];
          const maiorMargem = [...marcasForKPI].sort((a, b) => b.mc - a.mc)[0];
          const maiorPrejuizo = [...marcasForKPI].sort((a, b) => a.mc - b.mc)[0];



          if (!maiorFaturamento) return null;



          const destaques = [

            { id: 'faturamento', title: 'Maior Faturamento', icon: <Trophy size={18} />, marca: maiorFaturamento, highlightField: 'fatReal', color: 'hsl(var(--primary))', iconColor: 'hsl(var(--primary))' },

            { id: 'volume', title: 'Maior Volume', icon: <PackageSearch size={18} />, marca: maiorVolume, highlightField: 'qtde', color: 'hsl(220, 70%, 50%)', iconColor: 'hsl(220, 70%, 50%)' },

            { id: 'margem', title: 'Maior Lucro (MC)', icon: <Gem size={18} />, marca: maiorMargem, highlightField: 'mc', color: 'hsl(152, 60%, 45%)', iconColor: 'hsl(152, 60%, 45%)' },

            { id: 'prejuizo', title: 'Maior Prejuízo (MC)', icon: <AlertTriangle size={18} />, marca: maiorPrejuizo, highlightField: 'mcPrej', color: 'hsl(0, 84%, 60%)', iconColor: 'hsl(0, 84%, 60%)' }

          ];



          return destaques.map((d, i) => {

            const m = d.marca;

            if (!m) return null;

            return (

              <div key={d.id} className="card" style={{ borderColor: d.color }}>

                <div className="card-title" style={{color: d.iconColor, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem'}}>{d.icon} {d.title}</div>

                <div className="card-value" style={{fontSize: '1.1rem', marginBottom: '0.2rem'}}>{m.marca}</div>

                

                <div style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}}>

                  {d.highlightField === 'fatReal' ? formatCurrency(m.fatReal) : 

                   d.highlightField === 'qtde' ? `${(m.qtde || 0).toLocaleString('pt-BR')} unid.` : 

                   d.highlightField === 'mc' ? <span className="text-green">{formatCurrency(m.mc)}</span> : 

                   <span className="text-red">{formatCurrency(m.mc)}</span>}

                </div>



                <div className="card-trend text-muted" style={{display:'flex', gap:'8px', flexWrap: 'wrap', fontSize: '0.8rem'}}>

                  {d.highlightField !== 'fatReal' && <span>Fat: {formatCurrency(m.fatReal)}</span>}
                  {d.highlightField !== 'qtde' && <span>| Qtde: {m.qtde ? m.qtde.toLocaleString('pt-BR') : 0}</span>}
                </div>

              </div>

            );

          });

        })()}

      </div>



      {/* ATO 2: TABELA EXECUTIVA DE MARCAS */}

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
                      <Activity size={24} /> Performance Detalhada por Marca e Produto
                    </div>
                    <FilterBadges />
                  </div>
                </th>
              </tr>
              <tr>
                <th style={{cursor: 'pointer', backgroundColor: getBg('marca', true)}} onClick={() => handleSort('marca')}>MARCA / PRODUTO{renderSortIcon('marca')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('qtde', true)}} onClick={() => handleSort('qtde')}>QTDE.{renderSortIcon('qtde')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('fatPadrao', true)}} onClick={() => handleSort('fatPadrao')}>FAT. PADRÃO{renderSortIcon('fatPadrao')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('desconto', true)}} onClick={() => handleSort('desconto')}>DESCONTO{renderSortIcon('desconto')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('percDesc', true)}} onClick={() => handleSort('percDesc')}>% DESC.{renderSortIcon('percDesc')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('fatReal', true)}} onClick={() => handleSort('fatReal')}>FAT. REAL{renderSortIcon('fatReal')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('markupIdeal', true)}} onClick={() => handleSort('markupIdeal')}>MARKUP IDEAL{renderSortIcon('markupIdeal')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('markupReal', true)}} onClick={() => handleSort('markupReal')}>MARKUP REAL{renderSortIcon('markupReal')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('cmv', true)}} onClick={() => handleSort('cmv')}>CMV{renderSortIcon('cmv')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('verba', true), color: 'hsl(190, 90%, 40%)'}} onClick={() => handleSort('verba')}>VERBA{renderSortIcon('verba')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('impostos', true)}} onClick={() => handleSort('impostos')}>IMPOSTOS{renderSortIcon('impostos')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('mc', true)}} onClick={() => handleSort('mc')}>MARGEM R${renderSortIcon('mc')}</th>
                <th style={{textAlign: 'center', cursor: 'pointer', backgroundColor: getBg('margemContribuicaoPerc', true)}} onClick={() => handleSort('margemContribuicaoPerc')}>MARGEM %{renderSortIcon('margemContribuicaoPerc')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedMarcas.map((m) => {
                const isFaded = highlightedMarcas.length > 0 && !highlightedMarcas.includes(m.marca);
                const isExpanded = expandedMarcas[m.marca];

                return (
                <React.Fragment key={m.marca}>
                  <tr style={{ opacity: isFaded ? 0.25 : 1, transition: 'opacity 0.2s', backgroundColor: isExpanded ? 'hsl(var(--muted)/0.3)' : 'transparent' }}>
                    <td style={{fontWeight: 600, backgroundColor: getBg('marca'), display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none'}} onClick={() => toggleMarca(m.marca)}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      {m.marca}
                    </td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('qtde')}}>{m.qtde ? m.qtde.toLocaleString('pt-BR') : 0}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('fatPadrao')}}>{formatCurrency(m.fatPadrao)}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('desconto')}} className="text-red">{formatCurrency(m.desconto)}</td>
                    <td style={{textAlign: 'center', backgroundColor: getBg('percDesc')}} className="text-red">{formatPercent(m.percDesc)}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('fatReal')}}>{formatCurrency(m.fatReal)}</td>
                    <td style={{textAlign: 'center', backgroundColor: getBg('markupIdeal')}}>{formatPercent(m.markupIdeal)}</td>
                    <td style={{textAlign: 'center', fontWeight: 'bold', backgroundColor: getBg('markupReal')}} className={m.markupReal >= m.markupIdeal ? 'text-green' : 'text-red'}>{formatPercent(m.markupReal)}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('cmv')}}>{formatCurrency(m.cmv)}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('verba'), color: 'hsl(190, 90%, 40%)', fontWeight: 'bold'}}>{formatCurrency(m.verba)}</td>
                    <td style={{textAlign: 'right', backgroundColor: getBg('impostos')}} className="text-red">{formatCurrency(m.impostos)}</td>
                    <td style={{textAlign: 'right', fontWeight: 'bold', backgroundColor: getBg('mc')}} className={m.mc > 0 ? 'text-green' : 'text-red'}>{formatCurrency(m.mc)}</td>
                    <td style={{textAlign: 'center', fontWeight: 'bold', backgroundColor: getBg('margemContribuicaoPerc')}} className={m.margemContribuicaoPerc > 0 ? 'text-green' : 'text-red'}>{formatPercent(m.margemContribuicaoPerc)}</td>
                  </tr>

                  {isExpanded && m.produtos && [...m.produtos].map(p => ({

                    ...p,

                    markupIdeal: p.cmv > 0 ? ((p.fatPadrao - p.cmv) / p.cmv) * 100 : 0,

                    markupReal: p.cmv > 0 ? ((p.fatReal - p.cmv) / p.cmv) * 100 : 0,

                    percDesc: p.fatPadrao > 0 ? (p.desconto / p.fatPadrao) * 100 : 0,

                    margemContribuicaoPerc: p.fatReal > 0 ? (p.mc / p.fatReal) * 100 : 0

                  })).sort((a, b) => {

                    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;

                    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;

                    return 0;

                  }).map(p => (

                    <tr key={`${m.marca}-${p.produto}`} style={{ opacity: isFaded ? 0.25 : 1, backgroundColor: 'hsl(var(--background))', fontSize: '0.75rem' }}>

                      <td title={p.produto} style={{ paddingLeft: '2.5rem', backgroundColor: getBg('marca'), color: 'hsl(var(--muted-foreground))', maxWidth: '300px' }}>
                        <div style={{ whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.produto}
                        </div>
                      </td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('qtde'), color: 'hsl(var(--muted-foreground))'}}>{p.qtde ? p.qtde.toLocaleString('pt-BR') : 0}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('fatPadrao'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.fatPadrao)}</td>

                      <td style={{textAlign: 'right', backgroundColor: getBg('desconto'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.desconto)}</td>

                      <td style={{textAlign: 'center', backgroundColor: getBg('percDesc'), color: 'hsl(var(--muted-foreground))'}}>{formatPercent(p.percDesc)}</td>

                      <td style={{textAlign: 'right', backgroundColor: getBg('fatReal')}}>{formatCurrency(p.fatReal)}</td>
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
                <td style={{backgroundColor: getBg('marca')}}>TOTAIS ({sortedMarcas.length})</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('qtde')}}>{totaisTabela.qtde ? totaisTabela.qtde.toLocaleString('pt-BR') : 0}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('fatPadrao')}}>{formatCurrency(totaisTabela.fatPadrao)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('desconto')}} className="text-red">{formatCurrency(totaisTabela.desconto)}</td>
                <td style={{textAlign: 'center', backgroundColor: getBg('percDesc')}} className="text-red">{formatPercent(totaisTabela.percDesc)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('fatReal')}}>{formatCurrency(totaisTabela.fatReal)}</td>
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



      {/* ATO 3: DEEP-DIVE DE PRODUTOS */}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

        

        <div className="card" style={{ borderColor: 'hsl(152, 60%, 45%)' }}>

          <div className="card-title text-green" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>

            <TrendingUp size={24} /> Top 10 Produtos (Maior Margem de Contribuição)

          </div>

          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th>Produto</th>

                  <th style={{textAlign: 'right'}}>Fat. Real</th>

                  <th style={{textAlign: 'right'}}>Impostos</th>

                  <th style={{textAlign: 'right'}}>Margem Contrib.</th>

                  <th style={{textAlign: 'center'}}>Markup Real</th>

                </tr>

              </thead>

              <tbody>

                {data.tables.topProdutos.map((p) => (

                  <tr key={p.produto}>

                    <td title={p.produto} style={{maxWidth: '250px'}}>

                      <div style={{ whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>

                        {p.produto}

                      </div>

                    </td>

                    <td style={{textAlign: 'right'}}>{formatCurrency(p.receita)}</td>

                    <td style={{textAlign: 'right'}} className="text-red">{formatCurrency(p.impostos)}</td>

                    <td style={{textAlign: 'right'}} className="text-green">{formatCurrency(p.mc)}</td>

                    <td style={{textAlign: 'center'}}>{formatPercent(p.markupReal)}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>



        <div className="card" style={{ borderColor: 'hsl(var(--destructive)/0.5)' }}>

          <div className="card-title text-red" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>

            <AlertOctagon size={24} /> Top 10 Produtos (Maior Prejuízo na MC)

          </div>

          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th>Produto</th>

                  <th style={{textAlign: 'right'}}>Fat. Real</th>

                  <th style={{textAlign: 'right'}}>Impostos</th>

                  <th style={{textAlign: 'right'}}>Prejuízo (MC)</th>

                  <th style={{textAlign: 'center'}}>Markup Real</th>

                </tr>

              </thead>

              <tbody>

                {data.tables.pioresProdutos.length === 0 ? (

                  <tr><td colSpan="5" style={{textAlign: 'center', color: 'hsl(var(--success))'}}>Nenhum produto gerando prejuízo!</td></tr>

                ) : data.tables.pioresProdutos.map((p) => (

                  <tr key={p.produto}>

                    <td title={p.produto} style={{maxWidth: '250px', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{p.produto}</td>

                    <td style={{textAlign: 'right'}}>{formatCurrency(p.receita)}</td>

                    <td style={{textAlign: 'right'}} className="text-red">{formatCurrency(p.impostos)}</td>

                    <td style={{textAlign: 'right'}} className="text-red">{formatCurrency(p.mc)}</td>

                    <td style={{textAlign: 'center'}} className="text-red">{formatPercent(p.markupReal)}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>



      </div>



    </div>

  );

}
