'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const soDigitos = (s) => (s || '').replace(/\D/g, '');

export default function DefinirPassword() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [semSessao, setSemSessao] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [nif, setNif] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      // Convites enviados pelo back-office chegam com os tokens no fragmento (#access_token=...)
      const hash = new URLSearchParams(window.location.hash.slice(1));
      if (hash.get('access_token') && hash.get('refresh_token')) {
        await supabase.auth.setSession({ access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token') });
        window.history.replaceState(null, '', window.location.pathname);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSemSessao(true); setPronto(true); return; }
      const { data } = await supabase.from('clientes').select('id, nif, nome, convidado_em, ultimo_acesso').eq('user_id', user.id).maybeSingle();
      setCliente(data);
      setPronto(true);
    })();
  }, []);

  async function submeter(e) {
    e.preventDefault();
    setErro('');
    if (cliente && soDigitos(nif) !== soDigitos(cliente.nif)) return setErro('O NIF não corresponde à sua ficha de cliente.');
    if (p1.length < 8) return setErro('A password deve ter pelo menos 8 caracteres.');
    if (p1 !== p2) return setErro('As passwords não coincidem.');
    setAEnviar(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setAEnviar(false);
    if (error) return setErro('Não foi possível guardar a password. Tente novamente.');
    router.replace('/');
    router.refresh();
  }

  if (!pronto) return <div className="entrar"><p className="muted">A carregar…</p></div>;
  if (semSessao) return (
    <div className="entrar"><div className="card">
      <span className="marca">HUGO <span>VEIGA</span></span>
      <p>Este link expirou ou já foi usado.</p>
      <a className="btn primario" href="/entrar">Ir para a entrada</a>
    </div></div>
  );

  return (
    <div className="entrar">
      <form className="card" onSubmit={submeter}>
        <span className="marca">HUGO <span>VEIGA</span></span>
        <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>
          {cliente ? `Bem-vindo${cliente.nome ? ', ' + cliente.nome : ''}. Defina a sua password.` : 'Defina a sua password.'}
        </p>
        {cliente && (<>
          <label htmlFor="nif">NIF (para confirmar a sua identidade)</label>
          <input id="nif" inputMode="numeric" required value={nif} onChange={(e) => setNif(e.target.value)} />
        </>)}
        <label htmlFor="p1">Nova password</label>
        <input id="p1" type="password" autoComplete="new-password" required value={p1} onChange={(e) => setP1(e.target.value)} />
        <label htmlFor="p2">Repetir password</label>
        <input id="p2" type="password" autoComplete="new-password" required value={p2} onChange={(e) => setP2(e.target.value)} />
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn primario" style={{ width: '100%', marginTop: 16 }} disabled={aEnviar}>
          {aEnviar ? 'Aguarde…' : 'Guardar e entrar'}
        </button>
      </form>
    </div>
  );
}
