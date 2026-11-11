import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { useAuth } from '../auth/AuthContext';
import type { UsuarioResponse } from '../types/usuario';

function destinoPorPerfil(perfil: UsuarioResponse): string {
  if (perfil.roles.includes('SUPER_ADMIN') || perfil.roles.includes('ADMIN')) return '/gestion/negocios';
  if (perfil.roles.includes('OPERADOR')) return '/operador';
  return '/mi-cuenta';
}

export default function LoginPage() {
  const { iniciarSesion, usuario, cargandoSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search] = useSearchParams();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const registrado = search.get('registrado') === '1';
  const continuar = search.get('continuar');
  const continuarLocal = continuar?.startsWith('/')
    && !continuar.startsWith('//')
    && continuar !== '/ingresar'
    ? continuar
    : null;
  const rutaRegistro = continuarLocal ? `/registro?continuar=${encodeURIComponent(continuarLocal)}` : '/registro';
  const rutaActiva = location.pathname === '/ingresar';

  useEffect(() => {
    if (!rutaActiva || cargandoSesion || !usuario) return;
    navigate(continuarLocal ?? destinoPorPerfil(usuario), { replace: true });
  }, [rutaActiva, cargandoSesion, usuario, continuarLocal, navigate]);

  async function ingresar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setGuardando(true);
    try {
      const perfil = await iniciarSesion(correo, contrasena);
      const destino = continuarLocal ?? destinoPorPerfil(perfil);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    } finally { setGuardando(false); }
  }

  if (cargandoSesion || (rutaActiva && usuario)) {
    return <IonPage><BrandHeader mostrarGestion={false}/><IonContent fullscreen>
      <main className="auth-layout page-width">
        <section className="auth-card auth-loading" role="status">
          <IonSpinner />
          <span>Abriendo tu cuenta…</span>
        </section>
      </main>
    </IonContent></IonPage>;
  }

  return <IonPage><BrandHeader mostrarGestion={false}/><IonContent fullscreen>
    <main className="auth-layout page-width">
      <section className="auth-illustration"><span className="eyebrow">BIENVENIDO A MUTATÁ</span><h1>Tu próxima historia <em>comienza aquí.</em></h1><p>Ingresa para acceder a tu perfil, tus experiencias y las herramientas de administración si tienes permisos.</p></section>
      <section className="auth-card"><span className="eyebrow">TU CUENTA</span><h2>Iniciar sesión</h2>
        {registrado && <div className="notice-success" role="status">Tu cuenta de turista fue creada. Ahora puedes ingresar.</div>}
        <form onSubmit={ingresar} className="auth-form">
          <label>Correo electrónico<input type="email" required maxLength={254} autoComplete="username" value={correo} onChange={e=>setCorreo(e.target.value)} placeholder="correo@ejemplo.com" /></label>
          <label>Contraseña<input type="password" required autoComplete="current-password" value={contrasena} onChange={e=>setContrasena(e.target.value)} /></label>
          {error && <div className="notice-error" role="alert">{error}</div>}
          <IonButton className="btn-explora" type="submit" expand="block" disabled={guardando}>{guardando ? <><IonSpinner name="dots"/> Ingresando…</> : 'Ingresar'}</IonButton>
        </form>
        <p className="auth-footer">¿Aún no tienes una cuenta? <Link to={rutaRegistro}>Regístrate como turista</Link>.</p>
      </section>
    </main>
  </IonContent></IonPage>;
}
