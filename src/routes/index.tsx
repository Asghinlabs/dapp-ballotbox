import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { useContract } from "@/hooks/use-contract";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChainVote — Decentralized Voting" },
      { name: "description", content: "Transparent, secure blockchain voting on Sepolia testnet" },
      { property: "og:title", content: "ChainVote — Decentralized Voting" },
      { property: "og:description", content: "Transparent, secure blockchain voting on Sepolia testnet" },
    ],
  }),
  component: HomePage,
});

interface Candidate {
  id: number;
  name: string;
  description: string;
  voteCount: number;
}

interface Election {
  id: number;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  resultsPublished: boolean;
  candidates: Candidate[];
}

function HomePage() {
  const { account, isCorrectNetwork } = useWeb3();
  const { fetchElections, castVote, loading } = useContract();
  const [elections, setElections] = useState<Election[]>([]);
  const [fetchingElections, setFetchingElections] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const loadElections = useCallback(async () => {
    setFetchingElections(true);
    const data = await fetchElections();
    setElections(data);
    setFetchingElections(false);
  }, [fetchElections]);

  useEffect(() => {
    if (account && isCorrectNetwork) {
      loadElections();
    }
  }, [account, isCorrectNetwork, loadElections]);

  const handleVote = async (electionId: number, candidateId: number) => {
    setVotingId(`${electionId}-${candidateId}`);
    const result = await castVote(electionId, candidateId);
    if (result) await loadElections();
    setVotingId(null);
  };

  const activeElections = elections.filter((e) => e.isActive);
  const pastElections = elections.filter((e) => !e.isActive && e.resultsPublished);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {!isCorrectNetwork && account && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-warning/10 p-4 text-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-sm font-medium">Please switch to Sepolia testnet in MetaMask to interact with this DApp.</p>
        </div>
      )}

      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          <span className="text-gradient">Decentralized</span> Voting
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Cast your vote securely on the Ethereum blockchain. Every vote is transparent, immutable, and verifiable.
        </p>
      </div>

      {!account ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <h2 className="text-xl font-semibold font-display">Connect Your Wallet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Connect MetaMask to view elections and cast your vote.</p>
        </div>
      ) : fetchingElections ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass animate-pulse rounded-2xl p-6">
              <div className="mb-3 h-5 w-2/3 rounded bg-muted" />
              <div className="mb-6 h-4 w-full rounded bg-muted/50" />
              <div className="space-y-3">
                <div className="h-12 rounded-xl bg-muted/30" />
                <div className="h-12 rounded-xl bg-muted/30" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {activeElections.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold">
                <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
                Active Elections
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeElections.map((election) => (
                  <ElectionCard key={election.id} election={election} onVote={handleVote} votingId={votingId} loading={loading} />
                ))}
              </div>
            </section>
          )}

          {pastElections.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-6 font-display text-2xl font-bold text-muted-foreground">Past Results</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pastElections.map((election) => (
                  <ElectionCard key={election.id} election={election} onVote={handleVote} votingId={votingId} loading={loading} past />
                ))}
              </div>
            </section>
          )}

          {elections.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-muted-foreground">No elections found. Check back later or ask the admin to create one.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ElectionCard({
  election,
  onVote,
  votingId,
  loading,
  past,
}: {
  election: Election;
  onVote: (electionId: number, candidateId: number) => void;
  votingId: string | null;
  loading: boolean;
  past?: boolean;
}) {
  const totalVotes = election.candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const endDate = new Date(election.endTime * 1000);

  return (
    <div className="glass rounded-2xl p-6 transition-all hover:scale-[1.01]">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{election.title}</h3>
        {past ? (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Ended</span>
        ) : (
          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">Live</span>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{election.description}</p>
      <p className="mb-4 text-xs text-muted-foreground">
        Ends: {endDate.toLocaleDateString()} {endDate.toLocaleTimeString()}
      </p>

      <div className="space-y-2">
        {election.candidates.map((candidate) => {
          const pct = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;
          const isVoting = votingId === `${election.id}-${candidate.id}`;

          return (
            <div key={candidate.id} className="relative overflow-hidden rounded-xl bg-muted/30 p-3">
              {(past || election.resultsPublished) && (
                <div className="absolute inset-y-0 left-0 gradient-primary opacity-15 transition-all" style={{ width: `${pct}%` }} />
              )}
              <div className="relative flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{candidate.name}</p>
                  {candidate.description && (
                    <p className="truncate text-xs text-muted-foreground">{candidate.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(past || election.resultsPublished) && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {candidate.voteCount} ({pct.toFixed(0)}%)
                    </span>
                  )}
                  {!past && election.isActive && (
                    <Button
                      size="sm"
                      onClick={() => onVote(election.id, candidate.id)}
                      disabled={loading || isVoting}
                      className="gradient-primary border-0 text-xs text-primary-foreground"
                    >
                      {isVoting ? "..." : "Vote"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
