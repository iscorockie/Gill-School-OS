import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";
import { findFamilyAccount, staffSessionFor } from "@/lib/actions";
import { verifyPassword } from "@/lib/password";
import { isMailConfigured } from "@/lib/mail";
import { familyLoginBlock, familySession } from "@/lib/parent-auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const key = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key) || !password) {
      return NextResponse.json({ ok: false, error: "Enter the email address and password linked to your OS account." }, { status: 400 });
    }

    const db = getDB();
    const staff = (db.staffAccounts || []).find(
      (account) => String(account.email || "").trim().toLowerCase() === key
    );
    const family = findFamilyAccount(db, key);
    const matchingAccounts = [];

    if (staff && verifyPassword(password, staff.password)) {
      matchingAccounts.push({ kind: "staff", account: staff });
    }
    if (family && verifyPassword(password, family.password)) {
      matchingAccounts.push({ kind: "parent", account: family });
    }

    if (matchingAccounts.length > 1) {
      return NextResponse.json(
        { ok: false, error: "This email and password match more than one portal account. Use the sign-in page for the portal you need." },
        { status: 409 }
      );
    }

    const match = matchingAccounts[0];
    if (match?.kind === "staff") {
      const account = match.account;
      if (account.status !== "active") {
        return NextResponse.json({ ok: false, error: "This account is deactivated — contact the Head of School." }, { status: 403 });
      }
      if (account.verified === false || !account.passwordSet) {
        return NextResponse.json({ ok: false, error: "Open your invite email to set a password first." }, { status: 403 });
      }
      if (account.mustReset) {
        return NextResponse.json(
          { ok: false, resetRequired: true, error: "Password reset required — open Forgot password and enter the code we email to this address." },
          { status: 403 }
        );
      }
      const session = staffSessionFor(db, account);
      return NextResponse.json({
        ok: true,
        kind: "staff",
        session,
        destination: session.id === "u-admin" ? "/admin" : "/staff/home",
      });
    }

    if (match?.kind === "parent") {
      const blocked = familyLoginBlock(match.account);
      if (blocked) return NextResponse.json(blocked.body, { status: blocked.status });
      return NextResponse.json({ ok: true, kind: "parent", session: familySession(db, match.account) });
    }

    // Match the existing demo sign-in behavior without falling through from a
    // real staff account with a mistyped password into a different account.
    if (!staff && !family && !isMailConfigured() && String(password) === "gill2026") {
      const demoAccount = db.familyAccounts.find(
        (account) => account.username === "nansubuga.family" && account.status === "active" && account.verified !== false
      );
      if (demoAccount) {
        const blocked = familyLoginBlock(demoAccount);
        if (blocked) return NextResponse.json(blocked.body, { status: blocked.status });
        return NextResponse.json({ ok: true, kind: "parent", session: familySession(db, demoAccount), demo: true });
      }
    }

    return NextResponse.json(
      { ok: false, error: "That email or password doesn't match an OS account. Check your details or use Forgot password." },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
