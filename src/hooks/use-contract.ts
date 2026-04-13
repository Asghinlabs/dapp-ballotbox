import { useState, useCallback } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { toast } from "sonner";

export interface Candidate {
  id: number;
  name: string;
  description: string;
  voteCount: number;
}

export interface Election {
  id: number;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  resultsPublished: boolean;
  candidates: Candidate[];
}

const SEPOLIA_ETHERSCAN = "https://sepolia.etherscan.io/tx/";

function parseContractError(err: any): string {
  const raw = err?.reason || err?.message || "";
  const lower = raw.toLowerCase();

  if (lower.includes("already registered") || lower.includes("already a voter"))
    return "Registration failed: Wallet already registered or approved";
  if (lower.includes("not registered") || lower.includes("voter has not registered"))
    return "Approval failed: Voter has not registered yet";
  if (lower.includes("already voted"))
    return "Cannot vote: You have already voted in this election";
  if (lower.includes("not approved") || lower.includes("not an approved"))
    return "Cannot vote: You are not an approved voter";
  if (lower.includes("not active") || lower.includes("not started") || lower.includes("election has not started"))
    return "Cannot vote: Election has not started yet";
  if (lower.includes("election ended") || lower.includes("has ended") || lower.includes("election is over"))
    return "Cannot vote: Election has already ended";
  if (lower.includes("already started") || lower.includes("election is active"))
    return "Cannot add candidate: Election has already started";
  if (lower.includes("no candidates"))
    return "Cannot start election: Election has no candidates";
  if (lower.includes("only admin") || lower.includes("not the admin") || lower.includes("ownable"))
    return "Access denied: Only admin can perform this action";
  if (lower.includes("user rejected") || lower.includes("user denied"))
    return "Transaction cancelled by user";
  if (lower.includes("insufficient funds"))
    return "Insufficient funds for gas fees";

  // Truncate long generic messages
  const msg = raw.length > 120 ? raw.slice(0, 120) + "..." : raw;
  return msg || "Transaction failed";
}

