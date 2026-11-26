import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next')?.startsWith('/') ? searchParams.get('next') : '/';
  const supabase = await createClient();
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  let error = null;
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  else error = new Error('sem código');
  if (error) return NextResponse.redirect(`${origin}/entrar?erro=link`);
  return NextResponse.redirect(`${origin}${next}`);
}
