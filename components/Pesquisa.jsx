export default function Pesquisa({ q = '' }) {
  return (
    <form action="/pesquisa" className="pesquisa card pad" role="search">
      <input name="q" defaultValue={q} placeholder="O que procura? Ex.: vela de soja, buda dourado, íman Lisboa" aria-label="Pesquisar produtos" />
      <button className="btn primario">Pesquisar</button>
      <button type="button" className="btn" disabled title="Pesquisa por foto: disponível na próxima fase">📷 Foto</button>
    </form>
  );
}
