'use client';

import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function TrocarSenha() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      if (user) {
        await updatePassword(user, password);
        
        // Atualiza a flag de troca de senha via backend para evitar erro de permissões do Firestore
        const token = await user.getIdToken();
        await fetch('/api/auth/me', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ precisaTrocarSenha: false })
        });
        
        // Força recarregamento da página para rodar a AuthContext de novo
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao atualizar a senha. Tente fazer login novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-bg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, hsl(220, 20%, 18%), hsl(220, 10%, 8%) 80%);
          position: relative;
          overflow: hidden;
        }
        .login-bg::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(234, 179, 8, 0.08) 0%, rgba(0,0,0,0) 70%);
          top: -200px;
          right: -200px;
          border-radius: 50%;
          pointer-events: none;
        }
        .login-card {
          max-width: 420px;
          width: 100%;
          padding: 3rem 2.5rem;
          background: rgba(30, 34, 43, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 10;
        }
        .login-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: #ffffff;
          text-align: center;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }
        .login-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          text-align: center;
          margin-bottom: 2.5rem;
          line-height: 1.5;
        }
        .login-input {
          width: 100%;
          padding: 0.85rem 1.2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.2);
          color: #ffffff;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
        }
        .login-input:focus {
          border-color: #eab308;
          background: rgba(0, 0, 0, 0.3);
          box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.15);
        }
        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        .login-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
        }
        .login-btn {
          width: 100%;
          padding: 0.9rem;
          background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
          color: #ffffff;
          font-weight: 700;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          margin-top: 1rem;
          font-size: 0.95rem;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(234, 179, 8, 0.3);
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(234, 179, 8, 0.4);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>

      <div className="login-bg">
        <div className="login-card">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.15)', marginBottom: '1.5rem', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <ShieldAlert style={{ width: '32px', height: '32px', color: '#eab308' }} />
          </div>
          <h2 className="login-title">Troca Obrigatória</h2>
          <p className="login-subtitle">
            Como este é o seu primeiro acesso, você deve definir uma senha definitiva por segurança.
          </p>

          {error && (
            <div style={{ width: '100%', marginBottom: '1.5rem', padding: '0.85rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="login-label">Nova Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                placeholder="••••••••"
                style={{ letterSpacing: password ? '0.2em' : 'normal' }}
              />
            </div>

            <div>
              <label className="login-label">Confirme a Nova Senha</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="login-input"
                placeholder="••••••••"
                style={{ letterSpacing: confirmPassword ? '0.2em' : 'normal' }}
              />
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'SALVANDO...' : 'SALVAR E ACESSAR'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
