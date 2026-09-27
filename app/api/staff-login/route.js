import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";
import { staffSessionFor } from "@/lib/actions";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

// Staff sign-in: school email (@gill.ac.ug webmail address) + portal password.
// The mailbox lives in cPanel; the portal password is set via the emailed
// staff invite and can be reset any time with Forgot password.
export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const db = getDB();
    const key = String(email || "").trim().toLowerCase();
    const account = (db.staffAccounts || []).find(
      (a) => String(a.email || "").toLowerCase() === key
    );
    if (!account) {
      return NextResponse.json(
        { ok: false, error: "We couldn't find that staff email. Check the spelling, open your invite email, or ask the Head of School." },
        { status: 401 }
      );
    }
    if (account.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "This account is deactivated — contact the Head of School." },
        { status: 403 }
      );
    }
    if (account.verified === false || !account.passwordSet) {
      return NextResponse.json(
        { ok: false, error: "Open your invite email to set a password first." },
        { status: 403 }
      );
    }
    if (account.mustReset) {
      return NextResponse.json(
        { ok: false, resetRequired: true, error: "Password reset required — open Forgot password and enter the code we email to this address." },
        { status: 403 }
      );
    }
    if (!verifyPassword(password, account.password)) {
      return NextResponse.json(
        { ok: false, error: "That password doesn't match. Use Forgot password if you need a reset." },
        { status: 401 }
      );
    }
    return NextResponse.json({ ok: true, session: staffSessionFor(db, account) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
