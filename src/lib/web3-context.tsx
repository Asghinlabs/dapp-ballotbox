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
});

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);

  const isAdmin = account?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  const setupContract = useCallback(async (provider: BrowserProvider) => {
    const s = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
    setSigner(s);
    setContract(c);
  }, []);

  const checkNetwork = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });
      setIsCorrectNetwork(parseInt(chainId, 16) === SEPOLIA_CHAIN_ID);
    } catch {
      setIsCorrectNetwork(false);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("Please install MetaMask to use this DApp");
      return;
    }
    setIsConnecting(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const accounts: string[] = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
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
    setAccount(null);
    setContract(null);
    setSigner(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        const provider = new BrowserProvider(eth);
        setupContract(provider);
      }
    };

    const handleChainChanged = () => {
      checkNetwork();
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    // Auto-connect if previously connected
    eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) {
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
  }, [checkNetwork, disconnectWallet, setupContract]);

  return (
    <Web3Context.Provider value={{ account, isAdmin, isCorrectNetwork, isConnecting, contract, signer, connectWallet, disconnectWallet }}>
      {children}
    </Web3Context.Provider>
  );
}
