'use client'
import {useState,useEffect}from 'react'
import{useMemo}from'react'
import {usePoolData}from './usePoolData'
import{useEthPrice}from './useEthPrice'

export function useTokenPrice(token0,token1,poolAddress){
 
    const {reserve0,reserve1}=usePoolData(poolAddress)
    const { data: ethPrice, isLoading: isEthLoading } = useEthPrice() 
    const token0Price =useMemo(()=>{
        if(!reserve0 ||!reserve1 ||Number(reserve0)===0)return '0'
      if(!ethPrice)return '0'
      const priceInToken1=Number(reserve1)/Number(reserve0)
        return (priceInToken1*Number(ethPrice)).toFixed(4)
    },[reserve0,reserve1,ethPrice])
    return token0Price
}
