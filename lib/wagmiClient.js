import{getDefaultConfig}from '@rainbow-me/rainbowkit'
import{sepolia}from'wagmi/chains'
import{http}from 'wagmi'
export const config=getDefaultConfig({
    appName:'Web3-dapp',
    projectId:process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    chains:[sepolia],
    ssr:true,
    transports:{
        [sepolia.id]:http(process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA)
    },
})


