interface IBrandLogoProps {
  showTagline?: boolean;
}

export function BrandLogo({ showTagline = true }: IBrandLogoProps) {
  return (
    <>
      <span className="brand-logo__mark" aria-hidden="true">
        <span>F</span>
      </span>
      <span className="brand-logo__copy">
        <strong className="brand-logo__name">Fetefolio</strong>
        {showTagline && <small className="brand-logo__tagline">EVENT SERVICES</small>}
      </span>
    </>
  );
}
