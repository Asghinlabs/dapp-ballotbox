import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Web3Provider } from "@/lib/web3-context";
import { Header } from "@/components/Header";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ChainVote — Decentralized Voting DApp" },
      { name: "description", content: "Secure blockchain voting on Ethereum Sepolia testnet" },
      { property: "og:title", content: "ChainVote — Decentralized Voting DApp" },
      { property: "og:description", content: "Secure blockchain voting on Ethereum Sepolia testnet" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "ChainVote — Decentralized Voting DApp" },
      { name: "twitter:description", content: "Secure blockchain voting on Ethereum Sepolia testnet" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/192d90de-0504-405f-a509-2e5d95e6bd1a/id-preview-15acc913--dcf64b55-66a4-4df0-87de-7c0766c71a80.lovable.app-1775912575293.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/192d90de-0504-405f-a509-2e5d95e6bd1a/id-preview-15acc913--dcf64b55-66a4-4df0-87de-7c0766c71a80.lovable.app-1775912575293.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <Web3Provider>
      <div className="gradient-bg gradient-mesh min-h-screen">
        <Header />
        <Outlet />
        <Toaster position="bottom-right" theme="dark" />
      </div>
    </Web3Provider>
  );
}
