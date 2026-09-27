import { NextResponse } from "next/server";
import { runAction } from "@/lib/actions";
import { getPublicDB } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { type, payload } = await req.json();
    const result = await runAction(type, payload || {});
    return NextResponse.json({ ok: true, result, db: getPublicDB() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
