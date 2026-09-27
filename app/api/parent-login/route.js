import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";
import { findFamilyAccount } from "@/lib/actions";
import { verifyPassword } from "@/lib/password";
import { isMailConfigured } from "@/lib/mail";
import { familyLoginBlock, familySession } from "@/lib/parent-auth";

export const dynamic = "force-dynamic";

// One shared family login for ALL parents on the admission form. Accepts the
// family username (nansubuga.family) OR any parent email address on file.
export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const db = getDB();
    const account = findFamilyAccount(db, username);

    // Real account first: username-or-email + the family's chosen password.
    if (account && verifyPassword(password, account.password)) {
      const blocked = familyLoginBlock(account);
      if (blocked) return NextResponse.json(blocked.body, { status: blocked.status });
      return NextResponse.json({ ok: true, session: familySession(db, account) });
    }

    // Demo shortcut (simulated mode only): once real SMTP is configured this
    // backdoor closes and every family must use their own password.
    if (!isMailConfigured() && String(password || "") === "gill2026") {
      const demoAccount = db.familyAccounts.find(
        (a) => a.username === "nansubuga.family" && a.status === "active" && a.verified !== false
      );
      if (demoAccount) {
        const blocked = familyLoginBlock(demoAccount);
        if (blocked) return NextResponse.json(blocked.body, { status: blocked.status });
        return NextResponse.json({ ok: true, session: familySession(db, demoAccount), demo: true });
      }
    }

    if (!account) {
      return NextResponse.json(
        { ok: false, error: "That family login doesn't match. Check the SMS invite, or contact the school office." },
        { status: 401 }
      );
    }
    const blocked = guard(account);
    if (blocked) return blocked;
    return NextResponse.json({ ok: false, error: "That password doesn't match." }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
