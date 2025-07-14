import { tryWithFallback, tryRpcWithFallback } from '../../utils/tryWithFallback'

describe('tryWithFallback', () => {
  it('should return result from first provider when successful', async () => {
    const providers = ['provider1', 'provider2', 'provider3']
    const operation = jest.fn().mockResolvedValue('success')

    const result = await tryWithFallback(providers, operation)

    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
    expect(operation).toHaveBeenCalledWith('provider1', 0)
  })

  it('should try next provider when first fails', async () => {
    const providers = ['provider1', 'provider2', 'provider3']
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Error on provider 1'))
      .mockResolvedValue('success on provider 2')

    const result = await tryWithFallback(providers, operation)

    expect(result).toBe('success on provider 2')
    expect(operation).toHaveBeenCalledTimes(2)
    expect(operation).toHaveBeenNthCalledWith(1, 'provider1', 0)
    expect(operation).toHaveBeenNthCalledWith(2, 'provider2', 1)
  })

  it('should try all providers before failing', async () => {
    const providers = ['provider1', 'provider2', 'provider3']
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Error on provider 1'))
      .mockRejectedValueOnce(new Error('Error on provider 2'))
      .mockRejectedValueOnce(new Error('Error on provider 3'))

    await expect(tryWithFallback(providers, operation)).rejects.toThrow('Error on provider 3')
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('should throw error when provider list is empty', async () => {
    const providers: string[] = []
    const operation = jest.fn()

    await expect(tryWithFallback(providers, operation)).rejects.toThrow('Provider list is empty')
    expect(operation).not.toHaveBeenCalled()
  })
})

describe('tryRpcWithFallback', () => {
  it('should identify rate limit errors', async () => {
    const providers = ['provider1', 'provider2']
    const operation = jest.fn().mockRejectedValueOnce(new Error('Too many requests')).mockResolvedValue('success')

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

    const result = await tryRpcWithFallback(providers, operation)

    expect(result).toBe('success')
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚨 RPC Provider 0 rate limit exceeded'))

    consoleSpy.mockRestore()
  })

  it('should identify HTTP 429 errors', async () => {
    const providers = ['provider1', 'provider2']
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('HTTP 429 - rate limit exceeded'))
      .mockResolvedValue('success')

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

    const result = await tryRpcWithFallback(providers, operation)

    expect(result).toBe('success')
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚨 RPC Provider 0 rate limit exceeded'))

    consoleSpy.mockRestore()
  })

  it('should handle non-rate limit related errors', async () => {
    const providers = ['provider1', 'provider2']
    const operation = jest.fn().mockRejectedValueOnce(new Error('Network error')).mockResolvedValue('success')

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

    const result = await tryRpcWithFallback(providers, operation)

    expect(result).toBe('success')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌ RPC Provider 0 failed:'),
      expect.stringContaining('Network error')
    )

    consoleSpy.mockRestore()
  })

  it('should work with simulated real providers', async () => {
    const mockProviders = [
      { query: jest.fn().mockRejectedValue(new Error('Too many requests')) },
      { query: jest.fn().mockResolvedValue({ result: 'data' }) },
    ]

    const result = await tryRpcWithFallback(mockProviders, async (provider) => {
      return provider.query({ test: 'params' })
    })

    expect(result).toEqual({ result: 'data' })
    expect(mockProviders[0].query).toHaveBeenCalledWith({ test: 'params' })
    expect(mockProviders[1].query).toHaveBeenCalledWith({ test: 'params' })
  })
})

describe('Integration with RPC providers', () => {
  it('should simulate real behavior with multiple providers', async () => {
    const mockProviders = [
      {
        query: jest.fn().mockRejectedValue(new Error('Too many requests')),
        url: 'https://rpc1.near.org',
      },
      {
        query: jest.fn().mockRejectedValue(new Error('Network timeout')),
        url: 'https://rpc2.near.org',
      },
      {
        query: jest.fn().mockResolvedValue({
          result: Buffer.from(JSON.stringify({ success: true })).toString('base64'),
        }),
        url: 'https://rpc3.near.org',
      },
    ]

    const result = await tryRpcWithFallback(mockProviders, async (provider) => {
      return provider.query({
        request_type: 'call_function',
        account_id: 'test.near',
        method_name: 'get_data',
        args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
        finality: 'optimistic',
      })
    })

    expect(result).toEqual({
      result: Buffer.from(JSON.stringify({ success: true })).toString('base64'),
    })
    expect(mockProviders[0].query).toHaveBeenCalledTimes(1)
    expect(mockProviders[1].query).toHaveBeenCalledTimes(1)
    expect(mockProviders[2].query).toHaveBeenCalledTimes(1)
  })
})
