import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import EstrellasCalificacion from '../components/EstrellasCalificacion';
import { operadorNegociosApi } from '../services/operadorNegociosApi';
import { resenasApi } from '../services/resenasApi';
import type { NegocioResponse } from '../types/negocio';
import type { ResenaResponse } from '../types/resena';

export default function ResenasOperadorPage() {
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [negocioId, setNegocioId] = useState('');
  const [resenas, setResenas] = useState<ResenaResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState<Record<string,string>>({});
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarNegocios = useCallback(async () => {
    const primera = await operadorNegociosApi.listar(0, 100);
    const lista = [...primera.contenido];
    for (let pagina = 1; pagina < primera.totalPaginas; pagina++) {
      const otra = await operadorNegociosApi.listar(pagina, 100); lista.push(...otra.contenido);
    }
    const unicos = [...new Map(lista.map(item => [item.id, item])).values()];
    setNegocios(unicos); setNegocioId(actual => actual || unicos[0]?.id || '');
  }, []);

  const cargarResenas = useCallback(async (id: string) => {
    if (!id) { setResenas([]); return; }
    setCargando(true); setError('');
    try {
      const lista = await resenasApi.listarOperador(id);
      setResenas(lista);
      setRespuesta(Object.fromEntries(lista.map(item => [item.id, item.respuestaOperador ?? ''])));
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar las reseñas.'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => {
    let vivo = true; setCargando(true);
    void cargarNegocios().catch(err => { if (vivo) setError(err instanceof Error ? err.message : 'No se pudieron cargar tus negocios.'); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [cargarNegocios]);

  useEffect(() => { if (negocioId) void cargarResenas(negocioId); }, [negocioId, cargarResenas]);

  const responder = async (resena: ResenaResponse) => {
    const texto = (respuesta[resena.id] ?? '').trim();
    if (!texto || texto.length > 1500) return setError('La respuesta debe tener entre 1 y 1500 caracteres.');
    setGuardando(resena.id); setError(''); setMensaje('');
    try {
      await resenasApi.responder(resena.id, { respuesta: texto });
      setMensaje('Respuesta publicada.'); await cargarResenas(negocioId);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo responder la reseña.'); }
    finally { setGuardando(null); }
  };

  return <IonPage><BrandHeader title="Reseñas de mis negocios"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Reseñas de <em>viajeros.</em></h1><p>Lee las opiniones de tus clientes y responde desde tu negocio.</p></div></div>
    <section className="gestion-form-panel"><label>Negocio<select value={negocioId} onChange={e => setNegocioId(e.target.value)}><option value="">Selecciona un negocio</option>{negocios.map(n => <option key={n.id} value={n.id}>{n.nombreComercial}</option>)}</select></label></section>
    {mensaje && <div className="notice-success">{mensaje}</div>}{error && <div className="notice-error">{error}</div>}
    {cargando ? <div className="loading-state"><IonSpinner/> Cargando reseñas…</div> : <div className="reviews-list">{resenas.map(resena => <article className="review-card" key={resena.id}>
      <div className="gestion-form-heading"><EstrellasCalificacion valor={resena.calificacion}/><span className={`status-pill status-${resena.estado === 'PUBLICADA' ? 'activo' : resena.estado === 'OCULTA' ? 'borrador' : 'inactivo'}`}>{resena.estado.toLocaleLowerCase('es')}</span></div>
      {resena.comentario && <p>{resena.comentario}</p>}
      <small>{new Date(resena.fechaCreacion).toLocaleDateString('es-CO')}</small>
      {resena.motivoModeracion && <p><strong>Moderación:</strong> {resena.motivoModeracion}</p>}
      {resena.estado !== 'RETIRADA' ? <><label className="cambio-label">Respuesta del negocio<textarea rows={4} maxLength={1500} disabled={guardando === resena.id} value={respuesta[resena.id] ?? ''} onChange={e => setRespuesta(v => ({ ...v, [resena.id]: e.target.value }))}/></label><IonButton size="small" disabled={guardando === resena.id} onClick={() => void responder(resena)}>{guardando === resena.id ? 'Guardando…' : resena.respuestaOperador ? 'Actualizar respuesta' : 'Responder'}</IonButton></> : <p>Una reseña retirada por el turista no puede responderse.</p>}
    </article>)}{!resenas.length && <p className="empty-state">Este negocio todavía no tiene reseñas.</p>}</div>}
  </main></IonContent></IonPage>;
}
