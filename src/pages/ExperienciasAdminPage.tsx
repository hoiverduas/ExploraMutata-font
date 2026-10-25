import { IonButton, IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import BrandHeader from '../components/BrandHeader';
import { experienciasApi } from '../services/experienciasApi';
import { dificultadesExperiencia } from '../types/experiencia';
import type { EstadoExperiencia, Experiencia, ExperienciaRequest } from '../types/experiencia';
import { nombresDificultad } from '../data/turismo';

const dificultades = dificultadesExperiencia.map(valor => ({ valor, texto: nombresDificultad[valor] }));
const estados: { valor: EstadoExperiencia; texto: string }[] = [
  { valor: 'BORRADOR', texto: 'Borrador' }, { valor: 'ACTIVA', texto: 'Activa' }, { valor: 'INACTIVA', texto: 'Inactiva' },
];
const formularioVacio: ExperienciaRequest = { nombre: '', descripcion: '', duracionReferencia: '', dificultad: 'NO_APLICA', recomendaciones: '' };
const opcional = (valor: string | null | undefined) => valor?.trim() || null;

export default function ExperienciasAdminPage() {
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [filtro, setFiltro] = useState<EstadoExperiencia | ''>('');
  const [cargando, setCargando] = useState(true);
  const [consultando, setConsultando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<ExperienciaRequest>({ ...formularioVacio });
  const revision = useRef(0);
  const ocupado = guardando || consultando;
  const cargar = useCallback(async () => {
    const actual = ++revision.current;
    setCargando(true); setError('');
    try { const datos = await experienciasApi.listar(filtro || undefined); if (actual === revision.current) setExperiencias(datos); }
    catch (err) { if (actual === revision.current) { setExperiencias([]); setError(err instanceof Error ? err.message : 'No se pudieron cargar las experiencias.'); } }
    finally { if (actual === revision.current) setCargando(false); }
  }, [filtro]);
  useEffect(() => { void cargar(); return () => { revision.current++; }; }, [cargar]);
  useIonViewWillEnter(() => { void cargar(); }, [cargar]);
  const campo = <K extends keyof ExperienciaRequest>(nombre: K, valor: ExperienciaRequest[K]) => setFormulario(actual => ({ ...actual, [nombre]: valor }));
  const nuevo = () => { setFormulario({ ...formularioVacio }); setEditandoId(null); setError(''); setMensaje(''); setMostrarFormulario(true); };
  const editar = async (id: string) => {
    if (ocupado) return;
    setConsultando(true); setError(''); setMensaje('');
    try {
      const experiencia = await experienciasApi.buscar(id);
      setFormulario({ nombre: experiencia.nombre, descripcion: experiencia.descripcion ?? '', duracionReferencia: experiencia.duracionReferencia ?? '', dificultad: experiencia.dificultad, recomendaciones: experiencia.recomendaciones ?? '' });
      setEditandoId(id); setMostrarFormulario(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo consultar la experiencia.'); }
    finally { setConsultando(false); }
  };
  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (guardando) return;
    setError(''); setMensaje('');
    const nombre = formulario.nombre.trim();
    if (!nombre || nombre.length > 150) { setError('Indica un nombre de hasta 150 caracteres.'); return; }
    if ((formulario.descripcion?.length ?? 0) > 2000 || (formulario.recomendaciones?.length ?? 0) > 2000 || (formulario.duracionReferencia?.length ?? 0) > 100) {
      setError('Revisa los límites de los textos de la experiencia.'); return;
    }
    const body: ExperienciaRequest = { nombre, descripcion: opcional(formulario.descripcion), duracionReferencia: opcional(formulario.duracionReferencia), dificultad: formulario.dificultad, recomendaciones: opcional(formulario.recomendaciones) };
    setGuardando(true);
    try {
      if (editandoId) await experienciasApi.actualizar(editandoId, body); else await experienciasApi.crear(body);
      setMostrarFormulario(false); setMensaje(editandoId ? 'Experiencia actualizada correctamente.' : 'Experiencia creada como borrador.'); await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar la experiencia.'); }
    finally { setGuardando(false); }
  };
  const cambiarEstado = async (experiencia: Experiencia, activar: boolean) => {
    if (ocupado || !window.confirm(`¿${activar ? 'Activar' : 'Desactivar'} la experiencia «${experiencia.nombre}»?`)) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      if (activar) await experienciasApi.activar(experiencia.id); else await experienciasApi.desactivar(experiencia.id);
      setMensaje(activar ? 'Experiencia activada.' : 'Experiencia desactivada.'); await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado de la experiencia.'); }
    finally { setGuardando(false); }
  };
  return <IonPage><BrandHeader title="Gestión de experiencias"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">ADMINISTRACIÓN · EXPERIENCIAS</span><h1>Gestión de <em>experiencias.</em></h1><p>Administra las actividades y su disponibilidad en el catálogo público.</p></div><IonButton className="btn-explora" disabled={ocupado} onClick={nuevo}>Crear experiencia</IonButton></div>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}{error && <div className="notice-error" role="alert">{error}</div>}
    {mostrarFormulario ? <section className="gestion-form-panel"><div className="gestion-form-heading"><h2>{editandoId ? 'Editar experiencia' : 'Crear experiencia'}</h2><IonButton fill="clear" disabled={guardando} onClick={() => { setMostrarFormulario(false); setError(''); }}>Volver al listado</IonButton></div><form onSubmit={guardar}><fieldset disabled={guardando} className="negocio-form negocio-fieldset">
      <label>Nombre *<input required maxLength={150} value={formulario.nombre} onChange={e => campo('nombre', e.target.value)}/></label>
      <label>Dificultad *<select value={formulario.dificultad} onChange={e => campo('dificultad', dificultades.find(dificultad => dificultad.valor === e.target.value)?.valor ?? 'NO_APLICA')}>{dificultades.map(dificultad => <option key={dificultad.valor} value={dificultad.valor}>{dificultad.texto}</option>)}</select></label>
      <label className="form-full">Descripción<textarea rows={4} maxLength={2000} value={formulario.descripcion ?? ''} onChange={e => campo('descripcion', e.target.value)}/></label>
      <label className="form-full">Duración de referencia<input maxLength={100} value={formulario.duracionReferencia ?? ''} onChange={e => campo('duracionReferencia', e.target.value)}/></label>
      <label className="form-full">Recomendaciones<textarea rows={4} maxLength={2000} value={formulario.recomendaciones ?? ''} onChange={e => campo('recomendaciones', e.target.value)}/></label>
      <div className="form-actions"><IonButton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar experiencia'}</IonButton><IonButton type="button" fill="outline" disabled={guardando} onClick={() => setMostrarFormulario(false)}>Cancelar</IonButton></div>
    </fieldset></form></section> : <>
      <div className="gestion-list-heading"><label className="cambio-label resource-admin-filter">Estado<select disabled={ocupado} value={filtro} onChange={e => setFiltro(estados.find(estado => estado.valor === e.target.value)?.valor ?? '')}><option value="">Todas</option>{estados.map(estado => <option key={estado.valor} value={estado.valor}>{estado.texto}</option>)}</select></label><IonButton fill="outline" disabled={cargando || ocupado} onClick={() => void cargar()}>Actualizar</IonButton></div>
      {cargando || consultando ? <div className="loading-state"><IonSpinner/> {consultando ? 'Consultando experiencia…' : 'Cargando experiencias…'}</div> : <div className="negocios-list">{experiencias.map(experiencia => <article className="negocio-row" key={experiencia.id}><div className="negocio-row-main"><h3>{experiencia.nombre}</h3><p>{experiencia.descripcion || 'Sin descripción'}</p><small>Dificultad: {dificultades.find(dificultad => dificultad.valor === experiencia.dificultad)?.texto}{experiencia.duracionReferencia ? ` · ${experiencia.duracionReferencia}` : ''}</small></div><div className="negocio-row-right"><span className={`status-pill status-${experiencia.estado === 'ACTIVA' ? 'activo' : experiencia.estado === 'INACTIVA' ? 'inactivo' : 'borrador'}`}>{estados.find(estado => estado.valor === experiencia.estado)?.texto}</span><div className="negocio-row-actions"><IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void editar(experiencia.id)}>Editar</IonButton>{experiencia.estado !== 'ACTIVA' && <IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void cambiarEstado(experiencia, true)}>Activar</IonButton>}{experiencia.estado === 'ACTIVA' && <IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void cambiarEstado(experiencia, false)}>Desactivar</IonButton>}</div></div></article>)}{!experiencias.length && !error && <p className="empty-state">No hay experiencias para este filtro.</p>}</div>}
    </>}
  </main></IonContent></IonPage>;
}
