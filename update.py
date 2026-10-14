import json

with open('src/app/vendedores/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_imports = '''import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, Receipt, ArrowDown, ArrowUp, ArrowUpDown, Target, ChevronDown, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis, ReferenceLine, ReferenceDot, BarChart, Bar, Cell, LabelList } from 'recharts';
'''

content = content.replace(\"import React, { useEffect, useState } from 'react';\\nimport { useSearchParams } from 'next/navigation';\\nimport { Users, Receipt, ArrowDown, ArrowUp, ArrowUpDown, Target, ChevronDown, ChevronRight } from 'lucide-react';\", new_imports)

charts_code = '''
  const scatterData = data.tables.vendedores.map(v => ({
    name: v.nome,
    x: v.percDesc,
    y: v.margemContribuicaoPerc,
    z: v.receita,
    markupReal: v.markupReal,
    markupIdeal: v.markupIdeal
  }));

  const top10Vendedores = [...data.tables.vendedores].sort((a,b) => b.receita - a.receita).slice(0, 10);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{point.name}</p>
          <p>Fat. Real: {formatCurrency(point.z || point.receita)}</p>
          <p>Desconto: {formatPercent(point.x || point.percDesc)}</p>
          <p>Margem Contrib.: {formatPercent(point.y || point.margemContribuicaoPerc)}</p>
          <p>Markup Real: {formatPercent(point.markupReal)}</p>
        </div>
      );
    }
    return null;
  };
  
  const highlightedVendedorParam = searchParams.get('vendedor');
  const highlightedVendedores = highlightedVendedorParam ? highlightedVendedorParam.split(',') : [];
  const activeScatterPoints = highlightedVendedores.length > 0 ? scatterData.filter(m => highlightedVendedores.includes(m.name) && m.z > 0) : [];
'''

content = content.replace(\"  const getBg = (k) => sortConfig.key === k ? 'hsl(var(--muted))' : undefined;\", \"  const getBg = (k) => sortConfig.key === k ? 'hsl(var(--muted))' : undefined;\\n\" + charts_code)

ato1_code = '''
      <div className="grid-tables" style={{ alignItems: 'start', gridTemplateColumns: '1fr 1fr', marginBottom: '2rem' }}>
        
        <div className="card">
          <div className="card-title">
            <TrendingDown size={20} /> Matriz de Vendedores: Risco vs Retorno
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
                    key={efdot-\}
                    x={pt.x} 
                    y={pt.y} 
                    r={5} 
                    fill="transparent" 
                    stroke="none"
                  />
                ))}
                
                <Scatter data={scatterData.filter(d => d.z > 0)} fill="hsl(152, 60%, 45%)" opacity={0.7} isAnimationActive={false}>
                  {scatterData.filter(d => d.z > 0).map((entry, index) => {
                    const isHighlighted = highlightedVendedores.length > 0 && highlightedVendedores.includes(entry.name);
                    const isFaded = highlightedVendedores.length > 0 && !isHighlighted;
                    let fill = entry.y >= 0 ? 'hsl(152, 60%, 45%)' : 'hsl(0, 84%, 60%)';
                    return <Cell key={cell-\} fill={fill} opacity={isFaded ? 0.1 : 0.8} />;
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
          <div className="card-title">
            <TrendingUp size={20} /> Top 10 Vendedores por Faturamento
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
                    const isHighlighted = highlightedVendedores.length > 0 && highlightedVendedores.includes(entry.nome);
                    const isFaded = highlightedVendedores.length > 0 && !isHighlighted;
                    let fill = entry.margemContribuicaoPerc >= 0 ? 'hsl(152, 60%, 45%)' : 'hsl(0, 84%, 60%)';
                    return <Cell key={cell-\} fill={fill} opacity={isFaded ? 0.3 : 1} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
'''

content = content.replace('<div className="grid-kpis" style={{marginBottom: \\'2rem\\'}}>', ato1_code + '\\n      <div className="grid-kpis" style={{marginBottom: \\'2rem\\'}}>')

with open('src/app/vendedores/page.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
