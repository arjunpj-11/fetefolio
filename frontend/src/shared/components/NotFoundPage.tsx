import { Link } from 'react-router-dom';
export function NotFoundPage() {
  return (
    <section className="not-found">
      <span className="eyebrow">404 · FETEFOLIO</span>
      <h1>This page missed its cue.</h1>
      <p>
        The event continues elsewhere. Return to Fetefolio and discover something worth gathering
        for.
      </p>
      <Link className="button button--primary" to="/">
        Back to Fetefolio
      </Link>
    </section>
  );
}
