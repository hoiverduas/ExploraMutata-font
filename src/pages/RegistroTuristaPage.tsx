import { useState } from 'react';
import type { FormEvent } from 'react';
import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { usuariosApi } from '../services/usuariosApi';
import type { RegistroTuristaRequest } from '../types/usuario';

export default function RegistroTuristaPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const continuar = search.get('continuar');
  const continuarLocal = continuar?.startsWith('/') && !continuar.startsWith('//') ? continuar : null;
  const rutaLogin = continuarLocal ? `/ingresar?continuar=${encodeURIComponent(continuarLocal)}` : '/ingresar';
  const [form, setForm] = useState<RegistroTuristaRequest>({ nombres:'', apellidos:'', correo:'', telefono:'', contrasena:'' });
  const [confirmacion, setConfirmacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const change = (key: keyof RegistroTuristaRequest, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    if (form.contrasena.length < 12 || form.contrasena.length > 128) return setError('La contraseña debe tener entre 12 y 128 caracteres.');
    if (form.contrasena !== confirmacion) return setError('Las contraseñas no coinciden.');
    setCargando(true);
    try {
      await usuariosApi.registroTurista({ ...form, correo: form.correo.trim().toLowerCase() });
      setForm({ nombres:'', apellidos:'', correo:'', telefono:'', contrasena:'' });
      setConfirmacion('');
      const parametros = new URLSearchParams({ registrado: '1' });
      if (continuarLocal) parametros.set('continuar', continuarLocal);
      navigate(`/ingresar?${parametros}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
    } finally { setCargando(false); }
  }

  return <IonPage><BrandHeader mostrarGestion={false}/><IonContent fullscreen>
    <main className="auth-layout page-width">
      <section className="auth-illustration"><span className="eyebrow">EXPLORA MUTATÁ</span><h1>Viajar empieza <em>por descubrir.</em></h1><p>Crea tu cuenta para formar parte de la comunidad viajera de Mutatá. El registro público siempre crea un perfil TURISTA.</p></section>
      <section className="auth-card"><span className="eyebrow">CREA TU CUENTA</span><h2>Registro de turista</h2>
        <form className="auth-form" onSubmit={registrar}>
          <div className="auth-grid">
            <label>Nombres *<input required maxLength={120} autoComplete="given-name" value={form.nombres} onChange={e=>change('nombres',e.target.value)} /></label>
            <label>Apellidos *<input required maxLength={120} autoComplete="family-name" value={form.apellidos} onChange={e=>change('apellidos',e.target.value)} /></label>
          </div>
          <label>Correo electrónico *<input type="email" required maxLength={254} autoComplete="email" value={form.correo} onChange={e=>change('correo',e.target.value)} /></label>
          <label>Celular<input type="tel" maxLength={30} autoComplete="tel" value={form.telefono} onChange={e=>change('telefono',e.target.value)} placeholder="Ej. 3104567890" /></label>
          <label>Contraseña *<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={form.contrasena} onChange={e=>change('contrasena',e.target.value)} placeholder="Mínimo 12 caracteres" /></label>
          <label>Confirma tu contraseña *<input type="password" required minLength={12} autoComplete="new-password" value={confirmacion} onChange={e=>setConfirmacion(e.target.value)} /></label>
          {error && <div className="notice-error" role="alert">{error}</div>}
          <IonButton type="submit" expand="block" className="btn-explora" disabled={cargando}>{cargando ? <><IonSpinner name="dots"/> Registrando…</> : 'Crear mi cuenta'}</IonButton>
        </form>
        <p className="auth-footer">¿Ya tienes cuenta? <Link to={rutaLogin}>Inicia sesión</Link>.</p>
      </section>
    </main>
  </IonContent></IonPage>;
}
