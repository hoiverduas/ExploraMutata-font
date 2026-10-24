import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonPage, IonSpinner, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import { operadoresApi } from '../services/operadoresApi';
import type { EstadoSolicitudOperador, SolicitudOperadorResponse } from '../types/operador';

export default function SolicitudesOperadorAdminPage() {
  const [estado, setEstado] = useState<EstadoSolicitudOperador | ''>('PENDIENTE');
  const [solicitudes, setSolicitudes] = useState<SolicitudOperadorResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [rechazo, setRechazo] = useState<SolicitudOperadorResponse | null>(null);
  const [motivo, setMotivo] = useState('');
  const revision = useRef(0);
  const cargar = useCallback(async () => {
    const actual = ++revision.current;
    setCargando(true); setError('');
    try { const datos = await operadoresApi.listar(estado || undefined); if (actual === revision.current) setSolicitudes(datos); }
    catch (err) { if (actual === revision.current) { setSolicitudes([]); setError(err instanceof Error ? err.message : 'No se pudieron consultar las solicitudes.'); } }
    finally { if (actual === revision.current) setCargando(false); }
  }, [estado]);
  useEffect(() => { void cargar(); return () => { revision.current++; }; }, [cargar]);
  useIonViewWillEnter(() => { void cargar(); }, [cargar]);
  const decidir = async (solicitud: SolicitudOperadorResponse, aprobar: boolean) => {
    if (aprobar && !window.confirm(`¿Aprobar la solicitud de ${solicitud.nombres} ${solicitud.apellidos}?`)) return;
    if (!aprobar && (motivo.trim().length < 5 || motivo.trim().length > 500)) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      if (aprobar) await operadoresApi.aprobar(solicitud.id); else await operadoresApi.rechazar(solicitud.id, motivo.trim());
      setRechazo(null); setMotivo(''); setMensaje(aprobar ? 'Solicitud aprobada. El usuario puede actualizar su perfil para acceder como operador.' : 'Solicitud rechazada.');
      await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo revisar la solicitud.'); }
    finally { setGuardando(false); }
  };
  return <IonPage><BrandHeader title="Solicitudes de operadores"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">ADMINISTRACIÓN</span><h1>Solicitudes de <em>operadores.</em></h1></div><IonButton disabled={guardando || cargando} fill="outline" onClick={() => void cargar()}>Actualizar</IonButton></div>
    <div className="gestion-form-panel"><label className="cambio-label">Estado<select disabled={guardando} value={estado} onChange={e => setEstado(e.target.value as EstadoSolicitudOperador | '')}>
      <option value="">Todas</option><option value="PENDIENTE">Pendientes</option><option value="APROBADA">Aprobadas</option><option value="RECHAZADA">Rechazadas</option><option value="CANCELADA">Canceladas</option>
    </select></label></div>
    {error && <div className="notice-error" role="alert">{error}</div>}{mensaje && <div className="notice-success" role="status">{mensaje}</div>}
    {cargando ? <div className="loading-state"><IonSpinner/> Cargando solicitudes…</div> : <div className="negocios-list">
      {solicitudes.map(s => <article className="negocio-row" key={s.id}><div className="negocio-row-main"><h2>{s.nombres} {s.apellidos}</h2><p>{s.correo}</p><p>{s.telefono || 'Celular no registrado'}</p><small>Solicitud: {new Date(s.fechaCreacion).toLocaleString('es-CO')}</small>{s.fechaRevision && <p>Revisión: {new Date(s.fechaRevision).toLocaleString('es-CO')}</p>}{s.motivoRechazo && <p>Motivo de rechazo: {s.motivoRechazo}</p>}</div><div className="negocio-row-right"><span className={`status-pill status-${s.estado.toLowerCase()}`}>{s.estado}</span>{s.estado === 'PENDIENTE' && <div className="negocio-row-actions"><IonButton disabled={guardando} onClick={() => void decidir(s, true)}>Aprobar</IonButton><IonButton disabled={guardando} fill="outline" onClick={() => { setRechazo(s); setMotivo(''); setError(''); }}>Rechazar</IonButton></div>}</div></article>)}
      {!solicitudes.length && !error && <p className="empty-state">No hay solicitudes para este filtro.</p>}
    </div>}
  </main>
  <IonModal isOpen={rechazo !== null} backdropDismiss={!guardando} onDidDismiss={() => { setRechazo(null); setMotivo(''); }}><IonHeader><IonToolbar><IonTitle>Rechazar solicitud</IonTitle><IonButtons slot="end"><IonButton disabled={guardando} onClick={() => setRechazo(null)}>Cerrar</IonButton></IonButtons></IonToolbar></IonHeader><IonContent className="ion-padding"><div className="cambio-modal-content"><p>{rechazo?.nombres} {rechazo?.apellidos}</p><label className="cambio-label">Motivo del rechazo<textarea minLength={5} maxLength={500} rows={4} value={motivo} onChange={e => setMotivo(e.target.value)} disabled={guardando}/></label><p>Entre 5 y 500 caracteres.</p>{error && <div className="notice-error" role="alert">{error}</div>}<div className="cambio-modal-actions"><IonButton disabled={guardando} fill="outline" onClick={() => setRechazo(null)}>Cancelar</IonButton><IonButton disabled={guardando || motivo.trim().length < 5 || motivo.trim().length > 500} onClick={() => { if (rechazo) void decidir(rechazo, false); }}>{guardando ? 'Guardando…' : 'Confirmar rechazo'}</IonButton></div></div></IonContent></IonModal>
  </IonContent></IonPage>;
}
