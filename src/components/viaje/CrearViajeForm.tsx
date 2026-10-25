import { IonButton } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { paquetesTuristicosApi } from '../../services/paquetesTuristicosApi';
import { useViaje } from '../../context/ViajeContext';
import type { PaqueteTuristico } from '../../types/paqueteTuristico';

export default function CrearViajeForm({ onCreado, onCancelar }: { onCreado(viaje: PaqueteTuristico): void; onCancelar(): void }) {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const ocupado = useRef(false);
  const { usuario } = useAuth();
  const location = useLocation();
  const propietario = useRef(usuario?.id);
  const visita = useRef(location.key);
  const montado = useRef(true);
  propietario.current = usuario?.id; visita.current = location.key;
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  const { seleccionarViaje } = useViaje();
  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ocupado.current || !nombre.trim()) return;
    const usuarioActual = usuario?.id;
    const visitaActual = location.key;
    ocupado.current = true; setGuardando(true); setError('');
    try {
      const viaje = await paquetesTuristicosApi.crear({ nombre: nombre.trim() });
      if (!montado.current || propietario.current !== usuarioActual || visita.current !== visitaActual) return;
      seleccionarViaje(viaje); onCreado(viaje);
    } catch (err) { if (montado.current && propietario.current === usuarioActual && visita.current === visitaActual) setError(err instanceof Error ? err.message : 'No se pudo crear tu viaje. Inténtalo de nuevo.'); }
    finally { ocupado.current = false; if (montado.current) setGuardando(false); }
  };
  return <section className="gestion-form-panel viaje-create"><h2>¿Cómo se llamará tu próxima aventura?</h2>
    <p>Agrega servicios de diferentes negocios y organiza tu itinerario.</p>
    <form className="auth-form" onSubmit={event => void enviar(event)}><label>Nombre del viaje<input required maxLength={150} value={nombre} disabled={guardando} onChange={event => setNombre(event.target.value)} placeholder="Mi viaje a Mutatá"/></label>
      {error && <div className="notice-error" role="alert">{error}</div>}
      <div className="form-actions"><IonButton type="submit" disabled={guardando || !nombre.trim()}>{guardando ? 'Creando…' : 'Crear viaje'}</IonButton><IonButton fill="outline" type="button" disabled={guardando} onClick={onCancelar}>Volver</IonButton></div>
    </form>
  </section>;
}
