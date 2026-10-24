import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/react';
import { addOutline, refreshOutline, createOutline, arrowBackOutline, checkmarkCircleOutline, banOutline, repeatOutline, closeCircleOutline, powerOutline, listOutline } from 'ionicons/icons';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import HistorialNegocioModal from '../components/HistorialNegocioModal';
import NegocioCampos from '../components/NegocioCampos';
import { nombresCategoria } from '../data/categoriasCatalogo';
import { negociosApi } from '../services/negociosApi';
import type { AccionEstado, HistorialEstado } from '../services/negociosApi';
import type { NegocioRequest, NegocioResponse, EstadoNegocio } from '../types/negocio';

const emptyForm: NegocioRequest = {
  nombreComercial: '', razonSocial: '', tipoPersona: 'JURIDICA', tipoDocumento: 'NIT',
  numeroDocumento: '', correoContacto: '', telefonoContacto: '', descripcion: '', categorias: [],
};
const nombresEstado: Record<EstadoNegocio, string> = {
  PENDIENTE_VERIFICACION: 'Pendiente de verificación', ACTIVO: 'Activo', RECHAZADO: 'Rechazado',
  SUSPENDIDO: 'Suspendido', INACTIVO: 'Inactivo',
};

type CambioEstado = { id: string; nombre: string; accion: AccionEstado; estado: EstadoNegocio };
const accionesDisponibles: Record<EstadoNegocio, {accion: AccionEstado; texto: string; icono: string}[]> = {
  PENDIENTE_VERIFICACION: [
    {accion: 'aprobar', texto: 'Aprobar', icono: checkmarkCircleOutline},
    {accion: 'rechazar', texto: 'Rechazar', icono: closeCircleOutline},
  ],
  ACTIVO: [
    {accion: 'suspender', texto: 'Suspender', icono: banOutline},
    {accion: 'desactivar', texto: 'Desactivar', icono: powerOutline},
  ],
  SUSPENDIDO: [
    {accion: 'reactivar', texto: 'Reactivar', icono: repeatOutline},
    {accion: 'desactivar', texto: 'Desactivar', icono: powerOutline},
  ],
  RECHAZADO: [{accion: 'solicitar-revision', texto: 'Nueva revisión', icono: refreshOutline}],
  INACTIVO: [{accion: 'solicitar-revision', texto: 'Nueva revisión', icono: refreshOutline}],
};
const textosAccion: Record<AccionEstado, string> = {
  aprobar: 'Aprobar negocio', rechazar: 'Rechazar negocio',
  suspender: 'Suspender negocio', reactivar: 'Reactivar negocio',
  desactivar: 'Desactivar negocio', 'solicitar-revision': 'Solicitar nueva revisión',
};


