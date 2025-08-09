# Meme Token Auto Trader

This repository contains a simple web application that demonstrates how to connect a crypto wallet, scan for token opportunities, and (optionally) execute trades automatically.  It is intended as a **learning project** for experimenting with Web3 development and should **not** be used with significant funds on mainnet networks.

## Features

* **Wallet connection** via [wagmi](https://wagmi.sh/) with multiple connectors (Injected, MetaMask, WalletConnect).
* **Client UI** built with Next.js and React for connecting your wallet and toggling auto trading.
* **Backend server** built with Express and ethers.js that scans for tokens (stubbed) and performs swaps on a DEX router (e.g., Uniswap V2) using your private key.
* **Auto trading** mode that periodically scans for opportunities and executes trades using a fixed ETH budget.

> **Risk disclaimer:** Trading newly launched tokens is extremely risky.  This project provides code examples only.  You are solely responsible for any financial loss.  Always start with testnets or small amounts and understand the legal implications in your jurisdiction.

## Project structure

```
auto-trade-app/
├── client/         # Next.js front‑end
│   ├── config/
│   │   └── wagmi.ts
│   ├── components/
│   │   ├── AccountInfo.tsx
│   │   ├── TradeControls.tsx
│   │   └── WalletOptions.tsx
│   ├── pages/
│   │   ├── api/
│   │   │   ├── auto.ts
│   │   │   └── scan.ts
│   │   ├── _app.tsx
│   │   └── index.tsx
│   └── styles/
│       └── globals.css
├── server/         # Backend service
│   └── src/
│       ├── index.ts
│       ├── scanTokens.ts
│       └── trade.ts
├── .env.example    # Environment variables template
├── package.json    # Root package definitions (client & server)
├── tsconfig.json   # TypeScript configuration
├── next-env.d.ts
├── .gitignore
└── README.md
```

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and fill in your RPC endpoint, private key, router address and other parameters:

   ```bash
   cp .env.example .env
   # then edit .env
   ```

   | Variable               | Description                                        |
   |-----------------------|----------------------------------------------------|
   | `RPC_URL`             | RPC endpoint for your network (e.g. Infura/Alchemy) |
   | `PRIVATE_KEY`         | Private key of your wallet (keep this secret!)     |
   | `DEX_ROUTER_ADDRESS`  | Address of the UniswapV2 router or other DEX       |
   | `SLIPPAGE_BPS`        | Slippage tolerance in basis points (e.g. 500 = 5%) |
   | `TX_DEADLINE_MINUTES` | Minutes before a swap transaction expires          |
   | `PORT`                | Backend server port (default 3001)                 |
   | `NEXT_PUBLIC_BACKEND_URL` | (optional) Fully qualified URL to the backend    |

3. **Run the backend server**

   ```bash
   # from the project root
   npm run server
   ```

   The backend listens on port `3001` by default and exposes three routes:

   * `GET /scan` — returns a list of token opportunities.
   * `POST /auto` — enable/disable automatic trading (JSON body: `{ "enable": true }`).
   * `POST /trade` — manually execute a trade with a token address and amount `{ "tokenAddress": "0x…", "amountInEth": "0.01" }`.

4. **Run the client (Next.js)**

   In another terminal, start the Next.js development server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` in your browser.  You should be able to connect your wallet, scan for tokens, and toggle auto trading.  During development, the client proxies API calls to the backend running on port 3001 via the `/api/scan` and `/api/auto` routes.

## Extending the app

* Replace the stub implementation in `server/src/scanTokens.ts` with calls to a real DEX screener API (e.g. DexScreener, Bitquery, Moralis) and integrate your DecodeFi risk analysis prompt.
* Expand `server/src/trade.ts` to support other swap functions (e.g. swapping tokens for ETH or USDC) and add pre‑trade checks (honeypot tests, gas estimation).
* Build a persistent database (Supabase, PostgreSQL) to store token reports, scores and trade history.
* Add user authentication and multi‑wallet support if deploying for others.

## License

This project is provided as‑is for educational purposes.  Use at your own risk.