import { NextResponse } from "next/server";
import { mailConfig } from "@/lib/mail";

export const dynamic = "force-dynamic";

// Email health summary for the Head console. Never exposes the password.
export async function GET() {
  const c = mailConfig();
  return NextResponse.json({
    ok: true,
    configured: c.configured,
    host: c.configured ? c.host : null,
    port: c.configured ? c.port : null,
    secure: c.configured ? c.secure : null,
    user: c.configured ? c.user : null,
    from: c.configured ? c.from : null,
  });
}
