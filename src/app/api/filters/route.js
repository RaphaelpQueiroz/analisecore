import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const revalidate = 0;

let cachedFilters = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  try {
    if (cachedFilters && (Date.now() - lastFetchTime < CACHE_TTL_MS)) {
      return NextResponse.json(cachedFilters);
    }

    const possiblePaths = [
      path.join(process.cwd(), 'data', 'supermarket', 'metadata.json'),
      'C:\\Users\\Usuario\\dre\\data\\supermarket\\metadata.json',
      'c:\\Users\\Usuario\\OneDrive\\Documentos\\dre\\data\\supermarket\\metadata.json'
    ];

    let metadata = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          metadata = JSON.parse(raw);
          break;
        } catch (e) {
          console.error(`Erro ao ler ${p}:`, e.message);
        }
      }
    }

    if (!metadata) {
      metadata = {
        lojas: ['Loja 01', 'Loja 02', 'Loja 03', 'Loja 04', 'Loja 05', 'Loja 06', 'Loja 07', 'Loja 08', 'Loja 09'],
        departamentos: ['AÇOUGUE', 'BEBIDAS', 'BISCOITO', 'BOMBONIERE', 'DESCARTAVEIS', 'FRIOS', 'H.F.G', 'LANCHONETE', 'LIMPEZA', 'MERCEARIA', 'PADARIA', 'PERFUMARIA', 'UTILIDADES'],
        clientes: [],
        default_start: '2024-10-01',
        default_end: '2024-10-31',
        updated_at: new Date().toISOString()
      };
    }

    cachedFilters = {
      lojas: metadata.lojas || [],
      departamentos: metadata.departamentos || [],
      clientes: metadata.clientes || [],
      defaultStart: metadata.default_start || '2024-10-01',
      defaultEnd: metadata.default_end || '2024-10-31',
      minDate: metadata.min_date || '2024-01-02',
      maxDate: metadata.max_date || '2025-01-17',
      lastUpdate: metadata.updated_at || 'Supermercado - Base Atualizada'
    };
    lastFetchTime = Date.now();

    return NextResponse.json(cachedFilters);

  } catch (error) {
    console.error('Erro na rota de filtros:', error);
    return NextResponse.json({ error: 'Falha ao carregar filtros' }, { status: 500 });
  }
}

