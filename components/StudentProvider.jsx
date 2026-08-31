"use client";
import { useCallback, useContext, useEffect, useMemo, useState, createContext } from "react";

// Session storage is shared by layout + page providers (single source of
// truth), so logging in on /student/login immediately updates the layout Gate
// and the redirect to /student renders the real portal.
const KEY = "gill_student_session";
const Ctx = createContext(null);

function readSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.studentId ? s : null;
  } catch {
    return null;
  }
}

export function StudentProvider({ children }) {
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

export function useStudent() {
  return useContext(Ctx);
}
