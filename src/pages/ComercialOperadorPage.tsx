import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import { formatearPrecio } from '../domain/precios';
import { comercialOperadorApi } from '../services/comercialOperadorApi';
import { ApiError } from '../services/http';
import { operadorNegociosApi } from '../services/operadorNegociosApi';
import type { CargoSuscripcionResponse, ContratoComercialResponse, PlanComercialResponse } from '../types/comercial';
import type { NegocioResponse } from '../types/negocio';

const fecha = (valor: string | null) => valor ? new Date(valor).toLocaleString('es-CO') : '—';
const texto = (valor: string) => valor.replaceAll('_', ' ').toLocaleLowerCase('es');
const estadoClase = (valor: string) =>
  ['ACTIVO', 'PAGADO'].includes(valor) ? 'activo'
    : ['PRUEBA', 'PENDIENTE'].includes(valor) ? 'borrador'
      : 'inactivo';

export default function ComercialOperadorPage() {
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [negocioId, setNegocioId] = useState('');
  const [planes, setPlanes] = useState<PlanComercialResponse[]>([]);
  const [contrato, setContrato] = useState<ContratoComercialResponse | null>(null);
  const [cargos, setCargos] = useState<CargoSuscripcionResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarBase = useCallback(async () => {
    setCargando(true); setError('');
    try {
      const primera = await operadorNegociosApi.listar(0, 100);
      const lista = [...primera.contenido];
      for (let pagina = 1; pagina < primera.totalPaginas; pagina++) {
        const siguiente = await operadorNegociosApi.listar(pagina, 100);
        lista.push(...siguiente.contenido);
      }
      const unicos = [...new Map(lista.map(item => [item.id, item])).values()];
      const planesDatos = await comercialOperadorApi.listarPlanes();
      setNegocios(unicos);
      setPlanes(planesDatos);
      setNegocioId(actual => actual || unicos[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar tu información comercial.');
    } finally { setCargando(false); }
  }, []);

  const cargarNegocio = useCallback(async (id: string) => {
    if (!id) { setContrato(null); setCargos([]); return; }
    setCargando(true); setError('');
    try {
      const actual = await comercialOperadorApi.contratoActual(id)
        .catch(err => {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        });
      const cargosDatos = await comercialOperadorApi.listarCargos(id);
      setContrato(actual);
      setCargos(cargosDatos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el contrato comercial.');
    } finally { setCargando(false); }
  }, []);

  useEffect(() => { void cargarBase(); }, [cargarBase]);
  useEffect(() => { if (negocioId) void cargarNegocio(negocioId); }, [negocioId, cargarNegocio]);

  const negocio = useMemo(() => negocios.find(item => item.id === negocioId) ?? null, [negocios, negocioId]);

  return <IonPage><BrandHeader title="Mi plan comercial"/><IonContent fullscreen>
    <main className="page-width gestion-page">
      <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR · MODELO COMERCIAL</span><h1>Tu plan, contrato y <em>cargos.</em></h1><p>Consulta las condiciones comerciales vigentes de cada uno de tus negocios.</p></div><IonButton fill="outline" disabled={cargando} onClick={() => void cargarBase()}>Actualizar</IonButton></div>
      {error && <div className="notice-error" role="alert">{error}</div>}
      {cargando && !negocios.length ? <div className="loading-state"><IonSpinner/> Cargando información comercial…</div> : <>
        <section className="gestion-form-panel">
          <label>Negocio<select value={negocioId} onChange={e => setNegocioId(e.target.value)}><option value="">Selecciona un negocio</option>{negocios.map(item => <option key={item.id} value={item.id}>{item.nombreComercial}</option>)}</select></label>
          {negocio && <p>Modelo comercial de <strong>{negocio.nombreComercial}</strong>.</p>}
        </section>

        {negocioId && <section className="gestion-form-panel"><h2>Contrato vigente</h2>
          {contrato ? <article className="negocio-row"><div><h3>{contrato.planNombre}</h3>
            <p>{texto(contrato.modeloSnapshot)} · {formatearPrecio(contrato.valorSuscripcionSnapshot, contrato.monedaSnapshot)}{contrato.periodicidadSnapshot ? ' · ' + texto(contrato.periodicidadSnapshot) : ''}</p>
            <p>Inicio {fecha(contrato.fechaInicio)} · renovación automática {contrato.renovacionAutomatica ? 'sí' : 'no'}</p>
            {contrato.fechaFinPrueba && <p>Período de prueba hasta {fecha(contrato.fechaFinPrueba)}</p>}
            {contrato.periodoActualDesde && <p>Período de facturación: {fecha(contrato.periodoActualDesde)} → {fecha(contrato.periodoActualHasta)}</p>}
            {contrato.observacion && <p>{contrato.observacion}</p>}
          </div><span className={'status-pill status-' + estadoClase(contrato.estado)}>{texto(contrato.estado)}</span></article> : <p className="empty-state">Tu negocio todavía no tiene un contrato comercial vigente. Contacta al administrador de Explora Mutatá.</p>}
        </section>}

        {negocioId && <section className="gestion-form-panel"><h2>Cargos de suscripción</h2>
          <div className="negocios-list">{cargos.map(cargo => <article className="negocio-row" key={cargo.id}><div><h3>{formatearPrecio(cargo.monto, cargo.moneda)}</h3><p>{fecha(cargo.periodoDesde)} → {fecha(cargo.periodoHasta)} · vence {fecha(cargo.fechaVencimiento)}</p>{cargo.fechaPago && <p>Pagado {fecha(cargo.fechaPago)}{cargo.referenciaPago ? ' · ref. ' + cargo.referenciaPago : ''}</p>}{cargo.observacion && <p>{cargo.observacion}</p>}</div><span className={'status-pill status-' + estadoClase(cargo.estado)}>{texto(cargo.estado)}</span></article>)}{!cargos.length && <p className="empty-state">No hay cargos de suscripción para este negocio.</p>}</div>
        </section>}

        <section className="gestion-form-panel"><h2>Planes activos</h2><p>Estos son los planes comerciales disponibles actualmente. El cambio de plan lo gestiona la administración.</p>
          <div className="negocios-list">{planes.map(plan => <article className="negocio-row" key={plan.id}><div><h3>{plan.nombre}</h3><p>{texto(plan.modelo)} · {plan.valorSuscripcion > 0 ? formatearPrecio(plan.valorSuscripcion, plan.moneda) : 'sin mensualidad'}{plan.periodicidad ? ' · ' + texto(plan.periodicidad) : ''}</p>{plan.descripcion && <p>{plan.descripcion}</p>}</div>{contrato?.planComercialId === plan.id && <span className="status-pill status-activo">Tu plan</span>}</article>)}</div>
        </section>
      </>}
    </main>
  </IonContent></IonPage>;
}
