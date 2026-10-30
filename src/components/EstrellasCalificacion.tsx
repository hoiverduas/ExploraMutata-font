interface Props {
  valor: number;
  onChange?: (valor: number) => void;
  etiqueta?: string;
}

export default function EstrellasCalificacion({ valor, onChange, etiqueta = 'Calificación' }: Props) {
  const editable = Boolean(onChange);
  return <div className="rating-stars" role={editable ? 'radiogroup' : undefined} aria-label={etiqueta}>
    {[1,2,3,4,5].map(numero => editable
      ? <button
          type="button"
          key={numero}
          className={numero <= valor ? 'rating-star active' : 'rating-star'}
          role="radio"
          aria-checked={numero === valor}
          aria-label={`${numero} de 5 estrellas`}
          onClick={() => onChange?.(numero)}
        >★</button>
      : <span key={numero} className={numero <= valor ? 'rating-star active' : 'rating-star'} aria-hidden="true">★</span>
    )}
    {!editable && <span className="sr-only">{valor} de 5 estrellas</span>}
  </div>;
}
