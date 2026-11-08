/**
 * Re-keyed on every navigation, so each route fades in. Opacity only (see
 * .page-enter in globals.css): no transform, so pinned/fixed descendants keep
 * the viewport as their containing block.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
