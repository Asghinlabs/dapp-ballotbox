import { useState, useEffect } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { useContract } from "@/hooks/use-contract";

type VoterState = "loading" | "not-registered" | "pending" | "approved";

export function VoterStatusBadge() {
  const { account, isCorrectNetwork, isAdmin } = useWeb3();
  const { getVoterStatus } = useContract();
  const [state, setState] = useState<VoterState>("loading");

  useEffect(() => {
    if (!account || !isCorrectNetwork || isAdmin) {
      setState("loading");
      return;
    }
    let cancelled = false;
    getVoterStatus(account).then((s) => {
      if (cancelled) return;
      if (!s) setState("not-registered");
      else if (s.isApproved) setState("approved");
      else if (s.isRegistered) setState("pending");
      else setState("not-registered");
    });
    return () => { cancelled = true; };
  }, [account, isCorrectNetwork, isAdmin, getVoterStatus]);

  if (!account || isAdmin || state === "loading") return null;

  const config = {
    "not-registered": { bg: "bg-muted/50", text: "text-muted-foreground", label: "Not Registered" },
    pending: { bg: "bg-warning/15", text: "text-warning", label: "⏳ Pending" },
    approved: { bg: "bg-success/15", text: "text-success", label: "✓ Approved" },
  };

  const c = config[state];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
