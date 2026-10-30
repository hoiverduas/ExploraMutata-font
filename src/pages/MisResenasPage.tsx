import { IonButton, IonContent, IonModal, IonPage, IonSpinner } from '@ionic/react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import EstrellasCalificacion from '../components/EstrellasCalificacion';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { resenasApi } from '../services/resenasApi';
import { reservasApi } from '../services/reservasApi';
import type { ResenaResponse } from '../types/resena';
import type { ReservaResponse } from '../types/reserva';

interface Datos {
  resenas: ResenaResponse[];
  reservas: Map<string, ReservaResponse>;
}

export default function MisResenasPage() {
  const cargar = useCallback(async (signal: AbortSignal): Promise<Datos> => {
    const [resenas, reservas] = await Promise.all([
      resenasApi.mias({ signal }),
      reservasApi.listarMisReservas({ signal }),
    ]);
    return { resenas, reservas: new Map(reservas.map(item => [item.id, item])) };
  }, []);
  const consulta = useConsultaApi<Datos | null>(cargar, null);
  const [editando, setEditando] = useState<ResenaResponse | null>(null);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');
  const [mensaje, setMensaje] = useState('');

  const abrirEdicion = (resena: ResenaResponse) => {
    if (resena.estado !== 'PUBLICADA') return;
    setEditando(resena); setCalificacion(resena.calificacion); setComentario(resena.comentario ?? '');
    setErrorAccion(''); setMensaje('');
  };

  const guardar = async () => {
    if (!editando || guardando) return;
    if (comentario.length > 2000) return setErrorAccion('El comentario admite hasta 2000 caracteres.');
    setGuardando(true); setErrorAccion(''); setMensaje('');
    try {
      await resenasApi.actualizar(editando.id, { calificacion, comentario: comentario.trim() || null });
      setEditando(null); setMensaje('Reseña actualizada.'); await consulta.actualizar();
    } catch (err) { setErrorAccion(err instanceof Error ? err.message : 'No se pudo actualizar la reseña.'); }
    finally { setGuardando(false); }
  };

  const retirar = async (resena: ResenaResponse) => {
    if (guardando || resena.estado === 'RETIRADA') return;
    if (!window.confirm('¿Retirar esta reseña? Dejará de ser pública y no podrá editarse de nuevo.')) return;
    setGuardando(true); setErrorAccion(''); setMensaje('');
    try {
      await resenasApi.retirar(resena.id);
      setMensaje('Reseña retirada.'); await consulta.actualizar();
    } catch (err) { setErrorAccion(err instanceof Error ? err.message : 'No se pudo retirar la reseña.'); }
    finally { setGuardando(false); }
  };

  const datos = consulta.datos;
  return <IonPage><BrandHeader title="Mis reseñas"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE VIAJERO</span><h1>Mis <em>reseñas.</em></h1><p>Consulta las opiniones que has dejado después de completar tus reservas.</p></div><IonButton fill="outline" disabled={consulta.cargando} onClick={() => void consulta.actualizar()}>Actualizar</IonButton></div>
    {mensaje && <div className="notice-success">{mensaje}</div>}{errorAccion && <div className="notice-error">{errorAccion}</div>}
    <EstadoConsulta cargando={consulta.cargando} error={consulta.error} actualizar={consulta.actualizar} sinDatos={!datos?.resenas.length} mensajeVacio="Todavía no has escrito reseñas.">
      <div className="reviews-list">{datos?.resenas.map(resena => {
        const reserva = datos.reservas.get(resena.reservaId);
        return <article className="review-card" key={resena.id}>
          <div className="gestion-form-heading"><div><span className="eyebrow">{reserva?.negocioNombreComercial ?? 'Reserva completada'}</span><h3>{reserva?.experienciaNombre ?? 'Servicio reservado'}</h3></div><span className={`status-pill status-${resena.estado === 'PUBLICADA' ? 'activo' : resena.estado === 'OCULTA' ? 'borrador' : 'inactivo'}`}>{resena.estado.toLocaleLowerCase('es')}</span></div>
          <EstrellasCalificacion valor={resena.calificacion}/>
          {resena.comentario && <p>{resena.comentario}</p>}
          {resena.estado === 'OCULTA' && <div className="notice-error">Oculta por moderación.{resena.motivoModeracion ? ` Motivo: ${resena.motivoModeracion}` : ''}</div>}
          {resena.respuestaOperador && <div className="review-response"><strong>Respuesta del negocio</strong><p>{resena.respuestaOperador}</p></div>}
          <small>Publicada {new Date(resena.fechaCreacion).toLocaleDateString('es-CO')}</small>
          <div className="marketplace-actions"><Link className="resource-inline-link" to={`/reservas/${encodeURIComponent(resena.reservaId)}`}>Ver reserva →</Link>{resena.estado === 'PUBLICADA' && <><IonButton size="small" fill="outline" disabled={guardando} onClick={() => abrirEdicion(resena)}>Editar</IonButton><IonButton size="small" fill="outline" color="medium" disabled={guardando} onClick={() => void retirar(resena)}>Retirar</IonButton></>}</div>
        </article>;
      })}</div>
    </EstadoConsulta>
  </main>
  <IonModal isOpen={editando !== null} onDidDismiss={() => !guardando && setEditando(null)}><IonContent className="ion-padding"><div className="cambio-modal-content"><h2>Editar reseña</h2>
    <label>Calificación</label><EstrellasCalificacion valor={calificacion} onChange={setCalificacion}/>
    <label className="cambio-label">Comentario<textarea rows={6} maxLength={2000} disabled={guardando} value={comentario} onChange={e => setComentario(e.target.value)}/></label>
    {errorAccion && <div className="notice-error">{errorAccion}</div>}
    <div className="cambio-modal-actions"><IonButton fill="outline" disabled={guardando} onClick={() => setEditando(null)}>Cancelar</IonButton><IonButton disabled={guardando} onClick={() => void guardar()}>{guardando ? <IonSpinner/> : 'Guardar cambios'}</IonButton></div>
  </div></IonContent></IonModal>
  </IonContent></IonPage>;
}
