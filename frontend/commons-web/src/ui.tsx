import { ReactNode } from "react";

export function AuthenticatedLayout({
  path,
  onSignOut,
  children,
}: {
  path: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  return (
    <main className="page-shell">
      <section className="card app-card">
        <Header onSignOut={onSignOut} />
        <nav className="main-navigation" aria-label="Main navigation">
          <NavigationLink href="#/profile" active={path === "/profile"}>Profile</NavigationLink>
          <NavigationLink href="#/capabilities" active={path === "/capabilities"}>
            Capabilities
          </NavigationLink>
          <NavigationLink href="#/requests" active={path.startsWith("/requests")}>
            My Requests
          </NavigationLink>
          <NavigationLink
            href="#/available-requests"
            active={path.startsWith("/available-requests")}
          >
            Available Requests
          </NavigationLink>
          <NavigationLink href="#/offers" active={path.startsWith("/offers")}>
            My Offers
          </NavigationLink>
          <NavigationLink href="#/agreements" active={path.startsWith("/agreements")}>
            My Agreements
          </NavigationLink>
        </nav>
        {children}
      </section>
    </main>
  );
}

function NavigationLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return <a href={href} aria-current={active ? "page" : undefined}>{children}</a>;
}

export function Header({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="app-header">
      <Brand />
      <button className="text-button" type="button" onClick={onSignOut}>Sign out</button>
    </header>
  );
}

export function Brand() {
  return <div className="brand"><span aria-hidden="true">◉</span> Commons Market</div>;
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return <label className="field" htmlFor={htmlFor}><span>{label}</span>{children}</label>;
}

export function PageMessage({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <main className="page-shell">
      <section className="card message-card">
        <Brand />
        <p className="status-message">{message}</p>
        {actionLabel && onAction && (
          <button type="button" className="primary-button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </section>
    </main>
  );
}
