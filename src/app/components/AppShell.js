'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Store, Users, LogOut, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import GlobalFilters from './GlobalFilters';

export default function AppShell({ children }) {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (authLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#64748b' }}>Carregando permissões...</div>;
  if (!user || pathname === '/login' || pathname === '/trocar-senha') return <>{children}</>;

  const navigateTo = (path) => {
    if (pathname !== path) {
      startTransition(() => {
        router.push(`${path}?${searchParams.toString()}`);
      });
    }
  };

  return (
    <div className="app-layout-executive">
      {/* ── TOPBAR EXECUTIVA ESTILO VÍDEO 2 ── */}
      <header className="executive-topbar">
        {/* ESQUERDA: LOGO + NOME DO SISTEMA */}
        <div className="topbar-left">
          <div className="topbar-brand" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigateTo('/')}>
            <img 
              src="/images/logo-core-light-transparent.png" 
              alt="Análises Core" 
              style={{ height: '34px', width: 'auto', display: 'block' }} 
            />
          </div>

          {/* TABS DE NAVEGAÇÃO PRINCIPAL */}
          <nav className="nav-tabs-pill">
            <button 
              onClick={() => navigateTo('/')} 
              className={`nav-tab-item ${pathname === '/' ? 'active' : ''}`}
            >
              <LayoutDashboard size={14} /> Visão Geral
            </button>
            <button 
              onClick={() => navigateTo('/lojas')} 
              className={`nav-tab-item ${pathname === '/lojas' ? 'active' : ''}`}
            >
              <Store size={14} /> Lojas & Unidades
            </button>
            <button 
              onClick={() => navigateTo('/marcas')} 
              className={`nav-tab-item ${pathname === '/marcas' ? 'active' : ''}`}
            >
              <Package size={14} /> Departamentos
            </button>
            <button 
              onClick={() => navigateTo('/usuarios')} 
              className={`nav-tab-item ${pathname === '/usuarios' ? 'active' : ''}`}
            >
              <Users size={14} /> Usuários
            </button>
          </nav>
        </div>

        {/* CENTRO / DIREITA: FILTROS GLOBAIS INTEGRADINHOS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {pathname !== '/usuarios' && pathname !== '/logs' && (
            <GlobalFilters />
          )}

          {/* LOGOUT BUTTON */}
          <button 
            onClick={handleLogout} 
            title="Sair do Sistema"
            style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              color: '#ef4444', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              flexShrink: 0
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <main className="executive-main">
        {children}
      </main>
    </div>
  );
}
