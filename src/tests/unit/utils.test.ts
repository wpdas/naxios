import { buildTransaction, calculateDepositByDataSize, validateNearAddress } from '../../utils'
import '../setupTest'

describe('Utils', () => {
  it('buildTransaction', () => {
    const transactionBody = buildTransaction('get_greetings', { args: { limit: 1 } })
    expect(transactionBody).toStrictEqual({ method: 'get_greetings', args: { limit: 1 } })
  })

  it('validateNearAddress', () => {
    expect(validateNearAddress('fake.name.near')).toBeTruthy()
    expect(validateNearAddress('fake.nears')).toBeFalsy()
    expect(validateNearAddress('fake.testnet')).toBeTruthy()
    expect(validateNearAddress('fake')).toBeFalsy()
  })

  it('calculateDepositByDataSize', () => {
    const deposit = calculateDepositByDataSize({ name: 'wenderson' })
    expect(deposit).toBe('0.0006000000000000001')
  })
})