export default function NegociosPage() {
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<NegocioRequest>(emptyForm);
  const [busqueda, setBusqueda] = useState('');
  const [cambioPendiente, setCambioPendiente] = useState<CambioEstado | null>(null);
  const [cambiandoId, setCambiandoId] = useState<string | null>(null);
  const [motivoCambio, setMotivoCambio] = useState('');
  const [verificacionConfirmada, setVerificacionConfirmada] = useState(false);
  const [historialAbierto, setHistorialAbierto] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialEstado[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const resultado = await negociosApi.listar(pagina, 10);
      setNegocios(resultado.contenido);
      setTotalPaginas(resultado.totalPaginas);
      setTotal(resultado.totalElementos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los negocios.');
    } finally { setCargando(false); }
  }, [pagina]);

  useEffect(() => { void cargar(); }, [cargar]);

  const nuevo = () => {
    setFormulario({ ...emptyForm, categorias: [] }); setEditandoId(null); setMensaje(''); setError(''); setMostrarFormulario(true);
  };
  const editar = async (id: string) => {
    setCargando(true); setMensaje(''); setError('');
    try {
      const n = await negociosApi.buscar(id);
      const { nombreComercial, razonSocial, tipoPersona, tipoDocumento, numeroDocumento, correoContacto, telefonoContacto, descripcion } = n;
      setFormulario({ nombreComercial, razonSocial: razonSocial ?? '', tipoPersona, tipoDocumento,
        numeroDocumento, correoContacto, telefonoContacto, descripcion: descripcion ?? '', categorias: [...(n.categorias ?? [])] });
      setEditandoId(id);
      setMostrarFormulario(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo consultar el negocio.'); }
    finally { setCargando(false); }
  };
  const actualizarCampo = <K extends keyof NegocioRequest>(campo: K, valor: NegocioRequest[K]) =>
    setFormulario(actual => ({ ...actual, [campo]: valor }));

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(''); setMensaje('');
    if (!formulario.categorias.length) {
      setError('Selecciona al menos una categoría para el negocio.'); return;
    }
    if (formulario.tipoPersona === 'JURIDICA' && !formulario.razonSocial.trim()) {
      setError('La razón social es obligatoria para personas jurídicas.'); return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await negociosApi.actualizar(editandoId, formulario);
        setMensaje('Negocio actualizado correctamente.');
      } else {
        await negociosApi.registrar(formulario);
        setMensaje('Negocio registrado. Quedó pendiente de verificación.');
        setPagina(0);
      }
      setMostrarFormulario(false);
      await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar el negocio.'); }
    finally { setGuardando(false); }
  };

  const confirmarCambioEstado = async (cambio: CambioEstado) => {
    const maximo = cambio.accion === 'aprobar' ? 450 : 500;
    if (motivoCambio.trim().length < 5 || motivoCambio.trim().length > maximo || (cambio.accion === 'aprobar' && !verificacionConfirmada)) return;
    setCambiandoId(cambio.id);
    setError(''); setMensaje('');
    try {
      const actualizado = await negociosApi.cambiarEstado(
        cambio.id, cambio.accion, motivoCambio.trim(), verificacionConfirmada,
      );
      setNegocios(actuales => actuales.map(n => n.id === actualizado.id ? actualizado : n));
      setCambioPendiente(null);
      setMensaje(`El estado de «${actualizado.nombreComercial}» se actualizó a ${nombresEstado[actualizado.estado]}.`);
      setMotivoCambio(''); setVerificacionConfirmada(false);
      await cargar();
    } catch (err) {
      // Mantener el modal para corregir la información y mostrar el error.
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    } finally { setCambiandoId(null); }
  };

  const proponerCambio = (n: NegocioResponse, accion: AccionEstado) => {
    if (cambiandoId) return;
    setMotivoCambio(''); setVerificacionConfirmada(false); setError('');
    setCambioPendiente({ id: n.id, nombre: n.nombreComercial, estado: n.estado, accion });
  };

  const verHistorial = async (id: string) => {
    setHistorialAbierto(id); setHistorial([]); setCargandoHistorial(true); setError('');
    try { setHistorial(await negociosApi.historialEstados(id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar el historial.'); }
    finally { setCargandoHistorial(false); }
  };

  const filtrados = negocios.filter(n => `${n.nombreComercial} ${n.descripcion ?? ''}`.toLocaleLowerCase('es').includes(busqueda.toLocaleLowerCase('es')));

  return <IonPage><BrandHeader title="Gestión de negocios" mostrarGestion={false}/><IonContent fullscreen>
    <main className="page-width gestion-page">
<>
        <div className="notice-success">Panel de administración: acceso protegido con JWT y roles ADMIN / SUPER_ADMIN.</div>
        <div className="gestion-heading"><div><span className="eyebrow">ADMINISTRACIÓN · NEGOCIOS</span><h1>Gestión de <em>negocios.</em></h1><p>Registro, edición y gestión de estados conectados con Spring WebFlux y PostgreSQL.</p></div><IonButton className="btn-explora" onClick={nuevo}><IonIcon slot="start" icon={addOutline}/> Nuevo negocio</IonButton></div>
        <div className="gestion-stats"><div><small>REGISTROS EN BASE DE DATOS</small><strong>{total}</strong></div><div><small>RESULTADOS DE ESTA PÁGINA</small><strong>{negocios.length}</strong></div></div>
        {mensaje && <div role="status" className="notice-success">{mensaje}</div>}
        {error && <div role="alert" className="notice-error">{error}</div>}
        {mostrarFormulario ? <section className="gestion-form-panel">
          <div className="gestion-form-heading"><h2>{editandoId ? 'Editar negocio' : 'Registrar negocio'}</h2><IonButton fill="clear" onClick={()=>{setMostrarFormulario(false);setError('');}}><IonIcon slot="start" icon={arrowBackOutline}/> Volver</IonButton></div>
          <form onSubmit={enviar} className="negocio-form">
            <NegocioCampos formulario={formulario} actualizarCampo={actualizarCampo}/>
            <div className="form-actions"><IonButton type="submit" disabled={guardando} className="btn-explora">{guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Registrar negocio'}</IonButton><IonButton fill="outline" color="medium" type="button" onClick={()=>setMostrarFormulario(false)}>Cancelar</IonButton></div>
          </form>
        </section> : <>
          <div className="gestion-list-heading"><h2>Negocios registrados</h2><div className="list-actions"><input placeholder="Buscar en esta página" aria-label="Buscar negocios" value={busqueda} onChange={e=>setBusqueda(e.target.value)}/><IonButton fill="clear" onClick={()=>void cargar()} aria-label="Actualizar listado"><IonIcon icon={refreshOutline}/></IonButton></div></div>
          {cargando ? <div className="loading-state"><IonSpinner name="crescent"/> Cargando negocios...</div> : <div className="negocios-list">
            {filtrados.map(n => <article className="negocio-row" key={n.id}><div className="negocio-monogram">{n.nombreComercial.trim().charAt(0).toLocaleUpperCase('es')}</div><div className="negocio-row-main"><h3>{n.nombreComercial}</h3><p className="negocio-categorias-listado">{n.categorias?.length ? n.categorias.map(categoria => nombresCategoria[categoria]).join(' · ') : 'Sin categoría'}</p><p>{n.descripcion || 'Sin descripción comercial.'}</p><small>Registro {new Date(n.fechaCreacion).toLocaleDateString('es-CO')}</small></div><div className="negocio-row-right">
              <span className={`status-pill status-${n.estado.toLowerCase()}`}>{nombresEstado[n.estado]}</span>
              <div className="negocio-row-actions">
                <IonButton fill="outline" size="small" disabled={Boolean(cambiandoId)} onClick={()=>void editar(n.id)}><IonIcon icon={createOutline} slot="start"/> Editar</IonButton>
                {accionesDisponibles[n.estado].map(accion => (
                  <IonButton key={accion.accion} size="small"
                    className={accion.accion === 'aprobar' || accion.accion === 'reactivar' ? 'btn-activar' : 'btn-suspender'}
                    fill="outline" disabled={Boolean(cambiandoId)}
                    onClick={() => proponerCambio(n, accion.accion)}>
                    <IonIcon slot="start" icon={accion.icono}/>{accion.texto}
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
        <div className="disclaimer-bottom">Los cambios se guardan en PostgreSQL. Verifica la documentación del negocio antes de aprobarlo.</div>
      </>
    </main>
    <IonModal isOpen={Boolean(cambioPendiente)} onDidDismiss={() => { setCambioPendiente(null); setError(''); }}>
      <IonHeader><IonToolbar><IonTitle>{cambioPendiente ? textosAccion[cambioPendiente.accion] : 'Cambiar estado'}</IonTitle>
        <IonButtons slot="end"><IonButton disabled={Boolean(cambiandoId)} onClick={() => setCambioPendiente(null)}>Cerrar</IonButton></IonButtons>
      </IonToolbar></IonHeader>
      <IonContent className="ion-padding"><div className="cambio-modal-content">
        <p>Negocio: <strong>{cambioPendiente?.nombre}</strong></p>
        <p>Estado actual: {cambioPendiente ? nombresEstado[cambioPendiente.estado] : ''}</p>
        <p className="cambio-advertencia">Este cambio se guardará en PostgreSQL y quedará registrado en el historial.</p>
        <label className="cambio-label">{cambioPendiente?.accion === 'aprobar' ? 'Observación de la verificación *' : 'Motivo del cambio *'}
          <textarea rows={4} maxLength={cambioPendiente?.accion === 'aprobar' ? 450 : 500} value={motivoCambio} onChange={e => setMotivoCambio(e.target.value)}
            placeholder="Explica la decisión (mínimo 5 caracteres)" />
        </label>
        {cambioPendiente?.accion === 'aprobar' && <label className="verificacion-check">
          <input type="checkbox" checked={verificacionConfirmada} onChange={e => setVerificacionConfirmada(e.target.checked)} />
          Confirmo que realicé la verificación del negocio antes de aprobarlo.
        </label>}
        {error && <div className="notice-error" role="alert">{error}</div>}
        <div className="cambio-modal-actions">
          <IonButton fill="outline" color="medium" disabled={Boolean(cambiandoId)} onClick={() => setCambioPendiente(null)}>Cancelar</IonButton>
          <IonButton disabled={Boolean(cambiandoId) || motivoCambio.trim().length < 5 || motivoCambio.trim().length > (cambioPendiente?.accion === 'aprobar' ? 450 : 500) || (cambioPendiente?.accion === 'aprobar' && !verificacionConfirmada)}
            className="btn-explora" onClick={() => { if (cambioPendiente) void confirmarCambioEstado(cambioPendiente); }}>
            {cambiandoId ? 'Guardando…' : 'Confirmar cambio'}
          </IonButton>
        </div>
      </div></IonContent>
    </IonModal>
    <HistorialNegocioModal abierto={historialAbierto !== null} cerrar={() => setHistorialAbierto(null)} historial={historial} cargandoHistorial={cargandoHistorial} error={error}/>

  </IonContent></IonPage>;
}
