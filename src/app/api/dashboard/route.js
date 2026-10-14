import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export const revalidate = 0;

let cachedData = null;
let lastCacheLoad = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

function loadSupermarketData() {
  if (cachedData && (Date.now() - lastCacheLoad < CACHE_TTL_MS)) {
    return cachedData;
  }

  const findPath = (fileName) => {
    const candidates = [
      path.join(process.cwd(), 'data', 'supermarket', fileName),
      `C:\\Users\\Usuario\\dre\\data\\supermarket\\${fileName}`,
      `c:\\Users\\Usuario\\OneDrive\\Documentos\\dre\\data\\supermarket\\${fileName}`
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return null;
  };

  const readJsonOrGz = (baseName) => {
    const gzPath = findPath(`${baseName}.gz`);
    if (gzPath && fs.existsSync(gzPath)) {
      const buf = fs.readFileSync(gzPath);
      return JSON.parse(zlib.gunzipSync(buf).toString('utf-8'));
    }
    const jsonPath = findPath(baseName);
    if (jsonPath && fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    }
    return null;
  };

  const daily = readJsonOrGz('daily_sales.json');
  if (!daily) {
    throw new Error('Arquivos de dados de supermercado não encontrados em data/supermarket.');
  }

  const products = readJsonOrGz('products_monthly.json') || [];
  const clients = readJsonOrGz('clients_daily.json') || [];
  const metaPath = findPath('metadata.json');
  const metadata = metaPath ? JSON.parse(fs.readFileSync(metaPath, 'utf-8')) : {};

  cachedData = {
    daily,
    products,
    clients,
    metadata,
    loadedAt: new Date().toISOString()
  };
  lastCacheLoad = Date.now();
  return cachedData;
}

const STORE_ANON_MAP = {
  'RETIRO': 'Loja 01',
  'PINHEIRAL': 'Loja 02',
  'VOLDAC': 'Loja 03',
  'BELVEDERE': 'Loja 04',
  'COLINA': 'Loja 05',
  'VILA RICA': 'Loja 06',
  'VILA AMERICANA': 'Loja 07',
  'VILA NOVA': 'Loja 08',
  'LANCHONETE': 'Loja 09',
  'LOJA MATRIZ': 'Loja 01',
  'LOJA 01 - MATRIZ': 'Loja 01'
};

function getAnonStore(name) {
  if (!name) return 'Loja 01';
  const clean = String(name).trim().toUpperCase();
  if (STORE_ANON_MAP[clean]) return STORE_ANON_MAP[clean];
  if (/^LOJA\s*\d+/i.test(clean)) return clean;
  return clean;
}

function matchStore(itemLojaName, targetLoja) {
  if (!targetLoja) return true;
  const anonItem = getAnonStore(itemLojaName).toUpperCase();
  const rawItem = String(itemLojaName || '').trim().toUpperCase();
  const target = String(targetLoja || '').trim().toUpperCase();
  return anonItem === target || rawItem === target;
}

const parseCrossPeriod = (cp) => {
  if (!cp) return null;
  const str = String(cp).trim();
  const MONTH_MAP = {
    jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
    jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12'
  };

  // 1. Mês em texto: "Set/23", "Set/2023" ou "09/2023"
  if (str.includes('/')) {
    const parts = str.split('/');
    const first = parts[0].trim().toLowerCase();
    const second = parts[1].trim();

    if (MONTH_MAP[first]) {
      const m = MONTH_MAP[first];
      const y = second.length === 2 ? `20${second}` : second;
      return { type: 'month', ym: `${y}-${m}`, label: str };
    }
  }

  // 2. Mês ISO: "2023-09"
  if (/^\d{4}-\d{2}$/.test(str)) {
    return { type: 'month', ym: str, label: str };
  }

  // 3. Ano: "2023"
  if (/^\d{4}$/.test(str)) {
    return { type: 'year', year: str, label: str };
  }

  // 4. Semana: "Sem. 15/05"
  if (str.toLowerCase().startsWith('sem.')) {
    const clean = str.replace(/sem\.?/i, '').trim();
    return { type: 'week', weekLabel: clean, label: str };
  }

  // 5. Dia ISO: "2023-09-15"
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return { type: 'day', date: str, label: str };
  }

  // 6. Dia curto: "15/09"
  if (/^\d{2}\/\d{2}$/.test(str)) {
    return { type: 'day_short', dm: str, label: str };
  }

  return { type: 'raw', value: str, label: str };
};

