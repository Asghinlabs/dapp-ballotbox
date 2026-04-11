import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { useContract } from "@/hooks/use-contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — ChainVote" },
      { name: "description", content: "Manage elections, candidates, and voter registrations" },
    ],
  }),
  component: AdminPage,
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

function AdminPage() {
  const { account, isAdmin, isCorrectNetwork } = useWeb3();
  const {
    fetchElections,
    createElection,
    addCandidate,
    approveVoter,
    startElection,
    endElection,
    publishResults,
    loading,
  } = useContract();

  const [elections, setElections] = useState<Election[]>([]);
  const [tab, setTab] = useState<"elections" | "create" | "voters">("elections");

  // Create election form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Add candidate form
  const [candElectionId, setCandElectionId] = useState("");
  const [candidates, setCandidates] = useState([{ name: "", description: "" }]);

  // Approve voter
  const [voterAddress, setVoterAddress] = useState("");

  const loadElections = useCallback(async () => {
    const data = await fetchElections();
    setElections(data);
  }, [fetchElections]);

  useEffect(() => {
    if (account && isCorrectNetwork && isAdmin) {
      loadElections();
    }
  }, [account, isCorrectNetwork, isAdmin, loadElections]);

  if (!account) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-3 text-muted-foreground">Please connect your wallet first.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold">Access Denied</h1>
        <p className="mt-3 text-muted-foreground">Only the admin wallet can access this page.</p>
        <Link to="/" className="mt-6 inline-block text-sm text-primary hover:underline">← Back to elections</Link>
      </div>
    );
  }

  const handleCreateElection = async () => {
    if (!title || !startDate || !endDate) return;
    const start = Math.floor(new Date(startDate).getTime() / 1000);
    const end = Math.floor(new Date(endDate).getTime() / 1000);
    const result = await createElection(title, description, start, end);
    if (result) {
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      await loadElections();
    }
  };

  const handleAddCandidate = async () => {
    if (!candElectionId || !candName) return;
    const result = await addCandidate(Number(candElectionId), candName, candDesc);
    if (result) {
      setCandName("");
      setCandDesc("");
      await loadElections();
    }
  };

  const handleApproveVoter = async () => {
    if (!voterAddress) return;
    const result = await approveVoter(voterAddress);
    if (result) {
      setVoterAddress("");
    }
  };

  const tabs = [
    { key: "elections" as const, label: "Elections" },
    { key: "create" as const, label: "Create Election" },
    { key: "voters" as const, label: "Voters" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-3xl font-bold">
        <span className="text-gradient">Admin</span> Dashboard
      </h1>

      <div className="mb-8 flex gap-1 rounded-xl bg-muted/30 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              tab === t.key ? "glass-strong text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "create" && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 font-display text-lg font-bold">New Election</h2>
            <div className="space-y-4">
              <Input placeholder="Election title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/30 border-border/50" />
              <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted/30 border-border/50" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Start Date</label>
                  <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-muted/30 border-border/50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">End Date</label>
                  <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-muted/30 border-border/50" />
                </div>
              </div>
              <Button onClick={handleCreateElection} disabled={loading || !title || !startDate || !endDate} className="w-full gradient-primary border-0 text-primary-foreground">
                {loading ? "Creating..." : "Create Election"}
              </Button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Add Candidate</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Election ID</label>
                <Input type="number" placeholder="1" value={candElectionId} onChange={(e) => setCandElectionId(e.target.value)} className="bg-muted/30 border-border/50" />
              </div>
              <Input placeholder="Candidate name" value={candName} onChange={(e) => setCandName(e.target.value)} className="bg-muted/30 border-border/50" />
              <Input placeholder="Candidate description" value={candDesc} onChange={(e) => setCandDesc(e.target.value)} className="bg-muted/30 border-border/50" />
              <Button onClick={handleAddCandidate} disabled={loading || !candElectionId || !candName} className="w-full gradient-accent border-0 text-accent-foreground font-semibold">
                {loading ? "Adding..." : "Add Candidate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === "elections" && (
        <div className="space-y-4">
          {elections.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-muted-foreground">No elections yet. Create one to get started.</p>
            </div>
          ) : (
            elections.map((election) => (
              <div key={election.id} className="glass rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">#{election.id}</span>
                      <h3 className="font-display text-lg font-bold">{election.title}</h3>
                      {election.isActive ? (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">Active</span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inactive</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{election.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {election.candidates.length} candidate{election.candidates.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!election.isActive && (
                      <Button size="sm" onClick={() => startElection(election.id)} disabled={loading} className="gradient-primary border-0 text-xs text-primary-foreground">
                        Start
                      </Button>
                    )}
                    {election.isActive && (
                      <Button size="sm" variant="destructive" onClick={() => endElection(election.id)} disabled={loading} className="text-xs">
                        End
                      </Button>
                    )}
                    {!election.isActive && !election.resultsPublished && (
                      <Button size="sm" variant="outline" onClick={() => publishResults(election.id)} disabled={loading} className="text-xs">
                        Publish Results
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "voters" && (
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Approve Voter</h2>
          <div className="flex gap-3">
            <Input
              placeholder="0x... voter wallet address"
              value={voterAddress}
              onChange={(e) => setVoterAddress(e.target.value)}
              className="flex-1 bg-muted/30 border-border/50 font-mono text-sm"
            />
            <Button onClick={handleApproveVoter} disabled={loading || !voterAddress} className="gradient-primary border-0 text-primary-foreground">
              {loading ? "Approving..." : "Approve"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Enter the wallet address of a voter who has registered and needs approval to vote.
          </p>
        </div>
      )}
    </div>
  );
}
