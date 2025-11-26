'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import toast from 'react-hot-toast'
import { useLiquidity } from '@/hooks/useLiquidity'
import SwapRouterABI from '@/lib/abis/SwapRouterABI.json'
import { CONTRACTS } from '@/lib/constants/contracts'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { useTokenApprove } from '@/hooks/useTokenApprove'
import { formatUnits, parseUnits } from 'viem'

export default function PoolPage() {
  const { addLiquidity, removeLiquidity, isPending } = useLiquidity()
  const { approve, isPending: isApprovePending, isConfirming: isApproveConfirming } = useTokenApprove()

  const [activeTab, setActiveTab] = useState('add')
  const [token0, setToken0] = useState('TOKEN_A')
  const [token1, setToken1] = useState('TOKEN_B')
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [removeAmount, setRemoveAmount] = useState('')
  const [approveAmount0, setApproveAmount0] = useState('')
  const [approveAmount1, setApproveAmount1] = useState('')
  const tokens = ['TOKEN_A', 'TOKEN_B']

  const { address, isConnected } = useAccount()

  const normalize = (addr) =>
    addr && addr !== '0x...' && addr !== '0x0' ? addr : undefined
  const token0Address = normalize(CONTRACTS[token0])
  const token1Address = normalize(CONTRACTS[token1])

  const { data: reserves } = useReadContract({
    address: CONTRACTS.SWAP_ROUTER,
    abi: SwapRouterABI,
    functionName: 'getReserves',
  })

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.SWAP_ROUTER,
    abi: SwapRouterABI,
    functionName: 'totalSupply',
  })

  const {
    balance: lpBalance,
    refetch: refetchLpBalance,
  } = useTokenBalance(CONTRACTS.SWAP_ROUTER, address)

  const {
    balance: fromBalance,
    isLoading: isFromBalanceLoading,
    refetch: refetchFromBalance,
  } = useTokenBalance(token0Address, address)

  const {
    balance: toBalance,
    isLoading: isToBalanceLoading,
    refetch: refetchToBalance,
  } = useTokenBalance(token1Address, address)

  // 自动按池子比例补全第二个数额：amount1 = amount0 * reserveB / reserveA
  useEffect(() => {
    if (!amount0) {
      setAmount1('')
      return
    }
    if (!reserves || reserves.length < 2) return
    const reserveA = Number(reserves[0])
    const reserveB = Number(reserves[1])
    if (!Number.isFinite(reserveA) || reserveA <= 0) return
    const amt0 = Number(amount0)
    if (!Number.isFinite(amt0)) return
    const computed = (amt0 * reserveB) / reserveA
    setAmount1(computed ? computed.toString() : '')
  }, [amount0, reserves])

  const poolStats = useMemo(() => {
    const resA = reserves?.[0] ? Number(formatUnits(reserves[0], 18)) : 0
    const resB = reserves?.[1] ? Number(formatUnits(reserves[1], 18)) : 0
    const ts = totalSupply ? Number(formatUnits(totalSupply, 18)) : 0
    const lpBal = lpBalance ? Number(lpBalance) : 0
    const share =
      ts > 0 && lpBal > 0 ? ((lpBal / ts) * 100).toFixed(4) + '%' : '0.00%'
    return {
      pair: `${token0}/${token1}`,
      reserveA: resA.toFixed(4),
      reserveB: resB.toFixed(4),
      totalSupply: ts.toFixed(4),
      myShare: share,
    }
  }, [reserves, totalSupply, lpBalance, token0, token1])

  const removePreview = useMemo(() => {
    try {
      if (!removeAmount || !reserves || reserves.length < 2 || !totalSupply) {
        return { amountA: '0.00', amountB: '0.00' }
      }
      const lpWei = parseUnits(removeAmount, 18)
      if (lpWei <= 0n) return { amountA: '0.00', amountB: '0.00' }
      const resA = BigInt(reserves[0])
      const resB = BigInt(reserves[1])
      const ts = BigInt(totalSupply)
      if (ts === 0n) return { amountA: '0.00', amountB: '0.00' }
      const outA = (resA * lpWei) / ts
      const outB = (resB * lpWei) / ts
      return {
        amountA: Number(formatUnits(outA, 18)).toFixed(4),
        amountB: Number(formatUnits(outB, 18)).toFixed(4),
      }
    } catch {
      return { amountA: '0.00', amountB: '0.00' }
    }
  }, [removeAmount, reserves, totalSupply])

  const handleApprove = async (tokenAddr, amount) => {
    if (!isConnected || !address) {
      toast.error('请先连接钱包')
      return
    }
    if (!tokenAddr) {
      toast.error('Token 地址未配置')
      return
    }
    const amtNum = Number(amount)
    if (!Number.isFinite(amtNum) || amtNum <= 0) {
      toast.error('请输入要授权的数量')
      return
    }
    try {
      await approve(tokenAddr, CONTRACTS.SWAP_ROUTER, amount)
      toast.success('Approve 交易已发送')
    } catch (err) {
      toast.error('Approve 失败: ' + (err?.message || 'unknown error'))
    }
  }

  const handleAddLiquidity = async () => {
    if (!isConnected || !address) {
      toast.error('请先连接钱包')
      return
    }
    const amount0Num = Number(amount0)
    const amount1Num = Number(amount1)
    if (!Number.isFinite(amount0Num) || amount0Num <= 0) {
      toast.error('请输入 Token 1 数量')
      return
    }
    if (!Number.isFinite(amount1Num) || amount1Num <= 0) {
      toast.error('请输入 Token 2 数量')
      return
    }
    try {
      await addLiquidity({ amountA: amount0, amountB: amount1 })
      toast.success('Add liquidity 交易已发送')
      setAmount0('')
      setAmount1('')
      refetchFromBalance()
      refetchToBalance()
      refetchLpBalance()
    } catch (err) {
      toast.error('Add liquidity 失败: ' + (err?.message || 'unknown error'))
    }
  }

  const handleRemoveLiquidity = async () => {
    if (!isConnected || !address) {
      toast.error('请先连接钱包')
      return
    }
    const removeNum = Number(removeAmount)
    if (!Number.isFinite(removeNum) || removeNum <= 0) {
      toast.error('请输入要移除的 LP 数量')
      return
    }
    try {
      await removeLiquidity({ liquidityAmount: removeAmount })
      toast.success('Remove liquidity 交易已发送')
      setRemoveAmount('')
      refetchLpBalance()
    } catch (err) {
      toast.error('Remove liquidity 失败: ' + (err?.message || 'unknown error'))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Liquidity Pools
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveTab('add')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'add'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                Add Liquidity
              </button>
              <button
                onClick={() => setActiveTab('remove')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'remove'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                Remove Liquidity
              </button>
            </div>

            {activeTab === 'add' ? (
              <>
                <div className="mb-4">
                  <label className="text-white/70 text-sm mb-2 block">Token 1</label>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <select
                        value={token0}
                        onChange={(e) => setToken0(e.target.value)}
                        className="bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {tokens.map((token) => (
                          <option key={token} value={token} className="bg-gray-800">
                            {token}
                          </option>
                        ))}
                      </select>
                      <span className="text-white/50 text-sm">
                        Balance:{isFromBalanceLoading ? '...' : fromBalance}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={amount0}
                      onChange={(e) => setAmount0(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none placeholder-white/30"
                    />
                    <div className="mt-3 flex items-center space-x-2">
                      <input
                        type="number"
                        value={approveAmount0}
                        onChange={(e) => setApproveAmount0(e.target.value)}
                        placeholder="Approve amount"
                        className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleApprove(token0Address, approveAmount0)}
                        disabled={!isConnected || isApprovePending || isApproveConfirming}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApprovePending ? 'Confirm...' : isApproveConfirming ? 'Pending...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center my-4">
                  <div className="bg-white/10 rounded-full p-3 border border-white/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-white/70 text-sm mb-2 block">Token 2</label>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <select
                        value={token1}
                        onChange={(e) => setToken1(e.target.value)}
                        className="bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {tokens.map((token) => (
                          <option key={token} value={token} className="bg-gray-800">
                            {token}
                          </option>
                        ))}
                      </select>
                      <span className="text-white/50 text-sm">
                        Balance:{isToBalanceLoading ? '...' : toBalance}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={amount1}
                      onChange={(e) => setAmount1(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none placeholder-white/30"
                    />
                    <div className="mt-3 flex items-center space-x-2">
                      <input
                        type="number"
                        value={approveAmount1}
                        onChange={(e) => setApproveAmount1(e.target.value)}
                        placeholder="Approve amount"
                        className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleApprove(token1Address, approveAmount1)}
                        disabled={!isConnected || isApprovePending || isApproveConfirming}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApprovePending ? 'Confirm...' : isApproveConfirming ? 'Pending...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Share of Pool</span>
                    <span className="text-white">0.05%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">My LP Balance</span>
                    <span className="text-white">{lpBalance ?? '0.00'}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddLiquidity}
                  disabled={isPending || !isConnected}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnected ? (isPending ? 'Confirm in wallet...' : 'Add Liquidity') : 'Connect Wallet to Add'}
                </button>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <label className="text-white/70 text-sm mb-2 block">
                    LP Amount to Remove
                  </label>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <input
                      type="number"
                      value={removeAmount}
                      onChange={(e) => setRemoveAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none placeholder-white/30"
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-3">
                  <div className="text-white/70 text-sm mb-2">You will receive:</div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{removePreview.amountA} TOKEN_A</span>
                    <span className="text-white/50 text-sm"></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{removePreview.amountB} TOKEN_B</span>
                    <span className="text-white/50 text-sm"></span>
                  </div>
                </div>

                <button
                  onClick={handleRemoveLiquidity}
                  disabled={isPending || !isConnected}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnected ? (isPending ? 'Confirm in wallet...' : 'Remove Liquidity') : 'Connect Wallet to Remove'}
                </button>
              </>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Your Liquidity</h2>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-white font-semibold text-lg">{poolStats.pair}</div>
                  <div className="text-white/50 text-sm">
                    Reserves: {poolStats.reserveA} / {poolStats.reserveB}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Total LP</span>
                  <span className="text-white">{poolStats.totalSupply}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">My Share</span>
                  <span className="text-white font-semibold">{poolStats.myShare}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-white/50 text-sm">
              <p>Connect wallet to see your liquidity positions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
