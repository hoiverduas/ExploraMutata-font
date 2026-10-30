import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { favoritosApi } from '../services/favoritosApi';
import type { TipoRecursoFavorito } from '../types/favorito';

export default function BotonFavorito({ tipo, recursoId, compacto = false }: {
  tipo: TipoRecursoFavorito;
  recursoId: string;
  compacto?: boolean;
}) {
  const { usuario, tieneRol } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [favorito, setFavorito] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const vivo = useRef(true);

  const esTurista = tieneRol('TURISTA');
  useEffect(() => {
    vivo.current = true;
    if (!usuario || !esTurista) { setFavorito(false); setConsultando(false); return () => { vivo.current = false; }; }
    const controller = new AbortController();
    setConsultando(true);
    void favoritosApi.estado(tipo, recursoId, { signal: controller.signal })
      .then(resultado => { if (!controller.signal.aborted && vivo.current) setFavorito(resultado.favorito); })
      .catch(() => { if (!controller.signal.aborted && vivo.current) setFavorito(false); })
      .finally(() => { if (!controller.signal.aborted && vivo.current) setConsultando(false); });
    return () => { vivo.current = false; controller.abort(); };
  }, [usuario?.id, esTurista, tipo, recursoId]);

  if (usuario && !esTurista) return null;

  const cambiar = async () => {
    if (guardando || consultando) return;
    if (!usuario) {
      const continuar = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/ingresar?continuar=${continuar}`);
      return;
    }
    setGuardando(true);
    try {
      if (favorito) {
        await favoritosApi.eliminar(tipo, recursoId);
        if (vivo.current) setFavorito(false);
      } else {
        await favoritosApi.agregar({ tipoRecurso: tipo, recursoId });
        if (vivo.current) setFavorito(true);
      }
    } finally {
      if (vivo.current) setGuardando(false);
    }
  };

  const texto = favorito ? 'Quitar de favoritos' : 'Guardar en favoritos';
  return <IonButton
    size="small"
    fill={favorito ? 'solid' : 'outline'}
    className="favorite-button"
    disabled={guardando || consultando}
    aria-label={texto}
    title={texto}
    onClick={() => void cambiar()}
  >
    {guardando || consultando ? <IonSpinner name="crescent"/> : <IonIcon icon={favorito ? heart : heartOutline}/>}
    {!compacto && <span>{favorito ? 'Guardado' : 'Favorito'}</span>}
  </IonButton>;
}
