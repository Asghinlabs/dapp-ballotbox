import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { useContract } from "@/hooks/use-contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ProfilePictureAdmin } from "@/components/ProfilePictureAdmin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Election } from "@/hooks/use-contract";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — ChainVote" },
      { name: "description", content: "Manage elections, candidates, and voter registrations" },
    ],
  }),
  component: AdminPage,
});

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
    fetchPendingVoters,
    fetchApprovedVoters,
    loading,
  } = useContract();

  const [elections, setElections] = useState<Election[]>([]);
  const [tab, setTab] = useState<"elections" | "create" | "voters" | "candidates" | "profile">("elections");
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

  // Create election form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Add candidate form
  const [candElectionId, setCandElectionId] = useState("");
  const [candidates, setCandidates] = useState([{ name: "", description: "" }]);

  // Voters
  const [pendingVoters, setPendingVoters] = useState<string[]>([]);
  const [approvedVoters, setApprovedVoters] = useState<string[]>([]);
  const [approvingAddr, setApprovingAddr] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [voterSearch, setVoterSearch] = useState("");

  // Edit election
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loadElections = useCallback(async () => {
    const data = await fetchElections();
    setElections(data);
  }, [fetchElections]);

  const loadVoters = useCallback(async () => {
    const [pending, approved] = await Promise.all([fetchPendingVoters(), fetchApprovedVoters()]);
    setPendingVoters(pending);
    setApprovedVoters(approved);
  }, [fetchPendingVoters, fetchApprovedVoters]);

  useEffect(() => {
    if (account && isCorrectNetwork && isAdmin) {
      loadElections();
      loadVoters();
    }
  }, [account, isCorrectNetwork, isAdmin, loadElections, loadVoters]);

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

  const visibleElections = elections.filter((e) => !deletedIds.has(e.id));
  const now = Math.floor(Date.now() / 1000);

  const getElectionStatus = (e: Election) => {
    if (e.isActive) return "active";
    if (e.resultsPublished || e.endTime <= now) return "ended";
    return "upcoming";
  };

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
      setTab("elections");
    }
  };

  const handleAddCandidates = async () => {
    if (!candElectionId) return;
    const validCandidates = candidates.filter((c) => c.name.trim());
    if (validCandidates.length === 0) return;
    let anySuccess = false;
    for (const cand of validCandidates) {
      const result = await addCandidate(Number(candElectionId), cand.name, cand.description);
      if (result) anySuccess = true;
    }
    if (anySuccess) {
      setCandidates([{ name: "", description: "" }]);
      await loadElections();
    }
  };

  const addCandidateRow = () => setCandidates([...candidates, { name: "", description: "" }]);
  const removeCandidateRow = (index: number) => {
    if (candidates.length <= 1) return;
    setCandidates(candidates.filter((_, i) => i !== index));
  };
  const updateCandidate = (index: number, field: "name" | "description", value: string) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  const handleApproveVoter = async (addr: string) => {
    setApprovingAddr(addr);
    const result = await approveVoter(addr);
    if (result) {
      setPendingVoters((prev) => prev.filter((a) => a.toLowerCase() !== addr.toLowerCase()));
      setApprovedVoters((prev) => [...prev, addr]);
    }
    setApprovingAddr(null);
  };

  const handleApproveAll = async () => {
    setApprovingAll(true);
    for (const addr of pendingVoters) {
      await handleApproveVoter(addr);
    }
    setApprovingAll(false);
  };

  const handleDeleteElection = (id: number) => {
    setDeletedIds((prev) => new Set([...prev, id]));
  };

  const handleExportCSV = () => {
    const csv = "Address\n" + approvedVoters.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "approved_voters.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredApproved = voterSearch
    ? approvedVoters.filter((a) => a.toLowerCase().includes(voterSearch.toLowerCase()))
    : approvedVoters;

  const tabs = [
    { key: "elections" as const, label: "Elections", count: visibleElections.length },
    { key: "create" as const, label: "Create" },
    { key: "voters" as const, label: "Voters", count: pendingVoters.length },
    { key: "candidates" as const, label: "Candidates" },
    { key: "profile" as const, label: "Profile Picture" },
  ];

  const handleSeedDemo = () => {
    setTitle("Departmental Representative Election 2026");
    setDescription("Vote for your next departmental representative. Blockchain-secured voting demonstration.");
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    const fmt = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setStartDate(fmt(now));
    setEndDate(fmt(end));
    setCandidates([
      { name: "Alice Nkem", description: "Computer Science major with focus on cybersecurity" },
      { name: "Brian Tita", description: "Software engineering major, advocates for tech workshops" },
      { name: "Carol Mbarga", description: "Information systems major, focuses on student welfare" },
    ]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-3xl font-bold">
        <span className="text-gradient">Admin</span> Dashboard
      </h1>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-display">{visibleElections.length}</p>
          <p className="text-xs text-muted-foreground">Elections</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-display text-success">{visibleElections.filter((e) => e.isActive).length}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-display text-warning">{pendingVoters.length}</p>
          <p className="text-xs text-muted-foreground">Pending Voters</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-display text-accent">{approvedVoters.length}</p>
          <p className="text-xs text-muted-foreground">Approved Voters</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 rounded-xl bg-muted/30 p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.key ? "glass-strong text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs text-primary">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ============ CREATE TAB ============ */}
      {tab === "create" && (
        <>
          <div className="mb-6 glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Quick start: seed a demo election</p>
              <p className="text-xs text-muted-foreground">Prefills the form with the Departmental Representative Election 2026 + 3 candidates.</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleSeedDemo} className="border-primary/40 text-primary">
              Prefill Demo Election
            </Button>
          </div>
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
                {loading ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> Creating...</span>
                ) : "Create Election"}
              </Button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Add Candidates</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Select Election</label>
                <select
                  value={candElectionId}
                  onChange={(e) => setCandElectionId(e.target.value)}
                  className="w-full rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Choose an election...</option>
                  {visibleElections.filter((e) => getElectionStatus(e) === "upcoming").map((e) => (
                    <option key={e.id} value={e.id}>#{e.id} — {e.title}</option>
                  ))}
                </select>
              </div>
              {candidates.map((cand, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input placeholder={`Candidate ${i + 1} name`} value={cand.name} onChange={(e) => updateCandidate(i, "name", e.target.value)} className="bg-muted/30 border-border/50" />
                    <Input placeholder="Description (optional)" value={cand.description} onChange={(e) => updateCandidate(i, "description", e.target.value)} className="bg-muted/30 border-border/50" />
                  </div>
                  {candidates.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeCandidateRow(i)} className="mt-1 text-destructive hover:text-destructive">✕</Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addCandidateRow} className="w-full border-dashed">+ Add Another Candidate</Button>
              <Button onClick={handleAddCandidates} disabled={loading || !candElectionId || !candidates.some((c) => c.name.trim())} className="w-full gradient-accent border-0 text-accent-foreground font-semibold">
                {loading ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" /> Adding...</span>
                ) : `Add ${candidates.filter((c) => c.name.trim()).length} Candidate(s)`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============ ELECTIONS TAB ============ */}
      {tab === "elections" && (
        <div className="space-y-4">
          {visibleElections.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-muted-foreground">No elections yet. Create one to get started.</p>
            </div>
          ) : (
            visibleElections.map((election) => {
              const status = getElectionStatus(election);
              const totalVotes = election.candidates.reduce((s, c) => s + c.voteCount, 0);
              const canDelete = status === "upcoming";

              return (
                <div key={election.id} className="glass rounded-2xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">#{election.id}</span>
                        <h3 className="font-display text-lg font-bold">{election.title}</h3>
                        {status === "active" ? (
                          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">🟢 Active</span>
                        ) : status === "upcoming" ? (
                          <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">🟡 Upcoming</span>
                        ) : (
                          <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">🔴 Ended</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{election.description}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>{election.candidates.length} candidate{election.candidates.length !== 1 ? "s" : ""}</span>
                        <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                        {status === "active" && election.endTime > now && (
                          <CountdownTimer targetTime={election.endTime} label="Ends in" />
                        )}
                        {status === "upcoming" && election.startTime > now && (
                          <CountdownTimer targetTime={election.startTime} label="Starts in" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {status === "upcoming" && (
                        <Button size="sm" onClick={() => startElection(election.id).then(() => loadElections())} disabled={loading} className="gradient-primary border-0 text-xs text-primary-foreground">
                          {loading ? <span className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" /> : "Start"}
                        </Button>
                      )}
                      {status === "active" && (
                        <Button size="sm" variant="destructive" onClick={() => endElection(election.id).then(() => loadElections())} disabled={loading} className="text-xs">
                          End
                        </Button>
                      )}
                      {status === "ended" && !election.resultsPublished && (
                        <Button size="sm" variant="outline" onClick={() => publishResults(election.id).then(() => loadElections())} disabled={loading} className="text-xs">
                          Publish Results
                        </Button>
                      )}
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-xs text-destructive hover:text-destructive border-destructive/30">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-strong border-border/50">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Election #{election.id}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will hide "{election.title}" from the dashboard. Note: since the contract doesn't support on-chain deletion, this is a UI-level removal.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteElection(election.id)} className="bg-destructive text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============ VOTERS TAB ============ */}
      {tab === "voters" && (
        <div className="space-y-6">
          {/* Pending */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">
                Pending Registrations
                {pendingVoters.length > 0 && (
                  <span className="ml-2 rounded-full bg-warning/20 px-2 py-0.5 text-sm text-warning">{pendingVoters.length}</span>
                )}
              </h2>
              <div className="flex gap-2">
                {pendingVoters.length > 1 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" className="gradient-accent border-0 text-accent-foreground text-xs">
                        Approve All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-strong border-border/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve all {pendingVoters.length} voters?</AlertDialogTitle>
                        <AlertDialogDescription>This will approve all pending voter registrations.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApproveAll} className="gradient-primary border-0 text-primary-foreground">
                          {approvingAll ? "Approving..." : "Approve All"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="outline" size="sm" onClick={loadVoters} disabled={loading} className="text-xs">
                  Refresh
                </Button>
              </div>
            </div>
            {pendingVoters.length === 0 ? (
              <div className="rounded-xl bg-muted/30 p-8 text-center">
                <p className="text-muted-foreground text-sm">No pending voter registrations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingVoters.map((addr) => (
                  <div key={addr} className="flex items-center justify-between gap-3 rounded-xl bg-muted/20 p-4">
                    <span className="font-mono text-sm text-muted-foreground break-all">{addr}</span>
                    <Button
                      size="sm"
                      onClick={() => handleApproveVoter(addr)}
                      disabled={approvingAddr === addr}
                      className="gradient-primary border-0 text-primary-foreground text-xs shrink-0"
                    >
                      {approvingAddr === addr ? (
                        <span className="flex items-center gap-1"><span className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" /> Approving...</span>
                      ) : "Approve"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">
                Approved Voters
                <span className="ml-2 rounded-full bg-success/20 px-2 py-0.5 text-sm text-success">{approvedVoters.length}</span>
              </h2>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={approvedVoters.length === 0} className="text-xs">
                Export CSV
              </Button>
            </div>
            <Input
              placeholder="Search by address..."
              value={voterSearch}
              onChange={(e) => setVoterSearch(e.target.value)}
              className="mb-4 bg-muted/30 border-border/50"
            />
            {filteredApproved.length === 0 ? (
              <div className="rounded-xl bg-muted/30 p-8 text-center">
                <p className="text-muted-foreground text-sm">{voterSearch ? "No matching voters." : "No approved voters yet."}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredApproved.map((addr) => (
                  <div key={addr} className="flex items-center gap-3 rounded-xl bg-muted/20 p-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-success" />
                    <span className="font-mono text-sm text-muted-foreground break-all">{addr}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ CANDIDATES TAB ============ */}
      {tab === "candidates" && (
        <div className="space-y-6">
          {visibleElections.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-muted-foreground">No elections to show candidates for.</p>
            </div>
          ) : (
            visibleElections.map((election) => {
              const totalVotes = election.candidates.reduce((s, c) => s + c.voteCount, 0);
              const status = getElectionStatus(election);
              return (
                <div key={election.id} className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="font-mono text-xs text-muted-foreground">#{election.id}</span>
                    <h3 className="font-display text-lg font-bold">{election.title}</h3>
                    {status === "active" ? (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">🟢 Active</span>
                    ) : status === "upcoming" ? (
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">🟡 Upcoming</span>
                    ) : (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">🔴 Ended</span>
                    )}
                  </div>

                  <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
                    <span>Total votes: <strong className="text-foreground">{totalVotes}</strong></span>
                    {approvedVoters.length > 0 && (
                      <span>Turnout: <strong className="text-foreground">{totalVotes > 0 ? ((totalVotes / approvedVoters.length) * 100).toFixed(1) : 0}%</strong></span>
                    )}
                  </div>

                  {election.candidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No candidates added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {election.candidates
                        .slice()
                        .sort((a, b) => b.voteCount - a.voteCount)
                        .map((c, idx) => {
                          const pct = totalVotes > 0 ? (c.voteCount / totalVotes) * 100 : 0;
                          return (
                            <div key={c.id} className="relative overflow-hidden rounded-xl bg-muted/30 p-3">
                              <div className="absolute inset-y-0 left-0 gradient-primary opacity-15" style={{ width: `${pct}%` }} />
                              <div className="relative flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">{idx + 1}</span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{c.name}</p>
                                    {c.description && <p className="truncate text-xs text-muted-foreground">{c.description}</p>}
                                  </div>
                                </div>
                                <span className="font-mono text-sm font-semibold text-foreground shrink-0">
                                  {c.voteCount} <span className="text-xs text-muted-foreground">({pct.toFixed(1)}%)</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
