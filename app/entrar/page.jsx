'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Entrar() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modo, setModo] = useState('entrar');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro(''); setAviso(''); setAEnviar(true);
    const supabase = createClient();
    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setAEnviar(false);
      if (error) return setErro('E-mail ou password incorretos.');
      router.replace('/');
      router.refresh();
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/definir-password`,
      });
      setAEnviar(false);
      if (error) return setErro('Não foi possível enviar o e-mail. Tente novamente.');
      setAviso('Se o e-mail estiver registado, vai receber um link para definir a password.');
    }
  }

  return (
    <div className="entrar">
      <form className="card" onSubmit={submeter}>
        <span className="marca">HUGO <span>VEIGA</span></span>
        <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>Área reservada a clientes</p>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {modo === 'entrar' && (
          <>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        )}
        {erro && <p className="erro" role="alert">{erro}</p>}
        {aviso && <p className="sucesso" role="status">{aviso}</p>}
        <button className="btn primario" style={{ width: '100%', marginTop: 16 }} disabled={aEnviar}>
          {aEnviar ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Enviar link'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 14, marginBottom: 0 }}>
          <button type="button" className="btn" style={{ border: 0, background: 'none', color: 'var(--muted)' }}
            onClick={() => { setModo(modo === 'entrar' ? 'recuperar' : 'entrar'); setErro(''); setAviso(''); }}>
            {modo === 'entrar' ? 'Esqueci-me da password' : 'Voltar a entrar'}
          </button>
        </p>
        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '16px 0' }} />
        <p className="muted" style={{ textAlign: 'center', fontSize: 14, margin: '0 0 8px' }}>Ainda não é cliente?</p>
        <a className="btn" style={{ width: '100%' }} href="/solicitar-contacto">Solicitar contacto</a>
      </form>
    </div>
  );
}
