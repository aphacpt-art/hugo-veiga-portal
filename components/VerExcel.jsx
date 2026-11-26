'use client';
import { useEffect, useState } from 'react';

export default function VerExcel({ url }) {
  const [folhas, setFolhas] = useState(null);
  const [ativa, setAtiva] = useState(0);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!url) return setErro('Não foi possível abrir o ficheiro.');
    (async () => {
      try {
        const XLSX = await import('xlsx');
        const buf = await (await fetch(url)).arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        setFolhas(wb.SheetNames.map((n) => ({ nome: n, linhas: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '' }) })));
      } catch { setErro('Não foi possível ler o ficheiro Excel. Pode descarregá-lo.'); }
    })();
  }, [url]);

  if (erro) return <p className="erro">{erro}</p>;
  if (!folhas) return <p className="muted">A carregar…</p>;
  const folha = folhas[ativa];
  return (
    <>
      {folhas.length > 1 && (
        <div className="linha" style={{ marginBottom: 12 }}>
          {folhas.map((f, i) => <button key={f.nome} className={`btn ${i === ativa ? 'primario' : ''}`} onClick={() => setAtiva(i)}>{f.nome}</button>)}
        </div>
      )}
      <div className="card tabela-scroll">
        <table className="lista">
          <tbody>
            {folha.linhas.slice(0, 2000).map((l, i) => (
              <tr key={i}>{l.map((c, j) => i === 0 ? <th key={j}>{String(c)}</th> : <td key={j}>{String(c)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
