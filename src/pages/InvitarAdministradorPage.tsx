import { useState } from 'react';
import type { FormEvent } from 'react';
import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { usuariosApi } from '../services/usuariosApi';
import type { InvitarAdministradorRequest } from '../types/usuario';

export default function InvitarAdministradorPage() {
  const [form, setForm] = useState<InvitarAdministradorRequest>({ nombres:'', apellidos:'', correo:'', telefono:'' });
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const change = (key: keyof InvitarAdministradorRequest, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  async function invitar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setMensaje(''); setCargando(true);
    try {
      const respuesta = await usuariosApi.invitarAdministrador({ ...form, correo: form.correo.trim().toLowerCase() });
      setMensaje(`Invitación registrada y aceptada por el proveedor de correo para ${respuesta.correo}. Caduca el ${new Date(respuesta.venceEn).toLocaleString('es-CO')}. Verifica la entrega en Brevo.`);
      setForm({ nombres:'', apellidos:'', correo:'', telefono:'' });
      // Nunca mostrar ni almacenar el tokenInvitacion recibido en esta pantalla.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la invitación.');
    } finally { setCargando(false); }
  }
  return <IonPage><BrandHeader title="Invitaciones administrativas"/><IonContent fullscreen>
    <main className="page-width profile-page"><span className="eyebrow">SOLO SUPER ADMIN</span><h1>Invitar <em>administrador.</em></h1>
      <p className="auth-intro">El invitado recibirá un correo electrónico para activar su cuenta. La invitación tiene una vigencia de 48 horas.</p>
      <div className="auth-card admin-form-card">
        <form className="auth-form" onSubmit={invitar}>
          <div className="auth-grid">
            <label>Nombres *<input required maxLength={120} value={form.nombres} onChange={e=>change('nombres',e.target.value)}/></label>
            <label>Apellidos *<input required maxLength={120} value={form.apellidos} onChange={e=>change('apellidos',e.target.value)}/></label>
          </div>
          <label>Correo electrónico *<input type="email" required maxLength={254} value={form.correo} onChange={e=>change('correo',e.target.value)}/></label>
          <label>Celular *<input type="tel" required maxLength={30} value={form.telefono} onChange={e=>change('telefono',e.target.value)} placeholder="3104567890"/></label>
          {mensaje && <div className="notice-success" role="status">{mensaje}</div>}
          {error && <div className="notice-error" role="alert">{error}</div>}
          <IonButton type="submit" expand="block" className="btn-explora" disabled={cargando}>{cargando ? <><IonSpinner name="dots"/> Enviando…</> : 'Enviar invitación por correo'}</IonButton>
        </form>
      </div>
      <p><Link to="/mi-cuenta">← Volver a mi cuenta</Link></p>
    </main>
  </IonContent></IonPage>;
}
