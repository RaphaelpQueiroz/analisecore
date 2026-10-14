'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Trash2, Mail, Lock, Ban } from 'lucide-react';

export default function UsuariosAdmin() {
  const { userData, user, loading } = useAuth();
  const router = useRouter();
  
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('comum');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchUsers = useCallback(async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user]);

  useEffect(() => {
    const isAdmin = true; // Liberado temporariamente para testes locais
    
    if (!loading && !isAdmin) {
      router.push('/');
    } else if (!loading && isAdmin) {
      fetchUsers();
    }
  }, [loading, router, fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Usuário criado com sucesso!', type: 'success' });
        setNewEmail('');
        setNewPassword('');
        setNewRole('comum');
        fetchUsers();
      } else {
        setMessage({ text: data.details ? `${data.error}: ${data.details}` : (data.error || 'Erro ao criar usuário'), type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Erro de conexão', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!confirm('Tem certeza que deseja apagar este usuário?')) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/auth/users?uid=${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchUsers();
      } else {
        alert('Erro ao apagar usuário');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async (uid) => {
    if (!confirm('Deseja resetar a senha deste usuário para "123@mudar"?')) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/auth/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid, action: 'reset_password' })
      });
      if (res.ok) {
        alert('Senha resetada com sucesso para 123@mudar!');
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (uid) => {
    if (!confirm('Deseja alterar o status (Ativo/Inativo) deste usuário?')) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/auth/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid, action: 'toggle_status' })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || isLoadingUsers) return <div className="p-10 text-center">Carregando permissões...</div>;
  const isAdmin = true; // Liberado temporariamente para testes locais
  if (!isAdmin) return null;

  return (
    <div className="page-scroll">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', marginTop: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'hsl(var(--primary) / 0.15)', borderRadius: '8px' }}>
          <Users style={{ width: '24px', height: '24px', color: 'hsl(var(--primary))' }} />
        </div>
        <div>
          <h1 className="page-title">Gestão de Usuários</h1>
          <p className="page-subtitle">Controle de acessos ao painel gerencial</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        {/* Formulário de Criação */}
        <div className="card" style={{ gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>
            <UserPlus style={{ width: '20px', height: '20px' }} /> Novo Usuário
          </h2>

          {message.text && (
            <div style={{ padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem', backgroundColor: message.type === 'error' ? 'hsl(var(--destructive)/0.1)' : 'hsl(var(--success)/0.1)', color: message.type === 'error' ? 'hsl(var(--destructive))' : 'hsl(var(--success))', border: `1px solid ${message.type === 'error' ? 'hsl(var(--destructive)/0.2)' : 'hsl(var(--success)/0.2)'}` }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem', color: 'hsl(var(--foreground))' }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.5rem', border: '1px solid hsl(var(--border))', borderRadius: '4px', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: '0.9rem' }}
                  placeholder="email@empresa.com"
                />
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'hsl(var(--muted)/0.3)', borderRadius: '4px', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
              <Lock style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '4px', marginBottom: '-2px' }} />
              A senha provisória será fixa: <strong>123@mudar</strong>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem', color: 'hsl(var(--foreground))' }}>Perfil</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid hsl(var(--border))', borderRadius: '4px', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                <option value="comum">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              style={{ padding: '0.6rem 1rem', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', border: 'none', borderRadius: '4px', fontWeight: '500', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1, marginTop: '0.5rem' }}
            >
              {actionLoading ? 'Criando...' : 'Criar Conta'}
            </button>
          </form>
        </div>

        {/* Lista de Usuários */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0, padding: 0 }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.uid} style={{ opacity: u.inativo ? 0.5 : 1 }}>
                    <td style={{ fontWeight: '500' }}>
                      {u.email}
                      {u.inativo && <span style={{ marginLeft: '8px', fontSize: '0.7rem', backgroundColor: 'hsl(var(--destructive))', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>INATIVO</span>}
                    </td>
                    <td>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: u.perfil === 'admin' ? 'hsl(var(--info)/0.15)' : 'hsl(var(--muted)/0.3)', color: u.perfil === 'admin' ? 'hsl(var(--info))' : 'hsl(var(--foreground))' }}>
                        {u.perfil === 'admin' ? 'Administrador' : 'Comum'}
                      </span>
                    </td>
                    <td>
                      {u.precisaTrocarSenha ? (
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'hsl(var(--warning)/0.15)', color: 'hsl(var(--warning))' }}>Troca Pendente</span>
                      ) : (
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'hsl(var(--success)/0.15)', color: 'hsl(var(--success))' }}>Ativo</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleReset(u.uid)}
                        className="btn-reset"
                        style={{ padding: '0.4rem', border: 'none', cursor: 'pointer' }}
                        title="Resetar Senha (123@mudar)"
                      >
                        <Lock style={{ width: '16px', height: '16px', color: 'hsl(var(--info))' }} />
                      </button>

                      <button 
                        onClick={() => handleToggleStatus(u.uid)}
                        disabled={u.uid === user.uid}
                        className="btn-reset"
                        style={{ padding: '0.4rem', border: 'none', opacity: u.uid === user.uid ? 0.3 : 1, cursor: u.uid === user.uid ? 'not-allowed' : 'pointer' }}
                        title={u.inativo ? "Reativar usuário" : "Inativar usuário"}
                      >
                        {u.inativo ? <UserPlus style={{ width: '16px', height: '16px', color: 'hsl(var(--success))' }} /> : <Ban style={{ width: '16px', height: '16px', color: 'hsl(var(--warning))' }} />}
                      </button>

                      <button 
                        onClick={() => handleDeleteUser(u.uid)}
                        disabled={u.uid === user.uid}
                        className="btn-reset"
                        style={{ padding: '0.4rem', border: 'none', opacity: u.uid === user.uid ? 0.3 : 1, cursor: u.uid === user.uid ? 'not-allowed' : 'pointer' }}
                        title={u.uid === user.uid ? "Você não pode se deletar" : "Apagar usuário"}
                      >
                        <Trash2 style={{ width: '16px', height: '16px', color: 'hsl(var(--destructive))' }} />
                      </button>
                    </td>
                  </tr>
                ))}
                {usersList.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Nenhum usuário encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
