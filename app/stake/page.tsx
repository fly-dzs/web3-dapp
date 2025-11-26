// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import toast from 'react-hot-toast'

import { CONTRACTS } from '@/lib/constants/contracts'
import StakePoolABI from '@/lib/abis/StakePoolABI.json'
import ERC20ABI from '@/lib/abis/ERC20ABI.json'
import { useTokenApprove } from '@/hooks/useTokenApprove'
import { useStakePool } from '@/hooks/useStakePool'

const fallbackDecimals = 18

export default function StakePage() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    stake,
    withdraw,
    claim,
    isStakePending,
    isStakeConfirming,
    isWithdrawPending,
    isWithdrawConfirming,
    isClaimPending,
    isClaimConfirming,
  } = useStakePool(fallbackDecimals)
  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
  } = useTokenApprove()

  const isApproveBusy = isApprovePending || isApproveConfirming
  const isStakeBusy = isStakePending || isStakeConfirming
  const isWithdrawBusy = isWithdrawPending || isWithdrawConfirming
  const isClaimBusy = isClaimPending || isClaimConfirming

  // staking & reward tokens
  const { data: stakingToken } = useReadContract({
    address: CONTRACTS.STAKE_POOL,
    abi: StakePoolABI,
    functionName: 'stakingToken',
    scopeKey: `sp-staking-${refreshKey}`,
  })
  const { data: rewardToken } = useReadContract({
    address: CONTRACTS.STAKE_POOL,
    abi: StakePoolABI,
    functionName: 'rewardToken',
    scopeKey: `sp-reward-${refreshKey}`,
  })

  // user info
  const { data: userInfo } = useReadContract({
    address: CONTRACTS.STAKE_POOL,
    abi: StakePoolABI,
    functionName: 'getUserInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    scopeKey: `sp-user-${address}-${refreshKey}`,
  })

  // meta/balances/allowance
  const metaQuery = useReadContracts({
    contracts: [
      stakingToken
        ? { address: stakingToken, abi: ERC20ABI, functionName: 'symbol' }
        : null,
      stakingToken
        ? { address: stakingToken, abi: ERC20ABI, functionName: 'decimals' }
        : null,
      rewardToken
        ? { address: rewardToken, abi: ERC20ABI, functionName: 'symbol' }
        : null,
      rewardToken
        ? { address: rewardToken, abi: ERC20ABI, functionName: 'decimals' }
        : null,
      stakingToken && address
        ? { address: stakingToken, abi: ERC20ABI, functionName: 'balanceOf', args: [address] }
        : null,
      rewardToken && address
        ? { address: rewardToken, abi: ERC20ABI, functionName: 'balanceOf', args: [address] }
        : null,
      stakingToken && address
        ? { address: stakingToken, abi: ERC20ABI, functionName: 'allowance', args: [address, CONTRACTS.STAKE_POOL] }
        : null,
    ].filter(Boolean),
    query: { enabled: !!stakingToken },
  })

  const stakingSymbol = metaQuery.data?.[0]?.result || 'LP'
  const stakingDecimals = metaQuery.data?.[1]?.result ?? fallbackDecimals
  const rewardSymbol = metaQuery.data?.[2]?.result || 'REWARD'
  const rewardDecimals = metaQuery.data?.[3]?.result ?? fallbackDecimals
  const stakingBalance = metaQuery.data?.[4]?.result ?? 0n
  const rewardBalance = metaQuery.data?.[5]?.result ?? 0n
  const allowance = metaQuery.data?.[6]?.result ?? 0n

  const stakedRaw = userInfo?.[0] ?? 0n
  const pendingRaw = userInfo?.[1] ?? 0n

  const formattedStakingBalance = formatUnits(stakingBalance, stakingDecimals)
  const formattedStaked = formatUnits(stakedRaw, stakingDecimals)
  const formattedPending = formatUnits(pendingRaw, rewardDecimals)
  const formattedRewardBalance = formatUnits(rewardBalance, rewardDecimals)

  const parsedAmount = useMemo(() => {
    try {
      return parseUnits(String(amount || 0), stakingDecimals)
    } catch {
      return 0n
    }
  }, [amount, stakingDecimals])

  const needsApproval = parsedAmount > 0n && allowance < parsedAmount

  const handleApprove = async () => {
    if (!stakingToken) {
      toast.error('未获取到质押代币地址')
      return
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('请输入数量')
      return
    }
    try {
      await approve(stakingToken, CONTRACTS.STAKE_POOL, amount, stakingDecimals)
      toast.success('授权已发送')
      setRefreshKey((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '授权失败')
    }
  }

  const handleStake = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('请输入数量')
      return
    }
    try {
      await stake(amount, stakingDecimals)
      toast.success('质押已提交')
      setAmount('')
      setRefreshKey((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '质押失败')
    }
  }

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('请输入数量')
      return
    }
    try {
      await withdraw(amount, stakingDecimals)
      toast.success('解押已提交')
      setAmount('')
      setRefreshKey((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '解押失败')
    }
  }

  const handleClaim = async () => {
    try {
      await claim()
      toast.success('领取已提交')
      setRefreshKey((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '领取失败')
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 py-12 px-4 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Stake Pool</h1>
          <p className="text-white/70">请先连接钱包</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center text-white space-y-2">
          <h1 className="text-4xl font-bold">Stake Pool</h1>
          <p className="text-white/70">质押 {stakingSymbol} 领取 {rewardSymbol}</p>
          <div className="text-xs text-white/50">StakePool: {CONTRACTS.STAKE_POOL}</div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Stat title="质押代币余额" value={`${formattedStakingBalance} ${stakingSymbol}`} />
            <Stat title="已质押" value={`${formattedStaked} ${stakingSymbol}`} />
            <Stat title="待领取奖励" value={`${formattedPending} ${rewardSymbol}`} accent />
            <Stat title="奖励代币余额" value={`${formattedRewardBalance} ${rewardSymbol}`} />
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <label className="text-white/70 text-sm">数量 ({stakingSymbol})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              onWheel={(e) => e.currentTarget.blur()}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white text-xl outline-none placeholder-white/40"
            />
            <div className="flex gap-3 flex-wrap">
              {needsApproval ? (
                <button
                  disabled={isApproveBusy}
                  onClick={handleApprove}
                  className="flex-1 min-w-[140px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
                >
                  {isApproveBusy ? '授权中...' : `授权 ${stakingSymbol}`}
                </button>
              ) : (
                <button
                  disabled={isStakeBusy}
                  onClick={handleStake}
                  className="flex-1 min-w-[140px] bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
                >
                  {isStakeBusy ? '质押中...' : '质押'}
                </button>
              )}
              <button
                disabled={isWithdrawBusy}
                onClick={handleWithdraw}
                className="flex-1 min-w-[140px] bg-white/10 text-white font-semibold py-3 rounded-lg border border-white/20 disabled:opacity-60"
              >
                {isWithdrawBusy ? '解押中...' : '解押'}
              </button>
              <button
                disabled={isClaimBusy}
                onClick={handleClaim}
                className="flex-1 min-w-[140px] bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
              >
                {isClaimBusy ? '领取中...' : '领取奖励'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ title, value, accent }) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? 'border-emerald-400/50' : 'border-white/20'} bg-white/5`}>
      <div className="text-white/70 text-sm mb-1">{title}</div>
      <div className="text-white font-semibold text-lg break-words">{value}</div>
    </div>
  )
}
