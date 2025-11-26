import {Providers}from '@/components/providers'
import { WalletButton } from '@/components/WalletButton'
import "./globals.css";
import Link from  "next/link";
export const metadata = {
  title: "Web3 DAPP Demo",
  description: "Learn Web3 ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <nav className="bg-gray-900 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <Link href="/" className="text-white font-bold text-xl">
                    Web3 DAPP
                  </Link>
                  <div className="ml-10 flex items-baseline space-x-4">
                    <Link
                      href="/swap"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Swap
                    </Link>
                    <Link
                      href="/pool"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Pool
                    </Link>
                    <Link
                      href="/farm"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Farms
                    </Link>
                    <Link
                      href="/launchpad"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      LaunchPad
                    </Link>
                    <Link
                      href="/dashboard"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/bridge"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Bridge
                    </Link>
                  </div>
                </div>

                
                <div id="wallet-button-placeholder">
  <WalletButton />
</div>
              </div>
            </div>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
