import { Transaction } from './managers/types'

/**
 * Build a contract's Transaction body
 * @param method Contract's method name
 * @param {A} props.args - Function parameters
 * @param {string} props.receiverId - (optional) (defaults to contractId set when creating the instance) receiver Id - contract id that is going to be called.
 * @param {string} props.gas - (optional) gas
 * @param {string} props.deposit - (optional) yoctoⓃ amount
 * @returns
 */
export const buildTransaction = <A extends object>(method: string, props: Omit<Transaction<A>, 'method'>) =>
  ({
    method,
    ...props,
  } as Transaction<A>)

const NEAR_ACCOUNT_ID_REGEX = /^(?=.{2,64}$)(?!.*\.\.)(?!.*-$)(?!.*_$)[a-z\d._-]+$/i

/**
 * Check if an address is a valid NEAR address
 * @param address
 * @returns
 */
export const validateNearAddress = (address: string) => {
  let isValid = NEAR_ACCOUNT_ID_REGEX.test(address)
  if (address.length < 64 && (!address.endsWith('.near') || !address.endsWith('.testnet'))) {
    isValid = false
  }
  return isValid
}

/**
 * Calculate required deposit for data being stored. (~0.00001N per byte) with a bit extra for buffer
 * @param data
 * @returns
 */
export const calculateDepositByDataSize = (data: {}) => (JSON.stringify(data).length * 0.00003).toString()
