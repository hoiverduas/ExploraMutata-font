import type { Moneda } from './moneda';

export type EstadoOrdenPago = 'CREADA' | 'PENDIENTE' | 'PAGADA' | 'CANCELADA' | 'VENCIDA';
export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR' | 'REEMBOLSO_PARCIAL' | 'REEMBOLSADO' | 'CONTRACARGO';
export type ProveedorPago = 'WOMPI' | 'EPAYCO' | 'MERCADO_PAGO' | 'MANUAL';
export type TipoReglaComision = 'PORCENTAJE' | 'VALOR_FIJO';
export type EstadoCuentaPago = 'PENDIENTE_VERIFICACION' | 'ACTIVA' | 'RECHAZADA' | 'INACTIVA';
export type TipoCuentaBancariaWompi = 'AHORROS' | 'CORRIENTE';
export type TipoDestinoPago = 'CUENTA_AHORROS' | 'CUENTA_CORRIENTE' | 'DEPOSITO_ELECTRONICO' | 'LLAVE_BREB' | 'OTRO';
export type EstadoLiquidacion = 'ABIERTA' | 'LISTA' | 'PROCESANDO' | 'PAGADA' | 'FALLIDA' | 'CONCILIADA' | 'CANCELADA';
export type EstadoDispersionPago = 'CREADA' | 'ENVIANDO' | 'PROCESANDO' | 'PAGADA' | 'FALLIDA' | 'CANCELADA' | 'ESTADO_INCIERTO';
export type EstadoDistribucionPago = 'PENDIENTE' | 'DISPONIBLE' | 'EN_LIQUIDACION' | 'LIQUIDADA' | 'RETENIDA' | 'REEMBOLSADA';
export type TipoBeneficiarioDistribucion = 'NEGOCIO' | 'PLATAFORMA' | 'PASARELA';
export type TipoMovimientoFinanciero = 'PAGO_APROBADO' | 'INGRESO_NEGOCIO' | 'COMISION_PLATAFORMA' | 'COSTO_PASARELA' | 'REEMBOLSO' | 'LIQUIDACION' | 'AJUSTE';
export type NaturalezaMovimiento = 'CREDITO' | 'DEBITO';
export type EstadoReembolso = 'SOLICITADO' | 'PROCESANDO' | 'APROBADO' | 'RECHAZADO' | 'FALLIDO';
export type EstadoConciliacion = 'PENDIENTE' | 'CONCILIADA' | 'CON_DIFERENCIAS';

