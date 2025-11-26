import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import SwapRouterABI from '@/lib/abis/SwapRouterABI.json'
import { CONTRACTS } from '@/lib/constants/contracts'

export function useSwap() {
  const { address } = useAccount()


  const { data: hash, writeContractAsync, isPending, error } = useWriteContract()

 
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const swap = async (fromToken, amountIn) => {
    if (!amountIn) throw new Error('amountIn is required')
    if (!address) throw new Error('Wallet not connected')

    try {
      
      const amountInWei = parseUnits(String(amountIn), 18)
      if (amountInWei <= 0n) throw new Error('amountIn must be > 0')

      const tokenInAddress = CONTRACTS[fromToken]
      if (!tokenInAddress) {
        throw new Error(`Unknown fromToken key: ${fromToken}`)
      }

      await writeContractAsync({
        address: CONTRACTS.SWAP_ROUTER,
        abi: SwapRouterABI,
        functionName: 'swap',
        args: [tokenInAddress, amountInWei],
      })
    } catch (e) {
      console.error('swap failed', e)
      throw e
    }
  }

  return {
    swap,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
