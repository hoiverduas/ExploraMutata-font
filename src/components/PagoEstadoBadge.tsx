import type { EstadoOrdenPago, EstadoPago } from '../types/finanzas';

const nombres: Record<EstadoOrdenPago | EstadoPago, string> = {
  CREADA: 'Creada',
  PENDIENTE: 'Pendiente',
  PAGADA: 'Pagada',
  CANCELADA: 'Cancelada',
  VENCIDA: 'Vencida',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  ANULADO: 'Anulado',
  ERROR: 'Error',
  REEMBOLSO_PARCIAL: 'Reembolso parcial',
  REEMBOLSADO: 'Reembolsado',
  CONTRACARGO: 'Contracargo',
};

export default function PagoEstadoBadge({ estado }: { estado: EstadoOrdenPago | EstadoPago }) {
  const favorable = estado === 'PAGADA' || estado === 'APROBADO';
  const pendiente = estado === 'CREADA' || estado === 'PENDIENTE';
  return <span className={`status-pill status-${favorable ? 'activo' : pendiente ? 'borrador' : 'inactivo'}`}>{nombres[estado]}</span>;
}
