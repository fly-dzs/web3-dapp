import Link from "next/link";

const navTiles = [
  {
    title: "Swap",
    copy: "Instant token swaps with smart routing.",
    href: "/swap",
    accent: "from-fuchsia-500/70 via-purple-500/60 to-indigo-500/60",
  },
  {
    title: "Pool",
    copy: "Add liquidity and earn trading fees.",
    href: "/pool",
    accent: "from-blue-500/70 via-cyan-400/60 to-teal-400/60",
  },
  {
    title: "Farms",
    copy: "Stake LPs for boosted rewards.",
    href: "/farm",
    accent: "from-amber-500/70 via-orange-500/60 to-red-400/60",
  },
  {
    title: "LaunchPad",
    copy: "Access curated token launches early.",
    href: "/launchpad",
    accent: "from-emerald-500/70 via-teal-400/60 to-cyan-300/60",
  },
  {
    title: "Dashboard",
    copy: "Track balances, yields, and history.",
    href: "/dashboard",
    accent: "from-indigo-500/70 via-sky-500/60 to-blue-400/60",
  },
  {
    title: "Bridge",
    copy: "Move assets seamlessly across chains.",
    href: "/bridge",
    accent: "from-rose-500/70 via-pink-500/60 to-orange-400/60",
  },
];

const stats = [
  { label: "Total Value", value: "$184.2M" },
  { label: "24h Volume", value: "$28.4M" },
  { label: "Active Farms", value: "32" },
  { label: "Avg. APR", value: "18.6%" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_40%)]" />
      </div>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-14 px-6 py-20">
        <header className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/70 ring-1 ring-white/10">
              Multi-chain DeFi Hub
            </span>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              A bold home for
              {" "}
              <span className="bg-gradient-to-r from-fuchsia-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                every on-chain move
              </span>
            </h1>
            <p className="text-lg text-white/70">
              Swap, provide liquidity, farm rewards, bridge assets, and track everything without leaving one surface.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/swap"
                className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-fuchsia-500/30 transition hover:translate-y-[-2px]"
              >
                Start swapping
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50 hover:text-white"
              >
                View dashboard
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner shadow-black/20 backdrop-blur"
                >
                  <div className="text-xs uppercase tracking-wide text-white/50">{item.label}</div>
                  <div className="mt-1 text-xl font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="mb-5 flex items-center justify-between text-sm text-white/70">
              <span>Live overview</span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300 ring-1 ring-emerald-400/30">
                Updated
              </span>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                <div className="text-xs uppercase tracking-wide text-white/50">Most active</div>
                <div className="mt-2 text-xl font-semibold">ETH / USDT</div>
                <div className="mt-1 text-sm text-emerald-300">+12.4% liquidity inflow today</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="text-xs text-white/60">TVL</div>
                  <div className="text-lg font-semibold">$184.2M</div>
                  <div className="text-xs text-emerald-300">+3.1% today</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="text-xs text-white/60">24h Volume</div>
                  <div className="text-lg font-semibold">$28.4M</div>
                  <div className="text-xs text-emerald-300">+6.7% today</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="text-xs text-white/60">Top farm</div>
                  <div className="text-lg font-semibold">ETH/USDC</div>
                  <div className="text-xs text-amber-300">APR 24.5%</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="text-xs text-white/60">Bridge fee</div>
                  <div className="text-lg font-semibold">~0.09%</div>
                  <div className="text-xs text-white/60">Low congestion</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Jump into any module</h2>
            <p className="text-sm text-white/60">Curated actions for power users</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {navTiles.map((tile) => (
              <Link
                key={tile.title}
                href={tile.href}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-white/30"
              >
                <div className={`absolute inset-0 opacity-60 blur-0 bg-gradient-to-br ${tile.accent}`} />
                <div className="relative z-10 flex h-full flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{tile.title}</h3>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/20">
                      Open
                    </span>
                  </div>
                  <p className="text-sm text-white/70">{tile.copy}</p>
                  <div className="mt-auto inline-flex items-center gap-2 text-sm text-white/80">
                    <span>Go now</span>
                    <span className="transition duration-200 group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
