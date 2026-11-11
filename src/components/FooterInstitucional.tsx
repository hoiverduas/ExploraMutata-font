import { Link } from 'react-router-dom';

export default function FooterInstitucional() {
  return <footer className="site-footer">
    <div className="page-width site-footer-grid">
      <div className="site-footer-brand">
        <strong>explora<span>mutatá</span></strong>
        <p>Descubre, reserva y vive experiencias del territorio.</p>
      </div>
      <nav aria-label="Información de Explora Mutatá">
        <Link to="/nosotros">Sobre nosotros</Link>
        <Link to="/nosotros#mision">Nuestra misión</Link>
        <Link to="/nosotros#vision">Nuestra visión</Link>
      </nav>
      <nav aria-label="Explora Mutatá para operadores">
        <Link to="/operador/solicitud">Para operadores</Link>
        <Link to="/catalogo">Explorar servicios</Link>
        <Link to="/paquetes">Paquetes</Link>
      </nav>
    </div>
    <div className="page-width site-footer-bottom">
      <span>Explora Mutatá · Antioquia, Colombia</span>
    </div>
  </footer>;
}
