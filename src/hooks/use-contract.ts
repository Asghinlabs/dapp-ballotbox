import { useState, useCallback } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { toast } from "sonner";

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

export function useContract() {
  const { contract, account } = useWeb3();
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(async <T>(fn: () => Promise<T>, successMsg?: string): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await fn();
      if (successMsg) toast.success(successMsg);
      return result;
    } catch (err: any) {
      const msg = err?.reason || err?.message || "Transaction failed";
      toast.error(msg.length > 100 ? msg.slice(0, 100) + "..." : msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchElections = useCallback(async (): Promise<Election[]> => {
    if (!contract) return [];

    const elections: Election[] = [];
    let consecutiveFailures = 0;

    for (let i = 1; consecutiveFailures < 3; i++) {
      try {
        const electionResult = await contract.getElection(i);
        const e = Array.isArray(electionResult) && electionResult.length === 1 ? electionResult[0] : electionResult;

        let candidates: any[] = [];
        try {
          candidates = await contract.getAllCandidates(i);
        } catch {
          candidates = [];
        }

        const title = e.title ?? e[1];
        const startTime = Number(e.startTime ?? e[3]);
        const endTime = Number(e.endTime ?? e[4]);

        if (!title && startTime === 0 && endTime === 0) {
          consecutiveFailures++;
          continue;
        }

        consecutiveFailures = 0;
        elections.push({
          id: Number(e.id ?? e[0]),
          title,
          description: e.description ?? e[2],
          startTime,
          endTime,
          isActive: e.isActive ?? e[5],
          resultsPublished: e.resultsPublished ?? e[6],
          candidates: candidates.map((c: any) => ({
            id: Number(c[0] ?? c.id),
            name: c[1] ?? c.name,
            description: c[2] ?? c.description,
            voteCount: Number(c[3] ?? c.voteCount),
          })),
        });
      } catch {
        consecutiveFailures++;
      }
    }

    return elections.sort((a, b) => b.id - a.id);
  }, [contract]);

  const createElection = useCallback(async (title: string, description: string, startTime: number, endTime: number) => {
    if (!contract) return null;
    return withLoading(async () => {
      const tx = await contract.createElection(title, description, startTime, endTime);
      await tx.wait();
      return tx;
    }, "Election created!");
  }, [contract, withLoading]);

  const addCandidate = useCallback(async (electionId: number, name: string, description: string) => {
    if (!contract) return null;
    return withLoading(async () => {
      const tx = await contract.addCandidate(electionId, name, description);
      await tx.wait();
      return tx;
    }, "Candidate added!");
  }, [contract, withLoading]);

  const registerVoter = useCallback(async () => {
    if (!contract) return null;
    return withLoading(async () => {
      const tx = await contract.registerVoter();
      await tx.wait();
      return tx;
    }, "Registration submitted! Awaiting admin approval.");
  }, [contract, withLoading]);

  const approveVoter = useCallback(async (voterAddress: string) => {
    if (!contract) return null;
    return withLoading(async () => {
      const tx = await contract.approveVoter(voterAddress);
      await tx.wait();
      return tx;
    }, "Voter approved!");
  }, [contract, withLoading]);

  const startElection = useCallback(async (electionId: number) => {
    if (!contract) return null;
    return withLoading(async () => {
      const tx = await contract.startElection(electionId);
      await tx.wait();
      return tx;
    }, "Election started!");
  }, [contract, withLoading]);

  const endElection = useCallback(async (electionId: number) => {
    if (!contract) return null;
    return withLoading(async () => {
      const tx = await contract.endElection(electionId);
      await tx.wait();
      return tx;
    }, "Election ended!");
  }, [contract, withLoading]);

  const publishResults = useCallback(async (electionId: number) => {
    if (!contract) return null;
    return withLoading(async () => {
      const tx = await contract.publishResults(electionId);
      await tx.wait();
      return tx;
    }, "Results published!");
  }, [contract, withLoading]);

  const castVote = useCallback(async (electionId: number, candidateId: number) => {
    if (!contract) return null;
    return withLoading(async () => {
      const tx = await contract.castVote(electionId, candidateId);
      await tx.wait();
      return tx;
    }, "Vote cast successfully!");
  }, [contract, withLoading]);

  const getVoterStatus = useCallback(async (address: string) => {
    if (!contract) return null;
    try {
      const result = await contract.voters(address);
      return { isRegistered: result[0], isApproved: result[1] };
    } catch {
      return null;
    }
  }, [contract]);

  const fetchPendingVoters = useCallback(async (): Promise<string[]> => {
    if (!contract) return [];
    try {
      const filter = contract.filters.VoterRegistered();
      const events = await contract.queryFilter(filter, 0, "latest");
      const addresses: string[] = events.map((e: any) => e.args?.[0] || e.args?.voter).filter(Boolean);
      const unique = [...new Set(addresses)];
      const pending: string[] = [];
      for (const addr of unique) {
        try {
          const result = await contract.voters(addr);
          if (result[0] && !result[1]) pending.push(addr);
        } catch {}
      }
      return pending;
    } catch {
      return [];
    }
  }, [contract]);

  return {
    loading,
    fetchElections,
    createElection,
    addCandidate,
    registerVoter,
    approveVoter,
    startElection,
    endElection,
    publishResults,
    castVote,
    getVoterStatus,
    fetchPendingVoters,
  };
}
