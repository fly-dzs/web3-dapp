// app/api/eth-price/route.ts
import { NextResponse } from 'next/server';

const URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

export async function GET() {
  try {
    const res = await fetch(URL, { cache: 'no-store' });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream error', upstreamStatus: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const price = data?.ethereum?.usd;

    if (typeof price !== 'number') {
      return NextResponse.json(
        { error: 'Invalid response from CoinGecko' },
        { status: 502 }
      );
    }

    return NextResponse.json({ price }); // 单位 USD
  } catch (err) {
    console.error('[eth-price] error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
