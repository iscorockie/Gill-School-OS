"use client";
import { useCallback, useContext, useEffect, useMemo, useState, createContext } from "react";

// Session storage shared by layout + login-page providers — single source of
// truth, so logging in on /portal/login immediately updates the layout Gate.
const KEY = "gill_parent_session";
const Ctx = createContext(null);

function readSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.familyId ? s : null;
  } catch {
    return null;
  }
}

export function ParentProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readSession());
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

export function useParent() {
  return useContext(Ctx);
}
