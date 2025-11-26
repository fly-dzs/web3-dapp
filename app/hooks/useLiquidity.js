'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import SwapABI from '@/lib/abis/SwapRouterABI.json'
import { CONTRACTS } from '@/lib/constants/contracts'

// 默认两边 token 都是 18 位小数；如果代币 decimals 不同，可传入自定义
export function useLiquidity(tokenADecimals = 18, tokenBDecimals = 18) {
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Router ABI：addLiquidity(amountA, amountB)
  const addLiquidity = async ({ amountA, amountB }) => {
    try {
      if (!amountA || Number(amountA) <= 0) throw new Error('amountA must be > 0')
      if (!amountB || Number(amountB) <= 0) throw new Error('amountB must be > 0')

      const amountAWei = parseUnits(String(amountA), tokenADecimals)
      const amountBWei = parseUnits(String(amountB), tokenBDecimals)

      const txHash = await writeContractAsync({
        address: CONTRACTS.SWAP_ROUTER,
        abi: SwapABI,
        functionName: 'addLiquidity',
        args: [amountAWei, amountBWei],
      })

      return txHash
    } catch (err) {
      console.error('Add liquidity failed:', err)
      throw err
    }
  }

  // Router ABI：removeLiquidity(liquidity)
  const removeLiquidity = async ({ liquidityAmount }) => {
    try {
      if (!liquidityAmount || Number(liquidityAmount) <= 0) {
        throw new Error('liquidityAmount must be > 0')
      }

      const liquidityWei = parseUnits(String(liquidityAmount), 18) // 假设 LP token 18 位

      const txHash = await writeContractAsync({
        address: CONTRACTS.SWAP_ROUTER,
        abi: SwapABI,
        functionName: 'removeLiquidity',
        args: [liquidityWei],
      })

      return txHash
    } catch (err) {
      console.error('Remove liquidity failed:', err)
      throw err
    }
  }

  return {
    addLiquidity,
    removeLiquidity,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
