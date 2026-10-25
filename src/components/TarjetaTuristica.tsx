import { Link } from 'react-router-dom';

export default function TarjetaTuristica({ nombre, descripcion, etiqueta, ruta }: { nombre: string; descripcion: string | null; etiqueta: string; ruta: string }) {
  return <article className="catalog-card"><div className="catalog-card-body"><span>{etiqueta}</span><h2>{nombre}</h2>
    {descripcion && <p>{descripcion}</p>}<Link className="catalog-detail-link" to={ruta}>Conocer más <span aria-hidden="true">→</span></Link>
  </div></article>;
}
