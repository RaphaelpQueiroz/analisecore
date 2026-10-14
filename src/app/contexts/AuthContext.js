'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { setCookie, destroyCookie } from 'nookies';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const token = await user.getIdToken();
        setCookie(null, 'auth_token', token, { path: '/' });
        
        // Buscar dados extras do backend seguro para evitar erro de Regras do Firestore
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!res.ok) {
            console.warn("API /auth/me retornou status não-ok:", res.status);
            throw new Error(`API error ${res.status}`);
          }
          
          const data = await res.json();
          let extraData = data.userData || {};
          
          if (extraData.inativo) {
            await auth.signOut();
            alert('Sua conta foi inativada. Entre em contato com o administrador.');
            return;
          }

          setUserData(extraData);
        
          if (extraData.precisaTrocarSenha && pathname !== '/trocar-senha') {
            router.push('/trocar-senha');
          } else if (!extraData.precisaTrocarSenha && (pathname === '/login' || pathname === '/trocar-senha')) {
            router.push('/');
          }
        } catch (err) {
          console.error("Erro ao buscar dados do usuário:", err);
          // GARANTIR O REDIRECIONAMENTO MESMO SE A API CAIR:
          if (pathname === '/login' || pathname === '/trocar-senha') {
            router.push('/');
          }
        }
      } else {
        setUser(null);
        setUserData(null);
        destroyCookie(null, 'auth_token');
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
