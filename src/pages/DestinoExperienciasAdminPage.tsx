import { IonButton, IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { destinosApi } from '../services/destinosApi';
import { experienciasApi } from '../services/experienciasApi';
import { destinoExperienciasApi } from '../services/destinoExperienciasApi';
import type { Destino } from '../types/destino';
import type { Experiencia } from '../types/experiencia';

export default function DestinoExperienciasAdminPage() {
  const { destinoId } = useParams<{ destinoId: string }>();
  const [destino, setDestino] = useState<Destino | null>(null);
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const revision = useRef(0);
  const cargar = useCallback(async () => {
    const actual = ++revision.current;
    setCargando(true); setError('');
    if (!destinoId) { setError('No se indicó el destino.'); setCargando(false); return; }
    try {
      const [detalle, disponibles, asociadas] = await Promise.all([
        destinosApi.buscar(destinoId), experienciasApi.listar(), destinoExperienciasApi.listar(destinoId),
      ]);
      if (actual !== revision.current) return;
      setDestino(detalle);
      // Incluye cualquier asociación existente que haya cambiado mientras se consultaban ambas listas.
      setExperiencias([...new Map([...disponibles, ...asociadas].map(experiencia => [experiencia.id, experiencia])).values()]);
      setSeleccion(asociadas.map(experiencia => experiencia.id));
    } catch (err) {
      if (actual === revision.current) { setDestino(null); setExperiencias([]); setSeleccion([]); setError(err instanceof Error ? err.message : 'No se pudo cargar la relación del destino.'); }
    } finally { if (actual === revision.current) setCargando(false); }
  }, [destinoId]);
  useEffect(() => { void cargar(); return () => { revision.current++; }; }, [cargar]);
  useIonViewWillEnter(() => { void cargar(); }, [cargar]);
  const seleccionar = (id: string, incluir: boolean) => {
    if (guardando) return;
    if (incluir && !seleccion.includes(id) && seleccion.length >= 100) { setError('Puedes asociar como máximo 100 experiencias a un destino.'); return; }
    setError(''); setMensaje('');
    setSeleccion(actual => incluir ? [...new Set([...actual, id])] : actual.filter(seleccionada => seleccionada !== id));
  };
  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!destinoId || !destino || guardando || cargando) return;
    setError(''); setMensaje('');
    if (seleccion.length > 100) { setError('Puedes asociar como máximo 100 experiencias a un destino.'); return; }
    if (!window.confirm(`¿Reemplazar las experiencias asociadas a «${destino.nombre}» por las ${seleccion.length} seleccionadas?`)) return;
    setGuardando(true);
    try {
      const asociadas = await destinoExperienciasApi.reemplazar(destinoId, seleccion);
      setSeleccion(asociadas.map(experiencia => experiencia.id));
      setMensaje('Experiencias del destino actualizadas correctamente.');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron guardar las experiencias del destino.'); }
    finally { setGuardando(false); }
  };
  return <IonPage><BrandHeader title="Experiencias del destino"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">ADMINISTRACIÓN · DESTINOS</span><h1>Experiencias del <em>destino.</em></h1>{destino && <p>{destino.nombre}</p>}</div><Link className="resource-inline-link" to="/gestion/destinos">Volver a destinos</Link></div>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}{error && <div className="notice-error" role="alert">{error}</div>}
    <IonButton fill="outline" disabled={cargando || guardando || !destinoId} onClick={() => void cargar()}>Actualizar selección</IonButton>
    {cargando ? <div className="loading-state"><IonSpinner/> Cargando experiencias del destino…</div> : destino && <section className="gestion-form-panel">
      <h2>Experiencias asociadas a {destino.nombre}</h2><p>Selecciona hasta 100 experiencias. Al guardar se reemplaza la relación completa; una selección vacía retira todas las asociaciones.</p>
      <form onSubmit={guardar}><fieldset disabled={guardando} className="negocio-fieldset"><legend>Experiencias disponibles ({seleccion.length} seleccionadas)</legend>
        <div className="resource-checkbox-list">{experiencias.map(experiencia => <label key={experiencia.id}><input type="checkbox" checked={seleccion.includes(experiencia.id)} onChange={e => seleccionar(experiencia.id, e.target.checked)}/><span><strong>{experiencia.nombre}</strong><small className="resource-checkbox-description">{experiencia.estado === 'ACTIVA' ? 'Activa' : experiencia.estado === 'INACTIVA' ? 'Inactiva' : 'Borrador'}{experiencia.descripcion ? ` · ${experiencia.descripcion}` : ''}</small></span></label>)}</div>
        {!experiencias.length && <p className="empty-state">No hay experiencias registradas. Puedes crearlas desde Gestión de experiencias.</p>}
        <div className="form-actions"><IonButton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar experiencias del destino'}</IonButton></div>
      </fieldset></form>
    </section>}
  </main></IonContent></IonPage>;
}
