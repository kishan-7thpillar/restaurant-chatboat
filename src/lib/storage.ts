import { encryptApiKey, decryptApiKey } from './crypto'
import { supabase } from './supabase'

export interface Integration {
  type: string
  apiKey: string
  status: 'Checking...' | 'Connected' | 'Disconnected'
}

export interface Location {
  id: string
  name: string
  integrations: {
    posSystem: Integration
    taskTraining: Integration
    scheduling: Integration
    financialManagement: Integration
  }
}

export interface LocationsData {
  locations: Location[]
}

// Database types
interface DatabaseLocation {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

interface DatabaseIntegration {
  id: string
  location_id: string
  integration_type: 'posSystem' | 'taskTraining' | 'scheduling' | 'financialManagement'
  provider_type: string
  api_key_hash: string
  connection_status: 'Checking...' | 'Connected' | 'Disconnected'
  created_at: string
  updated_at: string
}

/**
 * Save a single location to Supabase with encrypted API keys
 */
export async function saveLocationData(location: Location): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // First, upsert the location
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .upsert({
        id: location.id,
        user_id: user.id,
        name: location.name
      })
      .select()
      .single()

    if (locationError) {
      console.error('Location save error:', locationError)
      return { success: false, error: locationError.message }
    }

    // Then, save all integrations
    const integrationTypes: (keyof Location['integrations'])[] = ['posSystem', 'taskTraining', 'scheduling', 'financialManagement']
    
    for (const integrationType of integrationTypes) {
      const integration = location.integrations[integrationType]
      
      const { error: integrationError } = await supabase
        .from('integrations')
        .upsert({
          location_id: location.id,
          integration_type: integrationType,
          provider_type: integration.type,
          api_key_hash: encryptApiKey(integration.apiKey),
          connection_status: integration.status
        })

      if (integrationError) {
        console.error(`Integration save error for ${integrationType}:`, integrationError)
        return { success: false, error: integrationError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to save location data:', error)
    return { success: false, error: 'Failed to save location data' }
  }
}

/**
 * Load locations data from Supabase and decrypt API keys
 */
export async function loadLocationsData(): Promise<LocationsData> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { locations: [] }
    }

    // Load locations for the current user
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (locationsError) {
      console.error('Failed to load locations:', locationsError)
      return { locations: [] }
    }

    if (!locations || locations.length === 0) {
      return { locations: [] }
    }

    // Load integrations for all locations
    const locationIds = locations.map(loc => loc.id)
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('*')
      .in('location_id', locationIds)

    if (integrationsError) {
      console.error('Failed to load integrations:', integrationsError)
      return { locations: [] }
    }

    // Transform database data to application format
    const transformedLocations: Location[] = locations.map((dbLocation: DatabaseLocation) => {
      const locationIntegrations = integrations?.filter(int => int.location_id === dbLocation.id) || []
      
      // Create default integrations structure
      const defaultIntegrations: Location['integrations'] = {
        posSystem: { type: 'Square', apiKey: '', status: 'Checking...' },
        taskTraining: { type: 'Jolt', apiKey: '', status: 'Checking...' },
        scheduling: { type: '7Shifts', apiKey: '', status: 'Checking...' },
        financialManagement: { type: 'Restaurant365', apiKey: '', status: 'Checking...' }
      }

      // Fill in actual integration data and decrypt API keys
      locationIntegrations.forEach((dbIntegration: DatabaseIntegration) => {
        if (dbIntegration.integration_type in defaultIntegrations) {
          defaultIntegrations[dbIntegration.integration_type] = {
            type: dbIntegration.provider_type,
            apiKey: decryptApiKey(dbIntegration.api_key_hash),
            status: dbIntegration.connection_status
          }
        }
      })

      return {
        id: dbLocation.id,
        name: dbLocation.name,
        integrations: defaultIntegrations
      }
    })

    return { locations: transformedLocations }
  } catch (error) {
    console.error('Failed to load locations data:', error)
    return { locations: [] }
  }
}

/**
 * Generate a unique ID for a new location
 */
export function generateLocationId(): string {
  return crypto.randomUUID()
}

/**
 * Create a new empty location with default integrations
 */
export function createEmptyLocation(name: string): Location {
  return {
    id: generateLocationId(),
    name,
    integrations: {
      posSystem: { type: 'Square', apiKey: '', status: 'Checking...' },
      taskTraining: { type: 'Jolt', apiKey: '', status: 'Checking...' },
      scheduling: { type: '7Shifts', apiKey: '', status: 'Checking...' },
      financialManagement: { type: 'Restaurant365', apiKey: '', status: 'Checking...' }
    }
  }
}

/**
 * Delete a location and all its integrations
 */
export async function deleteLocationData(locationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Delete the location (integrations will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to delete location:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to delete location:', error)
    return { success: false, error: 'Failed to delete location' }
  }
}
