import { JsonRpcProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";
import type { Election } from "@/hooks/use-contract";

// Public Sepolia RPC for read-only access (works without wallet)
const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

let cachedContract: Contract | null = null;

function getReadContract(): Contract {
  if (cachedContract) return cachedContract;
  const provider = new JsonRpcProvider(SEPOLIA_RPC);
  cachedContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  return cachedContract;
}

export async function fetchElectionsReadOnly(): Promise<Election[]> {
  const contract = getReadContract();
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
}
