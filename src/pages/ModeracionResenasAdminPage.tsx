import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import EstrellasCalificacion from '../components/EstrellasCalificacion';
import { negociosApi } from '../services/negociosApi';
import { resenasApi } from '../services/resenasApi';
import type { NegocioResponse } from '../types/negocio';
import type { ResenaPublicaResponse, ResenaResponse } from '../types/resena';

export default function ModeracionResenasAdminPage() {
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [negocioId, setNegocioId] = useState('');
  const [resenas, setResenas] = useState<ResenaPublicaResponse[]>([]);
  const [ocultadasSesion, setOcultadasSesion] = useState<ResenaResponse[]>([]);
  const [idRepublicar, setIdRepublicar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let vivo = true; setCargando(true);
    void negociosApi.listar(0, 100).then(async primera => {
      const lista = [...primera.contenido];
      for (let pagina = 1; pagina < primera.totalPaginas; pagina++) {
        const otra = await negociosApi.listar(pagina, 100); lista.push(...otra.contenido);
      }
      if (!vivo) return;
      const unicos = [...new Map(lista.map(item => [item.id, item])).values()];
      setNegocios(unicos); setNegocioId(unicos[0]?.id ?? '');
    }).catch(err => { if (vivo) setError(err instanceof Error ? err.message : 'No se pudieron cargar los negocios.'); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  const cargar = async (id: string) => {
    if (!id) { setResenas([]); return; }
    setCargando(true); setError('');
    try { setResenas(await resenasApi.listarPublicas(id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar las reseñas publicadas.'); }
    finally { setCargando(false); }
  };
  useEffect(() => { if (negocioId) void cargar(negocioId); }, [negocioId]);

  const ocultar = async (resena: ResenaPublicaResponse) => {
    const motivo = window.prompt('Motivo para ocultar la reseña:', '');
    if (motivo === null) return;
    if (!motivo.trim() || motivo.trim().length > 1000) return setError('Debes indicar un motivo de hasta 1000 caracteres.');
    setGuardando(true); setError(''); setMensaje('');
    try {
      const resultado = await resenasApi.moderar(resena.id, { estado: 'OCULTA', motivo: motivo.trim() });
      setOcultadasSesion(actual => [resultado, ...actual.filter(item => item.id !== resultado.id)]);
      setMensaje('Reseña oculta.'); await cargar(negocioId);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo ocultar la reseña.'); }
    finally { setGuardando(false); }
  };

  const publicar = async (id: string) => {
    if (!id.trim() || guardando) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      await resenasApi.moderar(id.trim(), { estado: 'PUBLICADA', motivo: null });
      setOcultadasSesion(actual => actual.filter(item => item.id !== id.trim()));
      setIdRepublicar(''); setMensaje('Reseña publicada nuevamente.'); await cargar(negocioId);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo publicar la reseña.'); }
    finally { setGuardando(false); }
  };

  return <IonPage><BrandHeader title="Moderación de reseñas" mostrarGestion={false}/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">ADMINISTRACIÓN</span><h1>Moderación de <em>reseñas.</em></h1><p>Oculta contenido publicado cuando sea necesario y conserva el motivo de la decisión.</p></div></div>
    <div className="notice-error">Limitación actual del backend: no existe un endpoint ADMIN para listar reseñas ocultas. Las ocultadas durante esta sesión pueden republicarse aquí; para una reseña oculta previamente se requiere conocer su ID.</div>
    <section className="gestion-form-panel"><label>Negocio<select value={negocioId} onChange={e => setNegocioId(e.target.value)}><option value="">Selecciona</option>{negocios.map(n => <option key={n.id} value={n.id}>{n.nombreComercial}</option>)}</select></label>
      <div className="negocio-form"><label>ID de reseña oculta para republicar<input value={idRepublicar} onChange={e => setIdRepublicar(e.target.value)} placeholder="UUID de la reseña"/></label><div className="form-actions"><IonButton fill="outline" disabled={guardando || !idRepublicar.trim()} onClick={() => void publicar(idRepublicar)}>Republicar por ID</IonButton></div></div>
    </section>
    {mensaje && <div className="notice-success">{mensaje}</div>}{error && <div className="notice-error">{error}</div>}
    {ocultadasSesion.length > 0 && <section className="gestion-form-panel"><h2>Ocultadas en esta sesión</h2>{ocultadasSesion.map(item => <article className="review-card" key={item.id}><EstrellasCalificacion valor={item.calificacion}/><p>{item.comentario || 'Sin comentario.'}</p><p><strong>Motivo:</strong> {item.motivoModeracion}</p><IonButton size="small" fill="outline" disabled={guardando} onClick={() => void publicar(item.id)}>Republicar</IonButton></article>)}</section>}
    <section className="gestion-form-panel"><h2>Reseñas publicadas</h2>{cargando ? <div className="loading-state"><IonSpinner/> Cargando reseñas…</div> : <div className="reviews-list">{resenas.map(item => <article className="review-card" key={item.id}><EstrellasCalificacion valor={item.calificacion}/>{item.comentario && <p>{item.comentario}</p>}{item.respuestaOperador && <div className="review-response"><strong>Respuesta del negocio</strong><p>{item.respuestaOperador}</p></div>}<small>{new Date(item.fechaCreacion).toLocaleDateString('es-CO')}</small><div><IonButton size="small" fill="outline" color="medium" disabled={guardando} onClick={() => void ocultar(item)}>Ocultar</IonButton></div></article>)}{!resenas.length && <p className="empty-state">No hay reseñas publicadas para este negocio.</p>}</div>}</section>
  </main></IonContent></IonPage>;
}
