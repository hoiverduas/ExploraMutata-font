import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import EstrellasCalificacion from '../components/EstrellasCalificacion';
import { negociosApi } from '../services/negociosApi';
import { resenasApi } from '../services/resenasApi';
import type { NegocioResponse } from '../types/negocio';
import type { ResenaResponse } from '../types/resena';

export default function ModeracionResenasAdminPage() {
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [negocioId, setNegocioId] = useState('');
  const [resenas, setResenas] = useState<ResenaResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
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
    try { setResenas(await resenasApi.listarAdmin(id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar las reseñas del negocio.'); }
    finally { setCargando(false); }
  };
  useEffect(() => { if (negocioId) void cargar(negocioId); }, [negocioId]);

  const ocultar = async (resena: ResenaResponse) => {
    const motivo = window.prompt('Motivo para ocultar la reseña:', resena.motivoModeracion ?? '');
    if (motivo === null) return;
    if (!motivo.trim() || motivo.trim().length > 1000) return setError('Debes indicar un motivo de hasta 1000 caracteres.');
    setGuardando(resena.id); setError(''); setMensaje('');
    try {
      await resenasApi.moderar(resena.id, { estado: 'OCULTA', motivo: motivo.trim() });
      setMensaje('Reseña oculta.'); await cargar(negocioId);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo ocultar la reseña.'); }
    finally { setGuardando(null); }
  };

  const publicar = async (resena: ResenaResponse) => {
    if (guardando) return;
    setGuardando(resena.id); setError(''); setMensaje('');
    try {
      await resenasApi.moderar(resena.id, { estado: 'PUBLICADA', motivo: null });
      setMensaje('Reseña publicada nuevamente.'); await cargar(negocioId);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo publicar la reseña.'); }
    finally { setGuardando(null); }
  };

  return <IonPage><BrandHeader title="Moderación de reseñas" mostrarGestion={false}/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">ADMINISTRACIÓN</span><h1>Moderación de <em>reseñas.</em></h1><p>Consulta todas las reseñas de un negocio, incluidas las ocultas, y aplica la moderación permitida por el backend.</p></div></div>
    <section className="gestion-form-panel"><label>Negocio<select value={negocioId} onChange={e => setNegocioId(e.target.value)}><option value="">Selecciona</option>{negocios.map(n => <option key={n.id} value={n.id}>{n.nombreComercial}</option>)}</select></label><div className="form-actions"><IonButton fill="outline" disabled={cargando || !negocioId} onClick={() => void cargar(negocioId)}>Actualizar</IonButton></div></section>
    {mensaje && <div className="notice-success">{mensaje}</div>}{error && <div className="notice-error">{error}</div>}
    <section className="gestion-form-panel"><h2>Reseñas del negocio</h2>{cargando ? <div className="loading-state"><IonSpinner/> Cargando reseñas…</div> : <div className="reviews-list">{resenas.map(item => <article className="review-card" key={item.id}>
      <div className="gestion-form-heading"><EstrellasCalificacion valor={item.calificacion}/><span className={`status-pill status-${item.estado === 'PUBLICADA' ? 'activo' : item.estado === 'OCULTA' ? 'borrador' : 'inactivo'}`}>{item.estado.toLocaleLowerCase('es')}</span></div>
      {item.comentario && <p>{item.comentario}</p>}
      {item.respuestaOperador && <div className="review-response"><strong>Respuesta del negocio</strong><p>{item.respuestaOperador}</p></div>}
      {item.motivoModeracion && <p><strong>Motivo de moderación:</strong> {item.motivoModeracion}</p>}
      <small>{new Date(item.fechaCreacion).toLocaleDateString('es-CO')} · reserva {item.reservaId}</small>
      <div className="marketplace-actions">
        {item.estado === 'PUBLICADA' && <IonButton size="small" fill="outline" color="medium" disabled={guardando === item.id} onClick={() => void ocultar(item)}>Ocultar</IonButton>}
        {item.estado === 'OCULTA' && <IonButton size="small" disabled={guardando === item.id} onClick={() => void publicar(item)}>Publicar</IonButton>}
        {item.estado === 'RETIRADA' && <span>Retirada por el turista; administración no puede republicarla.</span>}
      </div>
    </article>)}{!resenas.length && <p className="empty-state">Este negocio todavía no tiene reseñas.</p>}</div>}</section>
  </main></IonContent></IonPage>;
}
