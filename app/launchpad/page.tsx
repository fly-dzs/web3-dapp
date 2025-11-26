// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import toast from 'react-hot-toast'

import { CONTRACTS } from '@/lib/constants/contracts'
import LaunchPadABI from '@/lib/abis/LaunchPadV2.json'
import ERC20ABI from '@/lib/abis/ERC20ABI.json'
import { useTokenApprove } from '@/hooks/useTokenApprove'
import { useLaunchpad } from '@/hooks/useLaunchpad'
import { useTokenBalance } from '@/hooks/useTokenBalance'

const WAD = 10n ** 18n
const DEFAULT_DECIMALS = 18

const statusColors = {
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  upcoming: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  ended: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
  finalized: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/40',
  cancelled: 'bg-red-500/20 text-red-200 border-red-500/40',
}

const formatDate = (ts?: number) =>
  ts ? new Date(ts * 1000).toLocaleString() : '--'

const safeParseUnits = (value: string, decimals: number) => {
  if (!value) return 0n
  try {
    return parseUnits(value, decimals)
  } catch (e) {
    return 0n
  }
}

function LaunchCard({
  sale,
  amount,
  onAmountChange,
  onApprove,
  onBuy,
  onClaim,
  isConnected,
  isApproveBusy,
  isBuyBusy,
  isClaimBusy,
}: any) {
  const amountWei = safeParseUnits(amount, sale.saleDecimals)
  const costWei = amountWei > 0n ? (amountWei * sale.price) / WAD : 0n
  const costDisplay =
    costWei > 0n ? formatUnits(costWei, sale.paymentDecimals) : '0'

  const needsApproval = amountWei > 0n && sale.allowance < costWei

  const buyDisabled =
    !isConnected ||
    !sale.isActive ||
    amountWei <= 0n ||
    isApproveBusy ||
    isBuyBusy

  const approveLabel = isApproveBusy
    ? 'Approving...'
    : `Approve ${sale.paymentSymbol}`

  const buyLabel = isBuyBusy
    ? 'Confirming...'
    : sale.isActive
      ? 'Buy tokens'
      : 'Not available'

  const claimDisabled = !sale.isClaimable || isClaimBusy || !isConnected
  const claimLabel = isClaimBusy ? 'Claiming...' : 'Claim'

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-white/60">Sale #{sale.id}</div>
          <div className="text-2xl font-semibold text-white">
            {sale.saleSymbol} Launch
          </div>
          <div className="text-sm text-white/50">Creator: {sale.creator}</div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[sale.status] || statusColors.upcoming}`}
        >
          {sale.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-white">
        <div>
          <div className="text-white/60">Price</div>
          <div className="text-lg font-semibold">
            {sale.pricePerToken} {sale.paymentSymbol}
          </div>
        </div>
        <div>
          <div className="text-white/60">Progress</div>
          <div className="text-lg font-semibold">{sale.progress}%</div>
        </div>
        <div>
          <div className="text-white/60">Sold</div>
          <div className="font-semibold">
            {sale.soldDisplay} / {sale.totalDisplay} {sale.saleSymbol}
          </div>
        </div>
        <div>
          <div className="text-white/60">You bought</div>
          <div className="font-semibold">
            {sale.purchasedDisplay} {sale.saleSymbol}
          </div>
        </div>
        <div>
          <div className="text-white/60">Min/Max</div>
          <div className="font-semibold">
            {sale.minPurchaseDisplay} / {sale.maxPurchaseDisplay}
          </div>
        </div>
        <div>
          <div className="text-white/60">Timeline</div>
          <div className="font-semibold">
            {formatDate(sale.startTime)} {'->'} {formatDate(sale.endTime)}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Payment token</span>
          <span className="font-semibold text-white">
            {sale.paymentSymbol} balance: {sale.paymentBalance}
          </span>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <label className="text-xs uppercase tracking-wide text-white/60">
            Amount ({sale.saleSymbol})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(sale.id, e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="0.0"
            className="mt-1 w-full bg-transparent text-2xl font-semibold text-white outline-none placeholder-white/30"
          />
          <div className="mt-2 flex justify-between text-xs text-white/60">
            <span>Est. cost</span>
            <span className="text-white">
              {costDisplay} {sale.paymentSymbol}
            </span>
          </div>
        </div>

        {sale.status === 'active' &&
          (needsApproval ? (
            <button
              disabled={isApproveBusy || amountWei <= 0n}
              onClick={() =>
                onApprove({
                  saleId: sale.id,
                  costWei,
                  paymentDecimals: sale.paymentDecimals,
                  paymentToken: sale.paymentToken,
                })
              }
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-center font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {approveLabel}
            </button>
          ) : (
            <button
              disabled={buyDisabled}
              onClick={() => onBuy({ saleId: sale.id, amount })}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-center font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {buyLabel}
            </button>
          ))}

        {(sale.status === 'ended' || sale.status === 'finalized') && (
          <button
            disabled={claimDisabled}
            onClick={() => onClaim(sale.id)}
            className="w-full rounded-lg border border-white/20 px-4 py-3 text-center font-semibold text-white transition hover:border-white/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {claimLabel} ({sale.claimableDisplay} {sale.saleSymbol})
          </button>
        )}
      </div>
    </div>
  )
}

export default function LaunchPadPage() {
  const { address, isConnected } = useAccount()
  const [amountBySale, setAmountBySale] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)

  const nowMs = Date.now()
  const defaultStart = new Date(nowMs + 10 * 60 * 1000).toISOString().slice(0, 16)
  const defaultEnd = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)

  const [createForm, setCreateForm] = useState({
    name: '',
    symbol: '',
    decimals: DEFAULT_DECIMALS,
    initialSupply: '1000000',
    saleAmount: '500000',
    price: '0.5',
    startTime: defaultStart,
    endTime: defaultEnd,
    minPurchase: '0',
    maxPurchase: '0',
    paymentToken: CONTRACTS.PAYMENT_TOKEN,
  })

  const launchpadAddress = CONTRACTS.LAUNCHPAD

  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
  } = useTokenApprove()

  const {
    buy,
    claim,
    isBuyPending,
    isBuyConfirming,
    isBuySuccess,
    isClaimPending,
    isClaimConfirming,
    isClaimSuccess,
    createTokenAndSale,
    isCreatePending,
    isCreateConfirming,
    isCreateSuccess,
    createError,
  } = useLaunchpad(DEFAULT_DECIMALS)

  const isApproveBusy = isApprovePending || isApproveConfirming
  const isBuyBusy = isBuyPending || isBuyConfirming
  const isClaimBusy = isClaimPending || isClaimConfirming
  const isCreateBusy = isCreatePending || isCreateConfirming

  const { balance: paymentBalance } = useTokenBalance(
    CONTRACTS.PAYMENT_TOKEN,
    address
  )

  const { data: saleCountData, isLoading: isCountLoading } = useReadContract({
    address: launchpadAddress,
    abi: LaunchPadABI,
    functionName: 'getSaleCount',
    scopeKey: `sale-count-${refreshKey}`,
    query: { enabled: !!launchpadAddress },
  })

  const saleCount = Number(saleCountData ?? 0n)

  const saleInfoQuery = useReadContracts({
    contracts:
      saleCount > 0
        ? Array.from({ length: saleCount }).map((_, idx) => ({
            address: launchpadAddress,
            abi: LaunchPadABI,
            functionName: 'getSaleInfo',
            args: [BigInt(idx)],
          }))
        : [],
    query: {
      enabled: saleCount > 0,
    },
    scopeKey: `sale-info-${refreshKey}`,
  })

  const saleInfos = useMemo(
    () => saleInfoQuery.data?.map((entry) => entry?.result) ?? [],
    [saleInfoQuery.data]
  )

  const uniqueTokens = useMemo(() => {
    const set = new Set<string>()
    saleInfos.forEach((info) => {
      if (!info) return
      const saleToken = info.saleToken ?? info[1]
      const paymentToken = info.paymentToken ?? info[2]
      if (saleToken) set.add(String(saleToken))
      if (paymentToken) set.add(String(paymentToken))
    })
    return Array.from(set)
  }, [saleInfos])

  const decimalsQuery = useReadContracts({
    contracts: uniqueTokens.map((addr) => ({
      address: addr,
      abi: ERC20ABI,
      functionName: 'decimals',
    })),
    query: { enabled: uniqueTokens.length > 0 },
  })

  const symbolsQuery = useReadContracts({
    contracts: uniqueTokens.map((addr) => ({
      address: addr,
      abi: ERC20ABI,
      functionName: 'symbol',
    })),
    query: { enabled: uniqueTokens.length > 0 },
  })

  const tokenMeta = useMemo(() => {
    const meta = {}
    uniqueTokens.forEach((addr, idx) => {
      const key = addr.toLowerCase()
      const decimals = decimalsQuery.data?.[idx]?.result
      const symbol = symbolsQuery.data?.[idx]?.result
      meta[key] = {
        decimals: decimals != null ? Number(decimals) : undefined,
        symbol: symbol || 'TOKEN',
      }
    })
    return meta
  }, [uniqueTokens, decimalsQuery.data, symbolsQuery.data])

  const allowanceQuery = useReadContracts({
    contracts:
      isConnected && saleInfos.length
        ? saleInfos.map((info) => ({
            address: (info?.paymentToken ?? info?.[2]) as `0x${string}`,
            abi: ERC20ABI,
            functionName: 'allowance',
            args: [address, launchpadAddress],
          }))
        : [],
    query: {
      enabled: isConnected && saleInfos.length > 0,
    },
  })

  const userInfoQuery = useReadContracts({
    contracts:
      isConnected && saleInfos.length
        ? saleInfos.map((_, idx) => ({
            address: launchpadAddress,
            abi: LaunchPadABI,
            functionName: 'getUserInfo',
            args: [BigInt(idx), address],
          }))
        : [],
    query: {
      enabled: isConnected && saleInfos.length > 0,
    },
  })

  const getMeta = (addr?: string) =>
    addr ? tokenMeta[addr.toLowerCase()] || {} : {}

  const sales = useMemo(() => {
    return saleInfos
      .map((info, idx) => {
        if (!info) return null
        const creator = info.creator ?? info[0]
        const saleToken = info.saleToken ?? info[1]
        const paymentToken = info.paymentToken ?? info[2]
        const price = info.price ?? info[3] ?? 0n
        const totalAmount = info.totalAmount ?? info[4] ?? 0n
        const soldAmount = info.soldAmount ?? info[5] ?? 0n
        const startTime = Number(info.startTime ?? info[6] ?? 0n)
        const endTime = Number(info.endTime ?? info[7] ?? 0n)
        const minPurchase = info.minPurchase ?? info[8] ?? 0n
        const maxPurchase = info.maxPurchase ?? info[9] ?? 0n
        const finalized = info.finalized ?? info[10] ?? false
        const active = info.active ?? info[11] ?? false

        const saleMeta = getMeta(saleToken)
        const payMeta = getMeta(paymentToken)
        const saleDecimals = saleMeta.decimals ?? 18
        const paymentDecimals = payMeta.decimals ?? 18
        const saleSymbol = saleMeta.symbol || 'SALE'
        const paymentSymbol = payMeta.symbol || 'PAY'

        const now = Math.floor(Date.now() / 1000)
        let status: keyof typeof statusColors = 'upcoming'
        if (!active) status = 'cancelled'
        else if (finalized) status = 'finalized'
        else if (now < startTime) status = 'upcoming'
        else if (now <= endTime) status = 'active'
        else status = 'ended'

        const perTokenPaymentUnits =
          (BigInt(10) ** BigInt(saleDecimals) * price) / WAD

        const pricePerToken = formatUnits(perTokenPaymentUnits, paymentDecimals)

        const progress =
          totalAmount > 0n
            ? Number((soldAmount * 10000n) / totalAmount) / 100
            : 0

        const allowance = allowanceQuery.data?.[idx]?.result ?? 0n
        const userInfo = userInfoQuery.data?.[idx]?.result
        const purchasedAmount =
          userInfo?.purchasedAmount ?? userInfo?.[0] ?? 0n
        const claimedAmount =
          userInfo?.claimedAmount ?? userInfo?.[1] ?? 0n
        const claimableAmount =
          userInfo?.claimableAmount ?? userInfo?.[2] ?? 0n

        return {
          id: idx,
          creator,
          saleToken,
          paymentToken,
          saleDecimals,
          paymentDecimals,
          saleSymbol,
          paymentSymbol,
          price,
          pricePerToken,
          totalDisplay: formatUnits(totalAmount, saleDecimals),
          soldDisplay: formatUnits(soldAmount, saleDecimals),
          progress,
          startTime,
          endTime,
          minPurchaseDisplay: formatUnits(minPurchase, saleDecimals),
          maxPurchaseDisplay: formatUnits(maxPurchase, saleDecimals),
          allowance,
          purchasedDisplay: formatUnits(purchasedAmount, saleDecimals),
          claimedDisplay: formatUnits(claimedAmount, saleDecimals),
          claimableDisplay: formatUnits(claimableAmount, saleDecimals),
          isClaimable:
            (status === 'ended' || status === 'finalized') &&
            claimableAmount > 0n,
          isActive: status === 'active',
          status,
          paymentBalance,
        }
      })
      .filter(Boolean)
  }, [
    saleInfos,
    allowanceQuery.data,
    userInfoQuery.data,
    tokenMeta,
    paymentBalance,
  ])

  const handleAmountChange = (saleId: number, value: string) => {
    setAmountBySale((prev) => ({
      ...prev,
      [saleId]: value,
    }))
  }

  const handleApprove = async ({
    paymentToken,
    costWei,
    paymentDecimals,
  }) => {
    if (!isConnected) {
      toast.error('请先连接钱包')
      return
    }
    if (!paymentToken) {
      toast.error('支付代币地址缺失')
      return
    }
    const humanAmount = formatUnits(costWei, paymentDecimals)
    try {
      await approve(paymentToken, launchpadAddress, humanAmount, paymentDecimals)
      toast.success('Approval sent')
    } catch (err: any) {
      toast.error(err?.message || 'Approval failed')
    }
  }

  const handleBuy = async ({ saleId, amount }) => {
    if (!isConnected) {
      toast.error('请先连接钱包')
      return
    }
    const sale = sales?.find((s) => s.id === saleId)
    if (!sale) return
    try {
      await buy(saleId, amount, sale.saleDecimals)
      toast.success('Purchase submitted')
    } catch (err: any) {
      toast.error(err?.message || 'Buy failed')
    }
  }

  const handleClaim = async (saleId: number) => {
    if (!isConnected) {
      toast.error('请先连接钱包')
      return
    }
    try {
      await claim(saleId)
      toast.success('Claim sent')
    } catch (err: any) {
      toast.error(err?.message || 'Claim failed')
    }
  }

  useEffect(() => {
    if (isBuySuccess) {
      toast.success('Purchase confirmed')
    }
  }, [isBuySuccess])

  useEffect(() => {
    if (isClaimSuccess) {
      toast.success('Claim confirmed')
    }
  }, [isClaimSuccess])

  useEffect(() => {
    if (isCreateSuccess) {
      toast.success('创建代币并开启销售成功')
      setRefreshKey((k) => k + 1)
    }
  }, [isCreateSuccess])

  useEffect(() => {
    if (createError) {
      toast.error(createError.message || '创建失败')
    }
  }, [createError])

  const handleCreateChange = (field: string, value: any) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const toUnix = (value: string) => {
    const ts = Date.parse(value)
    return Number.isFinite(ts) ? Math.floor(ts / 1000) : 0
  }

  const handleCreate = async () => {
    if (!isConnected) {
      toast.error('请先连接钱包')
      return
    }
    try {
      const startTime = toUnix(createForm.startTime)
      const endTime = toUnix(createForm.endTime)
      await createTokenAndSale({
        name: createForm.name,
        symbol: createForm.symbol,
        decimals: Number(createForm.decimals) || DEFAULT_DECIMALS,
        initialSupply: createForm.initialSupply,
        saleAmount: createForm.saleAmount,
        paymentToken: createForm.paymentToken,
        price: createForm.price,
        startTime,
        endTime,
        minPurchase: createForm.minPurchase,
        maxPurchase: createForm.maxPurchase,
      })
    } catch (err: any) {
      toast.error(err?.message || '创建失败')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-12 px-4 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="text-sm uppercase tracking-[0.25em] text-white/60">
            Token Launchpad
          </div>
          <div className="text-4xl font-semibold leading-tight">
            Back early-stage tokens,{` `}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
              one curated pool at a time
            </span>
          </div>
          <div className="text-white/70">
            支付代币: {CONTRACTS.PAYMENT_TOKEN} · 合约: {launchpadAddress}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-lg font-semibold">一键发射代币并开启销售</div>
            <p className="text-sm text-white/70">
              在 TokenFactory 创建新代币，并在 LaunchPad 合约创建对应销售。价格按 1e18 精度输入，时间需晚于当前时间。
            </p>
            <div className="text-xs text-white/60">
              TokenFactory: {CONTRACTS.TOKEN_FACTORY}
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                placeholder="名称 (Name)"
                value={createForm.name}
                onChange={(e) => handleCreateChange('name', e.target.value)}
              />
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                placeholder="符号 (Symbol)"
                value={createForm.symbol}
                onChange={(e) => handleCreateChange('symbol', e.target.value)}
              />
              <input
                type="number"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                placeholder="Decimals"
                value={createForm.decimals}
                onChange={(e) => handleCreateChange('decimals', e.target.value)}
              />
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                placeholder="支付代币地址"
                value={createForm.paymentToken}
                onChange={(e) => handleCreateChange('paymentToken', e.target.value)}
              />
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                placeholder="初始总量 (mint 给自己)"
                value={createForm.initialSupply}
                onChange={(e) => handleCreateChange('initialSupply', e.target.value)}
              />
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                placeholder="销售数量"
                value={createForm.saleAmount}
                onChange={(e) => handleCreateChange('saleAmount', e.target.value)}
              />
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                placeholder="价格 (支付代币计价)"
                value={createForm.price}
                onChange={(e) => handleCreateChange('price', e.target.value)}
              />
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                placeholder="最小购买量"
                value={createForm.minPurchase}
                onChange={(e) => handleCreateChange('minPurchase', e.target.value)}
              />
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                placeholder="最大购买量 (0 表示不限制)"
                value={createForm.maxPurchase}
                onChange={(e) => handleCreateChange('maxPurchase', e.target.value)}
              />
              <input
                type="datetime-local"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                value={createForm.startTime}
                onChange={(e) => handleCreateChange('startTime', e.target.value)}
              />
              <input
                type="datetime-local"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder-white/40"
                value={createForm.endTime}
                onChange={(e) => handleCreateChange('endTime', e.target.value)}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={isCreateBusy}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreateBusy ? '创建中...' : '创建代币并开启销售'}
            </button>
          </div>
        </section>

        {isCountLoading && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/70">
            Loading sales...
          </div>
        )}

        {!isCountLoading && sales?.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/70">
            暂无公开 LaunchPad 销售
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sales?.map((sale) => (
            <LaunchCard
              key={sale.id}
              sale={sale}
              amount={amountBySale[sale.id] || ''}
              onAmountChange={handleAmountChange}
              onApprove={handleApprove}
              onBuy={handleBuy}
              onClaim={handleClaim}
              isConnected={isConnected}
              isApproveBusy={isApproveBusy}
              isBuyBusy={isBuyBusy}
              isClaimBusy={isClaimBusy}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
