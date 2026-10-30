import { useCallback } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { configuracionComercialOfertaApi } from '../services/configuracionComercialOfertaApi';
import type { ConfiguracionComercialPublicaResponse, OfertaTarifaResponse } from '../types/configuracionComercialOferta';
import { nombresModeloPrecio } from '../types/oferta';
import { formatearPrecio } from '../domain/precios';
import type { Moneda } from '../types/moneda';

const etiqueta = (valor: string) => (valor.charAt(0) + valor.slice(1).toLocaleLowerCase('es')).replaceAll('_', ' ');
const resumenTarifa = (tarifa: OfertaTarifaResponse, moneda: Moneda) => {
  if (tarifa.tipo === 'PROMOCION') {
    if (tarifa.tipoDescuentoPromocion === 'PORCENTAJE') return String(tarifa.valorDescuentoPromocion ?? 0) + '% de descuento';
    if (tarifa.tipoDescuentoPromocion === 'VALOR_FIJO') return formatearPrecio(tarifa.valorDescuentoPromocion ?? 0, moneda) + ' de descuento';
    if (tarifa.precio !== null) return 'Precio especial ' + formatearPrecio(tarifa.precio, moneda);
  }
  return tarifa.precio === null ? 'Precio según condiciones' : formatearPrecio(tarifa.precio, moneda);
};

export default function ConfiguracionComercialOfertaPublica({ ofertaId, moneda }: { ofertaId: number; moneda: Moneda }) {
  const cargar = useCallback(
    (signal: AbortSignal) => configuracionComercialOfertaApi.obtenerPublica(ofertaId, { signal }),
    [ofertaId],
  );
  const consulta = useConsultaApi<ConfiguracionComercialPublicaResponse | null>(cargar, null);
  const datos = consulta.datos;

  if (consulta.cargando || consulta.error || !datos) return null;
  if (!datos.variantes.length && !datos.inclusiones.length && !datos.tarifas.length) return null;

  return <section className="marketplace-section">
    <h2>Opciones de esta oferta</h2>
    {datos.variantes.length > 0 && <><h3>Variantes</h3><div className="catalog-grid">{datos.variantes.map(variante =>
      <article className="catalog-card" key={variante.id}><div className="catalog-card-body"><h3>{variante.nombre}</h3>
        {variante.descripcion && <p>{variante.descripcion}</p>}
        {variante.precio !== null && <p><strong>{formatearPrecio(variante.precio, moneda)}</strong>{variante.modeloPrecio ? ` · ${nombresModeloPrecio[variante.modeloPrecio]}` : ''}</p>}
        {variante.capacidadMaxima !== null && <p>Capacidad máxima: {variante.capacidadMaxima}</p>}
      </div></article>)}</div></>}
    {datos.inclusiones.length > 0 && <><h3>Qué incluye</h3><ul className="marketplace-includes">{datos.inclusiones.map(item =>
      <li key={item.id}><strong>{item.incluido ? 'Incluye' : 'No incluye'} · {item.nombre}</strong><span>{etiqueta(item.tipo)}</span>{item.descripcion && <p>{item.descripcion}</p>}</li>)}</ul></>}
    {datos.tarifas.length > 0 && <><h3>Tarifas disponibles</h3><div className="catalog-grid">{datos.tarifas.map(tarifa =>
      <article className="catalog-card" key={tarifa.id}><div className="catalog-card-body"><span>{etiqueta(tarifa.tipo)}</span><h3>{tarifa.nombre}</h3>
        {tarifa.descripcion && <p>{tarifa.descripcion}</p>}<p><strong>{resumenTarifa(tarifa, moneda)}</strong>{tarifa.modeloPrecio ? ` · ${nombresModeloPrecio[tarifa.modeloPrecio]}` : ''}</p>
        {(tarifa.minimoPersonas !== null || tarifa.maximoPersonas !== null) && <p>Personas: {tarifa.minimoPersonas ?? 1}{tarifa.maximoPersonas !== null ? ` a ${tarifa.maximoPersonas}` : ' o más'}</p>}
      </div></article>)}</div></>}
  </section>;
}
