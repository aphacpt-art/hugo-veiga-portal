'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Campos do portal e palavras usadas para adivinhar a coluna do ficheiro exportado
const CAMPOS = [
  ['nif', 'NIF *', ['nif', 'vat', 'contribuinte', 'tax', 'nipc']],
  ['nome', 'Nome *', ['nome', 'name', 'contact', 'contacto', 'first']],
  ['email', 'E-mail *', ['email', 'e-mail', 'mail']],
  ['empresa_cliente', 'Empresa / loja', ['empresa', 'company', 'organi', 'loja', 'firma']],
  ['telefone', 'Telefone', ['telefone', 'phone', 'mobile', 'telemovel', 'tlm']],
  ['morada', 'Morada', ['morada', 'address', 'endere', 'street']],
  ['codigo_postal', 'Código postal', ['postal', 'zip', 'cp']],
  ['localidade', 'Localidade', ['localidade', 'city', 'cidade']],
  ['pais', 'País', ['pais', 'país', 'country']],
  ['helloleads_id', 'ID HelloLeads', ['lead id', 'id']],
  ['notas', 'Notas', ['nota', 'note', 'coment', 'descri']],
];
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export default function Importador({ empresas }) {
  const [cabecalho, setCabecalho] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [mapa, setMapa] = useState({});
  const [marcas, setMarcas] = useState(new Set());
  const [estado, setEstado] = useState('');
  const [aImportar, setAImportar] = useState(false);

  async function lerFicheiro(e) {
    const ficheiro = e.target.files?.[0]; if (!ficheiro) return;
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await ficheiro.arrayBuffer(), { type: 'array' });
    const dados = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false });
    const [cab, ...resto] = dados;
    const cabN = (cab || []).map(norm);
    const m = {};
    CAMPOS.forEach(([k, , pistas]) => {
      const i = cabN.findIndex((h) => pistas.some((p) => h === p || h.includes(p)));
      if (i >= 0 && !Object.values(m).includes(i)) m[k] = i;
    });
    setCabecalho(cab || []); setLinhas(resto.filter((l) => l.some((c) => String(c).trim()))); setMapa(m); setEstado('');
  }

  const registos = () => linhas.map((l) => {
    const r = {};
    CAMPOS.forEach(([k]) => { if (mapa[k] != null) r[k] = String(l[mapa[k]] ?? '').trim() || null; });
    if (r.email) r.email = r.email.toLowerCase();
    if (r.nif) r.nif = r.nif.replace(/\s/g, '');
    return r;
  });

  async function importar() {
    const todos = registos();
    const validos = todos.filter((r) => r.nif && r.nome && r.email);
    const ignorados = todos.length - validos.length;
    setAImportar(true); setEstado('A importar…');
    const supabase = createClient();
    let ok = 0; const erros = [];
    for (let i = 0; i < validos.length; i += 200) {
      const lote = validos.slice(i, i + 200);
      const { data, error } = await supabase.from('clientes').upsert(lote, { onConflict: 'nif' }).select('id');
      if (error) {
        // tenta um a um para identificar a linha com problema
        for (const r of lote) {
          const u = await supabase.from('clientes').upsert(r, { onConflict: 'nif' }).select('id').single();
          if (u.error) erros.push(`${r.nif} (${r.email}): ${u.error.code === '23505' ? 'e-mail já usado por outro NIF' : u.error.message}`);
          else { ok++; await darAcessos(supabase, [u.data.id]); }
        }
      } else { ok += data.length; await darAcessos(supabase, data.map((d) => d.id)); }
      setEstado(`A importar… ${ok}/${validos.length}`);
    }
    setAImportar(false);
    setEstado(`${ok} cliente(s) importado(s) ou atualizado(s).${ignorados ? ` ${ignorados} linha(s) ignorada(s) por falta de NIF, nome ou e-mail.` : ''}${erros.length ? ` Erros: ${erros.slice(0, 10).join('; ')}${erros.length > 10 ? '…' : ''}` : ''}`);
  }

  async function darAcessos(supabase, ids) {
    if (!marcas.size || !ids.length) return;
    const linhasAcesso = ids.flatMap((cliente_id) => [...marcas].map((empresa_id) => ({ cliente_id, empresa_id })));
    await supabase.from('acessos').upsert(linhasAcesso, { onConflict: 'cliente_id,empresa_id', ignoreDuplicates: true });
  }

  const amostra = registos().slice(0, 5);
  return (
    <>
      <h1>Importar clientes</h1>
      <div className="card pad">
        <p style={{ marginTop: 0 }}>No HelloLeads, exporte os leads/clientes para Excel ou CSV e carregue o ficheiro aqui. Clientes com o mesmo NIF são atualizados, não duplicados. Os convites de acesso não são enviados automaticamente: envie-os depois na lista de clientes.</p>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={lerFicheiro} />
      </div>
      {cabecalho.length > 0 && (<>
        <h2>1. Confirme as colunas ({linhas.length} linhas)</h2>
        <div className="card pad checks">
          {CAMPOS.map(([k, n]) => (
            <div key={k}>
              <label htmlFor={`m-${k}`}>{n}</label>
              <select id={`m-${k}`} value={mapa[k] ?? ''} onChange={(e) => setMapa({ ...mapa, [k]: e.target.value === '' ? undefined : Number(e.target.value) })}>
                <option value="">— não importar —</option>
                {cabecalho.map((h, i) => <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>)}
              </select>
            </div>
          ))}
        </div>
        <h2>2. Marcas a dar a todos os clientes deste ficheiro (opcional)</h2>
        <div className="card pad checks">
          {empresas.map((e) => (
            <label key={e.id}><input type="checkbox" checked={marcas.has(e.id)}
              onChange={() => { const n = new Set(marcas); n.has(e.id) ? n.delete(e.id) : n.add(e.id); setMarcas(n); }} />{e.nome}</label>
          ))}
          {!empresas.length && <p className="muted">Ainda não há empresas criadas; pode dar acessos mais tarde, cliente a cliente.</p>}
        </div>
        <h2>3. Pré-visualização</h2>
        <div className="card tabela-scroll">
          <table className="lista"><thead><tr><th>NIF</th><th>Nome</th><th>E-mail</th><th>Empresa</th><th>Telefone</th></tr></thead>
            <tbody>{amostra.map((r, i) => <tr key={i}><td>{r.nif}</td><td>{r.nome}</td><td>{r.email}</td><td>{r.empresa_cliente}</td><td>{r.telefone}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="linha" style={{ marginTop: 16 }}>
          <button className="btn primario" disabled={aImportar || mapa.nif == null || mapa.nome == null || mapa.email == null} onClick={importar}>Importar</button>
          {estado && <span role="status">{estado}</span>}
        </div>
      </>)}
    </>
  );
}
