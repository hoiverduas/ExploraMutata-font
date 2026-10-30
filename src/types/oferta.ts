import type { CategoriaNegocio } from './catalogo';
import type { Moneda, PrecioConvertidoResponse } from './moneda';

export const estadosOferta = ['BORRADOR', 'ACTIVA', 'INACTIVA'] as const;
export type EstadoOferta = typeof estadosOferta[number];
export const modelosPrecio = [
  'FIJO', 'POR_PERSONA', 'POR_PAREJA', 'POR_DIA', 'POR_NOCHE', 'POR_PERSONA_Y_DIA',
  'POR_PERSONA_Y_NOCHE', 'POR_UNIDAD_Y_NOCHE', 'POR_TRAYECTO',
  'POR_PERSONA_Y_TRAYECTO', 'POR_VEHICULO', 'POR_MESA', 'POR_GRUPO',
] as const;
export type ModeloPrecio = typeof modelosPrecio[number];
export const unidadesDuracionOferta = ['UNICO', 'DIA', 'NOCHE', 'SEMANA', 'MES'] as const;
export type UnidadDuracionOferta = typeof unidadesDuracionOferta[number];

export const tiposInventario = [
  'CUPO', 'PERSONA', 'HABITACION', 'UNIDAD_ALOJAMIENTO', 'ESPACIO_CAMPING',
  'CABALLO', 'MOTO', 'BOTE', 'EQUIPO', 'VEHICULO', 'MESA', 'GRUPO', 'TRAYECTO', 'RESERVA',
] as const;
export type TipoInventario = typeof tiposInventario[number];

export const nombresModeloPrecio: Record<ModeloPrecio, string> = {
  FIJO: 'Precio fijo', POR_PERSONA: 'Por persona', POR_PAREJA: 'Por pareja', POR_DIA: 'Por día', POR_NOCHE: 'Por noche',
  POR_PERSONA_Y_DIA: 'Por persona y día', POR_PERSONA_Y_NOCHE: 'Por persona y noche',
  POR_UNIDAD_Y_NOCHE: 'Por unidad y noche', POR_TRAYECTO: 'Por trayecto',
  POR_PERSONA_Y_TRAYECTO: 'Por persona y trayecto', POR_VEHICULO: 'Por vehículo',
  POR_MESA: 'Por mesa', POR_GRUPO: 'Por grupo',
};
export const modelosPrecioPorCategoria: Record<CategoriaNegocio, readonly ModeloPrecio[]> = {
  AVENTURA: ['FIJO', 'POR_PERSONA', 'POR_PAREJA'],
  RESTAURANTE: ['FIJO', 'POR_PERSONA', 'POR_PAREJA', 'POR_DIA', 'POR_PERSONA_Y_DIA'],
  HOSPEDAJE: ['FIJO', 'POR_NOCHE', 'POR_PERSONA', 'POR_PAREJA', 'POR_PERSONA_Y_NOCHE', 'POR_UNIDAD_Y_NOCHE'],
  TRANSPORTE: ['FIJO', 'POR_PERSONA', 'POR_TRAYECTO', 'POR_PERSONA_Y_TRAYECTO', 'POR_VEHICULO'],
  GUIA: ['FIJO', 'POR_PERSONA', 'POR_PAREJA', 'POR_DIA', 'POR_GRUPO'],
  VIDA_NOCTURNA: ['FIJO', 'POR_PERSONA', 'POR_PAREJA', 'POR_MESA'],
};

