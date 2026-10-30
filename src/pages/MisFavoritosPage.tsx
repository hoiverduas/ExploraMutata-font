import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { listarNegociosPublicos } from '../services/catalogoApi';
import { destinosApi } from '../services/destinosApi';
import { experienciasApi } from '../services/experienciasApi';
import { favoritosApi } from '../services/favoritosApi';
import { ofertasApi } from '../services/ofertasApi';
import { paquetesComercialesApi } from '../services/paquetesComercialesApi';
import type { FavoritoResponse, TipoRecursoFavorito } from '../types/favorito';

interface FavoritoVista {
  favorito: FavoritoResponse;
  nombre: string;
  descripcion: string | null;
  ruta: string | null;
  disponible: boolean;
}

const nombresTipo: Record<TipoRecursoFavorito, string> = {
  NEGOCIO: 'Negocio',
  EXPERIENCIA: 'Experiencia',
  OFERTA: 'Oferta',
  DESTINO: 'Destino',
  PAQUETE: 'Paquete',
};

export default function MisFavoritosPage() {
  const [filtro, setFiltro] = useState<TipoRecursoFavorito | ''>('');
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState('');

  const cargar = useCallback(async (signal: AbortSignal): Promise<FavoritoVista[]> => {
    const [favoritos, negocios, destinos, experiencias, paquetes] = await Promise.all([
      favoritosApi.listar(undefined, { signal }),
      listarNegociosPublicos({ signal }),
      destinosApi.listarPublicos(undefined, { signal }),
      experienciasApi.listarPublicas(undefined, { signal }),
      paquetesComercialesApi.listarPublicos(undefined, { signal }),
    ]);

    const ofertasResultados = await Promise.allSettled(
      negocios.map(negocio => ofertasApi.listarPublicas(negocio.id, undefined, { signal })),
    );
    const ofertas = ofertasResultados.flatMap(resultado => resultado.status === 'fulfilled' ? resultado.value : []);

    const negocioPorId = new Map(negocios.map(item => [item.id, item]));
    const destinoPorId = new Map(destinos.map(item => [item.id, item]));
    const experienciaPorId = new Map(experiencias.map(item => [item.id, item]));
    const paquetePorId = new Map(paquetes.map(item => [item.id, item]));
    const ofertaPorId = new Map(ofertas.map(item => [String(item.id), item]));

    return favoritos.map(favorito => {
      switch (favorito.tipoRecurso) {
        case 'NEGOCIO': {
          const item = negocioPorId.get(favorito.recursoId);
          return { favorito, nombre: item?.nombreComercial ?? 'Negocio no disponible', descripcion: item?.descripcion ?? null, ruta: item ? `/negocios/${encodeURIComponent(item.id)}` : null, disponible: Boolean(item) };
        }
        case 'DESTINO': {
          const item = destinoPorId.get(favorito.recursoId);
          return { favorito, nombre: item?.nombre ?? 'Destino no disponible', descripcion: item?.descripcion ?? null, ruta: item ? `/destinos/${encodeURIComponent(item.slug)}` : null, disponible: Boolean(item) };
        }
        case 'EXPERIENCIA': {
          const item = experienciaPorId.get(favorito.recursoId);
          return { favorito, nombre: item?.nombre ?? 'Experiencia no disponible', descripcion: item?.descripcion ?? null, ruta: item ? `/catalogo/experiencias/${encodeURIComponent(item.slug)}` : null, disponible: Boolean(item) };
        }
        case 'PAQUETE': {
          const item = paquetePorId.get(favorito.recursoId);
          return { favorito, nombre: item?.nombre ?? 'Paquete no disponible', descripcion: item?.descripcion ?? null, ruta: item ? `/paquetes/${encodeURIComponent(item.id)}` : null, disponible: Boolean(item) };
        }
        case 'OFERTA': {
          const item = ofertaPorId.get(favorito.recursoId);
          return { favorito, nombre: item?.nombre ?? 'Oferta no disponible', descripcion: item?.descripcionOferta ?? null, ruta: item ? `/negocios/${encodeURIComponent(item.negocioId)}/ofertas/${item.id}` : null, disponible: Boolean(item) };
        }
      }
    });
  }, []);

  const consulta = useConsultaApi<FavoritoVista[]>(cargar, []);
  const visibles = filtro ? consulta.datos.filter(item => item.favorito.tipoRecurso === filtro) : consulta.datos;

  const eliminar = async (item: FavoritoVista) => {
    if (eliminando) return;
    setEliminando(item.favorito.id); setErrorAccion('');
    try {
      await favoritosApi.eliminar(item.favorito.tipoRecurso, item.favorito.recursoId);
      await consulta.actualizar();
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo quitar el favorito.');
    } finally { setEliminando(null); }
  };

  return <IonPage><BrandHeader title="Mis favoritos"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE VIAJERO</span><h1>Mis <em>favoritos.</em></h1><p>Guarda lugares y servicios para encontrarlos rápidamente cuando armes tu viaje.</p></div><IonButton fill="outline" disabled={consulta.cargando} onClick={() => void consulta.actualizar()}>Actualizar</IonButton></div>
    <div className="chip-filter" aria-label="Filtrar favoritos">
      <IonButton size="small" fill={filtro === '' ? 'solid' : 'outline'} onClick={() => setFiltro('')}>Todos</IonButton>
      {(Object.keys(nombresTipo) as TipoRecursoFavorito[]).map(tipo => <IonButton key={tipo} size="small" fill={filtro === tipo ? 'solid' : 'outline'} onClick={() => setFiltro(tipo)}>{nombresTipo[tipo]}</IonButton>)}
    </div>
    {errorAccion && <div className="notice-error" role="alert">{errorAccion}</div>}
    <EstadoConsulta {...consulta} sinDatos={!visibles.length} mensajeVacio={consulta.datos.length ? 'No tienes favoritos de este tipo.' : 'Todavía no has guardado favoritos.'}>
      <div className="negocios-list">{visibles.map(item => <article className="negocio-row" key={item.favorito.id}>
        <div className="negocio-row-main"><span className="eyebrow">{nombresTipo[item.favorito.tipoRecurso]}</span><h3>{item.nombre}</h3>{item.descripcion && <p>{item.descripcion}</p>}<small>Guardado {new Date(item.favorito.fechaCreacion).toLocaleDateString('es-CO')}</small></div>
        <div className="negocio-row-right"><div className="negocio-row-actions">{item.ruta && <Link className="resource-inline-link" to={item.ruta}>Ver detalle →</Link>}<IonButton size="small" fill="outline" color="medium" disabled={eliminando === item.favorito.id} onClick={() => void eliminar(item)}>{eliminando === item.favorito.id ? 'Quitando…' : 'Quitar'}</IonButton></div>{!item.disponible && <small>Este recurso ya no está publicado.</small>}</div>
      </article>)}</div>
    </EstadoConsulta>
  </main></IonContent></IonPage>;
}
