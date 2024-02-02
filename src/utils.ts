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
