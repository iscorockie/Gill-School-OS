import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";
import { findFamilyAccount } from "@/lib/actions";
import { verifyPassword } from "@/lib/password";
import { isMailConfigured } from "@/lib/mail";

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
      const blocked = guard(account);
      if (blocked) return blocked;
      return NextResponse.json({ ok: true, session: familySession(db, account) });
    }

    // Demo shortcut (simulated mode only): once real SMTP is configured this
    // backdoor closes and every family must use their own password.
    if (!isMailConfigured() && String(password || "") === "gill2026") {
      const demoAccount = db.familyAccounts.find(
        (a) => a.username === "nansubuga.family" && a.status === "active" && a.verified !== false
      );
      if (demoAccount) {
        const blocked = guard(demoAccount);
        if (blocked) return blocked;
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

function guard(account) {
  // "pending" = family created their own account on /register; they may sign
  // in to track the application, but the portal stays in application mode
  // until the Admissions registrar verifies documents + tuition (> "active").
  if (account.status !== "active" && account.status !== "pending") {
    return NextResponse.json({ ok: false, error: "This family account is pending." }, { status: 403 });
  }
  if (account.verified === false) {
    return NextResponse.json(
      { ok: false, error: "Open your invite link (from the SMS) to create a password and verify your number first." },
      { status: 403 }
    );
  }
  if (account.mustReset) {
    return NextResponse.json(
      { ok: false, resetRequired: true, error: "Password reset required — open Forgot password and enter the code emailed to the parent address on file." },
      { status: 403 }
    );
  }
  return null;
}

function familySession(db, account) {
  const fam = db.families.find((f) => f.id === account.familyId);
  const members = (account.members || [])
    .map((id) => db.users.find((u) => u.id === id))
    .filter(Boolean)
    .map((u) => ({ id: u.id, name: u.name, phone: u.phone, relation: u.relation }));
  const invites = db.deliveries.filter((d) => d.ref && db.applications.some((a) => a.id === d.ref && a.studentId && db.studentIndex[a.studentId]?.familyId === account.familyId) && d.channel === "SMS");
  return {
    familyId: account.familyId,
    familyName: fam.name,
    username: account.username,
    primaryUserId: account.members[0],
    members,
    inviteLink: account.inviteLink,
    smsInvitesTo: invites.map((d) => d.to),
    status: account.status,
  };
}
