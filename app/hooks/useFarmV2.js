'use client'

import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import FarmABI from '@/lib/abis/FarmABI.json'
import { CONTRACTS } from '@/lib/constants/contracts'

export function useFarmV2(defaultDecimals = 18) {
  // deposit
  const {
    data: depositHash,
    writeContractAsync: writeDepositAsync,
    isPending: isDepositPending,
    error: depositError,
  } = useWriteContract()
  const {
    isLoading: isDepositConfirming,
    isSuccess: isDepositSuccess,
  } = useWaitForTransactionReceipt({ hash: depositHash })

  const deposit = async (pid, amount, decimals = defaultDecimals) => {
    const amountWei = parseUnits(String(amount || 0), decimals)
    if (amountWei <= 0n) throw new Error('Amount must be > 0')
    return writeDepositAsync({
      address: CONTRACTS.FARM,
      abi: FarmABI,
      functionName: 'deposit',
      args: [BigInt(pid), amountWei],
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

  const withdraw = async (pid, amount, decimals = defaultDecimals) => {
    const amountWei = parseUnits(String(amount || 0), decimals)
    if (amountWei <= 0n) throw new Error('Amount must be > 0')
    return writeWithdrawAsync({
      address: CONTRACTS.FARM,
      abi: FarmABI,
      functionName: 'withdraw',
      args: [BigInt(pid), amountWei],
    })
  }

  // harvest
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

  const harvest = async (pid) =>
    writeHarvestAsync({
      address: CONTRACTS.FARM,
      abi: FarmABI,
      functionName: 'harvest',
      args: [BigInt(pid)],
    })

  return {
    deposit,
    withdraw,
    harvest,
    isDepositPending,
    isDepositConfirming,
    isDepositSuccess,
    depositError,
    depositHash,
    isWithdrawPending,
    isWithdrawConfirming,
    isWithdrawSuccess,
    withdrawError,
    withdrawHash,
    isHarvestPending,
    isHarvestConfirming,
    isHarvestSuccess,
    harvestError,
    harvestHash,
  }
}
