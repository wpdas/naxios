import { useCallback, useEffect, useState } from 'react'
import naxios from '../naxios'
import { ChangeMethodArgs, Config, ViewMethodArgs } from '../managers/types'
import ContractManager from '../managers/contract-manager'

/**
 * NEAR Contract API Hook
 * @param config
 * @returns
 */
const useContract = (config: Config) => {
  const [ready, setReady] = useState(false)
  const [contractApi, setContractApi] = useState<ContractManager>()

  useEffect(() => {
    const contractApi = new naxios(config).contractApi(() => {
      setReady(true)
    })

    setContractApi(contractApi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const view = useCallback(
    async <A extends {}, R>(method: string, props?: ViewMethodArgs<A>) => {
      return contractApi?.view<A, R>(method, props)
    },
    [contractApi]
  )

  const call = useCallback(
    async <A extends {}, R>(method: string, props?: ChangeMethodArgs<A>) => {
      return contractApi?.call<A, R>(method, props)
    },
    [contractApi]
  )

  return {
    /**
     * Is hook ready?
     */
    ready,
    /**
     * [view] Make a read-only call to retrieve information from the network
     * @param method Contract's method name
     * @param {A} props.args - Function parameters
     * @returns
     */
    view,
    /**
     * [payable] Call a method that changes the contract's state
     * @param method Contract's method name
     * @param {A} props.args - Function parameters
     * @param {string} props.gas - (optional) gas
     * @param {string} props.deposit - (optional) deposit
     * @returns
     */
    call,
  }
}

export default useContract
