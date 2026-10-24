import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonPage, IonSpinner, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { addOutline, refreshOutline, createOutline, arrowBackOutline, powerOutline, listOutline } from 'ionicons/icons';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import HistorialNegocioModal from '../components/HistorialNegocioModal';
import NegocioCampos from '../components/NegocioCampos';
import { nombresCategoria } from '../data/categoriasCatalogo';
import { operadorNegociosApi } from '../services/operadorNegociosApi';
import type { HistorialEstado } from '../services/negociosApi';
import type { NegocioRequest, NegocioResponse, EstadoNegocio } from '../types/negocio';

import { accionesOperador, puedeEditarNegocioOperador as puedeEditar } from '../domain/operadorNegocios';
import type { AccionOperador } from '../domain/operadorNegocios';

const emptyForm: NegocioRequest = {
  nombreComercial: '', razonSocial: '', tipoPersona: 'JURIDICA', tipoDocumento: 'NIT',
  numeroDocumento: '', correoContacto: '', telefonoContacto: '', descripcion: '', categorias: [],
};
const nombresEstado: Record<EstadoNegocio, string> = {
  PENDIENTE_VERIFICACION: 'Pendiente de verificación', ACTIVO: 'Activo', RECHAZADO: 'Rechazado',
  SUSPENDIDO: 'Suspendido', INACTIVO: 'Inactivo',
};

type CambioEstado = { id: string; nombre: string; accion: AccionOperador; estado: EstadoNegocio };
const detallesAccion: Record<AccionOperador, { texto: string; icono: string }> = {
  desactivar: { texto: 'Desactivar', icono: powerOutline },
  'solicitar-revision': { texto: 'Nueva revisión', icono: refreshOutline },
};
const textosAccion: Record<AccionOperador, string> = {
  desactivar: 'Desactivar negocio', 'solicitar-revision': 'Solicitar nueva revisión',
};


