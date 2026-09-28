import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";

export const dynamic = "force-dynamic";

// Supervised student sign-in: the parent-created username + password.
// Students never see fees; every account is supervised by the family.
// Live posture: every student must use their own password — no shortcuts.
export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const db = getDB();
    const account = db.studentAccounts.find(
      (a) =>
        a.username.trim().toLowerCase() === String(username || "").trim().toLowerCase() &&
        a.password === String(password || "")
    );
    if (!account) {
      return NextResponse.json(
        { ok: false, error: "That username or password doesn't match. Ask your parent to check Student Accounts." },
        { status: 401 }
      );
    }
    if (account.status === "closed") {
      return NextResponse.json(
        { ok: false, error: "This account is closed — the student has completed or left the school. Contact the school office with any questions." },
        { status: 403 }
      );
    }
    if (account.status !== "active") {
      return NextResponse.json({ ok: false, error: "This account is paused. Ask a parent or the school office." }, { status: 403 });
    }
    if (account.mustReset) {
      return NextResponse.json(
        { ok: false, resetRequired: true, error: "Password reset required — ask your parent to open Forgot password; the code goes to their email." },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: true, session: studentSession(db, account) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

function studentSession(db, account) {
  const student = db.studentIndex[account.studentId];
  const fam = db.families.find((f) => f.id === student?.familyId);
  return {
    accountId: account.id,
    studentId: student?.id || account.studentId,
    name: student?.name || "Student",
    schoolId: student?.schoolId || "—",
    class: student?.class || "—",
    campus: student?.campus || "main",
    supervisedBy: fam?.name || "Family",
    perms: account.perms,
  };
}
