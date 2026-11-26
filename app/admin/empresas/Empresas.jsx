'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { urlLogotipo } from '@/lib/logotipo';

const VAZIA = { nome: '', setor: '', descricao: '', site_url: '', ordem: 0, ativa: true };

export default function Empresas({ iniciais }) {
  const router = useRouter();
  const [ed, setEd] = useState(null);
  const [logo, setLogo] = useState(null);
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  async function guardar(e) {
    e.preventDefault(); setErro(''); setAGuardar(true);
    const supabase = createClient();
    const dados = { nome: ed.nome.trim(), setor: ed.setor || null, descricao: ed.descricao || null,
      site_url: ed.site_url ? (/^https?:\/\//.test(ed.site_url) ? ed.site_url : `https://${ed.site_url}`) : null,
      ordem: Number(ed.ordem) || 0, ativa: !!ed.ativa };
    let id = ed.id;
    const r = id ? await supabase.from('empresas').update(dados).eq('id', id) : await supabase.from('empresas').insert(dados).select('id').single();
    if (r.error) { setAGuardar(false); return setErro(r.error.message); }
    if (!id) id = r.data.id;
    if (logo) {
      const path = `${id}/${Date.now()}-${logo.name.replace(/[^\w.-]/g, '_')}`;
      const up = await supabase.storage.from('logotipos').upload(path, logo, { upsert: true });
      if (up.error) { setAGuardar(false); return setErro('Logótipo: ' + up.error.message); }
      await supabase.from('empresas').update({ logotipo_path: path }).eq('id', id);
    }
    setAGuardar(false); setEd(null); setLogo(null); router.refresh();
  }

  return (
    <>
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <h1>Empresas representadas</h1>
        <button className="btn primario" onClick={() => { setEd({ ...VAZIA }); setLogo(null); }}>Nova empresa</button>
      </div>
      {ed && (
        <form className="card pad" onSubmit={guardar} style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>{ed.id ? `Editar ${ed.nome}` : 'Nova empresa'}</h2>
          <div className="cols2">
            <div><label htmlFor="nome">Nome *</label><input id="nome" required value={ed.nome} onChange={(e) => setEd({ ...ed, nome: e.target.value })} /></div>
            <div><label htmlFor="setor">Setor</label>
              <input id="setor" list="setores" value={ed.setor ?? ''} onChange={(e) => setEd({ ...ed, setor: e.target.value })} />
              <datalist id="setores"><option value="Decoração" /><option value="Souvenirs" /><option value="Místicos e esotéricos" /></datalist></div>
            <div><label htmlFor="site">Site da marca</label><input id="site" value={ed.site_url ?? ''} onChange={(e) => setEd({ ...ed, site_url: e.target.value })} placeholder="www.marca.pt" /></div>
            <div><label htmlFor="ordem">Ordem de apresentação</label><input id="ordem" type="number" value={ed.ordem} onChange={(e) => setEd({ ...ed, ordem: e.target.value })} /></div>
          </div>
          <label htmlFor="desc">Descrição curta</label>
          <textarea id="desc" rows={2} value={ed.descricao ?? ''} onChange={(e) => setEd({ ...ed, descricao: e.target.value })} />
          <label htmlFor="logo">Logótipo (PNG, JPG ou SVG)</label>
          <input id="logo" type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--ink)' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={!!ed.ativa} onChange={(e) => setEd({ ...ed, ativa: e.target.checked })} /> Visível para os clientes</label>
          {erro && <p className="erro">{erro}</p>}
          <div className="linha" style={{ marginTop: 12 }}>
            <button className="btn primario" disabled={aGuardar}>{aGuardar ? 'A guardar…' : 'Guardar'}</button>
            <button type="button" className="btn" onClick={() => setEd(null)}>Cancelar</button>
          </div>
        </form>
      )}
      <div className="grelha">
        {iniciais.map((e) => (
          <button key={e.id} className="card empresa-tile" style={{ cursor: 'pointer', font: 'inherit', color: 'inherit' }} onClick={() => { setEd(e); setLogo(null); }}>
            {e.logotipo_path ? <img src={urlLogotipo(e.logotipo_path)} alt="" /> : null}
            <strong>{e.nome}</strong>
            <span className="muted" style={{ fontSize: 13 }}>{e.setor || '—'}{e.ativa ? '' : ' · oculta'}</span>
          </button>
        ))}
        {!iniciais.length && <p className="muted">Ainda não há empresas. Crie a primeira.</p>}
      </div>
    </>
  );
}
