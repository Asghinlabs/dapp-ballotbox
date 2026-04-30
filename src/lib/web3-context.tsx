import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { BrowserProvider, Contract, type Signer } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, SEPOLIA_CHAIN_ID, ADMIN_WALLET } from "./contract";

interface Web3ContextType {
  account: string | null;
  isAdmin: boolean;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  contract: Contract | null;
  signer: Signer | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  overrideNetworkCheck: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  isAdmin: false,
  isCorrectNetwork: true,
  isConnecting: false,
  contract: null,
  signer: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  overrideNetworkCheck: () => {},
});

const SEPOLIA_HEX = "0xaa36a7";
const FORCE_SEPOLIA_KEY = "forceSepolia";

function getForceSepolia(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FORCE_SEPOLIA_KEY) === "true";
  } catch {
    return false;
  }
}

export function setForceSepolia(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(FORCE_SEPOLIA_KEY, "true");
    else window.localStorage.removeItem(FORCE_SEPOLIA_KEY);
  } catch {}
}

export function isForceSepoliaEnabled(): boolean {
  return getForceSepolia();
}

function isSepolia(chainId: unknown): boolean {
  if (typeof chainId === "string") {
    const lower = chainId.toLowerCase();
    if (lower === SEPOLIA_HEX) return true;
    // Some mobile wallets return decimal as string
    const parsed = lower.startsWith("0x") ? parseInt(lower, 16) : parseInt(lower, 10);
    return parsed === SEPOLIA_CHAIN_ID;
  }
  if (typeof chainId === "number") return chainId === SEPOLIA_CHAIN_ID;
  if (typeof chainId === "bigint") return Number(chainId) === SEPOLIA_CHAIN_ID;
  return false;
}

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [hasManuallyDisconnected, setHasManuallyDisconnected] = useState(false);

  const isAdmin = account?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  const clearWalletState = useCallback(() => {
    setAccount(null);
    setContract(null);
    setSigner(null);
  }, []);

  const setupContract = useCallback(async (provider: BrowserProvider) => {
    const s = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
    setSigner(s);
    setContract(c);
  }, []);

  const checkNetwork = useCallback(async () => {
    if (getForceSepolia()) {
      console.log("[web3] forceSepolia flag enabled — bypassing network check");
      setIsCorrectNetwork(true);
      return;
    }
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });
      const ok = isSepolia(chainId);
      console.log("[web3] eth_chainId =", chainId, "→ isSepolia:", ok);
      if (!ok) {
        try {
          const provider = new BrowserProvider((window as any).ethereum);
          const net = await provider.getNetwork();
          const okFallback = isSepolia(net.chainId);
          console.log("[web3] provider.getNetwork().chainId =", net.chainId.toString(), "→ isSepolia:", okFallback);
          setIsCorrectNetwork(okFallback);
          return;
        } catch (e) {
          console.warn("[web3] getNetwork fallback failed", e);
        }
      }
      setIsCorrectNetwork(ok);
    } catch (e) {
      console.warn("[web3] checkNetwork failed", e);
      setIsCorrectNetwork(false);
    }
  }, []);

  const overrideNetworkCheck = useCallback(() => {
    console.log("[web3] User manually overrode network check");
    setIsCorrectNetwork(true);
  }, []);


  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("Please install MetaMask to use this DApp");
      return;
    }
    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      await ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      }).catch(() => null);

      const provider = new BrowserProvider(ethereum);
      const accounts: string[] = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setHasManuallyDisconnected(false);
        setAccount(accounts[0]);
        await checkNetwork();
        await setupContract(provider);
      }
    } catch (err: any) {
      console.error("Connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork, setupContract]);

  const disconnectWallet = useCallback(() => {
    setHasManuallyDisconnected(true);
    clearWalletState();

    if (typeof window !== "undefined" && (window as any).ethereum) {
      void (window as any).ethereum.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      }).catch(() => null);
    }
  }, [clearWalletState]);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum || hasManuallyDisconnected) return;
    const eth = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        clearWalletState();
      } else {
        setHasManuallyDisconnected(false);
        setAccount(accounts[0]);
        const provider = new BrowserProvider(eth);
        setupContract(provider);
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log("[web3] chainChanged event:", chainId);
      checkNetwork();
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    // Auto-connect if previously connected
    eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        setHasManuallyDisconnected(false);
        setAccount(accounts[0]);
        checkNetwork();
        const provider = new BrowserProvider(eth);
        setupContract(provider);
      }
    });

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [checkNetwork, clearWalletState, hasManuallyDisconnected, setupContract]);

  return (
    <Web3Context.Provider value={{ account, isAdmin, isCorrectNetwork, isConnecting, contract, signer, connectWallet, disconnectWallet, overrideNetworkCheck }}>
      {children}
    </Web3Context.Provider>
  );
}
