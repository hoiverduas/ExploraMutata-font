import { Link } from 'react-router-dom';
import type { TipoRecursoFavorito } from '../types/favorito';
import BotonFavorito from './BotonFavorito';

interface Props {
  nombre: string;
  descripcion: string | null;
  etiqueta: string;
  ruta: string;
  accion?: string;
  favorito?: { tipo: TipoRecursoFavorito; recursoId: string };
}
export default function TarjetaTuristica({ nombre, descripcion, etiqueta, ruta, accion = 'Explorar experiencias', favorito }: Props) {
  return <article className="catalog-card tourism-card">
    <div className="tourism-card-cover" aria-hidden="true"><img src="/images/serrania-abibe.webp" alt="" loading="lazy"/><span>EXPLORA MUTATÁ</span></div>
    <div className="catalog-card-body"><span>{etiqueta}</span><h2>{nombre}</h2>
      {descripcion && <p className="card-description">{descripcion}</p>}
      <div className="marketplace-actions"><Link className="catalog-detail-link" to={ruta}>{accion} <span aria-hidden="true">→</span></Link>{favorito && <BotonFavorito tipo={favorito.tipo} recursoId={favorito.recursoId} compacto/>}</div>
    </div>
  </article>;
}
