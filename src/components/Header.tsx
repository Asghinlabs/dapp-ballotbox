import { Link, useLocation } from "@tanstack/react-router";
import { useWeb3 } from "@/lib/web3-context";
import { Button } from "@/components/ui/button";
import { VoterStatusBadge } from "@/components/VoterStatusBadge";

export function Header() {
  const { account, isAdmin, isCorrectNetwork, isConnecting, connectWallet, disconnectWallet } = useWeb3();
  const location = useLocation();

  const navLinks = [
    { to: "/" as const, label: "Elections" },
    ...(!isAdmin ? [{ to: "/register" as const, label: "Register" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>
            </div>
            <span className="text-lg font-bold font-display text-gradient">ChainVote</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === "/admin"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Admin
                </Link>
                <Link
                  to="/voter-view"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === "/voter-view"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Voter View
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!isCorrectNetwork && account && (
            <div className="hidden items-center gap-2 rounded-lg bg-warning/15 px-3 py-1.5 text-xs font-medium text-warning sm:flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              Wrong Network
            </div>
          )}
          {account ? (
            <div className="flex items-center gap-2">
              <VoterStatusBadge />
              {isAdmin && (
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">Admin</span>
              )}
              <span className="glass rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectWallet}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connectWallet} disabled={isConnecting} className="gradient-primary border-0 text-primary-foreground font-semibold">
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
