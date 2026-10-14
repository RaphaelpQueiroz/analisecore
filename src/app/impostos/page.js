

'use client';



import React, { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { Landmark, AlertTriangle, TrendingDown, PackageSearch, ChevronDown, ChevronRight, Calculator, Percent } from 'lucide-react';

import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ZAxis, ReferenceLine } from 'recharts';
import LastUpdateBadge from '../components/LastUpdateBadge';
import FilterBadges from '../components/FilterBadges';



const formatCurrency = (value) => {

  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

};

const formatPercent = (value) => {

  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);

};



export default function Impostos() {

  const searchParams = useSearchParams();

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState({ key: 'impostos', direction: 'desc' });

  const [expandedMarcas, setExpandedMarcas] = useState({});

  const marcaParam = searchParams.get('marca');
  const highlightedMarcas = marcaParam ? marcaParam.split(',') : [];



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
      <p style={{ marginTop: '1rem', color: 'hsl(var(--muted-foreground))' }}>Calculando Carga Tributária...</p>
    </div>
  );



  const handleSort = (key) => {

    let direction = 'desc';

    if (sortConfig.key === key && sortConfig.direction === 'desc') {

      direction = 'asc';

    }

    setSortConfig({ key, direction });

  };



  const toggleMarca = (marca) => {

    setExpandedMarcas(prev => ({ ...prev, [marca]: !prev[marca] }));

  };



  const getBg = (key, isHeader = false) => {
    if (sortConfig.key === key) return isHeader ? 'hsl(var(--muted))' : 'hsl(var(--muted)/0.5)';
    return isHeader ? undefined : 'transparent';
  };

  

  const renderSortIcon = (key) => {

    if (sortConfig.key !== key) return null;

    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';

  };



  const marcasArray = data.marcas.map(m => {
    const fatTotal = m.fatReal + (m.verba || 0);
    return {
      ...m,
      cargaTributariaPerc: fatTotal > 0 ? (m.impostos / fatTotal) * 100 : 0,
      receitaLiquida: fatTotal - m.impostos
    };
  });



  const sortedMarcas = [...marcasArray].sort((a, b) => {

    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;

    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;

    return 0;

  });



  const pieData = [

    { name: 'ICMS', value: data.impostos.icms },

    { name: 'ICMS-ST', value: data.impostos.st },

    { name: 'PIS', value: data.impostos.pis },

    { name: 'COFINS', value: data.impostos.cofins },

    { name: 'DIFAL', value: data.impostos.difal },

    { name: 'FCP', value: data.impostos.fcp },

  ].filter(i => i.value > 0).sort((a, b) => b.value - a.value);



  const PIE_COLORS = ['hsl(210, 100%, 50%)', 'hsl(190, 80%, 45%)', 'hsl(280, 60%, 50%)', 'hsl(260, 50%, 40%)', 'hsl(35, 100%, 50%)', 'hsl(0, 84%, 60%)'];





  // KPIs

  const totalImpostos = data.impostos.total;

  const cargaGlobal = data.kpis.cargaTributaria;

  const marcasForKPI = highlightedMarcas.length > 0 ? marcasArray.filter(m => highlightedMarcas.includes(m.marca)) : marcasArray;

  const maiorPagadora = [...marcasForKPI].sort((a,b) => b.impostos - a.impostos)[0];
  
  const sortedByFat = [...marcasForKPI].sort((a, b) => b.fatReal - a.fatReal);
  const topHalf = sortedByFat.slice(0, Math.max(5, Math.ceil(sortedByFat.length / 2)));
  const maiorDensidade = [...topHalf].sort((a, b) => b.cargaTributariaPerc - a.cargaTributariaPerc)[0];



  // Scatter

  const scatterData = marcasArray.filter(m => m.fatReal > 0).map(m => ({

    name: m.marca,

    x: m.cargaTributariaPerc, // Eixo X: Carga Tributária

    y: m.margemContribuicaoPerc, // Eixo Y: Margem

    z: m.impostos // Tamanho: Impostos pagos

  }));



