import { IonIcon } from '@ionic/react';
import { logoFacebook, logoInstagram, logoWhatsapp } from 'ionicons/icons';

interface Props {
  whatsapp?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
}

const whatsappHref = (valor: string) => {
  const numero = valor.replace(/\D/g, '');
  return numero ? `https://wa.me/${numero}` : valor;
};

export default function RedesContactoPublicas({ whatsapp, instagramUrl, facebookUrl }: Props) {
  if (!whatsapp && !instagramUrl && !facebookUrl) return null;

  return <div className="social-network-links" aria-label="Redes sociales y contacto">
    {whatsapp && <a
      className="social-network-link social-network-whatsapp"
      href={whatsappHref(whatsapp)}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      <span className="social-network-icon"><IonIcon icon={logoWhatsapp}/></span>
      <span>WhatsApp</span>
    </a>}

    {instagramUrl && <a
      className="social-network-link social-network-instagram"
      href={instagramUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Abrir Instagram"
    >
      <span className="social-network-icon"><IonIcon icon={logoInstagram}/></span>
      <span>Instagram</span>
    </a>}

    {facebookUrl && <a
      className="social-network-link social-network-facebook"
      href={facebookUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Abrir Facebook"
    >
      <span className="social-network-icon"><IonIcon icon={logoFacebook}/></span>
      <span>Facebook</span>
    </a>}
  </div>;
}
