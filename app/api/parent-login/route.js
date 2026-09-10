import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";

export const dynamic = "force-dynamic";

// One shared family login for ALL parents on the admission form.
export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const db = getDB();
    // Demo flow: accept any username/email with the demo password gill2026
    const demoPassword = "gill2026";
    if (String(password || "") === demoPassword) {
      // Return the default demo family for any email/username in demo mode
      const demoAccount = db.familyAccounts.find((a) => a.username === "nansubuga.family" && a.status === "active" && a.verified !== false);
      if (demoAccount) {
        const fam = db.families.find((f) => f.id === demoAccount.familyId);
        const members = demoAccount.members
          .map((id) => db.users.find((u) => u.id === id))
          .filter(Boolean)
          .map((u) => ({ id: u.id, name: u.name, phone: u.phone, relation: u.relation }));
        const invites = db.deliveries.filter((d) => d.ref && db.applications.some((a) => a.id === d.ref && a.studentId && db.studentIndex[a.studentId]?.familyId === demoAccount.familyId) && d.channel === "SMS");
        return NextResponse.json({
          ok: true,
          session: {
            familyId: demoAccount.familyId,
            familyName: fam.name,
            username: demoAccount.username,
            primaryUserId: demoAccount.members[0],
            members,
            inviteLink: demoAccount.inviteLink,
            smsInvitesTo: invites.map((d) => d.to),
            status: demoAccount.status,
          },
        });
      }
    }
    const account = db.familyAccounts.find(
      (a) => a.username.trim().toLowerCase() === String(username || "").trim().toLowerCase()
    );
    if (!account) {
      return NextResponse.json(
        { ok: false, error: "That family login doesn't match. Check the SMS invite, or contact the school office." },
        { status: 401 }
      );
    }
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
    if (account.password !== String(password || "")) {
      return NextResponse.json({ ok: false, error: "That password doesn't match." }, { status: 401 });
    }
    const fam = db.families.find((f) => f.id === account.familyId);
    const members = account.members
      .map((id) => db.users.find((u) => u.id === id))
      .filter(Boolean)
      .map((u) => ({ id: u.id, name: u.name, phone: u.phone, relation: u.relation }));
    const invites = db.deliveries.filter((d) => d.ref && db.applications.some((a) => a.id === d.ref && a.studentId && db.studentIndex[a.studentId]?.familyId === account.familyId) && d.channel === "SMS");
    return NextResponse.json({
      ok: true,
      session: {
        familyId: account.familyId,
        familyName: fam.name,
        username: account.username,
        primaryUserId: account.members[0],
        members,
        inviteLink: account.inviteLink,
        smsInvitesTo: invites.map((d) => d.to),
        status: account.status,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
