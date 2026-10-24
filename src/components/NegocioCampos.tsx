import { categoriasCatalogo, nombresCategoria } from '../data/categoriasCatalogo';
import type { NegocioRequest, TipoDocumento, TipoPersona } from '../types/negocio';

interface Props {
  formulario: NegocioRequest;
  actualizarCampo: <K extends keyof NegocioRequest>(campo: K, valor: NegocioRequest[K]) => void;
}
export default function NegocioCampos({ formulario, actualizarCampo }: Props) {
  return <>
            <label>Nombre comercial *<input value={formulario.nombreComercial} onChange={e=>actualizarCampo('nombreComercial',e.target.value)} maxLength={150} required /></label>
            <label>Tipo de persona *<select value={formulario.tipoPersona} onChange={e=>actualizarCampo('tipoPersona',e.target.value as TipoPersona)}><option value="NATURAL">Persona natural</option><option value="JURIDICA">Persona jurídica</option></select></label>
            <label>Razón social {formulario.tipoPersona==='JURIDICA'?'*':''}<input value={formulario.razonSocial} onChange={e=>actualizarCampo('razonSocial',e.target.value)} maxLength={200} required={formulario.tipoPersona==='JURIDICA'} /></label>
            <label>Tipo de documento *<select value={formulario.tipoDocumento} onChange={e=>actualizarCampo('tipoDocumento',e.target.value as TipoDocumento)}><option value="NIT">NIT</option><option value="CEDULA_CIUDADANIA">Cédula de ciudadanía</option><option value="CEDULA_EXTRANJERIA">Cédula de extranjería</option><option value="PASAPORTE">Pasaporte</option></select></label>
            <label>Número de documento *<input value={formulario.numeroDocumento} onChange={e=>actualizarCampo('numeroDocumento',e.target.value)} maxLength={30} required /></label>
            <label>Correo de contacto *<input type="email" value={formulario.correoContacto} onChange={e=>actualizarCampo('correoContacto',e.target.value)} maxLength={150} required /></label>
            <label>Teléfono *<input type="tel" value={formulario.telefonoContacto} onChange={e=>actualizarCampo('telefonoContacto',e.target.value)} maxLength={30} required /></label>
            <fieldset className="form-full negocio-categorias">
              <legend>Categorías del negocio *</legend>
              <p>Selecciona una o más categorías.</p>
              <div className="negocio-categoria-opciones">{categoriasCatalogo.map(opcion => <label className="negocio-categoria-opcion" key={opcion.categoria}>
                <input type="checkbox" checked={formulario.categorias.includes(opcion.categoria)} onChange={e => actualizarCampo('categorias', e.target.checked
                  ? [...formulario.categorias, opcion.categoria]
                  : formulario.categorias.filter(categoria => categoria !== opcion.categoria))}/>
                <span>{nombresCategoria[opcion.categoria]}</span>
              </label>)}</div>
            </fieldset>
            <label className="form-full">Descripción<textarea rows={4} maxLength={1000} value={formulario.descripcion} onChange={e=>actualizarCampo('descripcion',e.target.value)}/></label>
  </>;
}
