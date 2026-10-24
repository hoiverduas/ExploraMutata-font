import { IonButton, IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { useAuth } from '../auth/AuthContext';
import { operadoresApi } from '../services/operadoresApi';
import type { SolicitudOperadorResponse } from '../types/operador';

export default function SolicitudOperadorPage() {
  const { refrescarUsuario, tieneRol } = useAuth();
  const [solicitud, setSolicitud] = useState<SolicitudOperadorResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setSolicitud(await operadoresApi.miSolicitud()); await refrescarUsuario(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo consultar la solicitud.'); }
    finally { setCargando(false); }
  }, [refrescarUsuario]);
  useIonViewWillEnter(() => { void cargar(); }, [cargar]);
  const enviar = async (cancelar = false) => {
    if (cancelar && !window.confirm('¿Quieres cancelar tu solicitud de operador?')) return;
    setGuardando(true); setError('');
    try {
      const resultado = cancelar && solicitud ? await operadoresApi.cancelar(solicitud.id) : await operadoresApi.solicitar();
      setSolicitud(resultado);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar la solicitud.'); }
    finally { setGuardando(false); }
  };
  return <IonPage><BrandHeader title="Solicitud de operador"/><IonContent fullscreen>
    <main className="page-width profile-page">
      <span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Quiero ofrecer <em>servicios.</em></h1>
      <p>Al aprobar tu solicitud podrás registrar y administrar tus establecimientos y servicios turísticos en Explora Mutatá.</p>
      {error && <div role="alert" className="notice-error">{error}</div>}
      <IonButton fill="outline" disabled={cargando || guardando} onClick={() => void cargar()}>Actualizar estado y perfil</IonButton>
      {cargando ? <div className="loading-state"><IonSpinner/> Consultando solicitud…</div> : !error && <section className="profile-actions">
        {!solicitud && !tieneRol('OPERADOR') && <><h2>Quiero ofrecer servicios en Explora Mutatá</h2><p>No existe solicitud todavía.</p><IonButton disabled={guardando} onClick={() => void enviar()}>Solicitar ser operador</IonButton></>}
        {solicitud && <><span className={`status-pill status-${solicitud.estado.toLowerCase()}`}>{solicitud.estado}</span><p>Fecha de solicitud: {new Date(solicitud.fechaCreacion).toLocaleString('es-CO')}</p>
          {solicitud.estado === 'PENDIENTE' && <><h2>Solicitud pendiente de revisión</h2><IonButton fill="outline" disabled={guardando} onClick={() => void enviar(true)}>Cancelar solicitud</IonButton></>}
          {solicitud.estado === 'APROBADA' && <h2>¡Tu solicitud fue aprobada!</h2>}
          {solicitud.estado === 'RECHAZADA' && <><h2>Solicitud rechazada</h2><p>{solicitud.motivoRechazo}</p></>}
          {solicitud.estado === 'CANCELADA' && <h2>Solicitud cancelada</h2>}
          {['RECHAZADA','CANCELADA'].includes(solicitud.estado) && !tieneRol('OPERADOR') && <IonButton disabled={guardando} onClick={() => void enviar()}>Enviar nueva solicitud</IonButton>}
        </>}
        {(solicitud?.estado === 'APROBADA' || tieneRol('OPERADOR')) && <Link className="profile-action" to="/operador/negocios">Ir a Mis negocios <span>→</span></Link>}
      </section>}
      {guardando && <p role="status">Guardando solicitud…</p>}
    </main>
  </IonContent></IonPage>;
}
