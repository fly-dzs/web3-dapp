'use server'

import { NextResponse } from 'next/server'

// 简单的本地 mock 数据，用于 Dashboard 展示
const mockDashboard = {
  stats: {
    walletBalance: '12,345.67',
    stakedValue: '6,789.00',
    pendingRewards: '123.45',
    portfolioValue: '19,134.67',
    pnlPercent: '+42.3%',
    pnlValue: '+$5,678.90',
  },
  assets: [
    { symbol: 'ETH', name: 'Ethereum', balance: '5.2345', value: '$10,469.00', change: '+3.2%', changePositive: true },
    { symbol: 'USDT', name: 'Tether', balance: '8,500', value: '$8,500.00', change: '0.0%', changePositive: true },
    { symbol: 'USDC', name: 'USD Coin', balance: '3,200', value: '$3,200.00', change: '0.0%', changePositive: true },
    { symbol: 'DPX', name: 'DeFi Protocol X', balance: '1,250', value: '$2,500.00', change: '+12.5%', changePositive: true },
  ],
  liquidity: [
    { pair: 'ETH/USDT', value: '$1,234.56', share: '0.05%', earned: '$45.67' },
    { pair: 'ETH/USDC', value: '$987.65', share: '0.03%', earned: '$23.45' },
  ],
  staking: [
    { pool: 'ETH/USDT LP', staked: '1.23 LP', value: '$1,234.56', apr: '45.6%', earned: '12.5 REWARD' },
    { pool: 'ETH/USDC LP', staked: '0.98 LP', value: '$987.65', apr: '32.1%', earned: '8.3 REWARD' },
  ],
  transactions: [
    { type: 'Swap', description: 'Swapped 1.5 ETH for 3000 USDT', time: '2 hours ago', status: 'success' },
    { type: 'Add Liquidity', description: 'Added ETH/USDT liquidity', time: '5 hours ago', status: 'success' },
    { type: 'Stake', description: 'Staked 1.23 ETH/USDT LP', time: '1 day ago', status: 'success' },
    { type: 'Harvest', description: 'Harvested 12.5 REWARD tokens', time: '2 days ago', status: 'success' },
  ],
}

export async function GET() {
  return NextResponse.json(mockDashboard)
}
