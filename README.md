# Kleo SDK [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Kleo-Protocol/kleo-sdk)

A TypeScript SDK for interacting with the Kleo Protocol on Polkadot Paseo Asset Hub. This SDK provides a unified interface for managing lending pools, reputation systems, and vouch relationships.

## Features

-  **Blockchain Integration** - Connect to Polkadot Paseo Asset Hub via WebSocket
-  **Lending Pool Management** - Query pool states and user deposits
-  **Reputation System** - Track lender exposure and borrower reputation
-  **Vouch System** - Manage vouch relationships between users
- **Profile Management** - Create and update user profiles
-  **Supabase Integration** - Hybrid on-chain/off-chain data fetching

## Installation

```bash
npm install @kleo-protocol/kleo-sdk
```

## Quick Start

```typescript
import { KleoClient } from '@kleo-protocol/kleo-sdk';

// Import contract metadata (generated from your contracts)
import configMetadata from './metadata/config.json';
import lendingPoolMetadata from './metadata/lending-pool.json';
import reputationMetadata from './metadata/reputation.json';
import vouchMetadata from './metadata/vouch.json';

// Initialize the client
const client = new KleoClient(
  {
    endpoint: 'wss://asset-hub-paseo.dotters.network', // Optional, this is the default
    timeout: 30000, // Optional, default is 30000ms
  },
  {
    config: configMetadata,
    lendingPool: lendingPoolMetadata,
    reputation: reputationMetadata,
    vouch: vouchMetadata,
  }
);

// Use the client
async function main() {
  try {
    // Get all pools
    const pools = await client.getPools();
    console.log('Available pools:', pools);

    // Get user deposit in a pool
    const deposit = await client.getUserDeposit('pool-id', 'user-address');
    console.log('User deposit:', deposit);

    // Get borrower information
    const borrowerInfo = await client.getBorrowerInfo('pool-id', 'borrower-address');
    console.log('Borrower info:', borrowerInfo);

    // Disconnect when done
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `string` | `wss://asset-hub-paseo.dotters.network` | WebSocket endpoint for blockchain connection |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |

## API Reference

### Pool Methods

| Method | Description |
|--------|-------------|
| `getPools()` | Get all available lending pools |
| `getPool(poolId)` | Get a specific pool by ID |
| `getPoolState(poolId, defaultCaller?)` | Get the current state of a pool |

### Profile Methods

| Method | Description |
|--------|-------------|
| `getProfile(userAddress)` | Get a user's profile |
| `insertProfile(userAddress, name)` | Create a new user profile |
| `updateProfile(userAddress, name)` | Update an existing profile |

### Lending Methods

| Method | Description |
|--------|-------------|
| `getUserDeposit(poolId, userAddress)` | Get a user's deposit amount in a pool |

### Reputation Methods

| Method | Description |
|--------|-------------|
| `getLenderExposure(poolId, userAddress)` | Get lender's reputation exposure (stars) |
| `getBorrowerInfo(poolId, userAddress)` | Get comprehensive borrower information |
| `getUserLoans(poolId, userAddress)` | Get a user's loan history |

### Vouch Methods

| Method | Description |
|--------|-------------|
| `getVouchRelationship(poolId, voucherAddress, borrowerAddress)` | Get a specific vouch relationship |
| `getBorrowerVouches(poolId, borrowerAddress)` | Get all vouches for a borrower |

### Connection Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to the blockchain |
| `disconnect()` | Disconnect from the blockchain |
| `getDedotClient()` | Get the underlying Dedot client |
| `getSupabaseClient()` | Get the underlying Supabase client |
| `ensureAccountMapped(caller)` | Ensure account is mapped on-chain |

## Interfaces

### BackedPosition

```typescript
interface BackedPosition {
  borrower: string;
  stakedStars: number;
  stakedCapital: string;
  createdAt: string;
  status: 'Active' | 'Fulfilled' | 'Defaulted';
}
```

### BorrowerInfo

```typescript
interface BorrowerInfo {
  stars: number;
  starsAtStake: number;
  canVouch: boolean;
  banned: boolean;
  creationTime: string;
  loanHistoryCount: number;
  vouchHistoryCount: number;
  totalExposure: string;
}
```

### VouchInfo

```typescript
interface VouchInfo {
  voucher: string;
  stakedStars: number;
  stakedCapital: string;
  createdAt: string;
  status: 'Active' | 'Fulfilled' | 'Defaulted';
}
```

### Loan

```typescript
interface Loan {
  amount: string;
  repaid: boolean;
}
```

## Project Structure

```
kleo-sdk/
├── src/
│   ├── index.ts              # Main entry point
│   ├── client.ts             # KleoClient implementation
│   ├── dedot.client.ts       # Dedot blockchain client
│   ├── supabase.client.ts    # Supabase client
│   ├── types.ts              # TypeScript type definitions
│   ├── interfaces/           # Data interfaces
│   │   ├── backed-position.ts
│   │   ├── borrower-info.ts
│   │   ├── loan.ts
│   │   └── vouch-info.ts
│   ├── services/             # Service modules
│   │   ├── lending.service.ts
│   │   ├── pool.service.ts
│   │   ├── profile.service.ts
│   │   ├── reputation.service.ts
│   │   └── vouch.service.ts
│   └── utils/                # Utility functions
│       └── contract-helpers.ts
├── types/                    # Contract type definitions
│   ├── config/
│   ├── lending-pool/
│   ├── loan-manager/
│   ├── reputation/
│   └── vouch/
├── dist/                     # Compiled output (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Watch mode for development:**
   ```bash
   npm run build:watch
   ```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run build:watch` | Watch mode for development |
| `npm run clean` | Remove build artifacts |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm test` | Run tests |

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Dependencies

- **[dedot](https://github.com/nicolo-ribaudo/dedot)** - Polkadot.js alternative for blockchain interaction
- **[@supabase/supabase-js](https://supabase.com/docs/reference/javascript)** - Supabase client for off-chain data

## License

MIT
