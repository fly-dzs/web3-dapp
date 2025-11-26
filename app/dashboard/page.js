'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { useTokenBalance } from '@/hooks/useTokenBalance'
import { useFarmData } from '@/hooks/useFarmData'
import { CONTRACTS } from '@/lib/constants/contracts'

const fetchDashboard = async () => {
  const res = await fetch('/api/dashboard')
  if (!res.ok) throw new Error('获取 dashboard 数据失败')
  return res.json()
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { address, isConnected } = useAccount()

  // 实时链上数据（连接钱包才显示）
  const { balance: tokenABalance } = useTokenBalance(CONTRACTS.TOKEN_A, address)
  const { balance: tokenBBalance } = useTokenBalance(CONTRACTS.TOKEN_B, address)
  const { balance: payBalance } = useTokenBalance(CONTRACTS.PAYMENT_TOKEN, address)
  const farm0 = useFarmData(0, address)

  useEffect(() => {
    let cancelled = false
    fetchDashboard()
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || '加载失败')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center text-white/70">
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center text-red-300">
        {error}
      </div>
    )
  }

  if (!data) return null

  const { stats, assets, staking, liquidity, transactions } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>

        {/* 总览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard title="Wallet Balance" value={`$${stats.walletBalance}`} sub="Total Assets" />
          <SummaryCard title="Staked Value" value={`$${stats.stakedValue}`} sub="In Farms" accent />
          <SummaryCard title="Pending Rewards" value={stats.pendingRewards} sub="REWARD tokens" accentPurple />
          <SummaryCard title="Portfolio Value" value={`$${stats.portfolioValue}`} sub={`${stats.pnlValue} (${stats.pnlPercent})`} />
          {isConnected && (
            <>
              <SummaryCard title="TOKEN_A 余额" value={tokenABalance} sub={CONTRACTS.TOKEN_A} />
              <SummaryCard title="TOKEN_B 余额" value={tokenBBalance} sub={CONTRACTS.TOKEN_B} />
              <SummaryCard title="支付代币余额" value={payBalance} sub={CONTRACTS.PAYMENT_TOKEN} />
              <SummaryCard
                title="Farm#0 待领取"
                value={`${farm0.pendingReward} REWARD`}
                sub={`已质押 ${farm0.stakedAmount} LP`}
                accent
              />
            </>
          )}
        </div>

        {/* 资产列表 */}
        <Section title="My Assets (Mock)">
          <div className="space-y-3">
            {assets.map((asset) => (
              <div
                key={asset.symbol}
                className="bg-white/5 rounded-lg p-4 flex justify-between items-center border border-white/10"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mr-3 flex items-center justify-center text-white font-bold">
                    {asset.symbol[0]}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{asset.symbol}</div>
                    <div className="text-white/50 text-sm">{asset.balance}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{asset.value}</div>
                  <div className={asset.changePositive ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
                    {asset.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 链上资产 */}
        {isConnected && (
          <Section title="On-chain Assets">
            <div className="space-y-3">
              {[{ symbol: 'TOKEN_A', balance: tokenABalance, address: CONTRACTS.TOKEN_A },
                { symbol: 'TOKEN_B', balance: tokenBBalance, address: CONTRACTS.TOKEN_B },
                { symbol: 'Payment', balance: payBalance, address: CONTRACTS.PAYMENT_TOKEN }].map((asset) => (
                <div
                  key={asset.symbol}
                  className="bg-white/5 rounded-lg p-4 flex justify-between items-center border border-white/10"
                >
                  <div>
                    <div className="text-white font-semibold">{asset.symbol}</div>
                    <div className="text-white/50 text-sm">地址: {asset.address}</div>
                  </div>
                  <div className="text-white font-semibold">{asset.balance}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 质押仓位 */}
        <Section title="Staking Positions">
          <div className="space-y-3">
            {staking.map((item) => (
              <div key={item.pool} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-white font-semibold text-lg">{item.pool}</div>
                    <div className="text-white/50 text-sm">Staked: {item.staked}</div>
                  </div>
                  <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                    {item.apr} APR
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Value:</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Pending Rewards:</span>
                  <span className="text-green-400 font-semibold">{item.earned}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 链上质押 (示例展示 Farm#0) */}
        {isConnected && (
          <Section title="On-chain Staking (Farm #0)">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 flex justify-between">
              <div>
                <div className="text-white font-semibold text-lg">Pool #0</div>
                <div className="text-white/60 text-sm">LP Token: {farm0.lpToken || 'N/A'}</div>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-sm">Staked</div>
                <div className="text-white font-semibold">{farm0.stakedAmount} LP</div>
                <div className="text-white/70 text-sm mt-2">Pending</div>
                <div className="text-green-400 font-semibold">{farm0.pendingReward} REWARD</div>
              </div>
            </div>
          </Section>
        )}

        {/* 流动性仓位 */}
        <Section title="Liquidity Positions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liquidity.map((lp) => (
              <div key={lp.pair} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-white font-semibold text-lg mb-1">{lp.pair}</div>
                <div className="text-white/70 text-sm">Value: {lp.value}</div>
                <div className="text-white/70 text-sm">Pool Share: {lp.share}</div>
                <div className="text-green-400 text-sm">Earned: {lp.earned}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 交易历史 */}
        <Section title="Recent Activity">
          <div className="space-y-2">
            {transactions.map((tx, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10 flex justify-between">
                <div>
                  <div className="text-white font-semibold">{tx.type}</div>
                  <div className="text-white/60 text-sm">{tx.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/60 text-sm">{tx.time}</div>
                  <div className="text-green-400 text-xs">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, sub, accent, accentPurple }) {
  const accentClass = accent
    ? 'border-green-400/40'
    : accentPurple
      ? 'border-purple-400/40'
      : 'border-white/20'

  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border ${accentClass}`}>
      <div className="text-white/70 text-sm mb-2">{title}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-white/50 text-xs">{sub}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      {children}
    </div>
  )
}
