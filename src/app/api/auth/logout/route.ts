import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Sesión cerrada correctamente' });
  response.cookies.delete('auth_token');
  return response;
}