export interface OrdenPagoResponse {
  id: string;
  reservaId: string;
  turistaId: string;
  negocioId: string;
  reglaComisionId: string;
  referencia: string;
  montoOriginal: number;
  monedaOriginal: Moneda;
  montoCobro: number;
  monedaCobro: Moneda;
  fechaTasa: string | null;
  tipoComision: TipoReglaComision;
  porcentajeComision: number | null;
  valorFijoComision: number | null;
  estado: EstadoOrdenPago;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface PreparacionPagoWompiResponse {
  ordenPagoId: string;
  llavePublica: string;
  moneda: string;
  montoCentavos: number;
  referencia: string;
  firmaIntegridad: string;
  urlRedireccion: string | null;
  ambiente: string;
}

export interface PagoResponse {
  id: string;
  ordenPagoId: string;
  proveedor: ProveedorPago;
  referenciaProveedor: string | null;
  estado: EstadoPago;
  monto: number;
  moneda: Moneda;
  metodoPago: string | null;
  mensajeEstado: string | null;
  fechaProveedor: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface CuentaPagoNegocioRequest {
  proveedor: ProveedorPago;
  entidadFinanciera: string;
  bancoIdWompi: string;
  tipoCuentaWompi?: TipoCuentaBancariaWompi;
  numeroCuenta: string;
  titular: string;
  predeterminada: boolean;
}

export interface CuentaPagoNegocioResponse {
  id: string;
  negocioId: string;
  proveedor: ProveedorPago;
  identificadorBeneficiarioProveedor: string | null;
  entidadFinanciera: string;
  bancoIdWompi: string;
  tipoDestino: TipoDestinoPago;
  tipoCuentaWompi: TipoCuentaBancariaWompi;
  referenciaDestinoEnmascarada: string;
  titular: string;
  estado: EstadoCuentaPago;
  predeterminada: boolean;
  observacionVerificacion: string | null;
  fechaVerificacion: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface MovimientoFinancieroResponse {
  id: string;
  ordenPagoId: string | null;
  pagoId: string | null;
  reservaId: string | null;
  negocioId: string | null;
  tipo: TipoMovimientoFinanciero;
  naturaleza: NaturalezaMovimiento;
  monto: number;
  moneda: Moneda;
  concepto: string;
  referencia: string;
  fechaCreacion: string;
}

export interface LiquidacionResponse {
  id: string;
  negocioId: string;
  cuentaPagoNegocioId: string | null;
  proveedor: ProveedorPago;
  monto: number;
  moneda: Moneda;
  estado: EstadoLiquidacion;
  referenciaProveedor: string | null;
  idempotencia: string | null;
  observacion: string | null;
  fechaProgramada: string | null;
  fechaPago: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface DispersionPagoResponse {
  id: string;
  liquidacionId: string;
  cuentaPagoNegocioId: string;
  proveedor: ProveedorPago;
  numeroIntento: number;
  idempotencia: string;
  referenciaLoteProveedor: string | null;
  referenciaTransaccionProveedor: string | null;
  referenciaTransaccionInterna: string | null;
  estado: EstadoDispersionPago;
  estadoLoteProveedor: string | null;
  estadoTransaccionProveedor: string | null;
  monto: number;
  moneda: Moneda;
  codigoError: string | null;
  mensajeError: string | null;
  traceIdProveedor: string | null;
  fechaCreacion: string;
  fechaEnvio: string | null;
  fechaActualizacion: string;
  fechaFinalizacion: string | null;
  version: number;
}

export interface ReglaComisionRequest {
  tipo: TipoReglaComision;
  porcentaje: number | null;
  valorFijo: number | null;
  moneda: Moneda;
  observacion: string | null;
}

export interface ReglaComisionResponse {
  id: string;
  negocioId: string;
  tipo: TipoReglaComision;
  porcentaje: number | null;
  valorFijo: number | null;
  moneda: Moneda;
  activa: boolean;
  vigenteDesde: string;
  vigenteHasta: string | null;
  observacion: string | null;
  creadoPor: string;
  fechaCreacion: string;
  version: number;
}

export interface DistribucionPagoResponse {
  id: string;
  pagoId: string;
  negocioId: string | null;
  tipoBeneficiario: TipoBeneficiarioDistribucion;
  concepto: string;
  monto: number;
  montoReembolsado: number;
  moneda: Moneda;
  reglaComisionId: string | null;
  porcentajeAplicado: number | null;
  estado: EstadoDistribucionPago;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface ReembolsoRequest {
  monto: number;
  motivo: string;
}

export interface ReembolsoResponse {
  id: string;
  pagoId: string;
  reservaId: string;
  monto: number;
  moneda: Moneda;
  motivo: string;
  estado: EstadoReembolso;
  referenciaProveedor: string | null;
  solicitadoPor: string;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  mensajeEstado: string | null;
  version: number;
}

export interface ConciliacionRequest {
  desde: string;
  hasta: string;
  totalProveedor: number;
  cantidadProveedor: number;
  observacion: string | null;
}

export interface ConciliacionResponse {
  id: string;
  proveedor: ProveedorPago;
  desde: string;
  hasta: string;
  estado: EstadoConciliacion;
  totalInterno: number;
  totalProveedor: number;
  diferencia: number;
  cantidadInterna: number;
  cantidadProveedor: number;
  observacion: string | null;
  ejecutadaPor: string;
  fechaCreacion: string;
}

export interface WompiBanco {
  id: string;
  nombre: string;
  codigo: string | null;
  depositoElectronico: boolean;
}

export interface WompiCuentaOrigen {
  id: string;
  balanceInCents: number | null;
  number: string | null;
  status: string;
  isMain: boolean | null;
  accountType: string | null;
  bank: {
    code: string | null;
    name: string | null;
  } | null;
  updatedAt: string | null;
}

export interface DiagnosticoWompiPagosTerceros {
  cuentasOrigen: WompiCuentaOrigen[];
  bancos: unknown;
}
