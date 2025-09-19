import { Integration } from './storage'

export type ConnectionStatus = 'Checking...' | 'Connected' | 'Disconnected'

/**
 * Validate Square POS API key using /v2/locations endpoint
 */
export async function validateSquareConnection(apiKey: string): Promise<ConnectionStatus> {
  if (!apiKey.trim()) return 'Disconnected'
  
  try {
    const response = await fetch('https://connect.squareup.com/v2/locations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Square-Version': '2023-10-18',
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return 'Connected'
    } else {
      console.error('Square API validation failed:', response.status, response.statusText)
      return 'Disconnected'
    }
  } catch (error) {
    console.error('Square API validation error:', error)
    return 'Disconnected'
  }
}

/**
 * Mock validation for Toast POS (placeholder until real API is available)
 */
export async function validateToastConnection(apiKey: string): Promise<ConnectionStatus> {
  if (!apiKey.trim()) return 'Disconnected'
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock validation - return Connected if API key exists and has reasonable length
  return apiKey.length >= 10 ? 'Connected' : 'Disconnected'
}

/**
 * Mock validation for Jolt (placeholder until real API is available)
 */
export async function validateJoltConnection(apiKey: string): Promise<ConnectionStatus> {
  if (!apiKey.trim()) return 'Disconnected'
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Mock validation - return Connected if API key exists and has reasonable length
  return apiKey.length >= 10 ? 'Connected' : 'Disconnected'
}

/**
 * Mock validation for 7Shifts (placeholder until real API is available)
 */
export async function validate7ShiftsConnection(apiKey: string): Promise<ConnectionStatus> {
  if (!apiKey.trim()) return 'Disconnected'
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  // Mock validation - return Connected if API key exists and has reasonable length
  return apiKey.length >= 10 ? 'Connected' : 'Disconnected'
}

/**
 * Mock validation for Restaurant365 (placeholder until real API is available)
 */
export async function validateRestaurant365Connection(apiKey: string): Promise<ConnectionStatus> {
  if (!apiKey.trim()) return 'Disconnected'
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 900))
  
  // Mock validation - return Connected if API key exists and has reasonable length
  return apiKey.length >= 10 ? 'Connected' : 'Disconnected'
}

/**
 * Validate connection for any integration type
 */
export async function validateIntegrationConnection(
  integrationType: keyof Integration | string,
  providerType: string,
  apiKey: string
): Promise<ConnectionStatus> {
  switch (providerType.toLowerCase()) {
    case 'square':
      return validateSquareConnection(apiKey)
    case 'toast':
      return validateToastConnection(apiKey)
    case 'jolt':
      return validateJoltConnection(apiKey)
    case '7shifts':
      return validate7ShiftsConnection(apiKey)
    case 'restaurant365':
      return validateRestaurant365Connection(apiKey)
    default:
      console.warn(`Unknown provider type: ${providerType}`)
      return 'Disconnected'
  }
}

/**
 * Validate all integrations for a location
 */
export async function validateAllIntegrations(integrations: {
  posSystem: Integration
  taskTraining: Integration
  scheduling: Integration
  financialManagement: Integration
}): Promise<{
  posSystem: ConnectionStatus
  taskTraining: ConnectionStatus
  scheduling: ConnectionStatus
  financialManagement: ConnectionStatus
}> {
  const [posStatus, taskStatus, scheduleStatus, financialStatus] = await Promise.all([
    validateIntegrationConnection('posSystem', integrations.posSystem.type, integrations.posSystem.apiKey),
    validateIntegrationConnection('taskTraining', integrations.taskTraining.type, integrations.taskTraining.apiKey),
    validateIntegrationConnection('scheduling', integrations.scheduling.type, integrations.scheduling.apiKey),
    validateIntegrationConnection('financialManagement', integrations.financialManagement.type, integrations.financialManagement.apiKey)
  ])

  return {
    posSystem: posStatus,
    taskTraining: taskStatus,
    scheduling: scheduleStatus,
    financialManagement: financialStatus
  }
}
