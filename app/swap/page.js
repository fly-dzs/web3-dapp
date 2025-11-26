'use client';
import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { CONTRACTS } from '@/lib/constants/contracts';
import { useTokenApprove } from '@/hooks/useTokenApprove';
import { useSwap } from '@/hooks/useSwap';
import { useEthPrice } from '@/hooks/useEthPrice';
import ERC20ABI from '@/lib/abis/ERC20ABI.json';
import toast from 'react-hot-toast';

const TOKEN_DECIMALS = 18;

export default function SwapPage() {
  const { swap, isConfirming: isSwapConfirming, isSuccess: isSwapSuccess } = useSwap();
 
  const { data: ethPrice, isLoading: isPriceLoading, error: priceError } = useEthPrice();
  const rateText = isPriceLoading
    ? 'Loading...'
    : priceError
      ? '获取失败'
      : `${ethPrice?.toFixed(2)}`;

  const { address, isConnected } = useAccount();
 
  const [fromToken, setFromToken] = useState('TOKEN_A');
  const [toToken, setToToken] = useState('TOKEN_B');
  const tokens = ['TOKEN_A', 'TOKEN_B'];
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const normalize = (addr) =>
    addr && addr !== '0x...' && addr !== '0x0' ? addr : undefined;
  const fromTokenAddress = normalize(CONTRACTS[fromToken]);
  const toTokenAddress = normalize(CONTRACTS[toToken]);
  const routerAddress = normalize(CONTRACTS.SWAP_ROUTER);

  const {
    balance: fromBalance,
    rawBalance: fromRawBalance,
    isLoading: isFromBalanceLoading,
    error: fromBalanceError,
    refetch: refetchFromBalance,
  } = useTokenBalance(fromTokenAddress, address);

  const {
    balance: toBalance,
    rawBalance: toRawBalance,
    isLoading: isToBalanceLoading,
    error: toBalanceError,
     refetch: refetchToBalance,
  } = useTokenBalance(toTokenAddress, address);

  useEffect(() => {
    console.log('balance debug', {
      address,
      fromToken,
      fromTokenAddress,
      toToken,
      toTokenAddress,
      fromBalance,
      fromRawBalance,
      fromBalanceError,
      toBalance,
      toRawBalance,
      toBalanceError,
    });
    if (fromBalanceError) console.error('from balance error >>>', fromBalanceError);
    if (toBalanceError) console.error('to balance error >>>', toBalanceError);
  }, [
    address,
    fromToken,
    fromTokenAddress,
    toToken,
    toTokenAddress,
    fromBalance,
    fromRawBalance,
    fromBalanceError,
    toBalance,
    toRawBalance,
    toBalanceError,
  ]);

  const { approve, isPending, isConfirming, isSuccess } = useTokenApprove();

  const { data: allowance } = useReadContract({
    address: fromTokenAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: address && routerAddress ? [address, routerAddress] : undefined,
    enabled: !!address && !!fromTokenAddress && !!routerAddress,
    
  });

  const parsedAmount =
    fromAmount && Number(fromAmount) > 0
      ? parseUnits(fromAmount, TOKEN_DECIMALS)
      : 0n;
  const hasAmount = parsedAmount > 0n;
  const needsApproval = hasAmount
    ? allowance
      ? allowance < parsedAmount
      : true
    : false;

    useEffect(() => {
  if (isSwapSuccess) {
    refetchFromBalance();
    refetchToBalance();
  }
}, [isSwapSuccess, refetchFromBalance, refetchToBalance]);

  const handleSwapTokens = () => {
    const prevFromToken = fromToken;
    const prevToToken = toToken;
    const prevFromAmount = fromAmount;
    const prevToAmount = toAmount;

    setFromToken(prevToToken);
    setToToken(prevFromToken);
    setFromAmount(prevToAmount);
    setToAmount(prevFromAmount);
    toast('Swap functionality coming next!');
  };

  const handleApprove = async () => {
    const amountNum = Number(fromAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error('请输入大于 0 的数量');
      return;
    }

    if (!fromTokenAddress) {
      toast.error('Token address 未配置');
      return;
    }
    if (!routerAddress) {
      toast.error('Router address 未配置');
      return;
    }

    try {
      await approve(fromTokenAddress, routerAddress, fromAmount, TOKEN_DECIMALS);
    } catch (err) {
      toast.error('Approval failed: ' + (err?.message || 'unknown error'));
    }
  };

  const handleSwap = async () => {
    if (!hasAmount) return;
    try {
      await swap(fromToken, fromAmount);
      toast('Swap successful!');
    
    } catch (err) {
      toast.error('Swap failed:' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Swap Tokens
        </h1>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div className="mb-4">
            <label className="text-white/70 text-sm mb-2 block">From</label>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {tokens.map((token) => (
                    <option key={token} value={token} className="bg-gray-800">
                      {token}
                    </option>
                  ))}
                </select>
                <span className="text-white/50 text-sm">
                  Balance: {isFromBalanceLoading ? '...' : fromBalance}
                </span>
              </div>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="0.0"
                className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none placeholder-white/30"
              />
            </div>
          </div>
          <div className="flex justify-center my-4">
            <button
              onClick={handleSwapTokens}
              className="bg-white/10 hover:bg-white/20 rounded-full p-3 border border-white/20 transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
          <div className="mb-6">
            <label className="text-white/70 text-sm mb-2 block">To</label>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {tokens.map((token) => (
                    <option key={token} value={token} className="bg-gray-800">
                      {token}
                    </option>
                  ))}
                </select>
                <span className="text-white/50 text-sm">
                  Balance: {isToBalanceLoading ? '...' : toBalance}
                </span>
              </div>
              <input
                type="number"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="0.0"
                className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none placeholder-white/30"
              />
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Exchange Rate</span>
              <span className="text-white">1 ETH = {rateText} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Price Impact</span>
              <span className="text-green-400">{'<'}0.01%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Network Fee</span>
              <span className="text-white">~$2.50</span>
            </div>
          </div>
        </div>
        {!isConnected ? (
          <button className="w-full bg-gray-600 text-white font-semibold py-4 rounded-xl cursor-not-allowed">
            Please Connect Wallet
          </button>
        ) : needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={!hasAmount || isPending || isConfirming}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            {isPending
              ? 'Approving...'
              : isConfirming
                ? 'Confirming...'
                : 'Approve ' + fromToken}
          </button>
        ) : (
          <button
            onClick={handleSwap}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 rounded-xl transition-all shadow-lg"
          >
            Swap
          </button>
        )}
        {isSuccess && (
          <div className="mt-4 bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
            <div className="text-green-400 font-semibold">Approval Successful!</div>
          </div>
        )}
      </div>
    </div>
  );
}
