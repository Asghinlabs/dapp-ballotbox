import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { useContract } from "@/hooks/use-contract";
import { fetchElectionsReadOnly } from "@/lib/read-contract";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";
import type { Election } from "@/hooks/use-contract";

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

function getWinner(election: Election) {
  if (!election.candidates.length) return null;
  const total = election.candidates.reduce((s, c) => s + c.voteCount, 0);
  const sorted = [...election.candidates].sort((a, b) => b.voteCount - a.voteCount);
  const top = sorted[0];
  const tie = sorted.length > 1 && sorted[1].voteCount === top.voteCount && top.voteCount > 0;
  return { winner: top, total, tie, isNoVotes: top.voteCount === 0 };
}

function HomePage() {
  const { account, isCorrectNetwork, isAdmin, connectWallet, isConnecting, contract } = useWeb3();
  const { fetchElections, castVote, getVoterStatus, loading } = useContract();
  const [elections, setElections] = useState<Election[]>([]);
  const [fetchingElections, setFetchingElections] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [votedFor, setVotedFor] = useState<Record<string, string>>({});
  const [voterStatus, setVoterStatus] = useState<{ isRegistered: boolean; isApproved: boolean } | null>(null);
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});

  const loadElections = useCallback(async () => {
    setFetchingElections(true);
    // Use authenticated contract if available, otherwise public RPC for guests
    const data = contract ? await fetchElections() : await fetchElectionsReadOnly();
    setElections(data);
    setFetchingElections(false);
  }, [fetchElections, contract]);

  useEffect(() => {
    loadElections();
  }, [loadElections]);

  useEffect(() => {
    if (account && !isAdmin && contract) {
      getVoterStatus(account).then((s) => {
        if (s) setVoterStatus(s);
      });
    } else {
      setVoterStatus(null);
    }
  }, [account, isAdmin, contract, getVoterStatus]);

  const handleVote = async (electionId: number, candidateId: number, candidateName: string) => {
    setVotingId(`${electionId}-${candidateId}`);
    const result = await castVote(electionId, candidateId);
    if (result) {
      setVotedFor((prev) => ({ ...prev, [electionId]: candidateName }));
      await loadElections();
    }
    setVotingId(null);
  };

  const now = Math.floor(Date.now() / 1000);
  const isEnded = (e: Election) => e.resultsPublished || (!e.isActive && e.endTime > 0 && e.endTime <= now);
  const isUpcoming = (e: Election) => !e.isActive && !isEnded(e) && e.startTime > now;

  const activeElections = elections.filter((e) => e.isActive && !isEnded(e));
  const upcomingElections = elections.filter(isUpcoming);
  const endedElections = elections.filter(isEnded);

  const canVote = !!account && !isAdmin && !!voterStatus?.isApproved && isCorrectNetwork;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {!isCorrectNetwork && account && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-warning/10 p-4 text-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-sm font-medium">Please switch to Sepolia testnet in MetaMask.</p>
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

      {!account && (
        <div className="glass mb-8 rounded-2xl p-6 sm:p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <h2 className="text-lg font-semibold font-display">Browsing as Guest</h2>
          <p className="mt-1 text-sm text-muted-foreground">You can view all elections below. Connect your wallet to cast a vote.</p>
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="mt-4 h-12 w-full sm:w-auto sm:px-10 gradient-primary border-0 text-base font-semibold text-primary-foreground shadow-lg"
          >
            {isConnecting ? "Connecting..." : "Tap to Connect"}
          </Button>
        </div>
      )}

      {fetchingElections ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <section className="mb-12">
            <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold">
              <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
              Active Elections
              <span className="text-sm font-normal text-muted-foreground">({activeElections.length})</span>
            </h2>
            {activeElections.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">No active elections right now.</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeElections.map((election) => (
                  <ElectionCard
                    key={election.id}
                    election={election}
                    onVote={handleVote}
                    votingId={votingId}
                    loading={loading}
                    canVote={canVote}
                    isConnected={!!account}
                    onConnect={connectWallet}
                    isConnecting={isConnecting}
                    votedFor={votedFor[election.id]}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mb-12">
            <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold">
              <span className="inline-block h-2 w-2 rounded-full bg-warning" />
              Upcoming Elections
              <span className="text-sm font-normal text-muted-foreground">({upcomingElections.length})</span>
            </h2>
            {upcomingElections.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">No upcoming elections.</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingElections.map((election) => (
                  <ElectionCard
                    key={election.id}
                    election={election}
                    onVote={handleVote}
                    votingId={votingId}
                    loading={loading}
                    canVote={false}
                    isConnected={!!account}
                    onConnect={connectWallet}
                    isConnecting={isConnecting}
                    upcoming
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mb-12">
            <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold">
              <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
              Ended Elections
              <span className="text-sm font-normal text-muted-foreground">({endedElections.length})</span>
            </h2>
            {endedElections.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">No ended elections yet.</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {endedElections.map((election) => (
                  <ElectionCard
                    key={election.id}
                    election={election}
                    onVote={handleVote}
                    votingId={votingId}
                    loading={loading}
                    canVote={false}
                    isConnected={!!account}
                    onConnect={connectWallet}
                    isConnecting={isConnecting}
                    past
                    expanded={!!expandedResults[election.id]}
                    onToggleResults={() =>
                      setExpandedResults((prev) => ({ ...prev, [election.id]: !prev[election.id] }))
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {elections.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-muted-foreground">No elections found on the contract yet.</p>
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
  canVote,
  isConnected,
  onConnect,
  isConnecting,
  past,
  upcoming,
  votedFor,
  expanded,
  onToggleResults,
}: {
  election: Election;
  onVote: (electionId: number, candidateId: number, candidateName: string) => void;
  votingId: string | null;
  loading: boolean;
  canVote: boolean;
  isConnected: boolean;
  onConnect: () => void;
  isConnecting: boolean;
  past?: boolean;
  upcoming?: boolean;
  votedFor?: string;
  expanded?: boolean;
  onToggleResults?: () => void;
}) {
  const totalVotes = election.candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const now = Math.floor(Date.now() / 1000);
  const winnerInfo = past ? getWinner(election) : null;

  const showCandidateList = !past || expanded;

  const getVoteDisabledReason = (): string | null => {
    if (!isConnected) return "Connect your wallet to vote";
    if (votedFor) return "You already voted in this election";
    if (!canVote) return "You must be an approved voter to vote";
    if (upcoming) return "Election has not started yet";
    if (past) return "Election has ended";
    return null;
  };

  const disabledReason = getVoteDisabledReason();

  return (
    <div className="glass rounded-2xl p-6 transition-all hover:scale-[1.01] flex flex-col">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold truncate">{election.title}</h3>
        {past ? (
          <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive shrink-0">🔴 Ended</span>
        ) : upcoming ? (
          <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning shrink-0">🟡 Upcoming</span>
        ) : (
          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success shrink-0">🟢 Live</span>
        )}
      </div>
      <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{election.description}</p>

      {election.isActive && election.endTime > now && (
        <CountdownTimer targetTime={election.endTime} label="Ends in" />
      )}
      {upcoming && election.startTime > now && (
        <>
          <CountdownTimer targetTime={election.startTime} label="Starts in" />
          <p className="mt-1 text-xs text-muted-foreground">
            Start: {new Date(election.startTime * 1000).toLocaleString()}
          </p>
        </>
      )}
      {past && (
        <p className="mt-1 text-xs text-muted-foreground">
          Ended: {new Date(election.endTime * 1000).toLocaleString()}
        </p>
      )}

      {votedFor && (
        <div className="my-3 rounded-lg bg-success/10 p-2.5 text-xs font-semibold text-success">
          ✓ You voted for {votedFor}
        </div>
      )}

      {/* Winner banner for ended elections */}
      {past && winnerInfo && (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
          {winnerInfo.isNoVotes ? (
            <p className="text-xs font-medium text-muted-foreground">No votes were cast in this election.</p>
          ) : winnerInfo.tie ? (
            <p className="text-xs font-semibold text-warning">⚖️ Tied result — no single winner</p>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">🏆 Winner</p>
              <p className="mt-0.5 font-display text-base font-bold">{winnerInfo.winner.name}</p>
              <p className="text-xs text-muted-foreground">
                {winnerInfo.winner.voteCount} votes ({((winnerInfo.winner.voteCount / winnerInfo.total) * 100).toFixed(1)}%) of {winnerInfo.total} total
              </p>
            </>
          )}
        </div>
      )}

      {showCandidateList && (
        <div className="mt-4 space-y-2">
          {election.candidates.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No candidates have been added.</p>
          )}
          {election.candidates.map((candidate) => {
            const pct = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;
            const isVoting = votingId === `${election.id}-${candidate.id}`;
            const showVoteBtn = !past && !upcoming && election.isActive && !votedFor;
            const isWinnerRow = past && winnerInfo && !winnerInfo.tie && !winnerInfo.isNoVotes && winnerInfo.winner.id === candidate.id;

            return (
              <div key={candidate.id} className={`relative overflow-hidden rounded-xl bg-muted/30 p-3 ${isWinnerRow ? "ring-1 ring-primary/40" : ""}`}>
                {(past || election.resultsPublished || election.isActive) && (
                  <div className="absolute inset-y-0 left-0 gradient-primary opacity-15 transition-all" style={{ width: `${pct}%` }} />
                )}
                <div className="relative flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {isWinnerRow && "🏆 "}{candidate.name}
                    </p>
                    {candidate.description && (
                      <p className="truncate text-xs text-muted-foreground">{candidate.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-muted-foreground">
                      {candidate.voteCount} ({pct.toFixed(0)}%)
                    </span>
                    {showVoteBtn && (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!isConnected) {
                            onConnect();
                            return;
                          }
                          onVote(election.id, candidate.id, candidate.name);
                        }}
                        disabled={loading || isVoting || (isConnected && !!disabledReason)}
                        title={disabledReason || "Cast your vote"}
                        className="gradient-primary border-0 text-xs text-primary-foreground"
                      >
                        {isVoting ? (
                          <span className="flex items-center gap-1">
                            <span className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
                            Voting...
                          </span>
                        ) : !isConnected ? "Connect to Vote" : "Vote"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {past && onToggleResults && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleResults}
          className="mt-4 w-full"
        >
          {expanded ? "Hide Results" : "View Results"}
        </Button>
      )}

      {disabledReason && !past && !votedFor && election.isActive && isConnected && (
        <p className="mt-3 text-xs text-muted-foreground italic">{disabledReason}</p>
      )}
    </div>
  );
}
