import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { usuariosApi } from '../services/usuariosApi';

export default function AceptarInvitacionPage() {
  // Conservar el token solo en memoria durante esta pantalla.
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [exito, setExito] = useState(false);
  useEffect(() => {
    // Retirar el token de la barra de direcciones tan pronto se abra la pantalla.
    if (window.location.search.includes('token=')) window.history.replaceState(window.history.state, '', '/aceptar-invitacion');
  }, []);
  async function activar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMensaje('');
    if (!token) return setMensaje('El enlace no contiene un token de invitación.');
    if (contrasena.length < 12 || contrasena.length > 128) return setMensaje('La contraseña debe tener entre 12 y 128 caracteres.');
    if (contrasena !== confirmacion) return setMensaje('Las contraseñas no coinciden.');
    setCargando(true);
    try {
      await usuariosApi.aceptarInvitacion(token, contrasena);
      setExito(true); setContrasena(''); setConfirmacion('');
      setMensaje('¡Cuenta activada! Ya puedes ingresar como administrador.');
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'La invitación es inválida o venció.');
    } finally { setCargando(false); }
  }
  return <IonPage><BrandHeader mostrarGestion={false}/><IonContent fullscreen>
    <main className="auth-layout page-width">
      <section className="auth-illustration"><span className="eyebrow">INVITACIÓN ESPECIAL</span><h1>Bienvenido al <em>equipo.</em></h1><p>Activa tu cuenta de administrador para colaborar con las experiencias y los negocios de Explora Mutatá.</p></section>
      <section className="auth-card"><span className="eyebrow">ACTIVACIÓN DE CUENTA</span><h2>Crear contraseña</h2>
        {!exito && <form className="auth-form" onSubmit={activar}>
          <label>Contraseña nueva *<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={contrasena} onChange={e=>setContrasena(e.target.value)}/></label>
          <label>Repetir contraseña *<input type="password" autoComplete="new-password" required minLength={12} value={confirmacion} onChange={e=>setConfirmacion(e.target.value)}/></label>
          <IonButton type="submit" expand="block" className="btn-explora" disabled={cargando || !token}>{cargando ? <><IonSpinner name="dots"/> Activando…</> : 'Activar cuenta'}</IonButton>
        </form>}
        {mensaje && <div className={exito ? 'notice-success' : 'notice-error'} role="status">{mensaje}</div>}
        {exito && <IonButton expand="block" routerLink="/ingresar" className="btn-explora">Ir a iniciar sesión</IonButton>}
        {!token && !exito && <p className="auth-footer">Solicita una invitación nueva al responsable de administración.</p>}
        <p className="auth-footer"><Link to="/inicio">Volver al inicio</Link></p>
      </section>
    </main>
  </IonContent></IonPage>;
}
