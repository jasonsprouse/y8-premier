import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Globe, Activity, Plus, ArrowRight, ExternalLink, CheckCircle2, ShieldCheck, Edit2, Wallet as WalletIcon, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { usePlaidLink } from 'react-plaid-link';

export function Financial() {
  const { user, updatePrimaryAddress, authorizeIntegration } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const [linkedBank, setLinkedBank] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newPrimaryAddress, setNewPrimaryAddress] = useState(user?.primaryAddress || '');
  
  const [ledger, setLedger] = useState<any[]>([]);

  // Rafiki Payment State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // Ramp State
  const [rampAmount, setRampAmount] = useState('');
  const [rampType, setRampType] = useState<'on' | 'off'>('on');

  // Swap State
  const [swapAmount, setSwapAmount] = useState('');
  const [swapFrom, setSwapFrom] = useState('USDC');
  const [swapTo, setSwapTo] = useState('ETH');

  useEffect(() => {
    if (user?.authorizedIntegrations?.includes('rafiki') && user.ethAddress) {
      setRecipient(`$ilp.y8.com/${user.ethAddress}`);
    }
  }, [user]);

  const handleAuthorizeRafiki = () => {
    toast.loading('Authorizing Rafiki Interledger via Wallet...', { id: 'rafiki-auth' });
    setTimeout(() => {
      authorizeIntegration('rafiki');
      toast.success('Rafiki authorized successfully', { id: 'rafiki-auth' });
    }, 1500);
  };

  useEffect(() => {
    fetch('/api/financial/ledger')
      .then(r => r.json())
      .then(setLedger)
      .catch(console.error);
  }, []);

  const createPlaidLinkToken = async () => {
    try {
      setIsLinking(true);
      const res = await fetch('/api/plaid/create_link_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryAddress: user?.primaryAddress })
      });
      const data = await res.json();
      if (data.link_token) {
        setLinkToken(data.link_token);
      } else {
        toast.error(data.error || 'Failed to initialize Plaid', { duration: 4000 });
        setIsLinking(false);
      }
    } catch (e) {
       toast.error('Network error connecting to Plaid');
       setIsLinking(false);
    }
  };

  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      await fetch('/api/plaid/set_access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token })
      });
      toast.success('KYC verified and Bank account linked');
      setLinkedBank(metadata.institution.name + ' (****' + (metadata.accounts[0]?.mask || '0000') + ')');
    } catch (e) {
      toast.error('Failed to exchange token');
    } finally {
      setIsLinking(false);
      setLinkToken(null);
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess,
    onExit: () => {
      setIsLinking(false);
      setLinkToken(null);
    }
  });

  useEffect(() => {
    if (ready && linkToken && isLinking) {
      open();
    }
  }, [ready, linkToken, isLinking, open]);

  const handlePlaidLink = () => {
    if (!linkToken) {
       createPlaidLinkToken();
    } else {
       open();
    }
  };

  const handleSaveAddress = () => {
    if (newPrimaryAddress) {
      updatePrimaryAddress(newPrimaryAddress);
      setIsEditingAddress(false);
      toast.success('Primary address updated for KYC');
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    toast.loading('Routing payment via Rafiki Interledger...', { id: 'payment' });
    try {
      const res = await fetch('/api/financial/rafiki/transfer', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ recipient, amount: parseFloat(amount) })
      });
      const data = await res.json();
      toast.dismiss('payment');
      if (data.success) {
        toast.success(`Transfer complete. Transaction ID: ${data.transactionId}`);
        setAmount('');
      } else {
        toast.error('Transfer failed');
      }
    } catch (e) {
      toast.dismiss('payment');
      toast.error('Network error routing payment');
    }
  };

  const handleRamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedBank) {
      toast.error('Please connect a bank account via Plaid first');
      return;
    }
    if (!rampAmount || parseFloat(rampAmount) <= 0) return;
    
    const action = rampType === 'on' ? 'On-Ramp (Deposit)' : 'Off-Ramp (Withdrawal)';
    toast.loading(`Processing ${action}...`, { id: 'ramp' });
    try {
      // Simulate API call to Plaid Transfer for moving money
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLedger(prev => [{
        id: Math.random().toString(),
        date: new Date().toISOString().split('T')[0],
        description: `Plaid ACH ${action}`,
        amount: rampType === 'on' ? parseFloat(rampAmount) : -parseFloat(rampAmount)
      }, ...prev]);
      
      toast.success(`${action} successful`, { id: 'ramp' });
      setRampAmount('');
    } catch (e) {
      toast.error(`Failed to process ${action}`, { id: 'ramp' });
    }
  };

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapAmount || parseFloat(swapAmount) <= 0) return;
    
    toast.loading(`Swapping ${swapAmount} ${swapFrom} to ${swapTo}...`, { id: 'swap' });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLedger(prev => [{
        id: Math.random().toString(),
        date: new Date().toISOString().split('T')[0],
        description: `Swap ${swapFrom} -> ${swapTo}`,
        amount: -parseFloat(swapAmount)
      }, ...prev]);
      
      toast.success(`Swap successful`, { id: 'swap' });
      setSwapAmount('');
    } catch (e) {
      toast.error(`Failed to process swap`, { id: 'swap' });
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Financial Services</h1>
        <p className="mt-2 text-sm text-slate-500">Manage global payments, view ledgers, and connect accounts securely.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account & Payments */}
        <div className="lg:col-span-1 space-y-6">

          {/* Identity & KYC Profile */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-[15px] font-semibold text-slate-900">Identity Profile</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Connected Wallet</label>
                <div className="mt-1 text-[13px] text-slate-900 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                  {user?.ethAddress}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Primary KYC Address</label>
                  {!isEditingAddress && (
                    <button onClick={() => setIsEditingAddress(true)} className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
                {isEditingAddress ? (
                  <div className="mt-1 flex gap-2">
                    <input 
                      type="text" 
                      value={newPrimaryAddress} 
                      onChange={(e) => setNewPrimaryAddress(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-[13px] focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                    />
                    <button onClick={handleSaveAddress} className="px-3 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded">Save</button>
                    <button onClick={() => setIsEditingAddress(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded">Cancel</button>
                  </div>
                ) : (
                  <div className="mt-1 text-[13px] text-slate-900 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                    {user?.primaryAddress}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">This address is used for Plaid identity verification and compliance.</p>
              </div>
            </div>
          </section>
          
          {/* Plaid Integration */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-[15px] font-semibold text-slate-900">Connected Accounts</h2>
            </div>
            
            {linkedBank ? (
              <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[13px] text-emerald-900">{linkedBank}</p>
                  <p className="text-xs text-emerald-700 mt-1">Verified via Plaid</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                <p className="text-[13px] text-slate-500 mb-4">No accounts connected yet.</p>
                <button
                  onClick={handlePlaidLink}
                  disabled={isLinking}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLinking ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : null}
                  Plaid Connect
                </button>
              </div>
            )}
          </section>

          {/* Fiat On/Off Ramp */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Fiat On/Off-Ramp</h2>
                <p className="text-xs text-slate-500 mt-0.5">Move funds via Plaid Transfer</p>
              </div>
            </div>

            <form onSubmit={handleRamp} className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => setRampType('on')}
                  className={`flex-1 text-[12px] font-semibold py-1.5 rounded transition-colors ${rampType === 'on' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  On-Ramp (Deposit)
                </button>
                <button
                  type="button"
                  onClick={() => setRampType('off')}
                  className={`flex-1 text-[12px] font-semibold py-1.5 rounded transition-colors ${rampType === 'off' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Off-Ramp (Withdraw)
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    value={rampAmount}
                    onChange={(e) => setRampAmount(e.target.value)}
                    className="w-full pl-7 pr-2 py-2 border border-slate-200 rounded text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full mt-2 bg-blue-600 text-white px-4 py-3 rounded-md text-[13px] font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {rampType === 'on' ? 'Execute On-Ramp' : 'Execute Off-Ramp'}
              </button>
              <div className="mt-3 p-2.5 bg-slate-50 border border-slate-100 rounded-md text-[11px] text-slate-500">
                {rampType === 'on' 
                  ? 'Funds will be pulled from your Plaid connected bank account to your Web3 wallet.' 
                  : 'Funds will be transferred from your Web3 wallet to your connected bank account via ACH.'}
              </div>
            </form>
          </section>

          {/* Rafiki Payments */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Rafiki Global Payments</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Powered by Interledger</p>
              </div>
            </div>

            {user?.authorizedIntegrations?.includes('rafiki') ? (
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500">Recipient Pointer</label>
                  <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-2 py-2 border border-slate-200 rounded text-[13px] bg-slate-50 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="$ilp.y8.com/address" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500">Amount (USD)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-2 py-2 border border-slate-200 rounded text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0.00" min="0" step="0.01" required />
                </div>
                <button type="submit" className="w-full mt-2 bg-slate-900 text-white px-4 py-3 rounded-md text-[13px] font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  Execute Interledger Transfer
                </button>
                <div className="mt-3 p-2.5 bg-blue-50 rounded-md text-[11px] text-blue-800">
                  Interledger dynamic quote secured: 0.002% fee applicable.
                </div>
              </form>
            ) : (
              <div className="text-center p-6 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                <p className="text-[13px] text-slate-500 mb-4">Rafiki Interledger requires SIWE authorization to map your payment pointer.</p>
                <button
                  onClick={handleAuthorizeRafiki}
                  className="w-full bg-slate-900 text-white px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  Authorize Rafiki via Wallet
                </button>
              </div>
            )}
          </section>

          {/* Token Swap */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Token Swap</h2>
                <p className="text-xs text-slate-500 mt-0.5">Swap stablecoins to L1 tokens</p>
              </div>
            </div>

            <form onSubmit={handleSwap} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500">From</label>
                <div className="flex gap-2">
                  <select
                    value={swapFrom}
                    onChange={(e) => setSwapFrom(e.target.value)}
                    className="w-[100px] px-2 py-2 border border-slate-200 rounded text-[13px] bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                  </select>
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="flex-1 px-2 py-2 border border-slate-200 rounded text-[13px] focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white p-1 rounded-full border border-slate-200 text-slate-400">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500">To</label>
                <div className="flex gap-2">
                  <select
                    value={swapTo}
                    onChange={(e) => setSwapTo(e.target.value)}
                    className="w-[100px] px-2 py-2 border border-slate-200 rounded text-[13px] bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="ETH">ETH</option>
                    <option value="BTC">BTC</option>
                    <option value="SOL">SOL</option>
                  </select>
                  <input
                    type="text"
                    value={swapAmount ? (parseFloat(swapAmount) * (swapTo === 'ETH' ? 0.0003 : swapTo === 'BTC' ? 0.000015 : 0.007)).toFixed(4) : ''}
                    disabled
                    className="flex-1 px-2 py-2 border border-slate-200 rounded text-[13px] bg-slate-50 text-slate-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-blue-600 text-white px-4 py-3 rounded-md text-[13px] font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Execute Swap
              </button>
            </form>
          </section>

        </div>

        {/* Right Column: Ledger & Analytics */}
        <div className="lg:col-span-2 space-y-6">

          {/* Crypto Holdings Analytics */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <WalletIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Digital Asset Holdings</h2>
                <p className="text-xs text-slate-500 mt-0.5">Current valuation and portfolio distribution</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Ethereum (ETH)', value: 14500, color: '#627EEA' },
                        { name: 'Bitcoin (BTC)', value: 25000, color: '#F7931A' },
                        { name: 'USDC', value: 5000, color: '#2775CA' },
                        { name: 'Solana (SOL)', value: 3200, color: '#14F195' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'Ethereum (ETH)', value: 14500, color: '#627EEA' },
                        { name: 'Bitcoin (BTC)', value: 25000, color: '#F7931A' },
                        { name: 'USDC', value: 5000, color: '#2775CA' },
                        { name: 'Solana (SOL)', value: 3200, color: '#14F195' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Valuation</p>
                  <p className="text-3xl font-bold text-slate-900">$47,700.00</p>
                  <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> +5.2% this week
                  </p>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                  {[
                    { name: 'Ethereum (ETH)', value: 14500, color: '#627EEA', amount: '4.5 ETH' },
                    { name: 'Bitcoin (BTC)', value: 25000, color: '#F7931A', amount: '0.4 BTC' },
                    { name: 'USDC', value: 5000, color: '#2775CA', amount: '5,000 USDC' },
                    { name: 'Solana (SOL)', value: 3200, color: '#14F195', amount: '22 SOL' },
                  ].map((asset, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                        <span className="text-[13px] font-medium text-slate-700">{asset.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-slate-900">{asset.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                        <p className="text-[11px] text-slate-500">{asset.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          
          {/* TigerBeetle Ledger */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
                TigerBeetle Ledger
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded tracking-wide">SYNCED</span>
              </h2>
              <button onClick={handlePlaidLink} className="text-[12px] bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors font-medium">
                Plaid Connect
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-[12px] whitespace-nowrap border-collapse">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-2 border-b border-slate-100 font-medium">Date</th>
                    <th className="p-2 border-b border-slate-100 font-medium">Description</th>
                    <th className="p-2 border-b border-slate-100 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2 border-b border-slate-100 text-slate-400">{tx.date}</td>
                      <td className="p-2 border-b border-slate-100 text-slate-900">{tx.description}</td>
                      <td className={`p-2 border-b border-slate-100 text-right font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                     <tr>
                       <td colSpan={3} className="p-4 text-center text-slate-500">Loading ledger data...</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
