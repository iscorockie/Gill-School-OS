import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";

export const dynamic = "force-dynamic";

// Demo authentication: validates the parent-created student account and
// returns the linked student profile. In production this becomes a real
// session (JWT + bcrypt) with the exact same supervised-account model.
export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const db = getDB();
    // Demo flow: accept any username with the demo password gill2026
    const demoPassword = "gill2026";
    if (String(password || "") === demoPassword) {
      const demoStudentAccount = db.studentAccounts.find((a) => a.status === "active");
      if (demoStudentAccount) {
        const student = db.studentIndex[demoStudentAccount.studentId];
        const fam = db.families.find((f) => f.id === student?.familyId);
        return NextResponse.json({
          ok: true,
          session: {
            accountId: demoStudentAccount.id,
            studentId: student?.id || demoStudentAccount.studentId,
            name: student?.name || "Demo Student",
            schoolId: student?.schoolId || "S-DEMO",
            class: student?.class || "Demo Class",
            campus: student?.campus || "main",
            supervisedBy: fam?.name || "Demo Family",
            perms: demoStudentAccount.perms,
          },
        });
      }
    }
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
    if (account.status !== "active") {
      return NextResponse.json({ ok: false, error: "This account is paused. Ask a parent or the school office." }, { status: 403 });
    }
    const student = db.studentIndex[account.studentId];
    const fam = db.families.find((f) => f.id === student.familyId);
    return NextResponse.json({
      ok: true,
      session: {
        accountId: account.id,
        studentId: student.id,
        name: student.name,
        schoolId: student.schoolId,
        class: student.class,
        campus: student.campus,
        supervisedBy: fam.name,
        perms: account.perms,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
