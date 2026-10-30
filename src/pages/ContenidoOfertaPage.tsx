import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import GestorMultimedia from '../components/GestorMultimedia';
import { geolocalizacionApi } from '../services/geolocalizacionApi';
import { ofertasApi } from '../services/ofertasApi';
import type { PuntoEncuentroOfertaRequest } from '../types/geolocalizacion';
import type { OfertaNegocioResponse } from '../types/oferta';

const opcional = (valor: string) => valor.trim() || null;

export default function ContenidoOfertaPage() {
  const { negocioId, ofertaId } = useParams<{ negocioId: string; ofertaId: string }>();
  const id = Number(ofertaId);
  const [oferta, setOferta] = useState<OfertaNegocioResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [form, setForm] = useState({
    usarUbicacionNegocio: true, nombre: '', direccion: '', municipio: '', vereda: '',
    referencia: '', latitud: '', longitud: '', comoLlegar: '',
  });

  const cargar = async () => {
    if (!negocioId || !Number.isSafeInteger(id) || id <= 0) return;
    setCargando(true); setError('');
    try {
      const [o, punto] = await Promise.all([
        ofertasApi.buscarOperador(negocioId, id),
        geolocalizacionApi.consultarPuntoEncuentro(negocioId, id),
      ]);
      setOferta(o);
      setForm({
        usarUbicacionNegocio: Boolean(punto.usaUbicacionNegocio),
        nombre: punto.nombre ?? '', direccion: punto.direccion ?? '', municipio: punto.municipio ?? '',
        vereda: punto.vereda ?? '', referencia: punto.referencia ?? '',
        latitud: punto.latitud == null ? '' : String(punto.latitud),
        longitud: punto.longitud == null ? '' : String(punto.longitud),
        comoLlegar: punto.comoLlegar ?? '',
      });
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar el contenido de la oferta.'); }
    finally { setCargando(false); }
  };
  useEffect(() => { void cargar(); }, [negocioId, ofertaId]);

  const guardar = async () => {
    if (!negocioId || !Number.isSafeInteger(id) || guardando) return;
    let latitud: number | null = null;
    let longitud: number | null = null;
    if (!form.usarUbicacionNegocio) {
      latitud = Number(form.latitud); longitud = Number(form.longitud);
      if (!form.latitud.trim() || !form.longitud.trim() || !Number.isFinite(latitud) || !Number.isFinite(longitud)
        || latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) return setError('Indica coordenadas válidas para el punto de encuentro.');
    }
    const body: PuntoEncuentroOfertaRequest = {
      usarUbicacionNegocio: form.usarUbicacionNegocio,
      nombre: opcional(form.nombre),
      direccion: form.usarUbicacionNegocio ? null : opcional(form.direccion),
      municipio: form.usarUbicacionNegocio ? null : opcional(form.municipio),
      vereda: form.usarUbicacionNegocio ? null : opcional(form.vereda),
      referencia: form.usarUbicacionNegocio ? null : opcional(form.referencia),
      latitud: form.usarUbicacionNegocio ? null : latitud,
      longitud: form.usarUbicacionNegocio ? null : longitud,
      comoLlegar: form.usarUbicacionNegocio ? null : opcional(form.comoLlegar),
    };
    setGuardando(true); setError(''); setMensaje('');
    try {
      await geolocalizacionApi.guardarPuntoEncuentro(negocioId, id, body);
      setMensaje(form.usarUbicacionNegocio ? 'La oferta usará la ubicación del negocio.' : 'Punto de encuentro actualizado.');
      await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar el punto de encuentro.'); }
    finally { setGuardando(false); }
  };

  return <IonPage><BrandHeader title="Contenido de la oferta"/><IonContent fullscreen><main className="page-width gestion-page">
    {negocioId && <Link className="resource-inline-link" to={`/operador/negocios/${encodeURIComponent(negocioId)}/ofertas`}>Volver a las ofertas</Link>}
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Presentación de la <em>oferta.</em></h1><p>{oferta?.nombre ?? 'Configura su punto de encuentro y contenido visual.'}</p></div><IonButton fill="outline" disabled={cargando || guardando} onClick={() => void cargar()}>Actualizar</IonButton></div>
    {mensaje && <div className="notice-success">{mensaje}</div>}{error && <div className="notice-error">{error}</div>}
    {cargando ? <div className="loading-state"><IonSpinner/> Cargando contenido…</div> : oferta && negocioId && <>
      <section className="gestion-form-panel"><span className="eyebrow">GEOLOCALIZACIÓN</span><h2>Punto de encuentro</h2>
        <div className="negocio-form">
          <label className="form-full"><input type="checkbox" checked={form.usarUbicacionNegocio} onChange={e => setForm(v => ({ ...v, usarUbicacionNegocio: e.target.checked }))}/> Usar la ubicación configurada para el negocio</label>
          <label className="form-full">Nombre del punto<input maxLength={150} value={form.nombre} onChange={e => setForm(v => ({ ...v, nombre: e.target.value }))} placeholder="Ej. Recepción, parque principal, muelle"/></label>
          {!form.usarUbicacionNegocio && <>
            <label className="form-full">Dirección<input maxLength={250} value={form.direccion} onChange={e => setForm(v => ({ ...v, direccion: e.target.value }))}/></label>
            <label>Municipio<input maxLength={100} value={form.municipio} onChange={e => setForm(v => ({ ...v, municipio: e.target.value }))}/></label>
            <label>Vereda<input maxLength={120} value={form.vereda} onChange={e => setForm(v => ({ ...v, vereda: e.target.value }))}/></label>
            <label className="form-full">Referencia<input maxLength={500} value={form.referencia} onChange={e => setForm(v => ({ ...v, referencia: e.target.value }))}/></label>
            <label>Latitud *<input type="number" min={-90} max={90} step="any" value={form.latitud} onChange={e => setForm(v => ({ ...v, latitud: e.target.value }))}/></label>
            <label>Longitud *<input type="number" min={-180} max={180} step="any" value={form.longitud} onChange={e => setForm(v => ({ ...v, longitud: e.target.value }))}/></label>
            <label className="form-full">Cómo llegar<textarea rows={4} maxLength={1000} value={form.comoLlegar} onChange={e => setForm(v => ({ ...v, comoLlegar: e.target.value }))}/></label>
          </>}
        </div>
        <div className="form-actions"><IonButton disabled={guardando} onClick={() => void guardar()}>{guardando ? 'Guardando…' : 'Guardar punto de encuentro'}</IonButton></div>
      </section>
      <GestorMultimedia contexto={{ tipo: 'OFERTA', entidadId: String(id), negocioId }} titulo="Fotos y videos de la oferta"/>
    </>}
  </main></IonContent></IonPage>;
}
