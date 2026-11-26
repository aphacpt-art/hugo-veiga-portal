'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SolicitarContacto() {
  const [f, setF] = useState({ nome: '', empresa: '', nif: '', email: '', telefone: '', mensagem: '' });
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submeter(e) {
    e.preventDefault();
    setErro(''); setAEnviar(true);
    const supabase = createClient();
    const { error } = await supabase.from('pedidos_contacto').insert({
      nome: f.nome.trim(), empresa: f.empresa.trim() || null, nif: f.nif.trim() || null,
      email: f.email.trim(), telefone: f.telefone.trim(), mensagem: f.mensagem.trim() || null,
    });
    setAEnviar(false);
    if (error) return setErro('Não foi possível enviar o pedido. Tente novamente.');
    setEnviado(true);
  }

  return (
    <div className="entrar">
      {enviado ? (
        <div className="card">
          <span className="marca">HUGO <span>VEIGA</span></span>
          <p>Obrigado! Recebemos o seu pedido e entraremos em contacto brevemente.</p>
          <a className="btn" href="/entrar">Voltar</a>
        </div>
      ) : (
        <form className="card" onSubmit={submeter}>
          <span className="marca">HUGO <span>VEIGA</span></span>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>Solicitar contacto</p>
          <label htmlFor="nome">Nome *</label>
          <input id="nome" required maxLength={200} value={f.nome} onChange={set('nome')} />
          <label htmlFor="empresa">Empresa / loja</label>
          <input id="empresa" maxLength={200} value={f.empresa} onChange={set('empresa')} />
          <label htmlFor="nif">NIF</label>
          <input id="nif" inputMode="numeric" maxLength={20} value={f.nif} onChange={set('nif')} />
          <label htmlFor="email">E-mail *</label>
          <input id="email" type="email" required maxLength={200} value={f.email} onChange={set('email')} />
          <label htmlFor="telefone">Telemóvel *</label>
          <input id="telefone" type="tel" inputMode="tel" autoComplete="tel" required minLength={9} maxLength={40} value={f.telefone} onChange={set('telefone')} placeholder="9XX XXX XXX" />
          <label htmlFor="mensagem">Mensagem</label>
          <textarea id="mensagem" rows={3} maxLength={2000} value={f.mensagem} onChange={set('mensagem')}
            placeholder="Que produtos ou marcas lhe interessam?" />
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="btn primario" style={{ width: '100%', marginTop: 16 }} disabled={aEnviar}>
            {aEnviar ? 'A enviar…' : 'Enviar pedido'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 14, marginBottom: 0 }}><a href="/entrar" className="muted">Já sou cliente</a></p>
        </form>
      )}
    </div>
  );
}