export default function MisNegociosPage() {
  const revisionListado = useRef(0);
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [soloConsulta, setSoloConsulta] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<NegocioRequest>(emptyForm);
  const [busqueda, setBusqueda] = useState('');
  const [cambioPendiente, setCambioPendiente] = useState<CambioEstado | null>(null);
  const [cambiandoId, setCambiandoId] = useState<string | null>(null);
  const [motivoCambio, setMotivoCambio] = useState('');
  const [historialAbierto, setHistorialAbierto] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialEstado[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const cargar = useCallback(async (paginaObjetivo = pagina) => {
    const revision = ++revisionListado.current;
    setCargando(true);
    setError('');
    try {
      const resultado = await operadorNegociosApi.listar(paginaObjetivo, 10);
      if (revision !== revisionListado.current) return;
      setNegocios(resultado.contenido);
      setTotalPaginas(resultado.totalPaginas);
      setTotal(resultado.totalElementos);
    } catch (err) {
      if (revision === revisionListado.current) { setNegocios([]); setError(err instanceof Error ? err.message : 'No se pudieron cargar los negocios.'); }
    } finally { if (revision === revisionListado.current) setCargando(false); }
  }, [pagina]);

  useIonViewWillEnter(() => { void cargar(); }, [cargar]);
  // Paginación también cambia mientras la vista permanece activa.
  useEffect(() => { void cargar(); }, [cargar]);

  const nuevo = () => {
    setSoloConsulta(false); setFormulario({ ...emptyForm, categorias: [] }); setEditandoId(null); setMensaje(''); setError(''); setMostrarFormulario(true);
  };
  const editar = async (id: string, soloConsulta = false) => {
    setCargando(true); setMensaje(''); setError('');
    try {
      const n = await operadorNegociosApi.buscar(id);
      const { nombreComercial, razonSocial, tipoPersona, tipoDocumento, numeroDocumento, correoContacto, telefonoContacto, descripcion } = n;
      setFormulario({ nombreComercial, razonSocial: razonSocial ?? '', tipoPersona, tipoDocumento,
        numeroDocumento, correoContacto, telefonoContacto, descripcion: descripcion ?? '', categorias: [...(n.categorias ?? [])] });
      setSoloConsulta(soloConsulta || !puedeEditar(n.estado));
      setEditandoId(id);
      setMostrarFormulario(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo consultar el negocio.'); }
    finally { setCargando(false); }
  };
  const actualizarCampo = <K extends keyof NegocioRequest>(campo: K, valor: NegocioRequest[K]) =>
    setFormulario(actual => ({ ...actual, [campo]: valor }));

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (soloConsulta || guardando) return; setError(''); setMensaje('');
    if (!formulario.categorias.length) {
      setError('Selecciona al menos una categoría para el negocio.'); return;
    }
    if (formulario.tipoPersona === 'JURIDICA' && !formulario.razonSocial.trim()) {
      setError('La razón social es obligatoria para personas jurídicas.'); return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await operadorNegociosApi.actualizar(editandoId, formulario);
        setMensaje('Negocio actualizado correctamente.');
      } else {
        await operadorNegociosApi.registrar(formulario);
        setMensaje('Negocio registrado. Quedó pendiente de verificación.');
        setPagina(0);
      }
      setMostrarFormulario(false);
      if (editandoId || pagina === 0) await cargar(editandoId ? pagina : 0);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar el negocio.'); }
    finally { setGuardando(false); }
  };

  const confirmarCambioEstado = async (cambio: CambioEstado) => {
    const maximo = 500;
    if (motivoCambio.trim().length < 5 || motivoCambio.trim().length > maximo) return;
    setCambiandoId(cambio.id);
    setError(''); setMensaje('');
    try {
      const actualizado = cambio.accion === 'desactivar'
        ? await operadorNegociosApi.desactivar(cambio.id, motivoCambio.trim())
        : await operadorNegociosApi.solicitarRevision(cambio.id, motivoCambio.trim());
      setNegocios(actuales => actuales.map(n => n.id === actualizado.id ? actualizado : n));
      setCambioPendiente(null);
      setMensaje(`El estado de «${actualizado.nombreComercial}» se actualizó a ${nombresEstado[actualizado.estado]}.`);
      setMotivoCambio('');
      await cargar();
    } catch (err) {
      // Mantener el modal para corregir la información y mostrar el error.
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    } finally { setCambiandoId(null); }
  };

  const proponerCambio = (n: NegocioResponse, accion: AccionOperador) => {
    if (cambiandoId) return;
    setMotivoCambio(''); setError('');
    setCambioPendiente({ id: n.id, nombre: n.nombreComercial, estado: n.estado, accion });
  };

  const verHistorial = async (id: string) => {
    setHistorialAbierto(id); setHistorial([]); setCargandoHistorial(true); setError('');
    try { setHistorial(await operadorNegociosApi.historialEstados(id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar el historial.'); }
    finally { setCargandoHistorial(false); }
  };

  const filtrados = negocios.filter(n => `${n.nombreComercial} ${n.descripcion ?? ''}`.toLocaleLowerCase('es').includes(busqueda.toLocaleLowerCase('es')));

  return <IonPage><BrandHeader title="Mis negocios" mostrarGestion={false}/><IonContent fullscreen>
    <main className="page-width gestion-page">
<>
        <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Mis <em>negocios.</em></h1><p>Administra los establecimientos y servicios que ofreces en Explora Mutatá.</p></div><IonButton className="btn-explora" onClick={nuevo}><IonIcon slot="start" icon={addOutline}/> Registrar negocio</IonButton></div>
        <div className="gestion-stats"><div><small>REGISTROS EN BASE DE DATOS</small><strong>{total}</strong></div><div><small>RESULTADOS DE ESTA PÁGINA</small><strong>{negocios.length}</strong></div></div>
        {mensaje && <div role="status" className="notice-success">{mensaje}</div>}
        {error && <div role="alert" className="notice-error">{error}</div>}
        {mostrarFormulario ? <section className="gestion-form-panel">
          <div className="gestion-form-heading"><h2>{soloConsulta ? 'Consultar negocio' : editandoId ? 'Editar negocio' : 'Registrar negocio'}</h2><IonButton fill="clear" onClick={()=>{setMostrarFormulario(false);setError('');}}><IonIcon slot="start" icon={arrowBackOutline}/> Volver</IonButton></div>
          <form onSubmit={enviar}><fieldset disabled={soloConsulta || guardando} className="negocio-form negocio-fieldset">
            <NegocioCampos formulario={formulario} actualizarCampo={actualizarCampo}/>
            {!soloConsulta && <div className="form-actions"><IonButton type="submit" disabled={guardando} className="btn-explora">{guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Registrar negocio'}</IonButton><IonButton fill="outline" color="medium" type="button" onClick={()=>setMostrarFormulario(false)}>Cancelar</IonButton></div>}
          </fieldset></form>
        </section> : <>
          <div className="gestion-list-heading"><h2>Negocios registrados</h2><div className="list-actions"><input placeholder="Buscar en esta página" aria-label="Buscar negocios" value={busqueda} onChange={e=>setBusqueda(e.target.value)}/><IonButton fill="clear" onClick={()=>void cargar()} aria-label="Actualizar listado"><IonIcon icon={refreshOutline}/></IonButton></div></div>
          {cargando ? <div className="loading-state"><IonSpinner name="crescent"/> Cargando negocios...</div> : <div className="negocios-list">
            {filtrados.map(n => <article className="negocio-row" key={n.id}><div className="negocio-monogram">{n.nombreComercial.trim().charAt(0).toLocaleUpperCase('es')}</div><div className="negocio-row-main"><h3>{n.nombreComercial}</h3><p className="negocio-categorias-listado">{n.categorias?.length ? n.categorias.map(categoria => nombresCategoria[categoria]).join(' · ') : 'Sin categoría'}</p><p>{n.descripcion || 'Sin descripción comercial.'}</p><small>Registro {new Date(n.fechaCreacion).toLocaleDateString('es-CO')}</small></div><div className="negocio-row-right">
              <span className={`status-pill status-${n.estado.toLowerCase()}`}>{nombresEstado[n.estado]}</span>
              <div className="negocio-row-actions">
                <IonButton fill="outline" size="small" disabled={Boolean(cambiandoId)} onClick={()=>void editar(n.id, true)}>Consultar</IonButton>
                {puedeEditar(n.estado) && <IonButton fill="outline" size="small" disabled={Boolean(cambiandoId)} onClick={()=>void editar(n.id)}><IonIcon icon={createOutline} slot="start"/> Editar</IonButton>}
                {accionesOperador[n.estado].map(accion => (
                  <IonButton key={accion} size="small"
                    className="btn-suspender"
                    fill="outline" disabled={Boolean(cambiandoId)}
                    onClick={() => proponerCambio(n, accion)}>
                    <IonIcon slot="start" icon={detallesAccion[accion].icono}/>{detallesAccion[accion].texto}
                  </IonButton>
                ))}
                <IonButton size="small" fill="clear" disabled={Boolean(cambiandoId)} onClick={() => void verHistorial(n.id)}>
                  <IonIcon slot="start" icon={listOutline}/> Historial
                </IonButton>
              </div>
            </div></article>)}
            {!filtrados.length && <div className="empty-state">No hay negocios para mostrar en esta página.</div>}
          </div>}
          <div className="pagination-controls"><IonButton fill="outline" disabled={pagina===0||cargando} onClick={()=>setPagina(p=>p-1)}>Anterior</IonButton><span>Página {pagina+1} de {Math.max(totalPaginas,1)}</span><IonButton fill="outline" disabled={pagina+1>=totalPaginas||cargando} onClick={()=>setPagina(p=>p+1)}>Siguiente</IonButton></div>
        </>}
        <div className="disclaimer-bottom">Solo puedes administrar los negocios asociados a tu cuenta. Las solicitudes de revisión serán evaluadas por administración.</div>
      </>
    </main>
    <IonModal isOpen={Boolean(cambioPendiente)} backdropDismiss={!cambiandoId} onDidDismiss={() => { setCambioPendiente(null); setError(''); }}>
      <IonHeader><IonToolbar><IonTitle>{cambioPendiente ? textosAccion[cambioPendiente.accion] : 'Cambiar estado'}</IonTitle>
        <IonButtons slot="end"><IonButton disabled={Boolean(cambiandoId)} onClick={() => setCambioPendiente(null)}>Cerrar</IonButton></IonButtons>
      </IonToolbar></IonHeader>
      <IonContent className="ion-padding"><div className="cambio-modal-content">
        <p>Negocio: <strong>{cambioPendiente?.nombre}</strong></p>
        <p>Estado actual: {cambioPendiente ? nombresEstado[cambioPendiente.estado] : ''}</p>
        <p className="cambio-advertencia">Este cambio se guardará en PostgreSQL y quedará registrado en el historial.</p>
        <label className="cambio-label">Motivo del cambio *
          <textarea rows={4} maxLength={500} value={motivoCambio} onChange={e => setMotivoCambio(e.target.value)}
            placeholder="Explica la decisión (mínimo 5 caracteres)" />
        </label>
        {error && <div className="notice-error" role="alert">{error}</div>}
        <div className="cambio-modal-actions">
          <IonButton fill="outline" color="medium" disabled={Boolean(cambiandoId)} onClick={() => setCambioPendiente(null)}>Cancelar</IonButton>
          <IonButton disabled={Boolean(cambiandoId) || motivoCambio.trim().length < 5 || motivoCambio.trim().length > 500}
            className="btn-explora" onClick={() => { if (cambioPendiente) void confirmarCambioEstado(cambioPendiente); }}>
            {cambiandoId ? 'Guardando…' : 'Confirmar cambio'}
          </IonButton>
        </div>
      </div></IonContent>
    </IonModal>
    <HistorialNegocioModal abierto={historialAbierto !== null} cerrar={() => setHistorialAbierto(null)} historial={historial} cargandoHistorial={cargandoHistorial} error={error}/>

  </IonContent></IonPage>;
}
