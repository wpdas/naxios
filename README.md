<div align="center">
   <img src="https://raw.githubusercontent.com/wpdas/naxios/HEAD/md/naxios-logo.png" height="70px" /></a><br>
</div>

<p align="center">Promise based NEAR Contract and NEAR Wallet client for browser. This was designed to facilitate the React integration with NEAR Blockchain and avoid the huge boilerplate of setting up a wallet and contract.</p>

<p align="center">
    <a href="https://wpdas.gitbook.io/naxios/"><b>Documentation</b></a>
</p>

## Table of Contents

- [Features](#features)
- [Installing](#installing)
- [How to Use](#how-to-use)
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
npm install @wpdas/naxios @near-wallet-selector/modal-ui@8.9.1
```

using yarn:

```bash
yarn add @wpdas/naxios @near-wallet-selector/modal-ui@8.9.1
```

## How to Use

### Preparing it

Import the NEAR Wallet Selector styles. The app needs it to render the Wallet Selector correctly.

```ts
import '@near-wallet-selector/modal-ui/styles.css'
```

### Using It

It's super easy to get a Wallet and/or Contract API in place all at once. Take a look:

```ts
// web3Api.ts
import naxios from '@wpdas/naxios'

const naxiosApi = new naxios({
  contractId: CONTRACT_ID,
  network: 'testnet', // or mainnet, localnet
})

// (optional)
const onContractInitHandler = () => {
  console.log('Contract is ready!')
}
const onWalletInitHandler = () => {
  console.log('Wallet is ready!')
}

/**
 * NEAR Contract API
 */
export const contractApi = naxiosInstance.contractApi(onContractInitHandler)

/**
 * NEAR Wallet API
 */
export const walletApi = naxiosInstance.walletApi(onWalletInitHandler)
```

#### Contract API Reference

- `ready`: boolean indicating whether the contractApi is ready.
- `view`: Make a read-only call to retrieve information from the network.
- `call`: Call a method that changes the contract's state. This is payable.

#### Wallet API Reference

- `accounts`: Signed-in Accounts.
- `contractId`: Contract ID.
- `initNear`: (This is called automatically. You don't need to call it!) Initializes a connection to the NEAR blockchain.
- `network`: Current network (`testnet`, `mainnet` or `localnet`).
- `signInModal`: Open up the Signin Wallet Modal.
- `wallet`: Wallet instance.
- `walletSelector`: WalletSelector instance.

### Contract View

Using a `view` method is free.

```ts
import { contractApi } from './web3Api'

contractApi.view('get_greeting').then((response) => console.log(response))
// Hi
```

### Contract Call

You need to pay for every request you make for a `call` method. This is going to change data and store it within the blockchain.

```ts
import { contractApi } from './web3Api'

// [payable]
contractApi.call('set_greeting', { greeting: 'Hello my dear!' }).then(() => console.log('Done!'))
```

### Contract Interface

It's a good practice to create a Contract Interface while building your app, so that, everyone knows what to input and what to get at the end.

```ts
// contract-interface.ts
import { contractApi } from './web3Api'

// Get greeting request
type EmptyInput = {}
type GetGreetingResponse = string
export const get_greeting = () => contractApi.view<EmptyInput, GetGreetingResponse>('get_greeting')

// [payable]
// Set greeting request
type SetGreetingInput = { greeting: string }
type SetGreetingResponse = string // current greeting
export const set_greeting = (args: SetGreetingInput) =>
  contractApi.call<typeof args, SetGreetingResponse>('set_greeting', { args })
```

Then, you can just call it over your app like:

```ts
import { useState, useEffect, useCallback } from 'react'
import { get_greeting, set_greeting } from './contract-interface'

const App = () => {
  const [greeting, setGreeting] = useState('')

  // Loads the last stored greeting
  useEffect(() => {
    ;(async () => {
      const storedGreeting = await get_greeting()
      setGreeting(storedGreeting)
    })()
  }, [])

  // Persist a new greeting message
  const persistNewGreetingHandler = useCallback(async () => {
    await set_greeting({ greeting: 'Hello my dear!!!' })
    console.log('Done!')
  }, [])

  return (
    <>
      <button onClick={persistNewGreetingHandler}>Save new greeting</button>
    </>
  )
}
```

### Open Up the Sign-in Wallet Selector Modal

You can open up the NEAR Wallet Selector modal by calling `signInModal()`:

```ts
import { walletApi } from './web3Api'

walletApi.signInModal()
```

<div align="center">
   <img src="https://3798793431-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fcudid4AoeKizKC6M6ros%2Fuploads%2FjD0nWoQ61lkQeEZwflHy%2FScreenshot%202024-01-11%20at%2009.15.59.png?alt=media&token=90d7edf4-fc7a-4879-916e-f0d2f9cace3f" height="500px" /></a><br>
</div>

### Customizing the Wallets Options for NEAR Wallet Selector

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

```tsx
const contract = useContract({ contractId: CONTRACT_ID, network: 'testnet' })

useEffect(() => {
  if (contract.ready) {
    contract.view('get_greeting').then((response) => console.log(response)) // Hi
  }
}, [contract])
```

<!-- To add a separator line -->

##

<!-- To add a separator line -->

### `useWallet`

The `useWallet` hook initializes a connection to the NEAR Blockchain and provides access to the walletApi instance.

```tsx
const wallet = useWallet({ contractId: CONTRACT_ID, network: 'testnet' })

useEffect(() => {
  if (wallet.ready) {
    console.log(wallet.walletApi?.accounts)
    // [{accountId: 'user.testnet', publicKey: 'ed25519:aaaaaaaa'}, {...}]
  }
}, [wallet])
```

## Contributing

Feel free to open issues or pull requests. For major changes, please open an issue first to discuss what you would like to change.
