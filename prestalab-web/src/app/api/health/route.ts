import { NextResponse } from 'next/server';

/** Sonda mínima para verificar la versión desplegada. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    build: 'staff-only-2026-11',
    ambiente: process.env.VERCEL_ENV || 'local',
  });
}