export interface OfertaNegocioRequest {
  nombre: string;
  categoria: CategoriaNegocio;
  destinoId: string | null;
  experienciaId: string | null;
  precioDesde: number | null;
  moneda: Moneda;
  modeloPrecio: ModeloPrecio;
  personasIncluidas: number | null;
  capacidadMaxima: number | null;
  duracionCantidad: number;
  duracionUnidad: UnidadDuracionOferta;
  reservaRequerida: boolean;
  descripcionOferta: string | null;
}
export interface OfertaNegocioResponse extends OfertaNegocioRequest {
  id: number;
  negocioId: string;
  negocioNombreComercial: string;
  negocioWhatsapp: string | null;
  negocioInstagramUrl: string | null;
  negocioFacebookUrl: string | null;
  preciosConvertidos: PrecioConvertidoResponse | null;
  controlaDisponibilidad: boolean | null;
  requiereHorario: boolean | null;
  tipoInventario: TipoInventario | null;
  capacidadPorInventario: number | null;
  usaUbicacionNegocio: boolean | null;
  puntoEncuentroNombre: string | null;
  puntoEncuentroDireccion: string | null;
  puntoEncuentroMunicipio: string | null;
  puntoEncuentroVereda: string | null;
  puntoEncuentroReferencia: string | null;
  puntoEncuentroLatitud: number | null;
  puntoEncuentroLongitud: number | null;
  puntoEncuentroComoLlegar: string | null;
  estado: EstadoOferta;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export type CamposOfertaEspecializadaRequest = Omit<OfertaNegocioRequest, 'categoria' | 'destinoId' | 'experienciaId'>;
export const tiposOfertaRestaurante = ['INDIVIDUAL', 'COMBO'] as const;
export type TipoOfertaRestaurante = typeof tiposOfertaRestaurante[number];
export const tiposServicioRestaurante = ['DESAYUNO', 'ALMUERZO', 'CENA', 'MERIENDA', 'POSTRE', 'BEBIDA', 'SNACK', 'MENU_ESPECIAL', 'OTRO'] as const;
export type TipoServicioRestaurante = typeof tiposServicioRestaurante[number];
export interface OfertaRestauranteItemRequest {
  tipoServicio: TipoServicioRestaurante;
  nombre: string;
  descripcion: string | null;
  cantidad: number;
  orden: number;
}
export interface OfertaRestauranteItemResponse extends OfertaRestauranteItemRequest { id: number; }
export interface OfertaRestauranteRequest extends CamposOfertaEspecializadaRequest {
  tipoOferta: TipoOfertaRestaurante;
  items: OfertaRestauranteItemRequest[];
}
export interface OfertaRestauranteResponse {
  oferta: OfertaNegocioResponse;
  tipoOferta: TipoOfertaRestaurante;
  items: OfertaRestauranteItemResponse[];
}

export const tiposAlojamiento = ['HABITACION', 'CABANA', 'APARTAMENTO', 'CASA', 'FINCA', 'HOSTAL', 'CAMPING', 'GLAMPING', 'OTRO'] as const;
export type TipoAlojamiento = typeof tiposAlojamiento[number];
export const tiposHabitacion = ['SENCILLA', 'DOBLE', 'TRIPLE', 'CUADRUPLE', 'FAMILIAR', 'COMPARTIDA', 'NO_APLICA'] as const;
export type TipoHabitacion = typeof tiposHabitacion[number];
export interface CamposHospedaje {
  tipoAlojamiento: TipoAlojamiento;
  tipoHabitacion: TipoHabitacion;
  cantidadCamas: number | null;
  banoPrivado: boolean;
  incluyeDesayuno: boolean;
}
export interface OfertaHospedajeRequest extends CamposOfertaEspecializadaRequest, CamposHospedaje {}
export const amenidadesHospedaje = [
  'WIFI', 'AIRE_ACONDICIONADO', 'VENTILADOR', 'PISCINA', 'PARQUEADERO', 'BANO_PRIVADO',
  'AGUA_CALIENTE', 'COCINA', 'TELEVISION', 'MASCOTAS_PERMITIDAS', 'ACCESIBILIDAD', 'BALCON',
  'VISTA_RIO', 'HAMACAS', 'PARRILLA', 'ZONA_SOCIAL', 'ACCESO_RIO', 'CASCADA', 'DESAYUNO',
  'LAVANDERIA', 'ZONA_CAMPING',
] as const;
export type AmenidadHospedaje = typeof amenidadesHospedaje[number];
export interface OfertaHospedajeResponse extends CamposHospedaje {
  oferta: OfertaNegocioResponse;
  cantidadUnidades: number | null;
  estadiaMinimaNoches: number | null;
  estadiaMaximaNoches: number | null;
  horaCheckIn: string | null;
  horaCheckOut: string | null;
  amenidades: AmenidadHospedaje[];
}

export const tiposServicioTransporte = ['TRASLADO', 'IDA_Y_REGRESO', 'TRANSPORTE_LOCAL', 'TOUR', 'OTRO'] as const;
export type TipoServicioTransporte = typeof tiposServicioTransporte[number];
export const tiposVehiculo = ['MOTO', 'AUTOMOVIL', 'CAMIONETA', 'VAN', 'BUS', 'LANCHA', 'OTRO'] as const;
export type TipoVehiculo = typeof tiposVehiculo[number];
export interface CamposTransporte {
  tipoServicio: TipoServicioTransporte;
  origen: string;
  destino: string;
  tipoVehiculo: TipoVehiculo;
  trayectosPredeterminados: number;
}
export interface OfertaTransporteRequest extends Omit<CamposOfertaEspecializadaRequest, 'duracionCantidad' | 'duracionUnidad'>, CamposTransporte {}
export interface OfertaTransporteResponse extends CamposTransporte { oferta: OfertaNegocioResponse; }

export const tiposServicioGuia = ['RECORRIDO_GUIADO', 'ACOMPANAMIENTO', 'GUIA_LOCAL', 'GUIA_NATURALEZA', 'GUIA_CULTURAL', 'GUIA_AVENTURA', 'OTRO'] as const;
export type TipoServicioGuia = typeof tiposServicioGuia[number];
export interface CamposGuia {
  tipoServicio: TipoServicioGuia;
  idiomas: string;
  puntoEncuentro: string | null;
  incluyeEquipo: boolean;
}
export interface OfertaGuiaRequest extends CamposOfertaEspecializadaRequest, CamposGuia {}
export interface OfertaGuiaResponse extends CamposGuia { oferta: OfertaNegocioResponse; }

export const tiposServicioVidaNocturna = ['ENTRADA', 'MESA', 'EVENTO', 'FIESTA', 'PLAN', 'CONSUMO', 'OTRO'] as const;
export type TipoServicioVidaNocturna = typeof tiposServicioVidaNocturna[number];
export interface CamposVidaNocturna {
  tipoServicio: TipoServicioVidaNocturna;
  edadMinima: number | null;
  incluyeConsumo: boolean;
  condicionesAcceso: string | null;
}
export interface OfertaVidaNocturnaRequest extends CamposOfertaEspecializadaRequest, CamposVidaNocturna {}
export interface OfertaVidaNocturnaResponse extends CamposVidaNocturna { oferta: OfertaNegocioResponse; }

export type DetalleOfertaResponse = OfertaRestauranteResponse | OfertaHospedajeResponse | OfertaTransporteResponse | OfertaGuiaResponse | OfertaVidaNocturnaResponse;