export function useContract() {
  const { contract } = useWeb3();
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(
    async <T>(fn: () => Promise<T>, successMsg?: string): Promise<T | null> => {
      setLoading(true);
      try {
        const result = await fn();
        if (successMsg) toast.success(successMsg);
        return result;
      } catch (err: any) {
        const msg = parseContractError(err);
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchElections = useCallback(async (): Promise<Election[]> => {
    if (!contract) return [];
    const elections: Election[] = [];
    let consecutiveFailures = 0;

    for (let i = 1; consecutiveFailures < 3; i++) {
      try {
        const electionResult = await contract.getElection(i);
        const e =
          Array.isArray(electionResult) && electionResult.length === 1
            ? electionResult[0]
            : electionResult;

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

  const createElection = useCallback(
    async (title: string, description: string, startTime: number, endTime: number) => {
      if (!contract) return null;
      return withLoading(async () => {
        const tx = await contract.createElection(title, description, startTime, endTime);
        await tx.wait();
        toast.info(`View on Etherscan: ${SEPOLIA_ETHERSCAN}${tx.hash}`, { duration: 8000 });
        return tx;
      }, "Election created successfully!");
    },
    [contract, withLoading]
  );

  const addCandidate = useCallback(
    async (electionId: number, name: string, description: string) => {
      if (!contract) return null;
      return withLoading(async () => {
        const tx = await contract.addCandidate(electionId, name, description);
        await tx.wait();
        toast.info(`View on Etherscan: ${SEPOLIA_ETHERSCAN}${tx.hash}`, { duration: 8000 });
        return tx;
      }, "Candidate added!");
    },
    [contract, withLoading]
  );

  const registerVoter = useCallback(async () => {
    if (!contract) return null;
    return withLoading(async () => {
      const tx = await contract.registerVoter();
      await tx.wait();
      toast.info(`View on Etherscan: ${SEPOLIA_ETHERSCAN}${tx.hash}`, { duration: 8000 });
      return tx;
    }, "Registration submitted! Awaiting admin approval.");
  }, [contract, withLoading]);

  const approveVoter = useCallback(
    async (voterAddress: string) => {
      if (!contract) return null;
      return withLoading(async () => {
        const tx = await contract.approveVoter(voterAddress);
        await tx.wait();
        toast.info(`View on Etherscan: ${SEPOLIA_ETHERSCAN}${tx.hash}`, { duration: 8000 });
        return tx;
      }, "Voter approved!");
    },
    [contract, withLoading]
  );

  const startElection = useCallback(
    async (electionId: number) => {
      if (!contract) return null;
      return withLoading(async () => {
        const tx = await contract.startElection(electionId);
        await tx.wait();
        toast.info(`View on Etherscan: ${SEPOLIA_ETHERSCAN}${tx.hash}`, { duration: 8000 });
        return tx;
      }, "Election started!");
    },
    [contract, withLoading]
  );

  const endElection = useCallback(
    async (electionId: number) => {
      if (!contract) return null;
      return withLoading(async () => {
        const tx = await contract.endElection(electionId);
        await tx.wait();
        toast.info(`View on Etherscan: ${SEPOLIA_ETHERSCAN}${tx.hash}`, { duration: 8000 });
        return tx;
      }, "Election ended!");
    },
    [contract, withLoading]
  );

  const publishResults = useCallback(
    async (electionId: number) => {
      if (!contract) return null;
      return withLoading(async () => {
        const tx = await contract.publishResults(electionId);
        await tx.wait();
        toast.info(`View on Etherscan: ${SEPOLIA_ETHERSCAN}${tx.hash}`, { duration: 8000 });
        return tx;
      }, "Results published!");
    },
    [contract, withLoading]
  );

  const castVote = useCallback(
    async (electionId: number, candidateId: number) => {
      if (!contract) return null;
      return withLoading(async () => {
        const tx = await contract.castVote(electionId, candidateId);
        await tx.wait();
        toast.info(`View on Etherscan: ${SEPOLIA_ETHERSCAN}${tx.hash}`, { duration: 8000 });
        return tx;
      }, "Vote cast successfully!");
    },
    [contract, withLoading]
  );

  const getVoterStatus = useCallback(
    async (address: string) => {
      if (!contract) return null;
      try {
        const result = await contract.voters(address);
        return { isRegistered: result[0], isApproved: result[1] };
      } catch {
        try {
          const isPending = await contract.pendingVoters(address);
          const isApproved = await contract.approvedVoters(address);
          return { isRegistered: isPending || isApproved, isApproved };
        } catch {
          return null;
        }
      }
    },
    [contract]
  );

  const fetchPendingVoters = useCallback(async (): Promise<string[]> => {
    if (!contract) return [];
    try {
      const filter = contract.filters.VoterRegistered();
      const events = await contract.queryFilter(filter, 0, "latest");
      const addresses: string[] = events
        .map((e: any) => e.args?.[0] || e.args?.voter)
        .filter(Boolean);
      const unique = [...new Set(addresses)];
      const pending: string[] = [];
      for (const addr of unique) {
        try {
          const result = await contract.voters(addr);
          if (result[0] && !result[1]) {
            pending.push(addr);
            continue;
          }
        } catch {
          try {
            const isPending = await contract.pendingVoters(addr);
            const isApproved = await contract.approvedVoters(addr);
            if (isPending && !isApproved) {
              pending.push(addr);
            }
          } catch {}
        }
      }
      return pending;
    } catch {
      return [];
    }
  }, [contract]);

  const fetchApprovedVoters = useCallback(async (): Promise<string[]> => {
    if (!contract) return [];
    try {
      const filter = contract.filters.VoterApproved();
      const events = await contract.queryFilter(filter, 0, "latest");
      const addresses: string[] = events
        .map((e: any) => e.args?.[0] || e.args?.voter)
        .filter(Boolean);
      return [...new Set(addresses)];
    } catch {
      // Fallback: check VoterRegistered events and filter approved
      try {
        const filter = contract.filters.VoterRegistered();
        const events = await contract.queryFilter(filter, 0, "latest");
        const addresses: string[] = events
          .map((e: any) => e.args?.[0] || e.args?.voter)
          .filter(Boolean);
        const unique = [...new Set(addresses)];
        const approved: string[] = [];
        for (const addr of unique) {
          try {
            const result = await contract.voters(addr);
            if (result[1]) {
              approved.push(addr);
              continue;
            }
          } catch {
            try {
              const isApproved = await contract.approvedVoters(addr);
              if (isApproved) approved.push(addr);
            } catch {}
          }
        }
        return approved;
      } catch {
        return [];
      }
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
    fetchApprovedVoters,
  };
}
