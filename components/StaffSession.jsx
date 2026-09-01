"use client";
import { useCallback, useEffect, useState } from "react";

const KEY = "gill_staff_session";

// Lightweight staff identity for the demo: signed in from /staff, shown
// across the administration workspace.
export function useStaff() {
  const [staff, setStaff] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setStaff(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const signIn = useCallback((s) => {
    setStaff(s);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(() => {
    setStaff(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { staff, ready, signIn, signOut };
}
