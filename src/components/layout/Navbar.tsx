import { Link } from 'react-router-dom';
import { Dock } from './Dock';

/** Slim centered wordmark on top; navigation lives in the bottom dock. */
export function Navbar() {
  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/60 backdrop-blur-xl backdrop-saturate-150 [@media(prefers-reduced-transparency:reduce)]:bg-surface-1 [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-center px-4">
          <Link to="/" className="font-display text-base font-semibold tracking-[-0.02em] text-cream transition-opacity hover:opacity-80">
            JobTracker
          </Link>
        </div>
      </header>
      <Dock />
    </>
  );
}
