const url =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

(async () => {
  try {
    console.log('start fetch...');
    const res = await fetch(url, { cache: 'no-store' });
    console.log('status:', res.status);
    const text = await res.text();
    console.log('body:', text);
  } catch (err) {
    console.error('error:', err);
    console.error('cause:', err && err.cause);
  }
})();
