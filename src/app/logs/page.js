'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';

export default function LogsPage() {
  const { userData, user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.email !== 'compras4@innovus.com.br')) {
      router.push('/');
    } else if (!loading && user?.email === 'compras4@innovus.com.br') {
      fetchLogs();
    }
  }, [loading, user, router]);

  const fetchLogs = async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/auth/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAction = (action) => {
    const map = {
      'login_or_session_refresh': 'Acesso / Refresh Sessão',
      'create_user': 'Criação de Usuário',
      'delete_user': 'Exclusão de Usuário',
      'reset_password': 'Reset de Senha',
      'activate_user': 'Ativação de Usuário',
      'deactivate_user': 'Inativação de Usuário',
    };
    return map[action] || action;
  };

  if (loading || isLoading) return <div className="p-10 text-center">Carregando logs...</div>;
  if (!user || user.email !== 'compras4@innovus.com.br') return null;

  return (
    <div className="page-scroll">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', marginTop: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'hsl(var(--primary) / 0.15)', borderRadius: '8px' }}>
          <ClipboardList style={{ width: '24px', height: '24px', color: 'hsl(var(--primary))' }} />
        </div>
        <div>
          <h1 className="page-title">Logs de Movimentação</h1>
          <p className="page-subtitle">Histórico de acessos e modificações de contas</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ margin: 0, padding: 0 }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Ação</th>
                <th>Usuário Afetado</th>
                <th>Responsável (Admin UID)</th>
              </tr>
            </thead>
            <tbody>
              {logs.filter(log => log.action !== 'login_or_session_refresh').map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                  <td>
                    <span style={{ fontWeight: '600', color: 'hsl(var(--primary))' }}>{formatAction(log.action)}</span>
                  </td>
                  <td>{log.targetEmail || log.email || log.targetUid || log.uid || 'N/A'}</td>
                  <td>{log.adminEmail || log.adminUid || 'Sistema / O Próprio'}</td>
                </tr>
              ))}
              {logs.filter(log => log.action !== 'login_or_session_refresh').length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Nenhum log encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
