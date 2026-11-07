import React, { createContext, useContext, useEffect } from 'react';
import { loadSession, subscribeSession } from '../services/session';
import {
  loginUser,
  logoutUser,
  refreshProfile,
  registerUser,
} from '../services/authService';

const UserContext = createContext();

/**
 * Sesión de la app: lee el token guardado y se mantiene sincronizada con
 * `session.js`. Ya no depende de Firebase ni de listeners remotos.
 */
export function UserProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      const session = await loadSession();
      if (!alive) return;
      setUser(session?.user ?? null);
      setLoading(false);

      // Perfil fresco (rol, nombre) sin bloquear el arranque.
      if (session?.token) {
        refreshProfile().catch(() => {});
      }
    })();

    const unsubscribe = subscribeSession((session) => {
      if (alive) setUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const signUp = (email, password, name, lastName, phone) =>
    registerUser(email, password, name, lastName, phone);

  const signIn = (email, password) => loginUser(email, password);

  const signOut = () => logoutUser();

  return (
    <UserContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
