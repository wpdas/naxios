import { QueueCalls } from '../../utils/queueCalls'

describe('QueueCalls', () => {
  let queueCalls: QueueCalls

  beforeEach(() => {
    queueCalls = new QueueCalls()
  })

  it('deve executar promises sequencialmente', async () => {
    const results: number[] = []

    const promise1 = queueCalls.queue(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      results.push(1)
      return 1
    })

    const promise2 = queueCalls.queue(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      results.push(2)
      return 2
    })

    const promise3 = queueCalls.queue(async () => {
      results.push(3)
      return 3
    })

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

    expect(results).toEqual([1, 2, 3]) // Execução sequencial
    expect(result1).toBe(1)
    expect(result2).toBe(2)
    expect(result3).toBe(3)
  })

  it('deve mesclar chamadas duplicadas com a mesma tag', async () => {
    let executionCount = 0

    const createPromise = (value: string) => async () => {
      executionCount++
      await new Promise((resolve) => setTimeout(resolve, 50))
      return value
    }

    // Três chamadas com a mesma tag - devem ser mescladas
    const promise1 = queueCalls.queue(createPromise('primeira'), 'same-tag')
    const promise2 = queueCalls.queue(createPromise('segunda'), 'same-tag')
    const promise3 = queueCalls.queue(createPromise('terceira'), 'same-tag')

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

    // Todas devem ter o mesmo resultado da primeira execução
    expect(result1).toBe('primeira')
    expect(result2).toBe('primeira')
    expect(result3).toBe('primeira')

    // A função deve ter sido executada apenas uma vez
    expect(executionCount).toBe(1)
  })

  it('deve executar chamadas separadas quando as tags são diferentes', async () => {
    let executionCount = 0

    const createPromise = (value: string) => async () => {
      executionCount++
      await new Promise((resolve) => setTimeout(resolve, 50))
      return value
    }

    // Três chamadas com tags diferentes - devem ser executadas separadamente
    const promise1 = queueCalls.queue(createPromise('primeira'), 'tag1')
    const promise2 = queueCalls.queue(createPromise('segunda'), 'tag2')
    const promise3 = queueCalls.queue(createPromise('terceira'), 'tag3')

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

    // Cada uma deve ter seu próprio resultado
    expect(result1).toBe('primeira')
    expect(result2).toBe('segunda')
    expect(result3).toBe('terceira')

    // A função deve ter sido executada três vezes
    expect(executionCount).toBe(3)
  })

  it('deve propagar erros corretamente', async () => {
    const errorMessage = 'Erro de teste'

    const promise1 = queueCalls.queue(async () => {
      throw new Error(errorMessage)
    })

    await expect(promise1).rejects.toThrow(errorMessage)
  })

  it('deve mesclar erros com a mesma tag', async () => {
    const errorMessage = 'Erro mesclado'

    const promise1 = queueCalls.queue(async () => {
      throw new Error(errorMessage)
    }, 'error-tag')

    const promise2 = queueCalls.queue(async () => {
      throw new Error('Este erro não será executado')
    }, 'error-tag')

    await expect(promise1).rejects.toThrow(errorMessage)
    await expect(promise2).rejects.toThrow(errorMessage)
  })

  it('deve fornecer informações sobre o estado da fila', () => {
    expect(queueCalls.length).toBe(0)
    expect(queueCalls.pendingCount).toBe(0)
    expect(queueCalls.processing).toBe(false)
    expect(queueCalls.hasPendingTag('test')).toBe(false)

    // Adiciona uma promise com tag
    queueCalls.queue(async () => 'test', 'test-tag')

    expect(queueCalls.hasPendingTag('test-tag')).toBe(true)
    expect(queueCalls.pendingCount).toBe(1)
  })

  it('deve limpar a fila corretamente', () => {
    queueCalls.queue(async () => 'test1', 'tag1')
    queueCalls.queue(async () => 'test2', 'tag2')

    expect(queueCalls.pendingCount).toBe(2)

    queueCalls.clear()

    expect(queueCalls.length).toBe(0)
    expect(queueCalls.pendingCount).toBe(0)
    expect(queueCalls.hasPendingTag('tag1')).toBe(false)
    expect(queueCalls.hasPendingTag('tag2')).toBe(false)
  })
})
