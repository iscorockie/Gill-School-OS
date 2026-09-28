// Shared family-account login rules and session shape. Used by both
// /api/parent-login (family username or parent email) and /api/login
// (shared email sign-in).
//
// Status rules (the family-account lifecycle):
//   "pending" = family created their own account on /register; they may sign
//     in to track the application, but the portal stays in application mode
//     until the Admissions registrar verifies documents + tuition (> "active").
//   "closed"  = every student completed/left the school — tenure over, the
//     admin deletes the accounts afterwards (records are retained).

// Blocked-account responses, applied only AFTER the password has been
// verified so a wrong password can never reveal account status.
export function familyLoginBlock(account) {
  if (account.status === "closed")
    return {
      status: 403,
      body: {
        ok: false,
        error:
          "This family account is closed — the students have completed or left the school. Contact the school office with any questions.",
      },
    };
  if (account.status !== "active" && account.status !== "pending")
    return {
      status: 403,
      body: { ok: false, error: "This family account is not available — contact the school office." },
    };
  if (account.verified === false)
    return {
      status: 403,
      body: {
        ok: false,
        error:
          "Open your invite link (from the SMS) to create a password and verify your number first.",
      },
    };
  if (account.mustReset)
    return {
      status: 403,
      body: {
        ok: false,
        resetRequired: true,
        error:
          "Password reset required — open Forgot password and enter the code emailed to the parent address on file.",
      },
    };
  return null;
}

// The Parent Portal session payload (shape expected by the front-end).
export function familySession(db, account) {
  const fam = db.families.find((f) => f.id === account.familyId);
  const members = (account.members || [])
    .map((id) => db.users.find((u) => u.id === id))
    .filter(Boolean)
    .map((u) => ({ id: u.id, name: u.name, phone: u.phone, relation: u.relation }));
  const invites = db.deliveries.filter(
    (d) =>
      d.ref &&
      db.applications.some(
        (a) => a.id === d.ref && a.studentId && db.studentIndex[a.studentId]?.familyId === account.familyId
      ) &&
      d.channel === "SMS"
  );
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
