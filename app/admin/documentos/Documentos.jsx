'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { gerarCapaPdf } from '@/lib/capaPdf';

const TIPOS = [['catalogo', 'Catálogo'], ['precos', 'Tabela de preços'], ['outro', 'Outro']];
const formatoDe = (nome) => /\.(xlsx|xls|csv)$/i.test(nome) ? 'excel' : /\.pdf$/i.test(nome) ? 'pdf' : null;

export default function Documentos({ empresas, docs, filtro }) {
  const router = useRouter();
  const [empresaId, setEmpresaId] = useState(filtro || '');
  const [tipo, setTipo] = useState('catalogo');
  const [epoca, setEpoca] = useState('');
  const [ficheiros, setFicheiros] = useState([]);
  const [capa, setCapa] = useState(null);
  const [estado, setEstado] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  async function carregar(e) {
    e.preventDefault();
    if (!empresaId || !ficheiros.length) return;
    setAEnviar(true);
    const supabase = createClient();
    let ok = 0; const erros = [];
    for (const [i, f] of ficheiros.entries()) {
      setEstado(`A carregar ${i + 1}/${ficheiros.length}: ${f.name}`);
      const formato = formatoDe(f.name);
      if (!formato) { erros.push(`${f.name}: formato não suportado`); continue; }
      const id = crypto.randomUUID();
      const ext = f.name.split('.').pop().toLowerCase();
      const ficheiro_path = `${empresaId}/${id}.${ext}`;
      const up = await supabase.storage.from('documentos').upload(ficheiro_path, f, { contentType: f.type || undefined });
      if (up.error) { erros.push(`${f.name}: ${up.error.message}`); continue; }
      let capa_path = null;
      try {
        const imagem = ficheiros.length === 1 && capa ? capa : formato === 'pdf' ? await gerarCapaPdf(f) : null;
        if (imagem) {
          capa_path = `${empresaId}/capas/${id}.jpg`;
          const c = await supabase.storage.from('documentos').upload(capa_path, imagem, { contentType: imagem.type || 'image/jpeg' });
          if (c.error) capa_path = null;
        }
      } catch { capa_path = null; }
      const titulo = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
      const ins = await supabase.from('documentos').insert({ id, empresa_id: empresaId, tipo, titulo, formato, ficheiro_path, capa_path, epoca: epoca || null });
      if (ins.error) erros.push(`${f.name}: ${ins.error.message}`); else ok++;
    }
    setAEnviar(false); setFicheiros([]); setCapa(null);
    setEstado(`${ok} documento(s) carregado(s).${erros.length ? ' Erros: ' + erros.join('; ') : ''}`);
    e.target.reset();
    router.refresh();
  }

  async function atualizar(id, dados) {
    await createClient().from('documentos').update(dados).eq('id', id);
    router.refresh();
  }

  async function apagar(d) {
    if (!window.confirm(`Apagar “${d.titulo}”? Os clientes deixam de o ver.`)) return;
    const supabase = createClient();
    await supabase.storage.from('documentos').remove([d.ficheiro_path, d.capa_path].filter(Boolean));
    await supabase.from('documentos').delete().eq('id', d.id);
    router.refresh();
  }

  return (
    <>
      <h1>Documentos</h1>
      <form className="card pad" onSubmit={carregar}>
        <h2 style={{ marginTop: 0 }}>Carregar catálogos ou tabelas de preços</h2>
        <div className="cols2">
          <div><label htmlFor="emp">Empresa *</label>
            <select id="emp" required value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
              <option value="">Escolha…</option>{empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select></div>
          <div><label htmlFor="tipo">Tipo</label>
            <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>{TIPOS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div>
          <div><label htmlFor="epoca">Época / ano (opcional)</label><input id="epoca" value={epoca} onChange={(e) => setEpoca(e.target.value)} placeholder="Ex.: 2027, Natal 2026" /></div>
          <div><label htmlFor="fich">Ficheiros (PDF ou Excel, pode escolher vários)</label>
            <input id="fich" type="file" multiple accept=".pdf,.xlsx,.xls,.csv" required onChange={(e) => setFicheiros([...(e.target.files || [])])} /></div>
        </div>
        {ficheiros.length === 1 && (<>
          <label htmlFor="capa">Capa personalizada (opcional; nos PDF usa-se a 1.ª página)</label>
          <input id="capa" type="file" accept="image/*" onChange={(e) => setCapa(e.target.files?.[0] || null)} />
        </>)}
        <div className="linha" style={{ marginTop: 12 }}>
          <button className="btn primario" disabled={aEnviar || !empresaId || !ficheiros.length}>{aEnviar ? 'A carregar…' : 'Carregar'}</button>
          {estado && <span role="status" className="muted">{estado}</span>}
        </div>
      </form>

      <div className="linha" style={{ margin: '24px 0 12px' }}>
        <h2 style={{ margin: 0 }}>Documentos carregados</h2>
        <select style={{ width: 'auto' }} value={filtro} onChange={(e) => router.push(`/admin/documentos${e.target.value ? '?empresa=' + e.target.value : ''}`)}>
          <option value="">Todas as empresas</option>{empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </div>
      <div className="card tabela-scroll">
        <table className="lista">
          <thead><tr><th>Título</th><th>Empresa</th><th>Tipo</th><th>Formato</th><th>Visível</th><th></th></tr></thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td><input defaultValue={d.titulo} onBlur={(e) => e.target.value !== d.titulo && atualizar(d.id, { titulo: e.target.value })} aria-label="Título" /></td>
                <td>{d.empresas?.nome}</td>
                <td><select value={d.tipo} onChange={(e) => atualizar(d.id, { tipo: e.target.value })} aria-label="Tipo">{TIPOS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></td>
                <td>{d.formato === 'excel' ? 'Excel' : 'PDF'}{d.capa_path ? '' : ' · sem capa'}</td>
                <td><input type="checkbox" style={{ width: 'auto' }} checked={d.ativo} onChange={(e) => atualizar(d.id, { ativo: e.target.checked })} aria-label="Visível" /></td>
                <td className="linha"><a className="btn" href={`/documento/${d.id}?acao=ver`} target="_blank" rel="noopener">Ver</a><button className="btn perigo" onClick={() => apagar(d)}>Apagar</button></td>
              </tr>
            ))}
            {!docs.length && <tr><td colSpan={6} className="muted">Sem documentos.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
