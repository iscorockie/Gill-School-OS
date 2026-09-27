import { NextResponse } from "next/server";
import { mailStatus, verifyMailConnection } from "@/lib/mail";

export const dynamic = "force-dynamic";

// Email health summary for the Head console. Never exposes the password.
// When SMTP is configured we also verify the live connection (EHLO + auth)
// unless the caller passes ?verify=0, so the console can show
// "live — verified" vs "configured but failing" with the actual error.
export async function GET(req) {
  const status = mailStatus();
  const skipVerify = new URL(req.url).searchParams.get("verify") === "0";
  let verified = null;
  let verifyError = null;
  if (status.configured && !skipVerify) {
    const v = await verifyMailConnection();
    verified = v.ok;
    verifyError = v.ok ? null : v.error;
  }
  return NextResponse.json({ ok: true, ...status, verified, verifyError });
}
