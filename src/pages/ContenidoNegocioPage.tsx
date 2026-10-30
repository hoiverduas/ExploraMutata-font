import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import GestorMultimedia from '../components/GestorMultimedia';
import { geolocalizacionApi } from '../services/geolocalizacionApi';
import { operadorNegociosApi } from '../services/operadorNegociosApi';
import type { UbicacionNegocioRequest } from '../types/geolocalizacion';
import type { NegocioResponse } from '../types/negocio';
import type { RedesNegocioRequest } from '../types/redesNegocio';

const opcional = (valor: string) => valor.trim() || null;
const dominioValido = (valor: string, dominios: string[]) => {
  const limpio = valor.trim();
  if (!limpio) return true;
  if (limpio.startsWith('@')) return true;
  try {
    const normalizado = /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
    const host = new URL(normalizado).hostname.toLocaleLowerCase('es');
    return dominios.some(dominio => host === dominio || host.endsWith(`.${dominio}`));
  } catch {
    return false;
  }
};

export default function ContenidoNegocioPage() {
  const { negocioId } = useParams<{ negocioId: string }>();
  const [negocio, setNegocio] = useState<NegocioResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<'redes' | 'ubicacion' | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [redes, setRedes] = useState({
    whatsappContacto: '', instagramUrl: '', facebookUrl: '',
    mostrarWhatsapp: true, mostrarInstagram: true, mostrarFacebook: true, notificacionesWhatsapp: false,
  });
  const [ubicacion, setUbicacion] = useState({
    direccion: '', municipio: '', vereda: '', ubicacionReferencia: '',
    latitud: '', longitud: '', comoLlegar: '',
  });

  const cargar = async () => {
    if (!negocioId) return;
    setCargando(true); setError('');
    try {
      const [n, u] = await Promise.all([
        operadorNegociosApi.buscar(negocioId),
        geolocalizacionApi.consultarUbicacion(negocioId),
      ]);
      setNegocio(n);
      setRedes({
        whatsappContacto: n.whatsappContacto ?? '',
        instagramUrl: n.instagramUrl ?? '',
        facebookUrl: n.facebookUrl ?? '',
        mostrarWhatsapp: Boolean(n.mostrarWhatsapp),
        mostrarInstagram: Boolean(n.mostrarInstagram),
        mostrarFacebook: Boolean(n.mostrarFacebook),
        notificacionesWhatsapp: Boolean(n.notificacionesWhatsapp),
      });
      setUbicacion({
        direccion: u.direccion ?? '', municipio: u.municipio ?? '', vereda: u.vereda ?? '',
        ubicacionReferencia: u.ubicacionReferencia ?? '',
        latitud: u.latitud == null ? '' : String(u.latitud),
        longitud: u.longitud == null ? '' : String(u.longitud),
        comoLlegar: u.comoLlegar ?? '',
      });
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar el contenido del negocio.'); }
    finally { setCargando(false); }
  };

  useEffect(() => { void cargar(); }, [negocioId]);

  const guardarRedes = async () => {
    if (!negocioId || guardando) return;
    if (redes.whatsappContacto.length > 25 || redes.instagramUrl.length > 300 || redes.facebookUrl.length > 300) return setError('Revisa la longitud de WhatsApp, Instagram y Facebook.');
    const numero = redes.whatsappContacto.replace(/[^0-9]/g, '');
    if (redes.whatsappContacto.trim() && !(/^3\d{9}$/.test(numero) || /^[1-9]\d{7,14}$/.test(numero))) return setError('WhatsApp debe ser un número válido, por ejemplo +573001234567.');
    if (!dominioValido(redes.instagramUrl, ['instagram.com'])) return setError('Instagram debe apuntar a instagram.com o usar @usuario.');
    if (!dominioValido(redes.facebookUrl, ['facebook.com', 'fb.com'])) return setError('Facebook debe apuntar a facebook.com/fb.com o usar @usuario.');
    if (redes.mostrarWhatsapp && !redes.whatsappContacto.trim()) return setError('Registra un WhatsApp antes de hacerlo público.');
    if (redes.notificacionesWhatsapp && !redes.whatsappContacto.trim()) return setError('Registra un WhatsApp antes de activar notificaciones.');
    if (redes.mostrarInstagram && !redes.instagramUrl.trim()) return setError('Registra Instagram antes de hacerlo público.');
    if (redes.mostrarFacebook && !redes.facebookUrl.trim()) return setError('Registra Facebook antes de hacerlo público.');
    const body: RedesNegocioRequest = {
      whatsappContacto: opcional(redes.whatsappContacto),
      instagramUrl: opcional(redes.instagramUrl),
      facebookUrl: opcional(redes.facebookUrl),
      mostrarWhatsapp: redes.mostrarWhatsapp,
      mostrarInstagram: redes.mostrarInstagram,
      mostrarFacebook: redes.mostrarFacebook,
      notificacionesWhatsapp: redes.notificacionesWhatsapp,
    };
    setGuardando('redes'); setError(''); setMensaje('');
    try {
      const actualizado = await operadorNegociosApi.actualizarRedes(negocioId, body);
      setNegocio(actualizado); setMensaje('Redes y configuración de WhatsApp actualizadas.');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron guardar las redes.'); }
    finally { setGuardando(null); }
  };

  const guardarUbicacion = async () => {
    if (!negocioId || guardando) return;
    const latitud = Number(ubicacion.latitud);
    const longitud = Number(ubicacion.longitud);
    if (!ubicacion.latitud.trim() || !ubicacion.longitud.trim() || !Number.isFinite(latitud) || !Number.isFinite(longitud)
      || latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
      return setError('Indica latitud y longitud válidas.');
    }
    const body: UbicacionNegocioRequest = {
      direccion: opcional(ubicacion.direccion),
      municipio: opcional(ubicacion.municipio),
      vereda: opcional(ubicacion.vereda),
      ubicacionReferencia: opcional(ubicacion.ubicacionReferencia),
      latitud, longitud,
      comoLlegar: opcional(ubicacion.comoLlegar),
    };
    setGuardando('ubicacion'); setError(''); setMensaje('');
    try {
      await geolocalizacionApi.guardarUbicacion(negocioId, body);
      setMensaje('Ubicación actualizada. Google Maps, Waze y el mapa público usarán estas coordenadas.');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar la ubicación.'); }
    finally { setGuardando(null); }
  };

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) return setError('El navegador no ofrece geolocalización.');
    setError('');
    navigator.geolocation.getCurrentPosition(
      posicion => setUbicacion(actual => ({
        ...actual,
        latitud: String(posicion.coords.latitude),
        longitud: String(posicion.coords.longitude),
      })),
      () => setError('No fue posible obtener tu ubicación. Puedes escribir las coordenadas manualmente.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return <IonPage><BrandHeader title="Contenido del negocio"/><IonContent fullscreen><main className="page-width gestion-page">
    <Link className="resource-inline-link" to="/operador/negocios">Volver a Mis negocios</Link>
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Contenido y presencia <em>digital.</em></h1><p>{negocio?.nombreComercial ?? 'Configura cómo se presenta tu negocio.'}</p></div><IonButton fill="outline" disabled={cargando || Boolean(guardando)} onClick={() => void cargar()}>Actualizar</IonButton></div>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}{error && <div className="notice-error" role="alert">{error}</div>}
    {cargando ? <div className="loading-state"><IonSpinner/> Cargando contenido…</div> : negocio && negocioId && <>
      <section className="gestion-form-panel"><span className="eyebrow">CONTACTO</span><h2>Redes sociales y WhatsApp</h2><p>El número de WhatsApp puede usarse como canal público y, por separado, para notificaciones automáticas del negocio.</p>
        <div className="negocio-form">
          <label>WhatsApp de contacto<input maxLength={25} placeholder="+57 300 000 0000" value={redes.whatsappContacto} onChange={e => setRedes(v => ({ ...v, whatsappContacto: e.target.value }))}/></label>
          <label className="form-full">Instagram<input type="url" maxLength={300} placeholder="https://instagram.com/..." value={redes.instagramUrl} onChange={e => setRedes(v => ({ ...v, instagramUrl: e.target.value }))}/></label>
          <label className="form-full">Facebook<input type="url" maxLength={300} placeholder="https://facebook.com/..." value={redes.facebookUrl} onChange={e => setRedes(v => ({ ...v, facebookUrl: e.target.value }))}/></label>
          <label><input type="checkbox" checked={redes.mostrarWhatsapp} onChange={e => setRedes(v => ({ ...v, mostrarWhatsapp: e.target.checked }))}/> Mostrar WhatsApp públicamente</label>
          <label><input type="checkbox" checked={redes.mostrarInstagram} onChange={e => setRedes(v => ({ ...v, mostrarInstagram: e.target.checked }))}/> Mostrar Instagram públicamente</label>
          <label><input type="checkbox" checked={redes.mostrarFacebook} onChange={e => setRedes(v => ({ ...v, mostrarFacebook: e.target.checked }))}/> Mostrar Facebook públicamente</label>
          <label><input type="checkbox" checked={redes.notificacionesWhatsapp} onChange={e => setRedes(v => ({ ...v, notificacionesWhatsapp: e.target.checked }))}/> Recibir notificaciones automáticas por WhatsApp</label>
        </div>
        <div className="form-actions"><IonButton disabled={Boolean(guardando)} onClick={() => void guardarRedes()}>{guardando === 'redes' ? 'Guardando…' : 'Guardar redes'}</IonButton></div>
      </section>

      <section className="gestion-form-panel"><span className="eyebrow">MAPA</span><h2>Ubicación del negocio</h2><p>Estas coordenadas alimentan el mapa público, Google Maps, Waze y pueden reutilizarse como punto de encuentro de tus ofertas.</p>
        <div className="negocio-form">
          <label className="form-full">Dirección<input maxLength={250} value={ubicacion.direccion} onChange={e => setUbicacion(v => ({ ...v, direccion: e.target.value }))}/></label>
          <label>Municipio<input maxLength={100} value={ubicacion.municipio} onChange={e => setUbicacion(v => ({ ...v, municipio: e.target.value }))}/></label>
          <label>Vereda<input maxLength={120} value={ubicacion.vereda} onChange={e => setUbicacion(v => ({ ...v, vereda: e.target.value }))}/></label>
          <label className="form-full">Referencia<input maxLength={500} value={ubicacion.ubicacionReferencia} onChange={e => setUbicacion(v => ({ ...v, ubicacionReferencia: e.target.value }))}/></label>
          <label>Latitud *<input type="number" step="any" min={-90} max={90} value={ubicacion.latitud} onChange={e => setUbicacion(v => ({ ...v, latitud: e.target.value }))}/></label>
          <label>Longitud *<input type="number" step="any" min={-180} max={180} value={ubicacion.longitud} onChange={e => setUbicacion(v => ({ ...v, longitud: e.target.value }))}/></label>
          <label className="form-full">Cómo llegar<textarea rows={4} maxLength={1000} value={ubicacion.comoLlegar} onChange={e => setUbicacion(v => ({ ...v, comoLlegar: e.target.value }))}/></label>
        </div>
        <div className="form-actions"><IonButton fill="outline" disabled={Boolean(guardando)} onClick={usarMiUbicacion}>Usar ubicación del dispositivo</IonButton><IonButton disabled={Boolean(guardando)} onClick={() => void guardarUbicacion()}>{guardando === 'ubicacion' ? 'Guardando…' : 'Guardar ubicación'}</IonButton></div>
      </section>

      <GestorMultimedia contexto={{ tipo: 'NEGOCIO', entidadId: negocioId, negocioId }} titulo="Fotos y videos del negocio"/>
    </>}
  </main></IonContent></IonPage>;
}
