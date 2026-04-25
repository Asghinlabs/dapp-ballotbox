import { useState } from "react";
import { toast } from "sonner";
import { HelpCircle, Monitor, Smartphone, Copy, Check, ChevronDown, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DEMO_WALLETS: { label: string; key: string }[] = [
  { label: "Demo Voter 1", key: "[PRIVATE_KEY_1]" },
  { label: "Demo Voter 2", key: "[PRIVATE_KEY_2]" },
  { label: "Demo Voter 3", key: "[PRIVATE_KEY_3]" },
  { label: "Demo Voter 4", key: "[PRIVATE_KEY_4]" },
  { label: "Demo Voter 5", key: "[PRIVATE_KEY_5]" },
];

const SEPOLIA_RPC = {
  name: "Sepolia Testnet",
  rpc: "https://rpc.sepolia.org",
  chainId: "11155111",
  symbol: "ETH",
  explorer: "https://sepolia.etherscan.io",
};

export function WalletSetupGuide() {
  const [open, setOpen] = useState(false);
  const [pcOpen, setPcOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copy = async (text: string, idx: number, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1800);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="mt-3 h-12 w-full border-primary/30 bg-background/50 text-sm font-semibold hover:bg-primary/5"
        >
          <HelpCircle className="h-4 w-4" />
          ❓ Don't have a wallet? Click here for setup guide
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">🚀 Wallet Setup Guide</DialogTitle>
          <DialogDescription>
            Choose your device to get step-by-step instructions, or grab a demo wallet to try the DApp instantly.
          </DialogDescription>
        </DialogHeader>

        {/* PC SECTION */}
        <section className="rounded-xl border border-border bg-muted/30">
          <button
            onClick={() => setPcOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 p-4 text-left"
          >
            <span className="flex items-center gap-2 font-semibold">
              <Monitor className="h-5 w-5 text-primary" />
              💻 PC / Laptop User
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${pcOpen ? "rotate-180" : ""}`} />
          </button>
          {pcOpen && (
            <ol className="space-y-3 border-t border-border p-4 text-sm">
              <Step n={1} title="Download MetaMask">
                Visit{" "}
                <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                  metamask.io/download <ExternalLink className="h-3 w-3" />
                </a>{" "}
                and pick Chrome, Firefox, Edge, or Brave.
              </Step>
              <Step n={2} title="Install the extension">
                Click "Add to browser" and pin the fox icon to your toolbar.
              </Step>
              <Step n={3} title="Create a new wallet">
                ⚠️ Save your 12-word seed phrase somewhere safe — it's the only way to recover your wallet.
              </Step>
              <Step n={4} title="Add the Sepolia network">
                Open Networks → Add network. Use these details:
                <pre className="mt-2 overflow-x-auto rounded-md bg-background p-3 text-xs">
{`Network Name: ${SEPOLIA_RPC.name}
RPC URL:      ${SEPOLIA_RPC.rpc}
Chain ID:     ${SEPOLIA_RPC.chainId}
Symbol:       ${SEPOLIA_RPC.symbol}
Explorer:     ${SEPOLIA_RPC.explorer}`}
                </pre>
              </Step>
              <Step n={5} title="Get free test ETH">
                Grab Sepolia ETH at{" "}
                <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                  sepoliafaucet.com <ExternalLink className="h-3 w-3" />
                </a>
                .
              </Step>
              <Step n={6} title="Return and connect">
                Come back here and tap "🔒 CONNECT TO VOTE".
              </Step>
            </ol>
          )}
        </section>

        {/* MOBILE SECTION */}
        <section className="rounded-xl border border-border bg-muted/30">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 p-4 text-left"
          >
            <span className="flex items-center gap-2 font-semibold">
              <Smartphone className="h-5 w-5 text-primary" />
              📱 Mobile User (iOS / Android)
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
          </button>
          {mobileOpen && (
            <ol className="space-y-3 border-t border-border p-4 text-sm">
              <Step n={1} title="Install MetaMask">
                Download from the{" "}
                <a href="https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  App Store
                </a>{" "}
                or{" "}
                <a href="https://play.google.com/store/apps/details?id=io.metamask" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Google Play
                </a>
                .
              </Step>
              <Step n={2} title="Open the app and create a wallet">
                Save your 12-word seed phrase. Never share it.
              </Step>
              <Step n={3} title="Switch to Sepolia">
                Tap the network dropdown at the top → Add network → enable test networks → choose Sepolia.
              </Step>
              <Step n={4} title="Get test ETH">
                Open{" "}
                <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  sepoliafaucet.com
                </a>{" "}
                in your phone's browser and request ETH.
              </Step>
              <Step n={5} title="⚠️ IMPORTANT — Open this DApp inside MetaMask">
                In the MetaMask app, tap the <b>Browser</b> (or <b>Explore</b>) tab and paste:
                <pre className="mt-2 overflow-x-auto rounded-md bg-background p-3 text-xs">
                  https://dapp-ballotbox.lovable.app
                </pre>
                Mobile browsers can't talk to MetaMask directly — you must use the in-app browser.
              </Step>
              <Step n={6} title="Connect and vote">
                Tap "🔒 CONNECT TO VOTE" and approve in MetaMask.
              </Step>
            </ol>
          )}
        </section>

        {/* DEMO WALLETS */}
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <h3 className="font-display text-lg font-bold">🎮 Want to skip setup? Try a demo wallet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Import one of these private keys into MetaMask (Account menu → Import account).
          </p>

          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-2.5">Account</th>
                  <th className="p-2.5">Private Key</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_WALLETS.map((w, i) => (
                  <tr key={i} className="border-t border-border bg-background">
                    <td className="p-2.5 font-medium whitespace-nowrap">{w.label}</td>
                    <td className="p-2.5 font-mono text-xs text-muted-foreground">
                      <span className="block max-w-[140px] truncate sm:max-w-[260px]">{w.key}</span>
                    </td>
                    <td className="p-2.5 text-right">
                      <Button
                        size="sm"
                        variant={copiedIdx === i ? "secondary" : "outline"}
                        onClick={() => copy(w.key, i, w.label)}
                        className="h-8"
                      >
                        {copiedIdx === i ? (
                          <><Check className="h-3.5 w-3.5" />Copied!</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5" />Copy</>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 rounded-lg bg-warning/10 p-3 text-xs text-warning">
            ⚠️ Demo wallets are public for testing. Each can vote only once. Never share your real private keys.
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <div className="mt-0.5 text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}
