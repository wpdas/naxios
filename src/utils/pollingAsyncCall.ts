/**
 * Make a polling async call and return success only when the checker returns true
 * @param caller
 * @param checker
 * @param timeout in milliseconds
 * @returns
 */
export const pollingAsyncCall = <T>(caller: () => Promise<T>, checker: (result: T) => boolean, timeout = 15000) => {
  return new Promise<T>((resolve, reject) => {
    let timer = 0
    const fetch = async () => {
      // console.log('Polling: fetch()')
      const result = await caller()
      const isRight = checker(result)
      // console.log('is right?', isRight, result)
      if (!isRight) {
        if (timer < timeout) {
          timer += 200
          setTimeout(() => {
            // console.log('Trying again!', timer)
            fetch()
          }, 200)
        } else {
          reject(false)
        }
      } else {
        resolve(result)
      }
    }

    fetch()
  })
}
