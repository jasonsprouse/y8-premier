import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Wallet } from 'lucide-react';
import { BrowserProvider } from 'ethers';
import { SiweMessage } from 'siwe';

export function Auth() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { loginWithWallet } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';

  const handleSIWE = async () => {
    try {
      setIsConnecting(true);
      
      if (!(window as any).ethereum) {
        toast.error('Please install a Web3 wallet (e.g. MetaMask)');
        return;
      }
      
      toast.loading('Connecting wallet...', { id: 'siwe' });
      const provider = new BrowserProvider((window as any).ethereum);
      
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const chainId = Number((await provider.getNetwork()).chainId);
      
      const nonceRes = await fetch('/api/auth/nonce');
      if (!nonceRes.ok) throw new Error('Failed to fetch nonce');
      const nonce = await nonceRes.text();
      
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to access your premier services',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });
      
      const preparedMessage = message.prepareMessage();
      
      toast.loading('Please sign the message in your wallet...', { id: 'siwe' });
      const signature = await signer.signMessage(preparedMessage);
      
      toast.loading('Verifying signature...', { id: 'siwe' });
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: preparedMessage, signature }),
      });
      
      if (!verifyRes.ok) {
        throw new Error('Error verifying message');
      }
      
      const verifyData = await verifyRes.json();
      
      if (verifyData.success) {
        loginWithWallet(verifyData.address);
        toast.dismiss('siwe');
        toast.success('Successfully signed in with Ethereum');
        navigate(from, { replace: true });
      } else {
        throw new Error('Verification failed');
      }
      
    } catch (err: any) {
      console.error(err);
      toast.dismiss('siwe');
      toast.error(err.message || 'Failed to sign in');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center font-bold text-xl rounded mx-auto mb-4 tracking-tight">Y8</div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-2 text-sm">Sign in with Ethereum to access your premier services</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleSIWE}
            disabled={isConnecting}
            className="w-full bg-slate-900 text-white font-semibold py-3 px-4 rounded-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-[13px] disabled:opacity-50"
          >
            {isConnecting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Wallet className="w-4 h-4" />
            )}
            Sign-In with Ethereum
          </button>
          
          <div className="text-center mt-4">
             <p className="text-[11px] text-slate-400">By connecting, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
