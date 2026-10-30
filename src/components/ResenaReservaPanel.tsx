import { IonButton, IonSpinner } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { resenasApi } from '../services/resenasApi';
import type { ResenaResponse } from '../types/resena';
import type { ReservaResponse } from '../types/reserva';
import EstrellasCalificacion from './EstrellasCalificacion';

export default function ResenaReservaPanel({ reserva }: { reserva: ReservaResponse }) {
  const [resena, setResena] = useState<ResenaResponse | null>(null);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [cargando, setCargando] = useState(reserva.estado === 'COMPLETADA');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    if (reserva.estado !== 'COMPLETADA') { setCargando(false); return () => { vivo.current = false; }; }
    const controller = new AbortController();
    setCargando(true); setError('');
    void resenasApi.mias({ signal: controller.signal }).then(lista => {
      if (controller.signal.aborted || !vivo.current) return;
      const existente = lista.find(item => item.reservaId === reserva.id) ?? null;
      setResena(existente);
      if (existente) {
        setCalificacion(existente.calificacion);
        setComentario(existente.comentario ?? '');
      }
    }).catch(err => {
      if (!controller.signal.aborted && vivo.current) setError(err instanceof Error ? err.message : 'No se pudo consultar tu reseña.');
    }).finally(() => { if (!controller.signal.aborted && vivo.current) setCargando(false); });
    return () => { vivo.current = false; controller.abort(); };
  }, [reserva.id, reserva.estado]);

  if (reserva.estado !== 'COMPLETADA') return null;
  if (cargando) return <section className="gestion-form-panel"><div className="loading-state"><IonSpinner/> Consultando reseña…</div></section>;

  const guardar = async () => {
    if (guardando) return;
    if (calificacion < 1 || calificacion > 5) return setError('Selecciona una calificación entre 1 y 5.');
    if (comentario.length > 2000) return setError('El comentario admite hasta 2000 caracteres.');
    setGuardando(true); setError(''); setMensaje('');
    try {
      const actualizada = resena
        ? await resenasApi.actualizar(resena.id, { calificacion, comentario: comentario.trim() || null })
        : await resenasApi.crear({ reservaId: reserva.id, calificacion, comentario: comentario.trim() || null });
      if (vivo.current) { setResena(actualizada); setMensaje(resena ? 'Reseña actualizada.' : 'Gracias por compartir tu experiencia.'); }
    } catch (err) {
      if (vivo.current) setError(err instanceof Error ? err.message : 'No se pudo guardar la reseña.');
    } finally { if (vivo.current) setGuardando(false); }
  };

  const retirar = async () => {
    if (!resena || guardando || resena.estado === 'RETIRADA') return;
    if (!window.confirm('¿Retirar esta reseña? Dejará de ser pública y no podrá editarse de nuevo.')) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      const actualizada = await resenasApi.retirar(resena.id);
      if (vivo.current) { setResena(actualizada); setMensaje('La reseña fue retirada.'); }
    } catch (err) {
      if (vivo.current) setError(err instanceof Error ? err.message : 'No se pudo retirar la reseña.');
    } finally { if (vivo.current) setGuardando(false); }
  };

  const editable = !resena || resena.estado === 'PUBLICADA';
  return <section className="gestion-form-panel review-form-panel">
    <span className="eyebrow">TU EXPERIENCIA</span><h2>{resena ? 'Tu reseña' : 'Escribe una reseña'}</h2>
    {resena && <p>Estado: <strong>{resena.estado.toLocaleLowerCase('es')}</strong>.</p>}
    {resena?.estado === 'OCULTA' && <div className="notice-error">La reseña está oculta por moderación.{resena.motivoModeracion ? ` Motivo: ${resena.motivoModeracion}` : ''}</div>}
    {resena?.estado === 'RETIRADA' && <p>Retiraste esta reseña. Se conserva en tu historial, pero ya no es pública.</p>}
    {editable && <>
      <label>Calificación *</label><EstrellasCalificacion valor={calificacion} onChange={setCalificacion}/>
      <label className="cambio-label">Comentario (opcional)<textarea rows={5} maxLength={2000} disabled={guardando} value={comentario} onChange={e => setComentario(e.target.value)}/></label>
      <div className="form-actions"><IonButton disabled={guardando} onClick={() => void guardar()}>{guardando ? 'Guardando…' : resena ? 'Guardar cambios' : 'Publicar reseña'}</IonButton>{resena && <IonButton fill="outline" color="medium" disabled={guardando} onClick={() => void retirar()}>Retirar reseña</IonButton>}</div>
    </>}
    {resena?.respuestaOperador && <div className="review-response"><strong>Respuesta del negocio</strong><p>{resena.respuestaOperador}</p></div>}
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}
    {error && <div className="notice-error" role="alert">{error}</div>}
  </section>;
}
