import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { useContract } from "@/hooks/use-contract";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Voter Registration — ChainVote" },
      { name: "description", content: "Register as a voter on the blockchain" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { account, isCorrectNetwork, connectWallet, isConnecting } = useWeb3();
  const { registerVoter, getVoterStatus, loading } = useContract();
  const [status, setStatus] = useState<{ isRegistered: boolean; isApproved: boolean } | null>(null);

  useEffect(() => {
    if (account && isCorrectNetwork) {
      getVoterStatus(account).then((s) => {
        if (s) setStatus(s);
      });
    }
  }, [account, isCorrectNetwork, getVoterStatus]);

  const handleRegister = async () => {
    const result = await registerVoter();
    if (result && account) {
      setStatus({ isRegistered: true, isApproved: false });
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="glass rounded-2xl p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </div>

        <h1 className="font-display text-2xl font-bold">Voter Registration</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Register your wallet address to participate in elections.
        </p>

        {!account ? (
          <div className="mt-8">
            <Button onClick={connectWallet} disabled={isConnecting} className="gradient-primary border-0 text-primary-foreground font-semibold">
              {isConnecting ? "Connecting..." : "Connect Wallet to Register"}
            </Button>
          </div>
        ) : !isCorrectNetwork ? (
          <div className="mt-8 rounded-xl bg-warning/10 p-4 text-sm text-warning">
            Please switch to Sepolia testnet.
          </div>
        ) : status?.isApproved ? (
          <div className="mt-8 rounded-xl bg-success/10 p-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <p className="font-semibold text-success">You are approved!</p>
            <p className="mt-1 text-xs text-muted-foreground">You can now vote in active elections.</p>
          </div>
        ) : status?.isRegistered ? (
          <div className="mt-8 rounded-xl bg-primary/10 p-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <p className="font-semibold text-primary">Registration Pending</p>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting admin approval. Check back soon.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="rounded-xl bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Your wallet</p>
              <p className="mt-1 break-all font-mono text-sm">{account}</p>
            </div>
            <Button onClick={handleRegister} disabled={loading} className="w-full gradient-primary border-0 text-primary-foreground font-semibold">
              {loading ? "Submitting..." : "Register as Voter"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
