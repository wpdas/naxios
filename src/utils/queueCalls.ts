/**
 * Class to manage a linear queue of promises, executing them sequentially
 *
 * @example
 * ```typescript
 * import { QueueCalls, queueCalls } from './queueCalls';
 *
 * // Using the global instance
 * const result1 = await queueCalls.queue(() => minhaFuncaoPromise());
 * const result2 = await queueCalls.queue(() => outraFuncaoPromise());
 *
 * // Merging duplicate calls with tags
 * const resultA = await queueCalls.queue(() => minhaFuncaoPromise1(), 'funcao1');
 * const resultB = await queueCalls.queue(() => minhaFuncaoPromise2(), 'funcao2');
 * const resultC = await queueCalls.queue(() => minhaFuncaoPromise1(), 'funcao1'); // Será mesclado com resultA
 *
 * // resultA and resultC will have the same value, but the function will only be executed once
 *
 * // Or creating a new instance
 * const myQueue = new QueueCalls();
 * const result = await myQueue.queue(() => minhaFuncaoPromise());
 * ```
 */
export class QueueCalls {
  private tasks: Array<() => Promise<void>> = []
  private isProcessing = false
  private pendingTasks: Map<string, Promise<any>> = new Map()

  /**
   * Adds a promise function to the queue for sequential execution
   * @param promiseFunction - Function that returns a promise
   * @param tag - Optional tag to identify and merge duplicate calls
   * @returns Promise that resolves when the function is executed in the queue
   */
  async queue<T>(promiseFunction: () => Promise<T>, tag?: string): Promise<T> {
    // If a tag is provided, check if there is a pending promise
    if (tag && this.pendingTasks.has(tag)) {
      return this.pendingTasks.get(tag) as Promise<T>
    }

    const promise = new Promise<T>((resolve, reject) => {
      // Adds the function to the queue
      this.tasks.push(async () => {
        try {
          const result = await promiseFunction()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          // Remove the pending promise when completed
          if (tag) {
            this.pendingTasks.delete(tag)
          }
        }
      })

      // Starts the queue processing if not already processing
      if (!this.isProcessing) {
        this.processQueue()
      }
    })

    // Stores the pending promise if a tag was provided
    if (tag) {
      this.pendingTasks.set(tag, promise)
    }

    return promise
  }

  /**
   * Processes
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.tasks.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.tasks.length > 0) {
      const currentTask = this.tasks.shift()
      if (currentTask) {
        await currentTask()
      }
    }

    this.isProcessing = false
  }

  /**
   * Returns the number of items in the queue
   */
  get length(): number {
    return this.tasks.length
  }

  /**
   * Returns the number of pending promises with tags
   */
  get pendingCount(): number {
    return this.pendingTasks.size
  }

  /**
   * Checks if the queue is processing
   */
  get processing(): boolean {
    return this.isProcessing
  }

  /**
   * Checks if there is a pending promise with the specified tag
   */
  hasPendingTag(tag: string): boolean {
    return this.pendingTasks.has(tag)
  }

  /**
   * Clears the queue (removes all pending promises)
   */
  clear(): void {
    this.tasks = []
    this.pendingTasks.clear()
  }
}

// Export a global instance for direct use
export const queueCalls = new QueueCalls()

// Export as default for compatibility
export default QueueCalls

/* Example of usage with merging:
 *
 * const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
 *
 * // These three calls will be merged because they use the same tag
 * const promiseA = queueCalls.queue(() => delay(1000).then(() => 'resultado-a'), 'delay-1s');
 * const promiseB = queueCalls.queue(() => delay(2000).then(() => 'resultado-b'), 'delay-2s');
 * const promiseC = queueCalls.queue(() => delay(1000).then(() => 'resultado-c'), 'delay-1s'); // Mesclado com promiseA
 *
 * // promiseA and promiseC will have the same result: 'resultado-a'
 * // The delay(1000) function will only be executed once
 */
