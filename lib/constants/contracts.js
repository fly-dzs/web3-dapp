// 合约地址（从 .env.local 或直接配置）
export const CONTRACTS = {

// ERC20 代币
TOKEN_A: process.env.NEXT_PUBLIC_TOKEN_A_ADDRESS || '0x0',
TOKEN_B: process.env.NEXT_PUBLIC_TOKEN_B_ADDRESS || '0x0',


  // DEX 合约
  SWAP_ROUTER: process.env.NEXT_PUBLIC_SWAP_ADDRESS || '0x...',


  // Farm 合约
  FARM: process.env.NEXT_PUBLIC_FARM_ADDRESS || '0x...',
  REWARD_TOKEN: process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS || '0x...',

  // LaunchPad 合约
  LAUNCHPAD: process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS || '0x...',
  PAYMENT_TOKEN: process.env.NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS || '0x...',
  TOKEN_FACTORY: process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS || '0x...',

  // StakePool（质押 LP，领取奖励）
  STAKE_POOL: process.env.NEXT_PUBLIC_STAKE_POOL_ADDRESS || '0x...',
}
