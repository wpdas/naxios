/**
 * Calculate required deposit for data being stored. (~0.00001N per byte) with a bit extra for buffer
 * @param data
 * @returns The parsed NEAR amount
 */
export const calculateDepositByDataSize = (data: {}) => (JSON.stringify(data).length * 0.00003).toString()
