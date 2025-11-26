// src/lib/coingecko.ts
export async function fetchEthPriceUSD() {
  const res = await fetch('/api/eth-price');

  if (!res.ok) {
    throw new Error('获取 ETH 价格失败');
  }

  const data = await res.json();
  const price = data?.price;

  if (typeof price !== 'number') {
    throw new Error('返回数据异常');
  }

  return price as number; // USD
}
