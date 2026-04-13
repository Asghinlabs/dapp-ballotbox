import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { useContract } from "@/hooks/use-contract";
import { CountdownTimer } from "@/components/CountdownTimer";
import type { Election } from "@/hooks/use-contract";

export const Route = createFileRoute("/voter-view")({
  head: () => ({
    meta: [
      { title: "Voter View Preview — ChainVote" },
      { name: "description", content: "Preview how voters see the elections" },
    ],
  }),
  component: VoterViewPage,
});

function VoterViewPage() {
  const { account, isAdmin, isCorrectNetwork } = useWeb3();
  const { fetchElections } = useContract();
  const [elections, setElections] = useState<Election[]>([]);
  const [fetching, setFetching] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const load = useCallback(async () => {
    setFetching(true);
    const data = await fetchElections();
    setElections(data);
    setFetching(false);
  }, [fetchElections]);

  useEffect(() => {
    if (account && isCorrectNetwork) load();
  }, [account, isCorrectNetwork, load]);

  if (!account || !isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold">Voter View</h1>
        <p className="mt-3 text-muted-foreground">Only the admin can access this preview.</p>
        <Link to="/" className="mt-6 inline-block text-sm text-primary hover:underline">← Back</Link>
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const activeElections = elections.filter((e) => e.isActive);
  const upcomingElections = elections.filter((e) => !e.isActive && e.startTime > now);
  const pastElections = elections.filter((e) => !e.isActive && (e.resultsPublished || e.endTime <= now));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-accent/10 p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        <p className="text-sm font-medium text-accent">Admin Preview Mode — This is how voters see the elections. All interactions are disabled.</p>
      </div>

      <h1 className="mb-2 font-display text-4xl font-bold">
        <span className="text-gradient">Decentralized</span> Voting
      </h1>
      <p className="mb-8 max-w-2xl text-muted-foreground">
        Cast your vote securely on the Ethereum blockchain. Every vote is transparent, immutable, and verifiable.
      </p>

      {fetching ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
                {activeElections.map((el) => (
                  <PreviewElectionCard key={el.id} election={el} />
                ))}
              </div>
            </section>
          )}

          {upcomingElections.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-6 font-display text-2xl font-bold">Upcoming Elections</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingElections.map((el) => (
                  <PreviewElectionCard key={el.id} election={el} upcoming />
                ))}
              </div>
            </section>
          )}

          <div className="mb-6">
            <button onClick={() => setShowPast(!showPast)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {showPast ? "▾ Hide" : "▸ Show"} Past Elections ({pastElections.length})
            </button>
          </div>

          {showPast && pastElections.length > 0 && (
            <section className="mb-12">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pastElections.map((el) => (
                  <PreviewElectionCard key={el.id} election={el} past />
                ))}
              </div>
            </section>
          )}

          {elections.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-muted-foreground">No elections found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PreviewElectionCard({ election, past, upcoming }: { election: Election; past?: boolean; upcoming?: boolean }) {
  const totalVotes = election.candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{election.title}</h3>
        {past ? (
          <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">🔴 Ended</span>
        ) : upcoming ? (
          <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">🟡 Upcoming</span>
        ) : (
          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">🟢 Live</span>
        )}
      </div>
      <p className="mb-2 text-sm text-muted-foreground">{election.description}</p>

      {election.isActive && election.endTime > now && (
        <CountdownTimer targetTime={election.endTime} label="Ends in" />
      )}
      {upcoming && election.startTime > now && (
        <CountdownTimer targetTime={election.startTime} label="Starts in" />
      )}

      <div className="mt-4 space-y-2">
        {election.candidates.map((candidate) => {
          const pct = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;
          return (
            <div key={candidate.id} className="relative overflow-hidden rounded-xl bg-muted/30 p-3">
              {(past || election.resultsPublished) && (
                <div className="absolute inset-y-0 left-0 gradient-primary opacity-15 transition-all" style={{ width: `${pct}%` }} />
              )}
              <div className="relative flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{candidate.name}</p>
                  {candidate.description && <p className="truncate text-xs text-muted-foreground">{candidate.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {(past || election.resultsPublished) && (
                    <span className="text-xs font-mono text-muted-foreground">{candidate.voteCount} ({pct.toFixed(0)}%)</span>
                  )}
                  {election.isActive && (
                    <span className="cursor-not-allowed rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground" title="Preview mode — voting disabled">
                      Vote
                    </span>
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
