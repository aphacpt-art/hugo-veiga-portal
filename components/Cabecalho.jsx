export default function Cabecalho({ admin }) {
  return (
    <header className="top">
      <div className="wrap">
        <a href="/" className="marca">HUGO <span>VEIGA</span></a>
        <nav className="menu">
          <a href="/">Marcas</a>
          {admin && <a href="/admin">Back-office</a>}
          <form action="/sair" method="post"><button className="btn" style={{ minHeight: 32, padding: '4px 10px' }}>Sair</button></form>
        </nav>
      </div>
    </header>
  );
}
