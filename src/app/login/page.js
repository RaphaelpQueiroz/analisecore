'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Mail, Lock, Eye, EyeOff, ArrowRight, TrendingUp, ShieldCheck, Store, Package } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!auth) {
      setError('Credenciais do Firebase não configuradas na nuvem.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      document.cookie = `auth_token=${token}; path=/; max-age=${rememberMe ? 86400 * 30 : 86400};`;
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        .split-login-container {
          display: flex;
          height: 100vh;
          max-height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: #ffffff;
          font-family: inherit;
          box-sizing: border-box;
        }

        /* ── PAINEL DA ESQUERDA (DARK LUXURY) ── */
        .brand-hero-panel {
          flex: 1.18;
          height: 100vh;
          max-height: 100vh;
          background: #090d16;
          background-image: 
            radial-gradient(circle at 15% 15%, rgba(2, 132, 199, 0.22) 0%, transparent 45%),
            radial-gradient(circle at 85% 80%, rgba(37, 99, 235, 0.2) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, #0e1526 0%, #070a12 100%);
          position: relative;
          padding: clamp(1.5rem, 3.5vh, 2.5rem) clamp(2rem, 3.5vw, 3.6rem);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
          box-sizing: border-box;
        }

        .brand-hero-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }

        .hero-top-brand {
          position: relative;
          z-index: 2;
          flex-shrink: 0;
        }

        .hero-top-brand img {
          height: clamp(52px, 7.5vh, 68px);
          width: auto;
          display: block;
          filter: drop-shadow(0 4px 16px rgba(2, 132, 199, 0.25));
        }

        .hero-center-content {
          position: relative;
          z-index: 2;
          max-width: 540px;
          margin: clamp(0.5rem, 2vh, 1.4rem) 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(2, 132, 199, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38bdf8;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: clamp(0.5rem, 1.2vh, 0.8rem);
          width: fit-content;
        }

        .hero-headline {
          font-size: clamp(1.65rem, 2.9vh, 2.2rem);
          font-weight: 800;
          color: #f8fafc;
          line-height: 1.22;
          letter-spacing: -0.02em;
          margin-bottom: clamp(0.35rem, 0.9vh, 0.65rem);
        }

        .hero-headline span {
          background: linear-gradient(135deg, #38bdf8 0%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-description {
          font-size: clamp(0.86rem, 1.4vh, 0.95rem);
          line-height: 1.55;
          color: #94a3b8;
          margin-bottom: clamp(0.9rem, 2vh, 1.4rem);
        }

        /* ── MÓDULOS REAIS DA PLATAFORMA (SEM GRÁFICOS OU DADOS FALSOS) ── */
        .platform-modules-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: clamp(8px, 1.4vh, 12px);
        }

        .module-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 11px;
          padding: clamp(10px, 1.5vh, 14px) 14px;
          display: flex;
          align-items: flex-start;
          gap: 11px;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .module-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.35);
          background: rgba(15, 23, 42, 0.85);
        }

        .module-card-icon {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }

        .module-card-content {
          display: flex;
          flex-direction: column;
        }

        .module-card-title {
          font-size: clamp(0.82rem, 1.35vh, 0.9rem);
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 3px;
        }

        .module-card-desc {
          font-size: clamp(0.72rem, 1.15vh, 0.78rem);
          color: #94a3b8;
          line-height: 1.45;
        }

        .hero-footer-trust {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 500;
          flex-shrink: 0;
        }

        /* ── PAINEL DA DIREITA (CONSOLE DE LOGIN BRANCO) ── */
        .login-form-panel {
          flex: 0.92;
          height: 100vh;
          max-height: 100vh;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1.5rem, 3.5vh, 2.5rem) clamp(1.8rem, 3.2vw, 3.5rem);
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
        }

        .login-form-card {
          width: 100%;
          max-width: 410px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-form-header {
          margin-bottom: clamp(1rem, 2.4vh, 1.8rem);
        }

        .mobile-brand-wrapper {
          display: none;
          margin-bottom: 1.2rem;
        }

        .login-form-title {
          font-size: clamp(1.55rem, 2.7vh, 1.85rem);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 0.3rem;
          line-height: 1.2;
        }

        .login-form-subtitle {
          font-size: clamp(0.86rem, 1.4vh, 0.94rem);
          color: #64748b;
          font-weight: 400;
          margin: 0;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .input-label {
          font-size: 0.86rem;
          font-weight: 600;
          color: #334155;
        }

        .input-relative-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon-left {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.15s ease;
        }

        .input-primary {
          width: 100%;
          padding: clamp(0.72rem, 1.35vh, 0.88rem) 1rem clamp(0.72rem, 1.35vh, 0.88rem) 42px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: #f8fafc;
          color: #0f172a;
          font-size: 0.95rem;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .input-primary:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .input-relative-wrapper:focus-within .input-icon-left {
          color: #2563eb;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.15s ease;
        }

        .password-toggle-btn:hover {
          color: #334155;
        }

        .login-extra-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-top: -0.15rem;
        }

        .remember-checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475569;
          font-weight: 500;
          cursor: pointer;
          user-select: none;
        }

        .forgot-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.15s ease;
        }

        .forgot-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .btn-primary-submit {
          width: 100%;
          padding: clamp(0.8rem, 1.5vh, 0.94rem);
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.95rem;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.03em;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
          transition: all 0.2s ease;
          margin-top: 0.35rem;
          box-sizing: border-box;
        }

        .btn-primary-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.38);
        }

        .btn-primary-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .login-copyright-footer {
          margin-top: clamp(1rem, 2.4vh, 2rem);
          font-size: 0.78rem;
          color: #94a3b8;
          text-align: center;
          line-height: 1.45;
        }

        /* RESPONSIVIDADE MOBILE / TABLET */
        @media (max-width: 960px) {
          html, body {
            overflow: auto;
          }
          .split-login-container {
            height: auto;
            max-height: none;
            overflow: auto;
          }
          .brand-hero-panel {
            display: none;
          }
          .login-form-panel {
            height: auto;
            min-height: 100vh;
            padding: 2.5rem 1.5rem;
            background: #f8fafc;
            overflow: auto;
          }
          .login-form-card {
            background: #ffffff;
            padding: 2.5rem 2rem;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.08);
          }
          .mobile-brand-wrapper {
            display: flex;
            justify-content: center;
          }
        }
      `}</style>

      <div className="split-login-container">
        
        {/* ── PAINEL ESQUERDO: APRESENTAÇÃO INSTITUCIONAL COM O LOGO NATIVO ── */}
        <section className="brand-hero-panel">
          
          <div className="hero-top-brand">
            <img 
              src="/images/logo-core-dark-transparent.png" 
              alt="Análises Core" 
            />
          </div>

          <div className="hero-center-content">
            <div className="hero-badge-pill">
              Inteligência Comercial & Varejo
            </div>

            <h1 className="hero-headline">
              Decisões estratégicas baseadas no <span>coração dos dados</span>.
            </h1>

            <p className="hero-description">
              Plataforma analítica para acompanhamento em tempo real de vendas, margem de contribuição, CMV e curva ABC por loja e departamento.
            </p>

            {/* MÓDULOS REAIS DO SISTEMA */}
            <div className="platform-modules-grid">
              
              <div className="module-card">
                <div className="module-card-icon" style={{ color: '#38bdf8' }}>
                  <TrendingUp size={16} />
                </div>
                <div className="module-card-content">
                  <div className="module-card-title">Faturamento & Vendas</div>
                  <div className="module-card-desc">Receita líquida, volume e ticket médio da rede dia a dia.</div>
                </div>
              </div>

              <div className="module-card">
                <div className="module-card-icon" style={{ color: '#34d399' }}>
                  <ShieldCheck size={16} />
                </div>
                <div className="module-card-content">
                  <div className="module-card-title">Margem & CMV Real</div>
                  <div className="module-card-desc">Margem de contribuição líquida e controle de custo de mercadorias.</div>
                </div>
              </div>

              <div className="module-card">
                <div className="module-card-icon" style={{ color: '#a78bfa' }}>
                  <Store size={16} />
                </div>
                <div className="module-card-content">
                  <div className="module-card-title">Lojas & Unidades</div>
                  <div className="module-card-desc">Comparativo de desempenho e ranking de vendas entre filiais.</div>
                </div>
              </div>

              <div className="module-card">
                <div className="module-card-icon" style={{ color: '#fbbf24' }}>
                  <Package size={16} />
                </div>
                <div className="module-card-content">
                  <div className="module-card-title">Departamentos & Curva ABC</div>
                  <div className="module-card-desc">Mix por departamento, produtos líderes e itens sensíveis a margem.</div>
                </div>
              </div>

            </div>
          </div>

          <div className="hero-footer-trust">
            <ShieldCheck size={16} color="#38bdf8" />
            <span>Ambiente Seguro • Conexão Criptografada</span>
          </div>

        </section>

        {/* ── PAINEL DIREITO: FORMULÁRIO DE LOGIN ── */}
        <section className="login-form-panel">
          <div className="login-form-card">
            
            {/* LOGO EM TELAS MOBILE / COMPACTAS */}
            <div className="mobile-brand-wrapper">
              <img 
                src="/images/logo-core-light-transparent.png" 
                alt="Análises Core" 
                style={{ height: '36px', width: 'auto' }} 
              />
            </div>

            <div className="login-form-header">
              <h2 className="login-form-title">Acessar Plataforma</h2>
              <p className="login-form-subtitle">Informe suas credenciais para continuar</p>
            </div>

            {error && (
              <div style={{ 
                width: '100%', 
                marginBottom: '1rem', 
                padding: '0.8rem 1rem', 
                borderRadius: '8px', 
                backgroundColor: '#fef2f2', 
                color: '#dc2626', 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                border: '1px solid #fecaca', 
                textAlign: 'center' 
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 1.5vh, 1.15rem)' }}>
              
              <div className="input-group">
                <label className="input-label">E-mail</label>
                <div className="input-relative-wrapper">
                  <Mail size={17} className="input-icon-left" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-primary"
                    placeholder="seu@email.com.br"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Senha de Acesso</label>
                <div className="input-relative-wrapper">
                  <Lock size={17} className="input-icon-left" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-primary"
                    placeholder="••••••••••••"
                    style={{ paddingRight: '42px', letterSpacing: !showPassword && password ? '0.15em' : 'normal' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="login-extra-row">
                <label className="remember-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                  Manter conectado
                </label>
                
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); alert('Para redefinir sua senha, entre em contato com o Administrador do Sistema.'); }} 
                  className="forgot-link"
                >
                  Esqueci minha senha
                </a>
              </div>

              <button type="submit" disabled={loading} className="btn-primary-submit">
                {loading ? (
                  'AUTENTICANDO...'
                ) : (
                  <>
                    <span>ENTRAR NO SISTEMA</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="login-copyright-footer">
              <div>© {new Date().getFullYear()} Análises Core • Todos os direitos reservados.</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>Tecnologia de Inteligência Comercial e Varejo Supermercadista</div>
            </div>

          </div>
        </section>

      </div>
    </>
  );
}
