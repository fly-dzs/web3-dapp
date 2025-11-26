'use client'
import {useReadContract}from 'wagmi'
import{formatUnits}from 'viem'
import ERC20ABI from'@/lib/abis/ERC20ABI.json'

export function useTokenBalance(tokenAddress,userAddress){
    const {data :balance,isLoading:isBalanceLoading,refetch}=useReadContract({
       address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query:{
    enabled: !!userAddress && !!tokenAddress,
    }
    
    })
      const { data: decimals ,isLoading:isDecimalsLoading} = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'decimals',
    query:{
    enabled: !!tokenAddress,
    }
  })
const isLoading = isBalanceLoading || isDecimalsLoading

   const hasBalance = balance != null && decimals != null
      const formattedBalance= hasBalance
      
      ?parseFloat(formatUnits(balance,decimals)).toFixed(4)
      :'0.00'
      return {
        balance:formattedBalance,
        rawBalance:balance,
        decimals,
        isLoading,
        refetch,
      }
}