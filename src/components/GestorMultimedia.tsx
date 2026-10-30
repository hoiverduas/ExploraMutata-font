import { IonButton, IonSpinner } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { multimediaGestionApi } from '../services/multimediaGestionApi';
import type { ContextoMultimedia } from '../services/multimediaGestionApi';
import type {
  MediaAssetResponse, MediaUploadRequest, RolMedia,
} from '../types/multimedia';

const roles: Array<{ valor: RolMedia; texto: string }> = [
  { valor: 'PORTADA', texto: 'Portada' },
  { valor: 'GALERIA', texto: 'Galería' },
  { valor: 'VIDEO_PRINCIPAL', texto: 'Video principal' },
  { valor: 'REEL', texto: 'Reel' },
  { valor: 'MINIATURA', texto: 'Miniatura' },
];

const vacio = (): MediaUploadRequest => ({
  rol: 'GALERIA',
  titulo: null,
  descripcion: null,
  altText: null,
  orden: null,
  autor: null,
  fuente: null,
  fuenteUrl: null,
  derechosConfirmados: false,
  fechaAutorizacion: null,
});

const texto = (valor: string) => valor.trim() || null;
const urlMedia = (media: MediaAssetResponse) => media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

export default function GestorMultimedia({ contexto, titulo = 'Multimedia' }: {
  contexto: ContextoMultimedia;
  titulo?: string;
}) {
  const [medios, setMedios] = useState<MediaAssetResponse[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [form, setForm] = useState<MediaUploadRequest>(vacio());
  const [editando, setEditando] = useState<MediaAssetResponse | null>(null);
  const [editForm, setEditForm] = useState<MediaUploadRequest>(vacio());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const vivo = useRef(true);

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try {
      const datos = await multimediaGestionApi.listar(contexto);
      if (vivo.current) setMedios([...datos].sort((a,b) => (a.orden ?? 0) - (b.orden ?? 0)));
    } catch (err) {
      if (vivo.current) setError(err instanceof Error ? err.message : 'No se pudo cargar la multimedia.');
    } finally { if (vivo.current) setCargando(false); }
  }, [contexto.tipo, contexto.entidadId, contexto.negocioId]);

  useEffect(() => {
    vivo.current = true;
    void cargar();
    return () => { vivo.current = false; };
  }, [cargar]);

  const actualizarForm = <K extends keyof MediaUploadRequest>(campo: K, valor: MediaUploadRequest[K]) =>
    setForm(actual => ({ ...actual, [campo]: valor }));
  const actualizarEdit = <K extends keyof MediaUploadRequest>(campo: K, valor: MediaUploadRequest[K]) =>
    setEditForm(actual => ({ ...actual, [campo]: valor }));

  const validar = (metadata: MediaUploadRequest) => {
    if (!metadata.derechosConfirmados) return 'Debes confirmar que tienes autorización para publicar los archivos.';
    if ((metadata.titulo?.length ?? 0) > 200 || (metadata.descripcion?.length ?? 0) > 1000 || (metadata.altText?.length ?? 0) > 300) return 'Revisa los límites de título, descripción y texto alternativo.';
    if ((metadata.autor?.length ?? 0) > 200 || (metadata.fuente?.length ?? 0) > 500 || (metadata.fuenteUrl?.length ?? 0) > 2000) return 'Revisa la información de autor y fuente.';
    if (metadata.orden !== null && (!Number.isSafeInteger(metadata.orden) || metadata.orden < 0)) return 'El orden debe ser un entero igual o mayor que cero.';
    return '';
  };

  const normalizar = (metadata: MediaUploadRequest): MediaUploadRequest => ({
    ...metadata,
    titulo: texto(metadata.titulo ?? ''),
    descripcion: texto(metadata.descripcion ?? ''),
    altText: texto(metadata.altText ?? ''),
    autor: texto(metadata.autor ?? ''),
    fuente: texto(metadata.fuente ?? ''),
    fuenteUrl: texto(metadata.fuenteUrl ?? ''),
    fechaAutorizacion: metadata.fechaAutorizacion || null,
  });

  const subir = async () => {
    if (guardando || !archivos.length) return;
    const validacion = validar(form);
    if (validacion) return setError(validacion);
    const tiposValidos = archivos.every(a => a.type.startsWith('image/') || a.type.startsWith('video/'));
    if (!tiposValidos) return setError('Selecciona únicamente imágenes o videos.');
    if (archivos.length > 20) return setError('El backend admite como máximo 20 archivos por lote.');
    if (archivos.length > 1 && !['GALERIA', 'REEL'].includes(form.rol)) return setError('La carga múltiple solo admite los roles Galería o Reel.');
    if ((form.rol === 'PORTADA' || form.rol === 'MINIATURA') && !archivos.every(a => a.type.startsWith('image/'))) return setError('Portada y miniatura requieren archivos de imagen.');
    if ((form.rol === 'VIDEO_PRINCIPAL' || form.rol === 'REEL') && !archivos.every(a => a.type.startsWith('video/'))) return setError('Video principal y Reel requieren archivos de video.');
    const excedeTamano = archivos.some(a => a.type.startsWith('image/') ? a.size > 15 * 1024 * 1024 : a.size > 250 * 1024 * 1024);
    if (excedeTamano) return setError('Una imagen supera 15 MB o un video supera 250 MB, límites actuales del backend.');
    setGuardando(true); setError(''); setMensaje('');
    try {
      const metadata = normalizar(form);
      if (archivos.length === 1) await multimediaGestionApi.subir(contexto, archivos[0], metadata);
      else await multimediaGestionApi.subirLote(contexto, archivos, metadata);
      if (!vivo.current) return;
      setArchivos([]); setForm(vacio()); setMensaje(archivos.length === 1 ? 'Archivo subido correctamente.' : 'Archivos subidos correctamente.');
      const input = document.getElementById(`media-files-${contexto.tipo}-${contexto.entidadId}`) as HTMLInputElement | null;
      if (input) input.value = '';
      await cargar();
    } catch (err) {
      if (vivo.current) setError(err instanceof Error ? err.message : 'No se pudieron subir los archivos.');
    } finally { if (vivo.current) setGuardando(false); }
  };

  const abrirEdicion = (media: MediaAssetResponse) => {
    setEditando(media); setError(''); setMensaje('');
    setEditForm({
      rol: media.rol,
      titulo: media.titulo,
      descripcion: media.descripcion,
      altText: media.altText,
      orden: media.orden,
      autor: media.autor,
      fuente: media.fuente,
      fuenteUrl: media.fuenteUrl,
      derechosConfirmados: Boolean(media.derechosConfirmados),
      fechaAutorizacion: media.fechaAutorizacion,
    });
  };

  const guardarMetadata = async () => {
    if (!editando || guardando) return;
    const validacion = validar(editForm);
    if (validacion) return setError(validacion);
    setGuardando(true); setError(''); setMensaje('');
    try {
      await multimediaGestionApi.actualizarMetadata(contexto, editando.id, normalizar(editForm));
      setEditando(null); setMensaje('Metadata actualizada.'); await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo actualizar la metadata.'); }
    finally { setGuardando(false); }
  };

  const cambiarEstado = async (media: MediaAssetResponse) => {
    if (guardando) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      if (media.estado === 'ACTIVO') await multimediaGestionApi.desactivar(contexto, media.id);
      else await multimediaGestionApi.activar(contexto, media.id);
      setMensaje(media.estado === 'ACTIVO' ? 'Archivo desactivado.' : 'Archivo activado.'); await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del archivo.'); }
    finally { setGuardando(false); }
  };

  const portada = async (media: MediaAssetResponse) => {
    if (guardando) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      await multimediaGestionApi.marcarPortada(contexto, media.id);
      setMensaje('Portada actualizada.'); await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo marcar la portada.'); }
    finally { setGuardando(false); }
  };

  const eliminar = async (media: MediaAssetResponse) => {
    if (guardando || !window.confirm(`¿Eliminar definitivamente «${media.titulo || media.id}»?`)) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      await multimediaGestionApi.eliminar(contexto, media.id);
      setMensaje('Archivo eliminado.'); await cargar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo eliminar el archivo.'); }
    finally { setGuardando(false); }
  };

  const formulario = (metadata: MediaUploadRequest, actualizar: <K extends keyof MediaUploadRequest>(campo: K, valor: MediaUploadRequest[K]) => void) => <div className="negocio-form">
    <label>Rol<select value={metadata.rol} onChange={e => actualizar('rol', e.target.value as RolMedia)}>{roles.map(r => <option value={r.valor} key={r.valor}>{r.texto}</option>)}</select></label>
    <label>Orden<input type="number" min={0} step={1} value={metadata.orden ?? ''} onChange={e => actualizar('orden', e.target.value === '' ? null : Number(e.target.value))}/></label>
    <label className="form-full">Título<input maxLength={200} value={metadata.titulo ?? ''} onChange={e => actualizar('titulo', e.target.value)}/></label>
    <label className="form-full">Descripción<textarea rows={3} maxLength={1000} value={metadata.descripcion ?? ''} onChange={e => actualizar('descripcion', e.target.value)}/></label>
    <label className="form-full">Texto alternativo<input maxLength={300} value={metadata.altText ?? ''} onChange={e => actualizar('altText', e.target.value)}/></label>
    <label>Autor<input maxLength={200} value={metadata.autor ?? ''} onChange={e => actualizar('autor', e.target.value)}/></label>
    <label>Fuente<input maxLength={500} value={metadata.fuente ?? ''} onChange={e => actualizar('fuente', e.target.value)}/></label>
    <label className="form-full">URL de la fuente<input type="url" maxLength={2000} value={metadata.fuenteUrl ?? ''} onChange={e => actualizar('fuenteUrl', e.target.value)}/></label>
    <label>Fecha de autorización<input type="date" value={metadata.fechaAutorizacion ?? ''} onChange={e => actualizar('fechaAutorizacion', e.target.value || null)}/></label>
    <label><input type="checkbox" checked={metadata.derechosConfirmados} onChange={e => actualizar('derechosConfirmados', e.target.checked)}/> Confirmo que tengo derechos o autorización para publicar este contenido *</label>
  </div>;

  return <section className="gestion-form-panel media-manager">
    <div className="gestion-form-heading"><div><span className="eyebrow">CONTENIDO VISUAL</span><h2>{titulo}</h2></div><IonButton fill="outline" disabled={cargando || guardando} onClick={() => void cargar()}>Actualizar</IonButton></div>
    <p>Sube imágenes o videos reales. La portada y la galería pública se alimentan de estos archivos.</p>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}
    {error && <div className="notice-error" role="alert">{error}</div>}

    <div className="media-upload-box">
      <label className="form-full">Archivos
        <input id={`media-files-${contexto.tipo}-${contexto.entidadId}`} type="file" accept="image/*,video/*" multiple disabled={guardando} onChange={e => setArchivos(Array.from(e.target.files ?? []))}/>
      </label>
      {archivos.length > 0 && <p>{archivos.length} archivo(s) seleccionado(s): {archivos.map(a => a.name).join(', ')}</p>}
      {formulario(form, actualizarForm)}
      <div className="form-actions"><IonButton disabled={guardando || !archivos.length} onClick={() => void subir()}>{guardando ? 'Subiendo…' : archivos.length > 1 ? 'Subir archivos' : 'Subir archivo'}</IonButton></div>
    </div>

    {editando && <div className="media-edit-box">
      <div className="gestion-form-heading"><h3>Editar metadata</h3><IonButton fill="clear" disabled={guardando} onClick={() => setEditando(null)}>Cerrar</IonButton></div>
      {formulario(editForm, actualizarEdit)}
      <div className="form-actions"><IonButton disabled={guardando} onClick={() => void guardarMetadata()}>Guardar metadata</IonButton></div>
    </div>}

    {cargando ? <div className="loading-state"><IonSpinner/> Cargando multimedia…</div> : <div className="media-admin-grid">
      {medios.map(media => <article className="media-admin-card" key={media.id}>
        <div className="media-admin-preview">{media.tipo === 'VIDEO'
          ? <video controls preload="metadata" poster={media.thumbnailUrl ?? undefined}><source src={urlMedia(media)} type={media.mimeType ?? undefined}/></video>
          : <img src={urlMedia(media)} alt={media.altText ?? media.titulo ?? ''}/>}</div>
        <div className="media-admin-body"><div className="gestion-form-heading"><div><span className="eyebrow">{media.tipo} · {media.rol}</span><h3>{media.titulo || 'Sin título'}</h3></div><span className={`status-pill status-${media.estado === 'ACTIVO' ? 'activo' : 'inactivo'}`}>{media.estado.toLocaleLowerCase('es')}</span></div>
          {media.descripcion && <p>{media.descripcion}</p>}
          <small>Orden {media.orden ?? 0}{media.mimeType ? ` · ${media.mimeType}` : ''}{media.sizeBytes ? ` · ${Math.round(media.sizeBytes/1024)} KB` : ''}</small>
          <div className="form-actions">
            <IonButton size="small" fill="outline" disabled={guardando} onClick={() => abrirEdicion(media)}>Editar metadata</IonButton>
            {media.tipo === 'IMAGEN' && media.rol !== 'PORTADA' && <IonButton size="small" fill="outline" disabled={guardando} onClick={() => void portada(media)}>Marcar portada</IonButton>}
            <IonButton size="small" fill="outline" disabled={guardando} onClick={() => void cambiarEstado(media)}>{media.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}</IonButton>
            <IonButton size="small" fill="clear" color="medium" disabled={guardando} onClick={() => void eliminar(media)}>Eliminar</IonButton>
          </div>
        </div>
      </article>)}
      {!medios.length && <p className="empty-state">Todavía no hay archivos multimedia asociados.</p>}
    </div>}
  </section>;
}