const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '4px', zIndex: 1000 }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{data.name}</p>
        <p style={{ margin: '0 0 3px 0' }}>Carga Tributária: {new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(data.x / 100)}</p>
        <p style={{ margin: '0 0 3px 0' }}>Margem Contrib.: {new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(data.y / 100)}</p>
        <p style={{ margin: 0 }}>Impostos Pagos: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.z)}</p>
      </div>
    );
  }
  return null;
};



  // TOTAIS DA TABELA
  const totaisTabela = {
    qtde: sortedMarcas.reduce((acc, curr) => acc + (curr.qtde || 0), 0),
    fatReal: sortedMarcas.reduce((acc, curr) => acc + curr.fatReal, 0),
    verba: sortedMarcas.reduce((acc, curr) => acc + (curr.verba || 0), 0),
    icms: sortedMarcas.reduce((acc, curr) => acc + curr.icms, 0),

    st: sortedMarcas.reduce((acc, curr) => acc + curr.st, 0),

    pis: sortedMarcas.reduce((acc, curr) => acc + curr.pis, 0),

    cofins: sortedMarcas.reduce((acc, curr) => acc + curr.cofins, 0),

    difal: sortedMarcas.reduce((acc, curr) => acc + curr.difal, 0),

    fcp: sortedMarcas.reduce((acc, curr) => acc + curr.fcp, 0),

    impostos: sortedMarcas.reduce((acc, curr) => acc + curr.impostos, 0),

  };

  const fatTotalTabela = totaisTabela.fatReal + totaisTabela.verba;
  const totaisCarga = fatTotalTabela > 0 ? (totaisTabela.impostos / fatTotalTabela) * 100 : 0;



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
          <h1 className="page-title">Carga Tributária</h1>
          <p className="page-subtitle">Análise detalhada de impostos, impacto na margem de contribuição e rastreabilidade por produto.</p>
        </div>
        <LastUpdateBadge lastUpdate={data.lastUpdate} />
      </div>



      {/* ATO 0: CARDS DE DESTAQUES */}

      <div className="grid-kpis" style={{marginBottom: '2rem'}}>

        <div className="card" style={{ borderColor: 'hsl(0, 84%, 60%)' }}>

          <div className="card-title" style={{color: 'hsl(0, 84%, 60%)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem'}}><Landmark size={18}/> Carga Tributária Global</div>

          <div className="card-value" style={{fontSize: '1.8rem', marginBottom: '0.2rem'}}>{formatPercent(cargaGlobal)}</div>

          <div className="card-trend text-muted" style={{fontSize: '0.85rem'}}>Alíquota efetiva sobre a receita líquida</div>

        </div>



        <div className="card" style={{ borderColor: 'hsl(var(--primary))' }}>

          <div className="card-title" style={{color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem'}}><Calculator size={18}/> Total Arrecadado</div>

          <div className="card-value" style={{fontSize: '1.8rem', marginBottom: '0.2rem'}}>{formatCurrency(totalImpostos)}</div>

          <div className="card-trend text-muted" style={{fontSize: '0.85rem'}}>Volume absoluto de impostos da empresa</div>

        </div>



        {maiorPagadora && (

          <div className="card" style={{ borderColor: 'hsl(var(--border))' }}>

            <div className="card-title" style={{color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem'}}><PackageSearch size={18}/> Maior Pagadora (Marca)</div>

            <div className="card-value" style={{fontSize: '1.2rem', marginBottom: '0.2rem'}}>{maiorPagadora.marca}</div>

            <div style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}} className="text-red">{formatCurrency(maiorPagadora.impostos)}</div>

            <div className="card-trend text-muted" style={{fontSize: '0.85rem'}}>Carga: {formatPercent(maiorPagadora.cargaTributariaPerc)}</div>

          </div>

        )}



        {maiorDensidade && (

          <div className="card" style={{ borderColor: 'hsl(var(--warning))' }}>

            <div className="card-title" style={{color: 'hsl(var(--warning))', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem'}}><Percent size={18}/> Densidade Fiscal (Alerta)</div>

            <div className="card-value" style={{fontSize: '1.2rem', marginBottom: '0.2rem'}}>{maiorDensidade.marca}</div>

            <div style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}} className="text-warning">{formatPercent(maiorDensidade.cargaTributariaPerc)}</div>

            <div className="card-trend text-muted" style={{fontSize: '0.85rem'}}>Imp: {formatCurrency(maiorDensidade.impostos)}</div>

          </div>

        )}

      </div>



      {/* ATO 1: GRÁFICOS */}

      <div className="grid-tables" style={{ alignItems: 'start', gridTemplateColumns: '1fr 1fr' }}>

        <div className="card">

          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingDown size={20} /> Matriz de Risco Fiscal
            </div>
            <FilterBadges />
          </div>

          <p className="text-muted" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>Eixo X: Carga Tributária % | Eixo Y: Margem % | Tamanho: Impostos Pagos</p>

          <div className="chart-container" style={{ height: '300px' }}>

            <ResponsiveContainer width="100%" height="100%">

              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>

                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

                <XAxis type="number" dataKey="x" name="Carga Tributária" tickFormatter={(v) => formatPercent(v)} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />

                <YAxis type="number" dataKey="y" name="Margem" tickFormatter={(v) => formatPercent(v)} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />

                <ZAxis type="number" dataKey="z" range={[20, 400]} name="Impostos" />

                <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                <ReferenceLine y={data.kpis.margemContribuicaoPerc} stroke="hsl(152, 60%, 45%)" strokeDasharray="3 3" />

                <ReferenceLine x={cargaGlobal} stroke="hsl(0, 84%, 60%)" strokeDasharray="3 3" />

                <Scatter data={scatterData} fill="hsl(var(--primary))" opacity={0.7}>

                  {scatterData.map((entry, index) => {

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
              <Landmark size={20}/> Divisão do Bolo Tributário
            </div>
            <FilterBadges />
          </div>

          <p className="text-muted" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>Representatividade de cada tributo no total arrecadado</p>

          <div className="chart-container" style={{ height: '300px' }}>

            <ResponsiveContainer width="100%" height="100%">

              <PieChart>

                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>

                  {pieData.map((e, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}

                </Pie>

                <RechartsTooltip formatter={(v) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px' }} />

                <Legend verticalAlign="bottom" height={36}/>

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>



      {/* ATO 2: TABELA EXECUTIVA */}

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
                      <Landmark size={24} /> Carga Tributária por Marca e Produto (Padrão ERP)
                    </div>
                    <FilterBadges />
                  </div>
                </th>
              </tr>
              <tr>
                <th style={{cursor: 'pointer', backgroundColor: getBg('marca', true)}} onClick={() => handleSort('marca')}>MARCA / PRODUTO{renderSortIcon('marca')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('qtde', true)}} onClick={() => handleSort('qtde')}>QTDE.{renderSortIcon('qtde')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('fatReal', true)}} onClick={() => handleSort('fatReal')}>FATURAMENTO{renderSortIcon('fatReal')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('verba', true), color: 'hsl(190, 90%, 40%)'}} onClick={() => handleSort('verba')}>VERBA{renderSortIcon('verba')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('icms', true)}} onClick={() => handleSort('icms')}>ICMS{renderSortIcon('icms')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('st', true)}} onClick={() => handleSort('st')}>ICMS-ST{renderSortIcon('st')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('pis', true)}} onClick={() => handleSort('pis')}>PIS{renderSortIcon('pis')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('cofins', true)}} onClick={() => handleSort('cofins')}>COFINS{renderSortIcon('cofins')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('difal', true)}} onClick={() => handleSort('difal')}>DIFAL{renderSortIcon('difal')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('fcp', true)}} onClick={() => handleSort('fcp')}>FCP{renderSortIcon('fcp')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('impostos', true)}} onClick={() => handleSort('impostos')}>TOTAL IMPOSTOS{renderSortIcon('impostos')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('receitaLiquida', true)}} onClick={() => handleSort('receitaLiquida')}>RECEITA LÍQUIDA{renderSortIcon('receitaLiquida')}</th>
                <th style={{textAlign: 'right', cursor: 'pointer', backgroundColor: getBg('cargaTributariaPerc', true)}} onClick={() => handleSort('cargaTributariaPerc')}>CARGA %{renderSortIcon('cargaTributariaPerc')}</th>
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
                        <div style={{ flexShrink: 0 }}>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                        <span title={m.marca} style={{ maxWidth: '250px', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {m.marca}
                        </span>
                      </td>
                        <td style={{textAlign: 'right', backgroundColor: getBg('qtde')}}>{m.qtde ? m.qtde.toLocaleString('pt-BR') : 0}</td>
                        <td style={{textAlign: 'right', backgroundColor: getBg('fatReal')}}>{formatCurrency(m.fatReal)}</td>
                        <td style={{textAlign: 'right', backgroundColor: getBg('verba'), color: 'hsl(190, 90%, 40%)', fontWeight: 'bold'}}>{formatCurrency(m.verba)}</td>
                        <td style={{textAlign: 'right', backgroundColor: getBg('icms')}}>{formatCurrency(m.icms)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('st')}}>{formatCurrency(m.st)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('pis')}}>{formatCurrency(m.pis)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('cofins')}}>{formatCurrency(m.cofins)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('difal')}}>{formatCurrency(m.difal)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('fcp')}}>{formatCurrency(m.fcp)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('impostos')}} className="text-red">{formatCurrency(m.impostos)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('receitaLiquida')}} className="text-green">{formatCurrency(m.receitaLiquida)}</td>
                      <td style={{textAlign: 'right', backgroundColor: getBg('cargaTributariaPerc')}} className={m.cargaTributariaPerc > cargaGlobal ? "text-warning" : "text-muted"}>
                        {formatPercent(m.cargaTributariaPerc)}
                      </td>
                    </tr>
                    
                    {isExpanded && m.produtos && [...m.produtos].map(p => ({
                      ...p,
                      receitaLiquida: p.fatReal - p.impostos,
                      cargaTributariaPerc: p.fatReal > 0 ? (p.impostos / p.fatReal) * 100 : 0
                    })).sort((a, b) => {
                      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                      return 0;
                    }).map(p => {
                      return (
                        <tr key={`${m.marca}-${p.produto}`} style={{ opacity: isFaded ? 0.25 : 1, backgroundColor: 'hsl(var(--background))', fontSize: '0.75rem' }}>
                          <td title={p.produto} style={{ paddingLeft: '2.5rem', backgroundColor: getBg('marca'), color: 'hsl(var(--muted-foreground))', maxWidth: '300px' }}>
                            <div style={{ whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {p.produto}
                            </div>
                          </td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('qtde'), color: 'hsl(var(--muted-foreground))'}}>{p.qtde ? p.qtde.toLocaleString('pt-BR') : 0}</td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('fatReal'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.fatReal)}</td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('verba'), color: 'hsl(190, 90%, 40%)'}}>{formatCurrency(p.verba)}</td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('icms'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.icms)}</td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('st'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.st)}</td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('pis'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.pis)}</td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('cofins'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.cofins)}</td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('difal'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.difal)}</td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('fcp'), color: 'hsl(var(--muted-foreground))'}}>{formatCurrency(p.fcp)}</td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('impostos'), color: 'hsl(var(--muted-foreground))'}} className="text-red">{formatCurrency(p.impostos)}</td>
                          <td style={{textAlign: 'right', backgroundColor: getBg('receitaLiquida'), color: 'hsl(var(--muted-foreground))'}} className="text-green">{formatCurrency(p.receitaLiquida)}</td>

                          <td style={{textAlign: 'right', backgroundColor: getBg('cargaTributariaPerc'), color: 'hsl(var(--muted-foreground))'}} className={p.cargaTributariaPerc > cargaGlobal ? "text-warning" : ""}>

                            {formatPercent(p.cargaTributariaPerc)}

                          </td>

                        </tr>

                      );

                    })}

                  </React.Fragment>

                );

              })}

            </tbody>

            <tfoot>
              <tr style={{fontWeight: 'bold'}}>
                <td style={{backgroundColor: getBg('marca')}}>TOTAIS ({sortedMarcas.length})</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('qtde')}}>{totaisTabela.qtde ? totaisTabela.qtde.toLocaleString('pt-BR') : 0}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('fatReal')}}>{formatCurrency(totaisTabela.fatReal)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('verba'), color: 'hsl(190, 90%, 40%)'}}>{formatCurrency(totaisTabela.verba)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('icms')}}>{formatCurrency(totaisTabela.icms)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('st')}}>{formatCurrency(totaisTabela.st)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('pis')}}>{formatCurrency(totaisTabela.pis)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('cofins')}}>{formatCurrency(totaisTabela.cofins)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('difal')}}>{formatCurrency(totaisTabela.difal)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('fcp')}}>{formatCurrency(totaisTabela.fcp)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('impostos')}} className="text-red">{formatCurrency(totaisTabela.impostos)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('receitaLiquida')}} className="text-green">{formatCurrency(totaisTabela.fatReal + totaisTabela.verba - totaisTabela.impostos)}</td>
                <td style={{textAlign: 'right', backgroundColor: getBg('cargaTributariaPerc')}}>{formatPercent(totaisCarga)}</td>
              </tr>
            </tfoot>

          </table>

        </div>

      </div>

    </div>

  );

}
