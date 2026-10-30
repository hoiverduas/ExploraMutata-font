interface Props {
  whatsapp?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
}

export default function RedesContactoPublicas({ whatsapp, instagramUrl, facebookUrl }: Props) {
  if (!whatsapp && !instagramUrl && !facebookUrl) return null;
  return <div className="marketplace-actions">
    {whatsapp && <a className="resource-inline-link" href={`https://wa.me/${encodeURIComponent(whatsapp)}`} target="_blank" rel="noreferrer">WhatsApp</a>}
    {instagramUrl && <a className="resource-inline-link" href={instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}
    {facebookUrl && <a className="resource-inline-link" href={facebookUrl} target="_blank" rel="noreferrer">Facebook</a>}
  </div>;
}
