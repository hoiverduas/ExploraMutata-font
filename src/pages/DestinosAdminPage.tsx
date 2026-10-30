import { IonButton, IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { destinosApi } from '../services/destinosApi';
import { tiposDestino } from '../types/destino';
import type { Destino, DestinoRequest, EstadoDestino } from '../types/destino';
import { nombresTipoDestino } from '../data/turismo';

const tipos = tiposDestino.map(valor => ({ valor, texto: nombresTipoDestino[valor] }));
const estados: { valor: EstadoDestino; texto: string }[] = [
  { valor: 'BORRADOR', texto: 'Borrador' }, { valor: 'PUBLICADO', texto: 'Publicado' }, { valor: 'INACTIVO', texto: 'Inactivo' },
];
type FormularioDestino = Omit<DestinoRequest, 'latitud' | 'longitud'> & { latitud: string; longitud: string };
const formularioVacio: FormularioDestino = {
  nombre: '', tipo: 'OTRO', descripcion: '', ubicacionReferencia: '', direccion: '', municipio: '', vereda: '',
  latitud: '', longitud: '', comoLlegar: '', recomendaciones: '',
};
const opcional = (valor: string | null | undefined) => valor?.trim() || null;

export default function DestinosAdminPage() {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [filtro, setFiltro] = useState<EstadoDestino | ''>('');
  const [cargando, setCargando] = useState(true);
  const [consultando, setConsultando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioDestino>({ ...formularioVacio });
  const revision = useRef(0);
  const ocupado = guardando || consultando;

  const cargar = useCallback(async () => {
    const actual = ++revision.current;
    setCargando(true); setError('');
    try {
      const resultado = await destinosApi.listar(filtro || undefined);
      if (actual === revision.current) setDestinos(resultado);
    } catch (err) {
      if (actual === revision.current) { setDestinos([]); setError(err instanceof Error ? err.message : 'No se pudieron cargar los destinos.'); }
    } finally { if (actual === revision.current) setCargando(false); }
  }, [filtro]);
  useEffect(() => { void cargar(); return () => { revision.current++; }; }, [cargar]);
  useIonViewWillEnter(() => { void cargar(); }, [cargar]);

  const campo = <K extends keyof FormularioDestino>(nombre: K, valor: FormularioDestino[K]) =>
    setFormulario(actual => ({ ...actual, [nombre]: valor }));
  const nuevo = () => {
    setFormulario({ ...formularioVacio }); setEditandoId(null); setMensaje(''); setError(''); setMostrarFormulario(true);
  };
  const editar = async (id: string) => {
    if (ocupado) return;
    setConsultando(true); setError(''); setMensaje('');
    try {
      const destino = await destinosApi.buscar(id);
      setFormulario({ nombre: destino.nombre, tipo: destino.tipo, descripcion: destino.descripcion ?? '',
        ubicacionReferencia: destino.ubicacionReferencia ?? '', direccion: destino.direccion ?? '', municipio: destino.municipio ?? '',
        vereda: destino.vereda ?? '', latitud: destino.latitud == null ? '' : String(destino.latitud),
        longitud: destino.longitud == null ? '' : String(destino.longitud), comoLlegar: destino.comoLlegar ?? '', recomendaciones: destino.recomendaciones ?? '' });
      setEditandoId(id); setMostrarFormulario(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo consultar el destino.'); }
    finally { setConsultando(false); }
  };
  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (guardando) return;
    setError(''); setMensaje('');
    const nombre = formulario.nombre.trim();
    if (!nombre || nombre.length > 150) { setError('Indica un nombre de hasta 150 caracteres.'); return; }
    if ((formulario.descripcion?.length ?? 0) > 2000 || (formulario.comoLlegar?.length ?? 0) > 2000 || (formulario.recomendaciones?.length ?? 0) > 2000
      || (formulario.ubicacionReferencia?.length ?? 0) > 500 || (formulario.direccion?.length ?? 0) > 250
      || (formulario.municipio?.length ?? 0) > 100 || (formulario.vereda?.length ?? 0) > 120) {
      setError('Revisa los límites de los textos y la ubicación del destino.'); return;
    }
    const tieneLatitud = formulario.latitud.trim() !== '';
    const tieneLongitud = formulario.longitud.trim() !== '';
    if (tieneLatitud !== tieneLongitud) { setError('Completa latitud y longitud juntas, o deja ambas vacías.'); return; }
    const latitud = tieneLatitud ? Number(formulario.latitud) : null;
    const longitud = tieneLongitud ? Number(formulario.longitud) : null;
    if ((latitud !== null && (!Number.isFinite(latitud) || latitud < -90 || latitud > 90)) || (longitud !== null && (!Number.isFinite(longitud) || longitud < -180 || longitud > 180))) {
      setError('La latitud debe estar entre -90 y 90, y la longitud entre -180 y 180.'); return;
    }
    const body: DestinoRequest = { nombre, tipo: formulario.tipo, descripcion: opcional(formulario.descripcion),
      ubicacionReferencia: opcional(formulario.ubicacionReferencia), direccion: opcional(formulario.direccion),
      municipio: opcional(formulario.municipio), vereda: opcional(formulario.vereda), latitud, longitud,
      comoLlegar: opcional(formulario.comoLlegar), recomendaciones: opcional(formulario.recomendaciones) };
    setGuardando(true);
    try {
      if (editandoId) await destinosApi.actualizar(editandoId, body); else await destinosApi.crear(body);
      setMostrarFormulario(false); setMensaje(editandoId ? 'Destino actualizado correctamente.' : 'Destino creado como borrador.');
      await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar el destino.'); }
    finally { setGuardando(false); }
  };
  const cambiarEstado = async (destino: Destino, publicar: boolean) => {
    if (ocupado || !window.confirm(`¿${publicar ? 'Publicar' : 'Desactivar'} el destino «${destino.nombre}»?`)) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      if (publicar) await destinosApi.publicar(destino.id); else await destinosApi.desactivar(destino.id);
      setMensaje(publicar ? 'Destino publicado.' : 'Destino desactivado.'); await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del destino.'); }
    finally { setGuardando(false); }
  };

  return <IonPage><BrandHeader title="Gestión de destinos"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">ADMINISTRACIÓN · DESTINOS</span><h1>Gestión de <em>destinos.</em></h1><p>Administra la información y publicación de los destinos de Mutatá.</p></div><IonButton className="btn-explora" disabled={ocupado} onClick={nuevo}>Crear destino</IonButton></div>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}{error && <div className="notice-error" role="alert">{error}</div>}
    {mostrarFormulario ? <section className="gestion-form-panel"><div className="gestion-form-heading"><h2>{editandoId ? 'Editar destino' : 'Crear destino'}</h2><IonButton fill="clear" disabled={guardando} onClick={() => { setMostrarFormulario(false); setError(''); }}>Volver al listado</IonButton></div>
      <form onSubmit={guardar}><fieldset disabled={guardando} className="negocio-form negocio-fieldset">
        <label>Nombre *<input required maxLength={150} value={formulario.nombre} onChange={e => campo('nombre', e.target.value)}/></label>
        <label>Tipo *<select value={formulario.tipo} onChange={e => campo('tipo', tipos.find(tipo => tipo.valor === e.target.value)?.valor ?? 'OTRO')}>{tipos.map(tipo => <option key={tipo.valor} value={tipo.valor}>{tipo.texto}</option>)}</select></label>
        <label className="form-full">Descripción<textarea rows={4} maxLength={2000} value={formulario.descripcion ?? ''} onChange={e => campo('descripcion', e.target.value)}/></label>
        <label className="form-full">Ubicación de referencia<input maxLength={500} value={formulario.ubicacionReferencia ?? ''} onChange={e => campo('ubicacionReferencia', e.target.value)}/></label>
        <label className="form-full">Dirección<input maxLength={250} value={formulario.direccion ?? ''} onChange={e => campo('direccion', e.target.value)}/></label>
        <label>Municipio<input maxLength={100} value={formulario.municipio ?? ''} onChange={e => campo('municipio', e.target.value)}/></label>
        <label>Vereda<input maxLength={120} value={formulario.vereda ?? ''} onChange={e => campo('vereda', e.target.value)}/></label>
        <label>Latitud<input type="number" min={-90} max={90} step="any" value={formulario.latitud} onChange={e => campo('latitud', e.target.value)}/></label>
        <label>Longitud<input type="number" min={-180} max={180} step="any" value={formulario.longitud} onChange={e => campo('longitud', e.target.value)}/></label>
        <label className="form-full">Cómo llegar<textarea rows={4} maxLength={2000} value={formulario.comoLlegar ?? ''} onChange={e => campo('comoLlegar', e.target.value)}/></label>
        <label className="form-full">Recomendaciones<textarea rows={4} maxLength={2000} value={formulario.recomendaciones ?? ''} onChange={e => campo('recomendaciones', e.target.value)}/></label>
        <div className="form-actions"><IonButton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar destino'}</IonButton><IonButton type="button" fill="outline" disabled={guardando} onClick={() => setMostrarFormulario(false)}>Cancelar</IonButton></div>
      </fieldset></form>
    </section> : <>
      <div className="gestion-list-heading"><label className="cambio-label resource-admin-filter">Estado<select disabled={ocupado} value={filtro} onChange={e => setFiltro(estados.find(estado => estado.valor === e.target.value)?.valor ?? '')}><option value="">Todos</option>{estados.map(estado => <option key={estado.valor} value={estado.valor}>{estado.texto}</option>)}</select></label><IonButton fill="outline" disabled={cargando || ocupado} onClick={() => void cargar()}>Actualizar</IonButton></div>
      {cargando || consultando ? <div className="loading-state"><IonSpinner/> {consultando ? 'Consultando destino…' : 'Cargando destinos…'}</div> : <div className="negocios-list">{destinos.map(destino => <article className="negocio-row" key={destino.id}><div className="negocio-row-main"><h3>{destino.nombre}</h3><p>{tipos.find(tipo => tipo.valor === destino.tipo)?.texto}</p><p>{destino.ubicacionReferencia || 'Sin ubicación de referencia'}</p></div><div className="negocio-row-right"><span className={`status-pill status-${destino.estado.toLowerCase()}`}>{estados.find(estado => estado.valor === destino.estado)?.texto}</span><div className="negocio-row-actions"><IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void editar(destino.id)}>Editar</IonButton>{destino.estado !== 'PUBLICADO' && <IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void cambiarEstado(destino, true)}>Publicar</IonButton>}{destino.estado === 'PUBLICADO' && <IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void cambiarEstado(destino, false)}>Desactivar</IonButton>}<Link className="resource-inline-link" to={`/gestion/destinos/${encodeURIComponent(destino.id)}/experiencias`}>Gestionar experiencias</Link></div></div></article>)}{!destinos.length && !error && <p className="empty-state">No hay destinos para este filtro.</p>}</div>}
    </>}
  </main></IonContent></IonPage>;
}
