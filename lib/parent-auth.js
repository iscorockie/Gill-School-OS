export function familyLoginBlock(account) {
  if (account.status !== "active" && account.status !== "pending") {
    return { status: 403, body: { ok: false, error: "This family account is pending." } };
  }
  if (account.verified === false) {
    return {
      status: 403,
      body: { ok: false, error: "Open your invite link (from the SMS) to create a password and verify your number first." },
    };
  }
  if (account.mustReset) {
    return {
      status: 403,
      body: { ok: false, resetRequired: true, error: "Password reset required — open Forgot password and enter the code emailed to the parent address on file." },
    };
  }
  return null;
}

export function familySession(db, account) {
  const fam = db.families.find((family) => family.id === account.familyId);
  const members = (account.members || [])
    .map((id) => db.users.find((user) => user.id === id))
    .filter(Boolean)
    .map((user) => ({ id: user.id, name: user.name, phone: user.phone, relation: user.relation }));
  const invites = db.deliveries.filter((delivery) =>
    delivery.ref &&
    db.applications.some((application) =>
      application.id === delivery.ref &&
      application.studentId &&
      db.studentIndex[application.studentId]?.familyId === account.familyId
    ) &&
    delivery.channel === "SMS"
  );
  return {
    familyId: account.familyId,
    familyName: fam.name,
    username: account.username,
    primaryUserId: account.members[0],
    members,
    inviteLink: account.inviteLink,
    smsInvitesTo: invites.map((delivery) => delivery.to),
    status: account.status,
  };
}
