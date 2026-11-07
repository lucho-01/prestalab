import { NextRequest, NextResponse } from 'next/server';
import { requireMobileAuth } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const guard = await requireMobileAuth(request);
  if ('response' in guard) return guard.response;

  return NextResponse.json({
    success: true,
    user: guard.user,
  });
}
