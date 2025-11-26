// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import toast from 'react-hot-toast'

import { CONTRACTS } from '@/lib/constants/contracts'
import FarmABI from '@/lib/abis/FarmABI.json'
import StakePoolABI from '@/lib/abis/StakePoolABI.json'
import ERC20ABI from '@/lib/abis/ERC20ABI.json'
import { useTokenApprove } from '@/hooks/useTokenApprove'
import { useFarmV2 } from '@/hooks/useFarmV2'
import { useStakePool } from '@/hooks/useStakePool'

const fallbackDecimals = 18

export default function FarmPage() {
  const { address, isConnected } = useAccount()
  const [amountFarm, setAmountFarm] = useState('')
  const [amountStake, setAmountStake] = useState('')
  const [refreshFarm, setRefreshFarm] = useState(0)
  const [refreshStake, setRefreshStake] = useState(0)
  const [selectedPool, setSelectedPool] = useState(0)
  const [view, setView] = useState<'farm' | 'stake'>('farm')

  // Farm multi-pool hooks
  const {
    deposit,
    withdraw,
    harvest,
    isDepositPending,
    isDepositConfirming,
    isWithdrawPending,
    isWithdrawConfirming,
    isHarvestPending,
    isHarvestConfirming,
  } = useFarmV2(fallbackDecimals)
  const {
    approve: approveFarm,
    isPending: isApproveFarmPending,
    isConfirming: isApproveFarmConfirming,
  } = useTokenApprove()

  // StakePool hooks
  const {
    stake,
    withdraw: spWithdraw,
    claim,
    isStakePending,
    isStakeConfirming,
    isWithdrawPending: isSpWithdrawPending,
    isWithdrawConfirming: isSpWithdrawConfirming,
    isClaimPending,
    isClaimConfirming,
  } = useStakePool(fallbackDecimals)
  const {
    approve: approveStake,
    isPending: isApproveStakePending,
    isConfirming: isApproveStakeConfirming,
  } = useTokenApprove()

  // Farm states
  const isApproveFarmBusy = isApproveFarmPending || isApproveFarmConfirming
  const isDepositBusy = isDepositPending || isDepositConfirming
  const isWithdrawBusy = isWithdrawPending || isWithdrawConfirming
  const isHarvestBusy = isHarvestPending || isHarvestConfirming

  // Stake states
  const isApproveStakeBusy = isApproveStakePending || isApproveStakeConfirming
  const isStakeBusy = isStakePending || isStakeConfirming
  const isSpWithdrawBusy = isSpWithdrawPending || isSpWithdrawConfirming
  const isClaimBusy = isClaimPending || isClaimConfirming

  // ---------- Farm (multi pool) data ----------
  const { data: poolLen } = useReadContract({
    address: CONTRACTS.FARM,
    abi: FarmABI,
    functionName: 'poolLength',
    scopeKey: `pool-length-${refreshFarm}`,
  })
  const poolLength = Number(poolLen ?? 0n)

  const { data: rewardTokenFarm } = useReadContract({
    address: CONTRACTS.FARM,
    abi: FarmABI,
    functionName: 'rewardToken',
  })

  const { data: poolInfo } = useReadContract({
    address: CONTRACTS.FARM,
    abi: FarmABI,
    functionName: 'poolInfo',
    args: [BigInt(selectedPool)],
    query: { enabled: poolLength > 0 },
    scopeKey: `pool-${selectedPool}-${refreshFarm}`,
  })
  const lpToken = poolInfo?.lpToken ?? poolInfo?.[0]

  const { data: userInfo } = useReadContract({
    address: CONTRACTS.FARM,
    abi: FarmABI,
    functionName: 'getUserInfo',
    args: poolLength > 0 && address ? [BigInt(selectedPool), address] : undefined,
    query: { enabled: poolLength > 0 && !!address },
    scopeKey: `user-${selectedPool}-${address}-${refreshFarm}`,
  })

  const { data: pendingRewardFarm } = useReadContract({
    address: CONTRACTS.FARM,
    abi: FarmABI,
    functionName: 'pendingReward',
    args: poolLength > 0 && address ? [BigInt(selectedPool), address] : undefined,
    query: { enabled: poolLength > 0 && !!address },
    scopeKey: `pending-${selectedPool}-${address}-${refreshFarm}`,
  })

  const metaFarmQuery = useReadContracts({
    contracts: [
      lpToken ? { address: lpToken, abi: ERC20ABI, functionName: 'symbol' } : null,
      lpToken ? { address: lpToken, abi: ERC20ABI, functionName: 'decimals' } : null,
      rewardTokenFarm ? { address: rewardTokenFarm, abi: ERC20ABI, functionName: 'symbol' } : null,
      rewardTokenFarm ? { address: rewardTokenFarm, abi: ERC20ABI, functionName: 'decimals' } : null,
      lpToken && address
        ? { address: lpToken, abi: ERC20ABI, functionName: 'balanceOf', args: [address] }
        : null,
      rewardTokenFarm && address
        ? { address: rewardTokenFarm, abi: ERC20ABI, functionName: 'balanceOf', args: [address] }
        : null,
      lpToken && address
        ? { address: lpToken, abi: ERC20ABI, functionName: 'allowance', args: [address, CONTRACTS.FARM] }
        : null,
    ].filter(Boolean),
    query: { enabled: !!lpToken },
  })

  const lpSymbol = metaFarmQuery.data?.[0]?.result || 'LP'
  const lpDecimals = metaFarmQuery.data?.[1]?.result ?? fallbackDecimals
  const rewardSymbolFarm = metaFarmQuery.data?.[2]?.result || 'REWARD'
  const rewardDecimalsFarm = metaFarmQuery.data?.[3]?.result ?? fallbackDecimals
  const lpBalance = metaFarmQuery.data?.[4]?.result ?? 0n
  const rewardBalanceFarm = metaFarmQuery.data?.[5]?.result ?? 0n
  const allowanceFarm = metaFarmQuery.data?.[6]?.result ?? 0n

  const stakedRaw = userInfo?.amount ?? userInfo?.[0] ?? 0n
  const pendingRawFarm = pendingRewardFarm ?? 0n

  const formattedLpBalance = formatUnits(lpBalance, lpDecimals)
  const formattedStaked = formatUnits(stakedRaw, lpDecimals)
  const formattedPendingFarm = formatUnits(pendingRawFarm, rewardDecimalsFarm)
  const formattedRewardBalanceFarm = formatUnits(rewardBalanceFarm, rewardDecimalsFarm)

  const parsedAmountFarm = useMemo(() => {
    try {
      return parseUnits(String(amountFarm || 0), lpDecimals)
    } catch {
      return 0n
    }
  }, [amountFarm, lpDecimals])
  const needsApprovalFarm = parsedAmountFarm > 0n && allowanceFarm < parsedAmountFarm

  // ---------- StakePool (single pool) data ----------
  const { data: stakingToken } = useReadContract({
    address: CONTRACTS.STAKE_POOL,
    abi: StakePoolABI,
    functionName: 'stakingToken',
    scopeKey: `sp-staking-${refreshStake}`,
  })
  const { data: rewardToken } = useReadContract({
    address: CONTRACTS.STAKE_POOL,
    abi: StakePoolABI,
    functionName: 'rewardToken',
    scopeKey: `sp-reward-${refreshStake}`,
  })
  const { data: userInfoSp } = useReadContract({
    address: CONTRACTS.STAKE_POOL,
    abi: StakePoolABI,
    functionName: 'getUserInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    scopeKey: `sp-user-${address}-${refreshStake}`,
  })

  const metaStakeQuery = useReadContracts({
    contracts: [
      stakingToken ? { address: stakingToken, abi: ERC20ABI, functionName: 'symbol' } : null,
      stakingToken ? { address: stakingToken, abi: ERC20ABI, functionName: 'decimals' } : null,
      rewardToken ? { address: rewardToken, abi: ERC20ABI, functionName: 'symbol' } : null,
      rewardToken ? { address: rewardToken, abi: ERC20ABI, functionName: 'decimals' } : null,
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

  const stakingSymbol = 'TOKEN_A'
  const stakingDecimals = metaStakeQuery.data?.[1]?.result ?? fallbackDecimals
  const rewardSymbol = metaStakeQuery.data?.[2]?.result || 'REWARD'
  const rewardDecimals = metaStakeQuery.data?.[3]?.result ?? fallbackDecimals
  const stakingBalance = metaStakeQuery.data?.[4]?.result ?? 0n
  const rewardBalance = metaStakeQuery.data?.[5]?.result ?? 0n
  const allowanceStake = metaStakeQuery.data?.[6]?.result ?? 0n

  const stakedSpRaw = userInfoSp?.[0] ?? 0n
  const pendingSpRaw = userInfoSp?.[1] ?? 0n

  const formattedStakingBalance = formatUnits(stakingBalance, stakingDecimals)
  const formattedStakedSp = formatUnits(stakedSpRaw, stakingDecimals)
  const formattedPendingSp = formatUnits(pendingSpRaw, rewardDecimals)
  const formattedRewardBalanceSp = formatUnits(rewardBalance, rewardDecimals)

  const parsedAmountStake = useMemo(() => {
    try {
      return parseUnits(String(amountStake || 0), stakingDecimals)
    } catch {
      return 0n
    }
  }, [amountStake, stakingDecimals])
  const needsApprovalStake = parsedAmountStake > 0n && allowanceStake < parsedAmountStake

  // ---------- handlers ----------
  const handleApproveFarm = async () => {
    if (!lpToken) return toast.error('未获取到 LP 地址')
    if (!amountFarm || Number(amountFarm) <= 0) return toast.error('请输入数量')
    try {
      await approveFarm(lpToken, CONTRACTS.FARM, amountFarm, lpDecimals)
      toast.success('授权已发送')
      setRefreshFarm((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '授权失败')
    }
  }

  const handleDeposit = async () => {
    if (!amountFarm || Number(amountFarm) <= 0) return toast.error('请输入数量')
    try {
      await deposit(selectedPool, amountFarm, lpDecimals)
      toast.success('质押已提交')
      setAmountFarm('')
      setRefreshFarm((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '质押失败')
    }
  }

  const handleWithdraw = async () => {
    if (!amountFarm || Number(amountFarm) <= 0) return toast.error('请输入数量')
    try {
      await withdraw(selectedPool, amountFarm, lpDecimals)
      toast.success('解押已提交')
      setAmountFarm('')
      setRefreshFarm((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '解押失败')
    }
  }

  const handleHarvest = async () => {
    try {
      await harvest(selectedPool)
      toast.success('领取已提交')
      setRefreshFarm((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '领取失败')
    }
  }

  const handleApproveStake = async () => {
    if (!stakingToken) return toast.error('未获取到质押代币地址')
    if (!amountStake || Number(amountStake) <= 0) return toast.error('请输入数量')
    try {
      await approveStake(stakingToken, CONTRACTS.STAKE_POOL, amountStake, stakingDecimals)
      toast.success('授权已发送')
      setRefreshStake((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '授权失败')
    }
  }

  const handleStake = async () => {
    if (!amountStake || Number(amountStake) <= 0) return toast.error('请输入数量')
    try {
      await stake(amountStake, stakingDecimals)
      toast.success('质押已提交')
      setAmountStake('')
      setRefreshStake((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '质押失败')
    }
  }

  const handleSpWithdraw = async () => {
    if (!amountStake || Number(amountStake) <= 0) return toast.error('请输入数量')
    try {
      await spWithdraw(amountStake, stakingDecimals)
      toast.success('解押已提交')
      setAmountStake('')
      setRefreshStake((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '解押失败')
    }
  }

  const handleClaim = async () => {
    try {
      await claim()
      toast.success('领取已提交')
      setRefreshStake((k) => k + 1)
    } catch (err: any) {
      toast.error(err?.message || '领取失败')
    }
  }

  useEffect(() => {
    if (selectedPool >= poolLength) setSelectedPool(0)
  }, [poolLength])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 py-12 px-4 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Farm / Stake</h1>
          <p className="text-white/70">请先连接钱包</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center gap-3 text-white">
          <button
            className={`px-4 py-2 rounded-lg border ${view === 'farm' ? 'bg-white/20 border-white/40' : 'border-white/20'}`}
            onClick={() => setView('farm')}
          >
            Farm (多池)
          </button>
          <button
            className={`px-4 py-2 rounded-lg border ${view === 'stake' ? 'bg-white/20 border-white/40' : 'border-white/20'}`}
            onClick={() => setView('stake')}
          >
            StakePool (单池)
          </button>
        </div>

        {view === 'farm' ? (
          <FarmSection
            poolLength={poolLength}
            selectedPool={selectedPool}
            setSelectedPool={setSelectedPool}
            lpSymbol={lpSymbol}
            formattedLpBalance={formattedLpBalance}
            formattedStaked={formattedStaked}
            formattedPending={formattedPendingFarm}
            formattedRewardBalance={formattedRewardBalanceFarm}
            poolInfo={poolInfo}
            lpDecimals={lpDecimals}
            amount={amountFarm}
            setAmount={setAmountFarm}
            needsApproval={needsApprovalFarm}
            isApproveBusy={isApproveFarmBusy}
            isDepositBusy={isDepositBusy}
            isWithdrawBusy={isWithdrawBusy}
            isHarvestBusy={isHarvestBusy}
            onApprove={handleApproveFarm}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
          onHarvest={handleHarvest}
          rewardSymbol={rewardSymbolFarm}
          farmAddress={CONTRACTS.FARM}
          lpToken={lpToken}
        />
      ) : (
        <StakeSection
            stakingSymbol={stakingSymbol}
            rewardSymbol={rewardSymbol}
            formattedStakingBalance={formattedStakingBalance}
            formattedStaked={formattedStakedSp}
            formattedPending={formattedPendingSp}
            formattedRewardBalance={formattedRewardBalanceSp}
            amount={amountStake}
            setAmount={setAmountStake}
            needsApproval={needsApprovalStake}
            isApproveBusy={isApproveStakeBusy}
            isStakeBusy={isStakeBusy}
            isWithdrawBusy={isSpWithdrawBusy}
            isClaimBusy={isClaimBusy}
            onApprove={handleApproveStake}
            onStake={handleStake}
            onWithdraw={handleSpWithdraw}
            onClaim={handleClaim}
            stakeAddress={CONTRACTS.STAKE_POOL}
          />
        )}
      </div>
    </div>
  )
}

function FarmSection({
  poolLength,
  selectedPool,
  setSelectedPool,
  lpSymbol,
  lpToken,
  formattedLpBalance,
  formattedStaked,
  formattedPending,
  formattedRewardBalance,
  poolInfo,
  lpDecimals,
  amount,
  setAmount,
  needsApproval,
  isApproveBusy,
  isDepositBusy,
  isWithdrawBusy,
  isHarvestBusy,
  onApprove,
  onDeposit,
  onWithdraw,
  onHarvest,
  rewardSymbol,
  farmAddress,
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 space-y-4 text-white">
      <div className="text-center space-y-1">
        <h1 className="text-4xl font-bold">Farm</h1>
        <p className="text-white/70">质押 LP 领取 {rewardSymbol || 'REWARD'} 奖励</p>
        <div className="text-xs text-white/50">Farm 合约: {farmAddress}</div>
        <div className="text-xs text-white/50">LP 合约: {lpToken}</div>
      </div>

      <div className="flex items-center gap-3 text-white/80">
        <span>选择池子:</span>
        <select
          value={selectedPool}
          onChange={(e) => setSelectedPool(Number(e.target.value))}
          className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white outline-none"
        >
          {Array.from({ length: poolLength || 1 }).map((_, idx) => (
            <option key={idx} value={idx} className="bg-gray-900">
              Pool #{idx}
            </option>
          ))}
        </select>
        <span className="text-white/60 text-sm">LP: {lpSymbol}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat title="LP 余额" value={`${formattedLpBalance} ${lpSymbol}`} />
        <Stat title="已质押" value={`${formattedStaked} ${lpSymbol}`} />
        <Stat title="待领取奖励" value={`${formattedPending} ${rewardSymbol || 'REWARD'}`} accent />
        <Stat title="奖励代币余额" value={`${formattedRewardBalance} ${rewardSymbol || 'REWARD'}`} />
        <Stat
          title="池子总质押"
          value={poolInfo?.totalStaked ? formatUnits(poolInfo.totalStaked, lpDecimals) : '0'}
        />
      </div>

      <div className="bg-white/5 rounded-xl p-4 space-y-3">
        <label className="text-white/70 text-sm">数量 ({lpSymbol})</label>
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
              onClick={onApprove}
              className="flex-1 min-w-[140px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
            >
              {isApproveBusy ? '授权中...' : `授权 ${lpSymbol}`}
            </button>
          ) : (
            <button
              disabled={isDepositBusy}
              onClick={onDeposit}
              className="flex-1 min-w-[140px] bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
            >
              {isDepositBusy ? '质押中...' : '质押'}
            </button>
          )}
          <button
            disabled={isWithdrawBusy}
            onClick={onWithdraw}
            className="flex-1 min-w-[140px] bg-white/10 text-white font-semibold py-3 rounded-lg border border-white/20 disabled:opacity-60"
          >
            {isWithdrawBusy ? '解押中...' : '解押'}
          </button>
          <button
            disabled={isHarvestBusy}
            onClick={onHarvest}
            className="flex-1 min-w-[140px] bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
          >
            {isHarvestBusy ? '领取中...' : '领取奖励'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StakeSection({
  stakingSymbol,
  rewardSymbol,
  formattedStakingBalance,
  formattedStaked,
  formattedPending,
  formattedRewardBalance,
  amount,
  setAmount,
  needsApproval,
  isApproveBusy,
  isStakeBusy,
  isWithdrawBusy,
  isClaimBusy,
  onApprove,
  onStake,
  onWithdraw,
  onClaim,
  stakeAddress,
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 space-y-4 text-white">
      <div className="text-center space-y-1">
        <h1 className="text-4xl font-bold">Stake Pool</h1>
        <p className="text-white/70">
          质押 {stakingSymbol} 领取 {rewardSymbol}
        </p>
        <div className="text-xs text-white/50">StakePool: {stakeAddress}</div>
      </div>

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
              onClick={onApprove}
              className="flex-1 min-w-[140px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
            >
              {isApproveBusy ? '授权中...' : `授权 ${stakingSymbol}`}
            </button>
          ) : (
            <button
              disabled={isStakeBusy}
              onClick={onStake}
              className="flex-1 min-w-[140px] bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
            >
              {isStakeBusy ? '质押中...' : '质押'}
            </button>
          )}
          <button
            disabled={isWithdrawBusy}
            onClick={onWithdraw}
            className="flex-1 min-w-[140px] bg-white/10 text-white font-semibold py-3 rounded-lg border border-white/20 disabled:opacity-60"
          >
            {isWithdrawBusy ? '解押中...' : '解押'}
          </button>
          <button
            disabled={isClaimBusy}
            onClick={onClaim}
            className="flex-1 min-w-[140px] bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
          >
            {isClaimBusy ? '领取中...' : '领取奖励'}
          </button>
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
