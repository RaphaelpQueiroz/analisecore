'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { Calendar, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

export default function GlobalFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const dateTimeoutRef = useRef(null);

  const fallbackStart = '2024-10-01';
  const fallbackEnd = '2024-10-31';

  const [defaultStart, setDefaultStart] = useState(fallbackStart);
  const [defaultEnd, setDefaultEnd] = useState(fallbackEnd);

  const [filters, setFilters] = useState({
    dataInicio: searchParams.get('dataInicio') || fallbackStart,
    dataFim: searchParams.get('dataFim') || fallbackEnd,
  });

  const [loading, setLoading] = useState(true);

  /* ── Carrega datas padrão da API e limpa parâmetros legados de loja/depto ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/filters');
        if (res.ok) {
          const d = await res.json();
          if (d.defaultStart) setDefaultStart(d.defaultStart);
          if (d.defaultEnd) setDefaultEnd(d.defaultEnd);

          const hasDates = searchParams.has('dataInicio') && searchParams.has('dataFim');
          const hasLegacy = searchParams.has('loja') || searchParams.has('departamento');

          if (!hasDates || hasLegacy) {
            const p = new URLSearchParams(searchParams.toString());
            if (!searchParams.has('dataInicio')) p.set('dataInicio', d.defaultStart || fallbackStart);
            if (!searchParams.has('dataFim')) p.set('dataFim', d.defaultEnd || fallbackEnd);
            p.delete('loja');
            p.delete('departamento');
            router.replace(`${pathname}?${p.toString()}`);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Sincroniza estado com a URL ── */
  useEffect(() => {
    setFilters({
      dataInicio: searchParams.get('dataInicio') || defaultStart,
      dataFim: searchParams.get('dataFim') || defaultEnd,
    });
  }, [searchParams, defaultStart, defaultEnd]);

  /* ── Navegação de filtros ── */
  const pushParams = (obj) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(obj).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    startTransition(() => {
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    });
  };

  const fmt = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parse = (str) => {
    if (!str) return null;
    const [y, m, d] = str.split('-');
    return new Date(+y, +m - 1, +d);
  };

  const handleDate = (name, date) => {
    const value = fmt(date);
    setFilters((prev) => ({ ...prev, [name]: value }));
    if (dateTimeoutRef.current) clearTimeout(dateTimeoutRef.current);
    dateTimeoutRef.current = setTimeout(() => {
      if (value && value !== searchParams.get(name)) pushParams({ [name]: value });
    }, 150);
  };

  /* ── Cabeçalho customizado para o DatePicker com seletor direto de Mês e Ano ── */
  const renderCalendarHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 10px',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      gap: '6px'
    }}>
      <button
        type="button"
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '4px',
          color: prevMonthButtonDisabled ? '#cbd5e1' : '#475569',
          borderRadius: '4px'
        }}
      >
        <ChevronLeft size={16} />
      </button>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <select
          value={date.getMonth()}
          onChange={({ target: { value } }) => changeMonth(Number(value))}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '2px 4px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#1e293b',
            cursor: 'pointer'
          }}
        >
          {MONTHS.map((m, idx) => (
            <option key={m} value={idx}>{m}</option>
          ))}
        </select>

        <select
          value={date.getFullYear()}
          onChange={({ target: { value } }) => changeYear(Number(value))}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '2px 4px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#1e293b',
            cursor: 'pointer'
          }}
        >
          {YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '4px',
          color: nextMonthButtonDisabled ? '#cbd5e1' : '#475569',
          borderRadius: '4px'
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'nowrap',
    }}>
      {/* SELETOR DE PERÍODO (CALENDÁRIO COM ESCOLHA DIRETA DE MÊS E ANO) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '0 10px',
          height: '32px',
          gap: '6px',
          flexShrink: 0,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)'
        }}
        title="Clique para escolher a data inicial e final"
      >
        <label htmlFor="dataInicioInput" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Calendar size={13} style={{ color: '#64748b', flexShrink: 0 }} />
        </label>
        <DatePicker
          id="dataInicioInput"
          selected={parse(filters.dataInicio)}
          onChange={(date) => handleDate('dataInicio', date)}
          dateFormat="dd/MM/yy"
          locale={ptBR}
          disabled={loading}
          portalId="root-portal"
          className="header-datepicker-light"
          renderCustomHeader={renderCalendarHeader}
        />
        <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>-</span>
        <DatePicker
          selected={parse(filters.dataFim)}
          onChange={(date) => handleDate('dataFim', date)}
          dateFormat="dd/MM/yy"
          locale={ptBR}
          disabled={loading}
          portalId="root-portal"
          className="header-datepicker-light"
          renderCustomHeader={renderCalendarHeader}
        />
      </div>

      {/* STATUS DA BASE / ATUALIZAR */}
      <button
        onClick={() => {
          const p = new URLSearchParams(searchParams.toString());
          p.set('ts', Date.now().toString());
          startTransition(() => {
            router.replace(`${pathname}?${p.toString()}`, { scroll: false });
          });
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          color: '#059669',
          background: '#ecfdf5',
          border: '1px solid #d1fae5',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title="Sincronizar base de dados"
      >
        <RefreshCw size={14} className={isPending ? 'spin' : ''} />
      </button>
    </div>
  );
}
