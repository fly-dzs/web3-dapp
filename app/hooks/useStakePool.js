'use client'

import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import StakePoolABI from '@/lib/abis/StakePoolABI.json'
import { CONTRACTS } from '@/lib/constants/contracts'

export function useStakePool(defaultDecimals = 18) {
  // stake
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

  const stake = async (amount, decimals = defaultDecimals) => {
    const amountWei = parseUnits(String(amount || 0), decimals)
    if (amountWei <= 0n) throw new Error('Stake amount must be > 0')
    return writeStakeAsync({
      address: CONTRACTS.STAKE_POOL,
      abi: StakePoolABI,
      functionName: 'stake',
      args: [amountWei],
    })
  }

  // withdraw
  const {
    data: withdrawHash,
    writeContractAsync: writeWithdrawAsync,
    isPending: isWithdrawPending,
    error: withdrawError,
  } = useWriteContract()
  const {
    isLoading: isWithdrawConfirming,
    isSuccess: isWithdrawSuccess,
  } = useWaitForTransactionReceipt({ hash: withdrawHash })

  const withdraw = async (amount, decimals = defaultDecimals) => {
    const amountWei = parseUnits(String(amount || 0), decimals)
    if (amountWei <= 0n) throw new Error('Withdraw amount must be > 0')
    return writeWithdrawAsync({
      address: CONTRACTS.STAKE_POOL,
      abi: StakePoolABI,
      functionName: 'withdraw',
      args: [amountWei],
    })
  }

  // claim
  const {
    data: claimHash,
    writeContractAsync: writeClaimAsync,
    isPending: isClaimPending,
    error: claimError,
  } = useWriteContract()
  const {
    isLoading: isClaimConfirming,
    isSuccess: isClaimSuccess,
  } = useWaitForTransactionReceipt({ hash: claimHash })

  const claim = async () => {
    return writeClaimAsync({
      address: CONTRACTS.STAKE_POOL,
      abi: StakePoolABI,
      functionName: 'claimReward',
      args: [],
    })
  }

  return {
    stake,
    withdraw,
    claim,
    stakeHash,
    isStakePending,
    isStakeConfirming,
    isStakeSuccess,
    stakeError,
    withdrawHash,
    isWithdrawPending,
    isWithdrawConfirming,
    isWithdrawSuccess,
    withdrawError,
    claimHash,
    isClaimPending,
    isClaimConfirming,
    isClaimSuccess,
    claimError,
  }
}
