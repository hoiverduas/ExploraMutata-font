import type { Moneda } from './moneda';

export type ModeloComercial = 'GRATIS' | 'SUSCRIPCION' | 'COMISION' | 'MIXTO';
export type PeriodicidadSuscripcion = 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
export type EstadoContratoComercial = 'PRUEBA' | 'ACTIVO' | 'SUSPENDIDO' | 'CANCELADO' | 'VENCIDO';
export type EstadoCargoSuscripcion = 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'ANULADO';

export interface PlanComercialRequest {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  modelo: ModeloComercial;
  valorSuscripcion: number | null;
  moneda: Moneda;
  periodicidad: PeriodicidadSuscripcion | null;
  diasPrueba: number | null;
  activo: boolean | null;
}

export interface PlanComercialResponse {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  modelo: ModeloComercial;
  valorSuscripcion: number;
  moneda: Moneda;
  periodicidad: PeriodicidadSuscripcion | null;
  diasPrueba: number;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface ContratoComercialRequest {
  planComercialId: string;
  reglaComisionId: string | null;
  fechaInicio: string | null;
  renovacionAutomatica: boolean | null;
  observacion: string | null;
}

export interface ContratoComercialResponse {
  id: string;
  negocioId: string;
  planComercialId: string;
  planCodigo: string;
  planNombre: string;
  reglaComisionId: string;
  estado: EstadoContratoComercial;
  modeloSnapshot: ModeloComercial;
  valorSuscripcionSnapshot: number;
  monedaSnapshot: Moneda;
  periodicidadSnapshot: PeriodicidadSuscripcion | null;
  fechaInicio: string;
  fechaFin: string | null;
  fechaFinPrueba: string | null;
  periodoActualDesde: string | null;
  periodoActualHasta: string | null;
  renovacionAutomatica: boolean;
  observacion: string | null;
  creadoPor: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface CargoSuscripcionResponse {
  id: string;
  contratoId: string;
  negocioId: string;
  periodoDesde: string;
  periodoHasta: string;
  monto: number;
  moneda: Moneda;
  estado: EstadoCargoSuscripcion;
  fechaVencimiento: string | null;
  referenciaPago: string | null;
  fechaPago: string | null;
  observacion: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface CambioEstadoContratoRequest {
  observacion: string | null;
}

export interface GenerarCargoSuscripcionRequest {
  fechaVencimiento: string | null;
}

export interface PagarCargoSuscripcionRequest {
  referenciaPago: string | null;
  observacion: string | null;
}
