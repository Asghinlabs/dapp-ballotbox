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
        const e = await contract.getElection(i);
        const candidates = await contract.getAllCandidates(i);
        consecutiveFailures = 0;
        elections.push({
          id: Number(e[0]),
          title: e[1],
          description: e[2],
          startTime: Number(e[3]),
          endTime: Number(e[4]),
          isActive: e[5],
          resultsPublished: e[6],
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
    return elections;
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
  };
}
