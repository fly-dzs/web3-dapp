'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import LaunchPadABI from '@/lib/abis/LaunchPadV2.json'
import { CONTRACTS } from '@/lib/constants/contracts'

/**
 * Actions for LaunchPadV2: buy/claim and create token + sale.
 */
export function useLaunchpad(defaultSaleTokenDecimals = 18) {
  // create token and sale
  const {
    data: createHash,
    writeContractAsync: writeCreateAsync,
    isPending: isCreatePending,
    error: createError,
  } = useWriteContract()

  const {
    isLoading: isCreateConfirming,
    isSuccess: isCreateSuccess,
  } = useWaitForTransactionReceipt({ hash: createHash })

  const createTokenAndSale = async ({
    name,
    symbol,
    decimals = defaultSaleTokenDecimals,
    initialSupply,
    saleAmount,
    paymentToken,
    price, // human readable (e.g. 0.5 USDC)
    startTime,
    endTime,
    minPurchase,
    maxPurchase,
  }) => {
    try {
      if (!name || !symbol) throw new Error('Name/symbol required')
      if (!paymentToken) throw new Error('Payment token required')
      if (!startTime || !endTime) throw new Error('Invalid time')
      if (!initialSupply || Number(initialSupply) <= 0) {
        throw new Error('Initial supply must be > 0')
      }
      if (!saleAmount || Number(saleAmount) <= 0) {
        throw new Error('Sale amount must be > 0')
      }
      if (!price || Number(price) <= 0) {
        throw new Error('Price must be > 0')
      }
      if (startTime >= endTime) {
        throw new Error('Start time must be earlier than end time')
      }

      const initialSupplyWei = parseUnits(String(initialSupply || 0), decimals)
      const saleAmountWei = parseUnits(String(saleAmount || 0), decimals)
      if (saleAmountWei > initialSupplyWei) {
        throw new Error('Sale amount exceeds initial supply')
      }
      const minPurchaseWei = parseUnits(String(minPurchase || 0), decimals)
      const maxPurchaseWei = parseUnits(String(maxPurchase || 0), decimals)
      if (minPurchaseWei > maxPurchaseWei && maxPurchaseWei > 0n) {
        throw new Error('minPurchase > maxPurchase')
      }
      const priceScaled = parseUnits(String(price || 0), 18) // LaunchPadV2 expects 1e18 scaled price

      await writeCreateAsync({
        address: CONTRACTS.LAUNCHPAD,
        abi: LaunchPadABI,
        functionName: 'createTokenAndSale',
        args: [
          name,
          symbol,
          BigInt(decimals),
          initialSupplyWei,
          paymentToken,
          priceScaled,
          saleAmountWei,
          BigInt(startTime),
          BigInt(endTime),
          minPurchaseWei,
          maxPurchaseWei,
        ],
      })
    } catch (err) {
      console.error('createTokenAndSale failed:', err)
      throw err
    }
  }

  // buy
  const {
    data: buyHash,
    writeContractAsync: writeBuyAsync,
    isPending: isBuyPending,
    error: buyError,
  } = useWriteContract()

  const {
    isLoading: isBuyConfirming,
    isSuccess: isBuySuccess,
  } = useWaitForTransactionReceipt({ hash: buyHash })

  const buy = async (saleId, amount, saleTokenDecimals = defaultSaleTokenDecimals) => {
    try {
      const amountWei = parseUnits(String(amount), saleTokenDecimals)
      if (amountWei <= 0n) throw new Error('Purchase amount must be > 0')

      await writeBuyAsync({
        address: CONTRACTS.LAUNCHPAD,
        abi: LaunchPadABI,
        functionName: 'buy',
        args: [saleId, amountWei],
      })
    } catch (err) {
      console.error('buy failed:', err)
      throw err
    }
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

  const claim = async (saleId) => {
    try {
      await writeClaimAsync({
        address: CONTRACTS.LAUNCHPAD,
        abi: LaunchPadABI,
        functionName: 'claim',
        args: [saleId],
      })
    } catch (err) {
      console.error('claim failed:', err)
      throw err
    }
  }

  return {
    buy,
    claim,
    // buy state
    buyHash,
    isBuyPending,
    isBuyConfirming,
    isBuySuccess,
    buyError,
    // create state
    createTokenAndSale,
    createHash,
    isCreatePending,
    isCreateConfirming,
    isCreateSuccess,
    createError,
    // claim state
    claimHash,
    isClaimPending,
    isClaimConfirming,
    isClaimSuccess,
    claimError,
  }
}
