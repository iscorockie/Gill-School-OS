// Gill School OS — password hashing (no native dependencies).
//
// New passwords (staff invites, password resets) are stored as
// `scrypt$<salt>$<hash>`. Seeded demo accounts keep their plaintext demo
// password (e.g. gill2026) so the demo works out of the box; verifyPassword()
// accepts both formats, so old databases keep working after upgrade.

import crypto from "node:crypto";

export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(plain), salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function isHashed(stored) {
  return typeof stored === "string" && stored.startsWith("scrypt$");
}

export function verifyPassword(plain, stored) {
  if (plain == null || !stored) return false;
  if (!isHashed(stored)) {
    // Legacy / demo account: direct compare.
    return String(plain) === String(stored);
  }
  try {
    const [, salt, hash] = String(stored).split("$");
    if (!salt || !hash) return false;
    const check = crypto.scryptSync(String(plain), salt, 32);
    const expected = Buffer.from(hash, "hex");
    return check.length === expected.length && crypto.timingSafeEqual(check, expected);
  } catch {
    return false;
  }
}

export function setPasswordOn(record, plain) {
  record.password = hashPassword(plain);
  record.passwordSet = true;
}
