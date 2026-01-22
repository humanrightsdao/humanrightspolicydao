// hooks/useWeb3Auth.js
import { useState } from "react";
import { supabase } from "../lib/supabase";

export function useWeb3Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [walletAddress, setWalletAddress] = useState(
    localStorage.getItem("web3_wallet_address") || "",
  );

  // Check Web3 provider availability
  const checkWeb3Provider = () => {
    if (typeof window.ethereum === "undefined") {
      throw new Error(
        "MetaMask or another Web3 wallet is not installed. Please install MetaMask.",
      );
    }
    return true;
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      checkWeb3Provider();

      setLoading(true);
      setError("");

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("Failed to access wallet");
      }

      const address = accounts[0].toLowerCase();
      setWalletAddress(address);
      localStorage.setItem("web3_wallet_address", address);

      console.log("Wallet connected:", address);

      return {
        success: true,
        address,
      };
    } catch (err) {
      console.error("Connect wallet error:", err);
      const errorMsg = err.message || "Wallet connection error";
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  // Generate message for signing
  const generateMessage = (address, nonce) => {
    return `Sign this message to authenticate with Human Rights DAO\n\nWallet: ${address}\nNonce: ${nonce}`;
  };

  // Sign message
  const signMessage = async (address, message) => {
    try {
      checkWeb3Provider();

      console.log("Signing message for address:", address);

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      console.log("Message signed successfully");

      return {
        success: true,
        signature,
      };
    } catch (err) {
      console.error("Sign message error:", err);
      const errorMsg = err.message || "Message signing error";
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // Main authentication function
  const login = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("Connecting to wallet...");

      // 1. Connect wallet
      const connectResult = await connectWallet();
      if (!connectResult.success) {
        throw new Error(connectResult.error);
      }

      const address = connectResult.address;
      setMessage("Preparing message for signing...");

      // 2. Generate nonce (timestamp)
      const nonce = Date.now().toString();
      const messageToSign = generateMessage(address, nonce);

      console.log("Message to sign:", messageToSign);

      // 3. Sign message
      setMessage("Please sign the message in your wallet...");
      const signResult = await signMessage(address, messageToSign);

      if (!signResult.success) {
        throw new Error(signResult.error);
      }

      const signature = signResult.signature;

      // Save data for potential reuse
      localStorage.setItem("web3_signature", signature);
      localStorage.setItem("web3_message", messageToSign);
      localStorage.setItem("web3_nonce", nonce);

      // 4. Send to Edge Function for verification
      setMessage("Verifying signature...");

      const { data: functionData, error: functionError } =
        await supabase.functions.invoke("web3-auth", {
          body: {
            walletAddress: address,
            signature: signature,
            message: messageToSign,
            nonce: nonce,
          },
        });

      if (functionError) {
        console.error("Edge function error:", functionError);
        throw new Error(
          functionError.message || "Signature verification error",
        );
      }

      console.log("Edge function response:", functionData);

      if (!functionData.access_token) {
        throw new Error("Access token not received");
      }

      // 5. Set Supabase session with received JWT
      setMessage("Establishing session...");

      const { data: sessionData, error: sessionError } =
        await supabase.auth.setSession({
          access_token: functionData.access_token,
          refresh_token:
            functionData.refresh_token || functionData.access_token,
        });

      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error(sessionError.message || "Session establishment error");
      }

      console.log("Session established:", sessionData);

      // 6. Check if session was successfully established
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Failed to establish session");
      }

      setMessage("Authentication successful! ✅");

      // Clear temporary data
      setTimeout(() => {
        localStorage.removeItem("web3_signature");
        localStorage.removeItem("web3_message");
        localStorage.removeItem("web3_nonce");
      }, 1000);

      return {
        success: true,
        user: session.user,
        address,
      };
    } catch (err) {
      console.error("Web3 login error:", err);
      const errorMsg = err.message || "Web3 authentication error";
      setError(errorMsg);
      setMessage("");
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setWalletAddress("");
    setError("");
    setMessage("");
    localStorage.removeItem("web3_wallet_address");
    localStorage.removeItem("web3_signature");
    localStorage.removeItem("web3_message");
    localStorage.removeItem("web3_nonce");
    console.log("Web3 wallet disconnected");
  };

  // Format wallet address (short version)
  const formatWalletAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get current network
  const getChainId = async () => {
    try {
      checkWeb3Provider();
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      return parseInt(chainId, 16);
    } catch (err) {
      console.error("Get chain ID error:", err);
      return null;
    }
  };

  // Check correct network
  const checkNetwork = async (expectedChainId = 1) => {
    const chainId = await getChainId();
    if (chainId && chainId !== expectedChainId) {
      setError(
        `Please switch to ${expectedChainId === 1 ? "Ethereum Mainnet" : `network with ID ${expectedChainId}`}`,
      );
      return false;
    }
    return true;
  };

  return {
    // States
    loading,
    error,
    message,
    walletAddress,

    // Methods
    login,
    disconnect,
    connectWallet,
    formatWalletAddress,
    getChainId,
    checkNetwork,

    // Setters (for resetting states from parent component)
    setError,
    setMessage,
  };
}
