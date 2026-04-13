export const CONTRACT_ADDRESS = "0x4C462Ebd0238964D26cd0CF1591956956BE78486";
export const ADMIN_WALLET = "0x8EBE60c6DD3FAE22e23AEE36333D202874AFc412";
export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACT_ABI = [
  "function createElection(string title, string description, uint256 startTime, uint256 endTime) external",
  "function addCandidate(uint256 electionId, string name, string description) external",
  "function registerVoter() external",
  "function approveVoter(address voterAddress) external",
  "function startElection(uint256 electionId) external",
  "function endElection(uint256 electionId) external",
  "function publishResults(uint256 electionId) external",
  "function castVote(uint256 electionId, uint256 candidateId) external",
  "function getElection(uint256 electionId) external view returns ((uint256 id, string title, string description, uint256 startTime, uint256 endTime, bool isActive, bool resultsPublished))",
  "function getAllCandidates(uint256 electionId) external view returns (tuple(uint256 id, string name, string description, uint256 voteCount)[])",
  
  "function voters(address) external view returns (bool isRegistered, bool isApproved)",
  "function pendingVoters(address) external view returns (bool)",
  "function approvedVoters(address) external view returns (bool)",
  "event ElectionCreated(uint256 indexed electionId, string title)",
  "event VoterRegistered(address indexed voter)",
  "event VoterApproved(address indexed voter)",
  "event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address indexed voter)",
];
