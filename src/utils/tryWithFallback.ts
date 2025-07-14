// INFO: not being used

/**
 * Executes an operation with sequential fallback through a list of providers
 * Tries each provider in order until getting a response or exhausting all options
 *
 * @example
 * ```typescript
 * const providers = [provider1, provider2, provider3];
 * const result = await tryWithFallback(providers, (provider) => provider.query(params));
 * ```
 */
export async function tryWithFallback<T, P>(
  providers: P[],
  operation: (provider: P, index: number) => Promise<T>
): Promise<T> {
  if (providers.length === 0) {
    throw new Error('Provider list is empty')
  }

  let lastError: Error | unknown

  for (let i = 0; i < providers.length; i++) {
    try {
      const result = await operation(providers[i], i)
      return result
    } catch (error) {
      lastError = error

      // Log error for debug (optional)
      console.warn(`Provider ${i} failed:`, error)

      // If not the last provider, continue trying
      if (i < providers.length - 1) {
        console.log(`Trying next provider (${i + 1})...`)
        continue
      }
    }
  }

  // If it reached here, all providers failed
  throw lastError || new Error('All providers failed')
}

/**
 * Optimized version for NEAR RPC providers
 * Includes specific logic to identify "Too many requests" errors
 */
export async function tryRpcWithFallback<T>(
  providers: any[],
  operation: (provider: any, index: number) => Promise<T>
): Promise<T> {
  if (providers.length === 0) {
    throw new Error('RPC provider list is empty')
  }

  let lastError: Error | unknown

  for (let i = 0; i < providers.length; i++) {
    try {
      const result = await operation(providers[i], i)
      return result
    } catch (error: any) {
      lastError = error

      // Identifies specific error types
      const errorMessage = error?.message || String(error)
      const isRateLimitError =
        errorMessage.includes('Too many requests') ||
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit')

      if (isRateLimitError) {
        console.warn(`RPC Provider ${i} rate limit exceeded, trying next...`)
      } else {
        console.warn(`RPC Provider ${i} failed:`, errorMessage)
      }

      // If not the last provider, continue trying
      if (i < providers.length - 1) {
        console.log(`Trying RPC provider ${i + 1}...`)
        continue
      }
    }
  }

  // If it reached here, all providers failed
  throw lastError || new Error('All RPC providers failed')
}

export default tryWithFallback
