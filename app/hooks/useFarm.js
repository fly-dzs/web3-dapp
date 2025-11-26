'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import FarmABI from '@/lib/abis/FarmABI.json'
import { CONTRACTS } from '@/lib/constants/contracts'

export function useFarm(tokenDecimals = 18) {
  // --- stake ---
  const {
    data: stakeHash,
    writeContractAsync: writeStakeAsync,
    isPending: isStakePending,
    error: stakeError,
  } = useWriteContract()

  const {
    isLoading: isStakeConfirming,
    isSuccess: isStakeSuccess,
  } = useWaitForTransactionReceipt({ hash: stakeHash })

  const stake = async (poolId, amount) => {
    try {
      const amountWei = parseUnits(String(amount), tokenDecimals)
      if (amountWei <= 0n) throw new Error('Stake amount must be > 0')

      const txHash = await writeStakeAsync({
        address: CONTRACTS.FARM,
        abi: FarmABI,
        functionName: 'stake',
        args: [poolId, amountWei],
      })

      return txHash
    } catch (err) {
      console.error('Stake failed:', err)
      throw err
    }
  }

  // --- unstake ---
  const {
    data: unstakeHash,
    writeContractAsync: writeUnstakeAsync,
    isPending: isUnstakePending,
    error: unstakeError,
  } = useWriteContract()

  const {
    isLoading: isUnstakeConfirming,
    isSuccess: isUnstakeSuccess,
  } = useWaitForTransactionReceipt({ hash: unstakeHash })

  const unstake = async (poolId, amount) => {
    try {
      const amountWei = parseUnits(String(amount), tokenDecimals)
      if (amountWei <= 0n) throw new Error('Unstake amount must be > 0')

      const txHash = await writeUnstakeAsync({
        address: CONTRACTS.FARM,
        abi: FarmABI,
        functionName: 'unstake',
        args: [poolId, amountWei],
      })

      return txHash
    } catch (err) {
      console.error('Unstake failed:', err)
      throw err
    }
  }

  // --- harvest ---
  const {
    data: harvestHash,
    writeContractAsync: writeHarvestAsync,
    isPending: isHarvestPending,
    error: harvestError,
  } = useWriteContract()

  const {
    isLoading: isHarvestConfirming,
    isSuccess: isHarvestSuccess,
  } = useWaitForTransactionReceipt({ hash: harvestHash })

  const harvest = async (poolId) => {
    try {
      const txHash = await writeHarvestAsync({
        address: CONTRACTS.FARM,
        abi: FarmABI,
        functionName: 'harvest',
        args: [poolId],
      })

      return txHash
    } catch (err) {
      console.error('Harvest failed:', err)
      throw err
    }
  }

  return {
    // actions
    stake,
    unstake,
    harvest,

    // stake 状态
    stakeHash,
    isStakePending,
    isStakeConfirming,
    isStakeSuccess,
    stakeError,

    // unstake 状态
    unstakeHash,
    isUnstakePending,
    isUnstakeConfirming,
    isUnstakeSuccess,
    unstakeError,

    // harvest 状态
    harvestHash,
    isHarvestPending,
    isHarvestConfirming,
    isHarvestSuccess,
    harvestError,
  }
}
