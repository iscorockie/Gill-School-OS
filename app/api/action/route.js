import { NextResponse } from "next/server";
import { runAction } from "@/lib/actions";
import { getDB } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { type, payload } = await req.json();
    const result = runAction(type, payload || {});
    return NextResponse.json({ ok: true, result, db: getDB() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
