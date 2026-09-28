// Family (parent) login: one shared family account per admission form.
import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";
import { verifyPassword } from "@/lib/password";
import { findFamilyAccount } from "@/lib/actions";
import { familyLoginBlock, familySession } from "@/lib/parent-auth";

export const dynamic = "force-dynamic";

// One shared family login for ALL parents on the admission form. Accepts the
// family username (nansubuga.family) OR any parent email address on file.
// Live posture: every family must use their own password — there is no
// shared/magic password shortcut.
export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const db = getDB();
    const account = findFamilyAccount(db, username);

    // Username-or-email + the family's chosen password.
    if (account && verifyPassword(password, account.password)) {
      const blocked = familyLoginBlock(account);
      if (blocked) return NextResponse.json(blocked.body, { status: blocked.status });
      return NextResponse.json({ ok: true, session: familySession(db, account) });
    }

    // No account found, or the password didn't match. Never reveal which.
    return NextResponse.json(
      { ok: false, error: "That username/email or password doesn't match a family account. Check the details from your registration SMS or use the password-reset link below." },
      { status: 401 },
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Login failed" }, { status: 400 });
  }
}
