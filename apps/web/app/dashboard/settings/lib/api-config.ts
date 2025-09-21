/**
 * Settings API Configuration
 * Centralized management of settings API endpoints and their availability
 */

export interface SettingsEndpoint {
  path: string
  available: boolean
  mockFallback?: boolean
  description: string
}

export const SETTINGS_ENDPOINTS: Record<string, SettingsEndpoint> = {
  overview: {
    path: '/api/settings/overview',
    available: true,
    description: 'Profile completion status and quick stats'
  },
  profile: {
    path: '/api/settings/profile',
    available: true,
    description: 'Business information and therapist profile'
  },
  travel: {
    path: '/api/settings/travel',
    available: true,
    description: 'Base location and travel configuration'
  },
  pricing: {
    path: '/api/settings/pricing',
    available: true,
    description: 'Service rates and pricing templates'
  },
  'tax-compliance': {
    path: '/api/settings/tax-compliance',
    available: true,
    description: 'Austrian tax compliance and RKSV settings'
  },
  system: {
    path: '/api/settings/system',
    available: true,
    description: 'System preferences and export configurations'
  },
  rksv: {
    path: '/api/settings/rksv',
    available: true,
    description: 'RKSV compliance monitoring'
  }
}

/**
 * Enhanced fetch wrapper for settings API calls
 * Provides error handling, loading states, and fallback mechanisms
 */
export async function fetchSettingsEndpoint(
  endpointKey: string,
  options: RequestInit = {}
): Promise<{ data: any; error: string | null; fromCache: boolean }> {
  const endpoint = SETTINGS_ENDPOINTS[endpointKey]

  if (!endpoint) {
    return {
      data: null,
      error: `Unknown endpoint: ${endpointKey}`,
      fromCache: false
    }
  }

  if (!endpoint.available) {
    return {
      data: null,
      error: `Endpoint ${endpointKey} is not yet implemented`,
      fromCache: false
    }
  }

  try {
    const response = await fetch(endpoint.path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          data: null,
          error: `Endpoint ${endpoint.path} not found (404)`,
          fromCache: false
        }
      }

      return {
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
        fromCache: false
      }
    }

    const data = await response.json()
    return {
      data,
      error: null,
      fromCache: false
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
      fromCache: false
    }
  }
}

/**
 * Hook for conditional API fetching with caching and error handling
 */
export function useSettingsEndpoint(endpointKey: string, enabled: boolean = true) {
  const [state, setState] = React.useState<{
    data: any
    loading: boolean
    error: string | null
    fromCache: boolean
  }>({
    data: null,
    loading: false,
    error: null,
    fromCache: false
  })

  const fetchData = React.useCallback(async () => {
    if (!enabled) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    const result = await fetchSettingsEndpoint(endpointKey)

    setState({
      data: result.data,
      loading: false,
      error: result.error,
      fromCache: result.fromCache
    })
  }, [endpointKey, enabled])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refetch: fetchData
  }
}

// React import for the hook
import React from 'react'