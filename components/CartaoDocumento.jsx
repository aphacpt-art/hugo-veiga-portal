const TIPOS = { catalogo: 'Catálogo', precos: 'Tabela de preços', outro: 'Documento' };

export default function CartaoDocumento({ doc, capaUrl }) {
  return (
    <div className="card doc">
      <div className="capa">
        {capaUrl ? <img src={capaUrl} alt={`Capa de ${doc.titulo}`} loading="lazy" /> :
          <div className="sem-capa"><div style={{ fontSize: 40 }}>{doc.formato === 'excel' ? '📊' : '📄'}</div>{doc.titulo}</div>}
      </div>
      <div className="info">
        <div className="titulo">{doc.titulo}</div>
        <div className="etiquetas">
          <span className="etiqueta">{TIPOS[doc.tipo] || 'Documento'}</span>
          <span className="etiqueta">{doc.formato === 'excel' ? 'Excel' : 'PDF'}</span>
          {doc.epoca && <span className="etiqueta">{doc.epoca}</span>}
        </div>
        <div className="acoes">
          <a className="btn" href={`/documento/${doc.id}?acao=ver`} target="_blank" rel="noopener">Ver</a>
          <a className="btn primario" href={`/documento/${doc.id}?acao=descarregar`}>Descarregar</a>
        </div>
      </div>
    </div>
  );
}