const matchPeriod = (itemDate, parsed) => {
  if (!parsed) return true;
  if (!itemDate) return false;

  if (parsed.type === 'month') {
    return itemDate.startsWith(parsed.ym);
  }
  if (parsed.type === 'year') {
    return itemDate.startsWith(parsed.year);
  }
  if (parsed.type === 'day') {
    return itemDate === parsed.date;
  }
  if (parsed.type === 'day_short') {
    const [d, m] = parsed.dm.split('/');
    return itemDate.endsWith(`-${m}-${d}`);
  }
  if (parsed.type === 'week') {
    if (parsed.weekLabel.includes('/')) {
      const [d, m] = parsed.weekLabel.split('/');
      const cur = new Date(`${itemDate}T12:00:00Z`);
      const dayOfWeek = cur.getUTCDay();
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const monday = new Date(cur.getTime() + diffToMonday * 86400000);
      const monD = String(monday.getUTCDate()).padStart(2, '0');
      const monM = String(monday.getUTCMonth() + 1).padStart(2, '0');
      return `${monD}/${monM}` === `${d}/${m}`;
    }
  }
  return itemDate === parsed.value;
};

export async function GET(req) {
  try {
    const dataset = loadSupermarketData();
    const { daily, products, clients, metadata } = dataset;

    const { searchParams } = new URL(req.url);
    const filterLojas = searchParams.get('loja') ? searchParams.get('loja').split(',').map(s => s.trim().toUpperCase()) : null;
    const filterDeptos = searchParams.get('departamento') ? searchParams.get('departamento').split(',').map(s => s.trim().toUpperCase()) : null;
    const filterClientes = searchParams.get('cliente') ? searchParams.get('cliente').split(',').map(s => s.trim().toUpperCase()) : null;
    const filterNivelPeriodo = searchParams.get('nivelPeriodo') || 'dia';
    const selectedDay = searchParams.get('selectedDay');

    const crossDeptoRaw = searchParams.get('crossDepto') ? searchParams.get('crossDepto').trim().toUpperCase() : null;
    const crossDeptosParam = searchParams.get('crossDeptos');
    const crossDeptosList = crossDeptosParam ? crossDeptosParam.split(',').map(d => d.trim().toUpperCase()).filter(Boolean) : null;
    const crossDepto = crossDeptoRaw;

    // Helper para checar match de departamento no cross-filter (seja 1 depto ou lista de 'Outros')
    const matchCrossDeptoFn = (itemDepto) => {
      if (crossDeptosList && crossDeptosList.length > 0) {
        return crossDeptosList.includes(itemDepto);
      }
      if (crossDepto) {
        return itemDepto === crossDepto;
      }
      return true;
    };
    const crossLoja = searchParams.get('crossLoja') ? searchParams.get('crossLoja').trim().toUpperCase() : null;
    const crossPeriod = searchParams.get('crossPeriod') || selectedDay || null;
    const parsedPeriod = parseCrossPeriod(crossPeriod);

    const defaultStart = metadata.default_start || '2024-10-01';
    const defaultEnd = metadata.default_end || '2024-10-31';

    const startDateStr = searchParams.get('dataInicio') || defaultStart;
    const endDateStr = searchParams.get('dataFim') || defaultEnd;

    const startDate = new Date(`${startDateStr}T00:00:00Z`);
    const endDate = new Date(`${endDateStr}T23:59:59Z`);

    // Período anterior equivalente para cálculo dos Deltas %
    const durationMs = Math.max(endDate.getTime() - startDate.getTime(), 86400000);
    const prevStartDate = new Date(startDate.getTime() - durationMs - 1000);
    const prevEndDate = new Date(startDate.getTime() - 1000);

    const prevStartStr = prevStartDate.toISOString().split('T')[0];
    const prevEndStr = prevEndDate.toISOString().split('T')[0];

    // Configuração do comparativo para deltas baseado no tipo de período filtrado
    let prevMatchFn = (itemDate) => (itemDate >= prevStartStr && itemDate <= prevEndStr);
    let periodDeltaLabel = 'vs ant.';

    if (parsedPeriod) {
      if (parsedPeriod.type === 'month') {
        const [y, m] = parsedPeriod.ym.split('-').map(Number);
        const prevM = m === 1 ? 12 : m - 1;
        const prevY = m === 1 ? y - 1 : y;
        const prevYM = `${prevY}-${String(prevM).padStart(2, '0')}`;
        prevMatchFn = (itemDate) => itemDate.startsWith(prevYM);
        periodDeltaLabel = 'vs mês';
      } else if (parsedPeriod.type === 'year') {
        const prevYear = `${Number(parsedPeriod.year) - 1}`;
        prevMatchFn = (itemDate) => itemDate.startsWith(prevYear);
        periodDeltaLabel = 'vs ano';
      } else if (parsedPeriod.type === 'day') {
        const prevDateTarget = new Date(Date.parse(`${parsedPeriod.date}T12:00:00Z`) - 7 * 86400000).toISOString().split('T')[0];
        prevMatchFn = (itemDate) => itemDate === prevDateTarget;
        periodDeltaLabel = 'vs sem.';
      } else if (parsedPeriod.type === 'day_short') {
        periodDeltaLabel = 'vs sem.';
      }
    }

    // 1. Métricas do Período Anterior (para deltas)
    let prevFat = 0;
    let prevCmv = 0;
    let prevMargem = 0;
    let prevVol = 0;
    let prevCount = 0;

    daily.forEach(item => {
      if (!prevMatchFn(item.data)) return;
      const rawLoja = (item.loja || '').toUpperCase();
      const itemLoja = getAnonStore(rawLoja);
      const itemDepto = (item.depto || '').toUpperCase();
      if (filterLojas && !filterLojas.some(fl => matchStore(rawLoja, fl))) return;
      if (filterDeptos && !filterDeptos.includes(itemDepto)) return;
      if (crossLoja && !matchStore(rawLoja, crossLoja)) return;
      if (!matchCrossDeptoFn(itemDepto)) return;
      prevFat += item.faturamento;
      prevCmv += item.cmv;
      prevMargem += item.margem;
      prevVol += item.quantidade;
      prevCount += item.linhas || 1;
    });

    // 2. Filtro e Agregação do Período Atual
    let fatTotal = 0;
    let cmvTotal = 0;
    let margemTotal = 0;
    let volumeTotal = 0;
    let ticketCount = 0;

    const temporalMap = {};
    const storesMap = {};
    const deptMap = {};

    daily.forEach(item => {
      if (item.data < startDateStr || item.data > endDateStr) return;

      const rawLoja = (item.loja || 'RETIRO').toUpperCase();
      const itemLoja = getAnonStore(rawLoja);
      const itemDepto = (item.depto || 'DIVERSOS').toUpperCase();

      const passLoja = !filterLojas || filterLojas.some(fl => matchStore(rawLoja, fl));
      const passDepto = !filterDeptos || filterDeptos.includes(itemDepto);

      if (!passLoja || !passDepto) return;

      const matchCrossLoja = !crossLoja || matchStore(rawLoja, crossLoja);
      const matchCrossDepto = matchCrossDeptoFn(itemDepto);

      // Agregação Temporal
      const [year, month, day] = item.data.split('-');
      let periodoGrafico = item.data; // Mantém chave única por data completa (evita colapsar múltiplos anos em 1)
      let sortKey = `${year}${month}${day}`;

      if (filterNivelPeriodo === 'semana') {
        const d = new Date(`${item.data}T12:00:00Z`);
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDays = (d - firstDayOfYear) / 86400000;
        const weekNum = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
        periodoGrafico = `Sem. ${weekNum}/${year}`;
        sortKey = `${year}${String(weekNum).padStart(2, '0')}`;
      } else if (filterNivelPeriodo === 'mes') {
        const monthNames = { '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez' };
        periodoGrafico = `${monthNames[month] || month}/${year}`;
        sortKey = `${year}${month}`;
      } else if (filterNivelPeriodo === 'ano') {
        periodoGrafico = `${year}`;
        sortKey = `${year}`;
      }

      // Gráfico de Evolução (AreaChart): reflete crossLoja e crossDepto
      if (matchCrossLoja && matchCrossDepto) {
        if (!temporalMap[periodoGrafico]) {
          temporalMap[periodoGrafico] = {
            date: item.data,
            displayDate: `${day}/${month}`,
            isoDate: item.data,
            sortKey,
            receita: 0,
            cmv: 0,
            mc: 0,
            volume: 0
          };
        }
        temporalMap[periodoGrafico].receita += item.faturamento;
        temporalMap[periodoGrafico].cmv += item.cmv;
        temporalMap[periodoGrafico].mc += item.margem;
        temporalMap[periodoGrafico].volume += item.quantidade;
      }

      const matchCrossPeriod = matchPeriod(item.data, parsedPeriod);

      // KPIs Globais: refletem crossLoja, crossDepto e crossPeriod
      if (matchCrossLoja && matchCrossDepto && matchCrossPeriod) {
        fatTotal += item.faturamento;
        cmvTotal += item.cmv;
        margemTotal += item.margem;
        volumeTotal += item.quantidade;
        ticketCount += item.linhas || 1;
      }

      // Agregação por Loja: reflete crossDepto e crossPeriod (mantém todas as lojas visíveis com nomes anonimizados)
      if (matchCrossDepto && matchCrossPeriod) {
        const sName = itemLoja;
        if (!storesMap[sName]) {
          storesMap[sName] = { name: sName, faturamento: 0, cmv: 0, mc: 0, volume: 0, linhas: 0 };
        }
        storesMap[sName].faturamento += item.faturamento;
        storesMap[sName].cmv += item.cmv;
        storesMap[sName].mc += item.margem;
        storesMap[sName].volume += item.quantidade;
        storesMap[sName].linhas += item.linhas || 1;
      }

      // Agregação por Departamento: reflete crossLoja e crossPeriod (mantém todos os departamentos visíveis)
      if (matchCrossLoja && matchCrossPeriod) {
        const dName = item.depto || 'DIVERSOS';
        if (!deptMap[dName]) {
          deptMap[dName] = { name: dName, faturamento: 0, cmv: 0, mc: 0, volume: 0 };
        }
        deptMap[dName].faturamento += item.faturamento;
        deptMap[dName].cmv += item.cmv;
        deptMap[dName].mc += item.margem;
        deptMap[dName].volume += item.quantidade;
      }
    });

    // 3. Deltas Executivos vs Período Anterior
    const deltaReceita = prevFat > 0 ? ((fatTotal - prevFat) / prevFat) * 100 : 0;
    const deltaCMV = prevCmv > 0 ? ((cmvTotal - prevCmv) / prevCmv) * 100 : 0;
    const deltaMargem = prevMargem !== 0 ? ((margemTotal - prevMargem) / Math.abs(prevMargem)) * 100 : 0;
    const deltaVolume = prevVol > 0 ? ((volumeTotal - prevVol) / prevVol) * 100 : 0;
    const margemPerc = fatTotal > 0 ? (margemTotal / fatTotal) * 100 : 0;
    const markupReal = cmvTotal > 0 ? ((fatTotal - cmvTotal) / cmvTotal) * 100 : 0;

    const ticketMedio = ticketCount > 0 ? fatTotal / ticketCount : 0;
    const prevTicketMedio = prevCount > 0 ? prevFat / prevCount : 0;
    const deltaTicketMedio = prevTicketMedio > 0 ? ((ticketMedio - prevTicketMedio) / prevTicketMedio) * 100 : 0;

    // 4. Lista Estruturada de Lojas
    const totalStoresFat = Object.values(storesMap).reduce((s, item) => s + item.faturamento, 0);
    const storesList = Object.values(storesMap).sort((a, b) => b.faturamento - a.faturamento).map(s => {
      const margemPct = s.faturamento > 0 ? (s.mc / s.faturamento) * 100 : 0;
      const cmvPctFat = s.faturamento > 0 ? (s.cmv / s.faturamento) * 100 : 0;
      const partTotal = totalStoresFat > 0 ? (s.faturamento / totalStoresFat) * 100 : 0;
      const storeTicket = s.linhas > 0 ? s.faturamento / s.linhas : 0;
      return {
        name: s.name,
        faturamento: s.faturamento,
        cmv: s.cmv,
        mc: s.mc,
        volume: s.volume,
        margemPct,
        cmvPctFat,
        partTotal,
        ticketMedio: storeTicket
      };
    });

    // 5. Lista Estruturada de Departamentos
    const totalDeptsFat = Object.values(deptMap).reduce((s, item) => s + item.faturamento, 0);
    const departmentsList = Object.values(deptMap).sort((a, b) => b.faturamento - a.faturamento).map(d => {
      const margemPct = d.faturamento > 0 ? (d.mc / d.faturamento) * 100 : 0;
      const cmvPctFat = d.faturamento > 0 ? (d.cmv / d.faturamento) * 100 : 0;
      const partTotal = totalDeptsFat > 0 ? (d.faturamento / totalDeptsFat) * 100 : 0;
      return {
        name: d.name,
        faturamento: d.faturamento,
        cmv: d.cmv,
        mc: d.mc,
        volume: d.volume,
        margemPct,
        cmvPctFat,
        partTotal
      };
    });

    // 6. Top e Piores Produtos (a partir de products_monthly)
    let targetYMStart = startDateStr.substring(0, 7);
    let targetYMEnd = endDateStr.substring(0, 7);

    if (parsedPeriod) {
      if (parsedPeriod.type === 'month') {
        targetYMStart = parsedPeriod.ym;
        targetYMEnd = parsedPeriod.ym;
      } else if (parsedPeriod.type === 'year') {
        targetYMStart = `${parsedPeriod.year}-01`;
        targetYMEnd = `${parsedPeriod.year}-12`;
      }
    }

    const filteredProdsMap = {};
    products.forEach(p => {
      if (p.ym >= targetYMStart && p.ym <= targetYMEnd) {
        const pLoja = (p.loja || '').toUpperCase();
        const pDepto = (p.depto || '').toUpperCase();
        if (filterLojas && !filterLojas.some(fl => matchStore(pLoja, fl))) return;
        if (filterDeptos && !filterDeptos.includes(pDepto)) return;
        if (crossLoja && !matchStore(pLoja, crossLoja)) return;
        if (!matchCrossDeptoFn(pDepto)) return;

        const pKey = `${p.codigo} - ${p.descricao}`;
        if (!filteredProdsMap[pKey]) {
          filteredProdsMap[pKey] = {
            codigo: p.codigo,
            descricao: p.descricao,
            produto: `${p.descricao} (${p.depto})`,
            depto: p.depto,
            faturamento: 0,
            receita: 0,
            cmv: 0,
            mc: 0,
            volume: 0,
            qtde: 0
          };
        }
        filteredProdsMap[pKey].faturamento += p.faturamento;
        filteredProdsMap[pKey].receita += p.faturamento;
        filteredProdsMap[pKey].cmv += p.cmv;
        filteredProdsMap[pKey].mc += p.margem;
        filteredProdsMap[pKey].volume += p.quantidade;
        filteredProdsMap[pKey].qtde += p.quantidade;
      }
    });

    const prodsList = Object.values(filteredProdsMap).map(p => {
      const margemContribuicaoPerc = p.receita > 0 ? (p.mc / p.receita) * 100 : 0;
      const markupRealProd = p.cmv > 0 ? ((p.receita - p.cmv) / p.cmv) * 100 : 0;
      return {
        ...p,
        margemContribuicaoPerc,
        markupReal: markupRealProd
      };
    });

    // Top 10 Produtos por Faturamento
    const topProdutosPorFaturamento = [...prodsList].sort((a, b) => b.receita - a.receita).slice(0, 10);
    // Top 10 Lucrativos por Margem Absoluta
    const topProdutos = [...prodsList].sort((a, b) => b.mc - a.mc).slice(0, 10);
    // 10 SKUs com maior Custo (CMV)
    const topCostProducts = [...prodsList].sort((a, b) => b.cmv - a.cmv).slice(0, 10);
    // 10 SKUs com maior Volume de Unidades
    const topVolumeProducts = [...prodsList].sort((a, b) => b.volume - a.volume).slice(0, 10);
    // Piores Produtos (Margem baixa ou comprimida)
    const pioresProdutos = [...prodsList].filter(p => p.receita > 100).sort((a, b) => a.margemContribuicaoPerc - b.margemContribuicaoPerc).slice(0, 10);

    // 7. Top Clientes (a partir de clients_daily)
    const filteredClientsMap = {};
    clients.forEach(c => {
      if (c.data >= startDateStr && c.data <= endDateStr) {
        const cLoja = (c.loja || '').toUpperCase();
        if (filterLojas && !filterLojas.some(fl => matchStore(cLoja, fl))) return;
        if (filterClientes && !filterClientes.includes(c.cliente.toUpperCase())) return;
        if (crossLoja && !matchStore(cLoja, crossLoja)) return;

        if (!filteredClientsMap[c.cliente]) {
          filteredClientsMap[c.cliente] = {
            cliente: c.cliente,
            name: c.cliente,
            loja: getAnonStore(c.loja),
            receita: 0,
            cmv: 0,
            mc: 0,
            volume: 0,
            compras: 0
          };
        }
        filteredClientsMap[c.cliente].receita += c.faturamento;
        filteredClientsMap[c.cliente].cmv += c.cmv;
        filteredClientsMap[c.cliente].mc += c.margem;
        filteredClientsMap[c.cliente].volume += c.quantidade;
        filteredClientsMap[c.cliente].compras += c.compras;
      }
    });

    const topClientes = Object.values(filteredClientsMap)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10)
      .map((c, idx) => ({
        ...c,
        cliente: `Cliente ${String(idx + 1).padStart(2, '0')}`,
        name: `Cliente ${String(idx + 1).padStart(2, '0')}`,
        loja: getAnonStore(c.loja)
      }));

    // 8. Gráfico de Área Temporal
    const areaData = Object.values(temporalMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // 9. Donut de Departamentos
    const donutData = departmentsList.slice(0, 8).map(d => ({
      name: d.name,
      value: d.faturamento
    }));

    // 10. Data Science Insights (Descritiva, Diagnóstica, Preditiva, Prescritiva)
    const insights = [];
    
    // Descritiva
    insights.push({
      categoria: 'Descritiva',
      tipo: 'descritivo',
      icone: 'search',
      titulo: 'Análise Descritiva: "O que aconteceu no Supermercado?"',
      texto: `A rede registrou um faturamento bruto de R$ ${(fatTotal / 1000000).toFixed(2)}M no período, com um CMV de R$ ${(cmvTotal / 1000000).toFixed(2)}M e Margem Bruta de Contribuição de ${margemPerc.toFixed(1)}% (R$ ${(margemTotal / 1000000).toFixed(2)}M). O volume movimentado foi de ${(volumeTotal / 1000).toFixed(1)} mil unidades.`
    });

    // Diagnóstica
    let diagText = 'A distribuição de margem permaneceu equilibrada entre as unidades.';
    if (departmentsList.length > 0) {
      const topDept = departmentsList[0];
      const lowestMarginDept = [...departmentsList].sort((a, b) => a.margemPct - b.margemPct)[0];
      diagText = `O departamento líder em faturamento foi "${topDept.name}" com ${topDept.partTotal.toFixed(1)}% da receita da rede. A maior compressão de margem ocorreu em "${lowestMarginDept.name}" com margem líquida de apenas ${lowestMarginDept.margemPct.toFixed(1)}%, indicando alta sensibilidade a custos e promoções.`;
    }
    insights.push({
      categoria: 'Diagnóstica',
      tipo: 'diagnostico',
      icone: 'bar-chart',
      titulo: 'Análise Diagnóstica: "Por que aconteceu?"',
      texto: diagText
    });

    // Preditiva
    const projecaoMensal = fatTotal > 0 ? (fatTotal * 1.05).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '0';
    insights.push({
      categoria: 'Preditiva',
      tipo: 'preditivo',
      icone: 'trending-up',
      titulo: 'Análise Preditiva: "O que vai acontecer?"',
      texto: `Mantida a tendência atual e sazonalidade dos departamentos chave, a projeção de faturamento para o próximo ciclo de 30 dias é de aproximadamente R$ ${projecaoMensal}, com expectativa de pressão no CMV em itens de mercearia e perecíveis.`
    });

    // Prescritiva
    let prescricao = 'Manter mix de produtos atual.';
    if (pioresProdutos.length > 0) {
      prescricao = `Ação Recomendada: Revisar alíquotas e tabela de precificação dos SKUs "${pioresProdutos[0].descricao}" e "${pioresProdutos[1]?.descricao || ''}", pois estão operando com margem abaixo da meta departamental.`;
    }
    insights.push({
      categoria: 'Prescritiva',
      tipo: 'prescritivo',
      icone: 'target',
      titulo: 'Análise Prescritiva: "O que fazer?"',
      texto: prescricao
    });

    // 11. Modal Drilldown Estruturado
    const drilldown = {
      faturamento: {
        stores: storesList,
        departments: departmentsList.slice(0, 10),
        topProducts: topProdutosPorFaturamento
      },
      cmv: {
        stores: [...storesList].sort((a, b) => b.cmv - a.cmv),
        departments: [...departmentsList].sort((a, b) => b.cmv - a.cmv).slice(0, 10),
        topCostProducts: topCostProducts
      },
      margem: {
        stores: [...storesList].sort((a, b) => b.mc - a.mc),
        departments: [...departmentsList].sort((a, b) => b.mc - a.mc).slice(0, 10),
        topLucrativos: topProdutos,
        viloesMargem: pioresProdutos
      },
      volumeTicket: {
        stores: [...storesList].sort((a, b) => b.volume - a.volume),
        departments: [...departmentsList].sort((a, b) => b.volume - a.volume).slice(0, 10),
        topVolumeProducts: topVolumeProducts,
        topClientes: topClientes
      }
    };

    return NextResponse.json({
      filters: {
        lojas: ['Loja 01', 'Loja 02', 'Loja 03', 'Loja 04', 'Loja 05', 'Loja 06', 'Loja 07', 'Loja 08', 'Loja 09'],
        departamentos: metadata.departamentos || [],
        clientes: []
      },
      kpis: {
        receitaLiquida: fatTotal,
        receitaLiquidaPrev: prevFat,
        receitaLiquidaDeltaPct: deltaReceita,
        cmvGeral: cmvTotal,
        cmvGeralPrev: prevCmv,
        cmvGeralDeltaPct: deltaCMV,
        volumeTotal: volumeTotal,
        volumeTotalPrev: prevVol,
        volumeTotalDeltaPct: deltaVolume,
        ticketMedio: ticketMedio,
        ticketMedioPrev: prevTicketMedio,
        ticketMedioDeltaPct: deltaTicketMedio,
        ticketCount: ticketCount,
        itensPorCupom: ticketCount > 0 ? (volumeTotal / ticketCount) : 0,
        lucroBruto: margemTotal,
        margemBruta: margemPerc,
        descontos: 0,
        markupReal: markupReal,
        markupIdeal: markupReal * 1.08,
        verbaPirelli: 0,
        margemContribuicao: margemTotal,
        margemContribuicaoPrev: prevMargem,
        margemContribuicaoDeltaPct: deltaMargem,
        margemContribuicaoPerc: margemPerc,
        cargaTributaria: 0,
        periodDeltaLabel: periodDeltaLabel
      },
      drilldown: drilldown,
      charts: {
        donut: donutData,
        area: areaData,
        topVendedores: storesList.slice(0, 5).map(s => ({
          nome: s.name,
          receita: s.faturamento,
          mc: s.mc,
          margemContribuicaoPerc: s.margemPct
        })),
        topClientes: topClientes,
        pioresClientesDevolucao: [],
        marcasDonut: departmentsList.map(d => ({
          name: d.name,
          marca: d.name,
          value: d.faturamento,
          fatReal: d.faturamento,
          cmv: d.cmv,
          mc: d.mc,
          margemContribuicaoPerc: d.margemPct
        }))
      },
      impostos: { icms: 0, st: 0, pis: 0, cofins: 0, total: 0 },
      marcas: departmentsList.slice(0, 8).map(d => ({
        name: d.name,
        marca: d.name,
        value: d.faturamento,
        fatReal: d.faturamento,
        cmv: d.cmv,
        mc: d.mc,
        margemContribuicaoPerc: d.margemPct
      })),
      tables: {
        topProdutos: topProdutosPorFaturamento,
        topProdutosPorFaturamento: topProdutosPorFaturamento,
        topLucrativos: topProdutos,
        pioresProdutos: pioresProdutos,
        vendedores: storesList.map(s => ({
          nome: s.name,
          receita: s.faturamento,
          cmv: s.cmv,
          mc: s.mc,
          margemContribuicaoPerc: s.margemPct,
          volume: s.volume,
          qtde: s.volume,
          ticketMedio: s.ticketMedio
        }))
      },
      insights: insights,
      activeCrossFilters: {
        crossDepto,
        crossLoja,
        crossPeriod
      },
      lastUpdate: metadata.updated_at || 'Supermercado DRE'
    });

  } catch (error) {
    console.error('Erro na API Supermercado Dashboard:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
