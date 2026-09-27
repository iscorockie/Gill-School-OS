import { NextResponse } from "next/server";
import { runAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Unified email password-reset for all three portals (staff · parent ·
// student). Step 1 emails a 6-digit code, step 2 sets the new password.
const OPS = ["requestPasswordReset", "verifyResetCode", "resetPasswordWithCode"];

export async function POST(req) {
  try {
    const { op, ...payload } = await req.json();
    if (!OPS.includes(op)) throw new Error(`Unknown reset step: ${op}`);
    const result = await runAction(op, payload);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
