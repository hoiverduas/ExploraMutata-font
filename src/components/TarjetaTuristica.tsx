import { Link } from 'react-router-dom';

interface Props {
  nombre: string;
  descripcion: string | null;
  etiqueta: string;
  ruta: string;
  accion?: string;
}
export default function TarjetaTuristica({ nombre, descripcion, etiqueta, ruta, accion = 'Explorar experiencias' }: Props) {
  return <article className="catalog-card tourism-card">
    <div className="tourism-card-cover" aria-hidden="true"><img src="/images/serrania-abibe.webp" alt="" loading="lazy"/><span>EXPLORA MUTATÁ</span></div>
    <div className="catalog-card-body"><span>{etiqueta}</span><h2>{nombre}</h2>
      {descripcion && <p className="card-description">{descripcion}</p>}<Link className="catalog-detail-link" to={ruta}>{accion} <span aria-hidden="true">→</span></Link>
    </div>
  </article>;
}
