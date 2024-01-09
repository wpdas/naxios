<div align="center">
   <img src="https://raw.githubusercontent.com/wpdas/naxios/HEAD/md/naxios-logo.png" height="70px" /></a><br>
</div>

<p align="center">Promise based NEAR Contract and NEAR Wallet client for browser. This was designed to facilitate the React integration with NEAR Blockchain and avoid the huge boilerplate of setting up a wallet and contract.</p>

## Table of Contents

- [Features](#features)
- [Installing](#installing)
- [Example](#example)
- [React Hooks](#react-hooks)
- [Contributing](#contributing)

## Features

- Simplified Wallet and Contract integration
- Supports the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) API
- Easy to create a Contract Interface
- Wallet connection modal to be easily used
- Automatic transforms for [JSON](https://www.json.org/json-en.html) data
- Client side events to tell when the api is ready
- Helpful react hooks

## Installing

Using npm:

```bash
npm install @wpdas/naxios
```

using yarn:

```bash
yarn add @wpdas/naxios
```

## Example

### Contract API

Using contract's `view` request:

```ts
import naxios from '@wpdas/naxios'

const contractApi = new naxios({
  contractId: CONTRACT_ID,
  network: 'testnet', // or mainnet, localnet
}).contractApi()

contractApi.view('get_greeting').then((response) => console.log(response)) // Hi
```

Using contract's `call` request:

```ts
import naxios from '@wpdas/naxios'

const contractApi = new naxios({
  contractId: CONTRACT_ID,
  network: 'testnet', // or mainnet, localnet
}).contractApi()

// [payable]
contractApi.call('set_greeting', { greeting: 'Hello my dear!' }).then(() => console.log('Done!'))
```

Creating a contract interface:

```ts
// contract-interface.ts
import naxios from '@wpdas/naxios'

const contractApi = new naxios({
  contractId: CONTRACT_ID,
  network: 'testnet', // or mainnet, localnet
}).contractApi()

type GetGreetingInput = {}
type Greeting = string
export const get_greeting = () => contractApi.view<GetGreetingInput, Greeting>('get_greeting')

// [payable]
type SetGreetingResponse = string // current greeting
export const set_greeting = (args: { greeting: string }) =>
  contractApi.call<typeof args, SetGreetingResponse>('set_greeting', {
    args,
  })
```

### Wallet API

Using `walletApi`:

```ts
import naxios from '@wpdas/naxios'

const walletApi = new naxios({
  contractId: CONTRACT_ID,
  network: 'testnet', // or mainnet, localnet
}).walletApi()

console.log(walletApi.accounts)
// [{accountId: 'user.testnet', publicKey: 'ed25519:aaaaaaaa'}, {...}]
```

#### API

- `accounts`: Signed-in Accounts.
- `contractId`: Contract ID.
- `initNear`: (This is called automatically. You don't need to call it!) Initializes a connection to the NEAR blockchain.
- `network`: Current network (`testnet`, `mainnet` or `localnet`).
- `signInModal`: Open up the Signin Wallet Modal.
- `wallet`: Wallet instance.
- `walletSelector`: WalletSelector instance.

### Good Practices of Usage

You can use the contract API and the wallet API through the same naxios instance:

```ts
import naxios from '@wpdas/naxios'

const naxiosApi = new naxios({
  contractId: CONTRACT_ID,
  network: 'testnet', // or mainnet, localnet
})

/**
 * NEAR Contract API
 */
export const contractApi = naxiosInstance.contractApi()

/**
 * NEAR Wallet API
 */
export const walletApi = naxiosInstance.walletApi()
```

### Using Custom NEAR Wallet Selectors

By default, naxios only uses **@near-wallet-selector/my-near-wallet** as a means of connecting the wallet. However, you can add other wallet selectors as follows:

```sh
npm install @near-wallet-selector/ledger @near-wallet-selector/my-near-wallet
```

Then, you can start naxius as follows:

```ts
import naxios from '@wpdas/naxios'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import { setupLedger } from '@near-wallet-selector/ledger'
import MyNearIconUrl from '@near-wallet-selector/my-near-wallet/assets/my-near-wallet-icon.png'
import LedgerIconUrl from '@near-wallet-selector/ledger/assets/ledger-icon.png'

const naxiosApi = new naxios({
  contractId: CONTRACT_ID,
  network: 'testnet', // or mainnet, localnet
  walletSelectorModules: [
    setupMyNearWallet({ iconUrl: MyNearIconUrl.src }),
    setupLedger({ iconUrl: LedgerIconUrl.src }),
  ],
})
```

Find out all the NEAR wallet selectors here: [**NEAR Wallet Selector**](https://github.com/near/wallet-selector)

## React Hooks

### `useContract`

The `useContract` hook initializes a connection to the NEAR Blockchain and provides access to the contractApi instance.

#### Usage

```tsx
const contract = useContract({ contractId: CONTRACT_ID, network: 'testnet' })

useEffect(() => {
  if (contract.ready) {
    contract.view('get_greeting').then((response) => console.log(response)) // Hi
  }
}, [contract])
```

#### API

- `ready`: boolean indicating whether the contractApi is ready.
- `view`: Make a read-only call to retrieve information from the network.
- `call`: Call a method that changes the contract's state. This is payable.

<!-- To add a separator line -->

##

<!-- To add a separator line -->

### `useWallet`

The `useWallet` hook initializes a connection to the NEAR Blockchain and provides access to the walletApi instance.

#### Usage

```tsx
const wallet = useWallet({ contractId: CONTRACT_ID, network: 'testnet' })

useEffect(() => {
  if (wallet.ready) {
    console.log(wallet.walletApi?.accounts)
    // [{accountId: 'user.testnet', publicKey: 'ed25519:aaaaaaaa'}, {...}]
  }
}, [wallet])
```

#### API

- `ready`: boolean indicating whether the contractApi is ready.
- `view`: Make a read-only call to retrieve information from the network.
- `call`: Call a method that changes the contract's state. This is payable.

<!-- To add a separator line -->

##

<!-- To add a separator line -->

## Contributing

Feel free to open issues or pull requests. For major changes, please open an issue first to discuss what you would like to change.
