const NEAR_ACCOUNT_ID_REGEX = /^(?=.{2,64}$)(?!.*\.\.)(?!.*-$)(?!.*_$)[a-z\d._-]+$/i

/**
 * Check if an address is a valid NEAR address
 * @param address
 * @returns
 */
export const validateNearAddress = (address: string) => {
  let isValid = NEAR_ACCOUNT_ID_REGEX.test(address)

  const finalNearName = address.endsWith('.near') ? '.near' : '.testnet'

  if (address.length > 64 || !address.endsWith(finalNearName)) {
    isValid = false
  }
  return isValid
}
