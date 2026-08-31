"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "gill_student_session";
const Ctx = createContext(null);

export function StudentProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const login = useCallback((sess) => {
    setSession(sess);
    try {
      localStorage.setItem(KEY, JSON.stringify(sess));
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ session, ready, login, logout }), [session, ready, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudent() {
  return useContext(Ctx);
}
