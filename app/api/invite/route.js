import { NextResponse } from "next/server";
import { runAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Invite flow steps: look up the invite link, create the family password,
// resend the verification code, verify the code (→ shared family session).
export async function POST(req) {
  try {
    const { op, ...payload } = await req.json();
    const result = runAction(op, payload);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
