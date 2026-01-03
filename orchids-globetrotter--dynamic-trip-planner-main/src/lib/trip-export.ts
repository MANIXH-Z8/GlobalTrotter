/**
 * Trip Export/Import Utilities
 * 
 * Provides offline JSON export and import functionality for trips.
 * Exports include all trip data, stops, and activities.
 * Imports validate data structure before loading.
 */

import { Trip, TripStop, TripActivity } from './supabase'

export type ExportedTrip = {
  version: string
  trip: Trip
  stops: TripStop[]
  activities: TripActivity[]
  exportedAt: string
}

const EXPORT_VERSION = "1.0"

/**
 * Export trip to JSON format
 * Includes all related stops and activities
 */
export async function exportTrip(
  trip: Trip,
  stops: TripStop[],
  activities: TripActivity[]
): Promise<void> {
  const exportedData: ExportedTrip = {
    version: EXPORT_VERSION,
    trip,
    stops,
    activities,
    exportedAt: new Date().toISOString(),
  }

  const json = JSON.stringify(exportedData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${trip.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Validate imported trip data structure
 */
function validateImportedData(data: any): data is ExportedTrip {
  if (!data || typeof data !== 'object') return false
  if (!data.trip || typeof data.trip !== 'object') return false
  if (!Array.isArray(data.stops)) return false
  if (!Array.isArray(data.activities)) return false

  // Basic trip validation
  if (!data.trip.name || typeof data.trip.name !== 'string') return false

  return true
}

/**
 * Import trip from JSON file
 * Returns validated trip data or null if invalid
 */
export async function importTrip(file: File): Promise<ExportedTrip | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = JSON.parse(text)

        if (validateImportedData(data)) {
          resolve(data)
        } else {
          console.error('Invalid trip data structure')
          resolve(null)
        }
      } catch (error) {
        console.error('Error parsing JSON:', error)
        resolve(null)
      }
    }

    reader.onerror = () => {
      console.error('Error reading file')
      resolve(null)
    }

    reader.readAsText(file)
  })
}

/**
 * Prepare imported trip for database insertion
 * Removes IDs and timestamps to allow fresh creation
 */
export function prepareImportedTripForInsert(
  importedData: ExportedTrip,
  userId: string
): {
  trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>
  stops: (Omit<TripStop, 'id' | 'trip_id'> & { _original_stop_id?: string })[]
  activities: (Omit<TripActivity, 'id' | 'trip_stop_id'> & { _original_stop_id?: string })[]
} {
  const { trip, stops, activities } = importedData

  // Prepare trip without IDs
  const newTrip: Omit<Trip, 'id' | 'created_at' | 'updated_at'> = {
    user_id: userId,
    name: `${trip.name} (Imported)`,
    description: trip.description,
    start_date: trip.start_date,
    end_date: trip.end_date,
    cover_image: trip.cover_image,
    is_public: false, // Always set to private for imported trips
    share_code: null, // Generate new share code
    total_budget: trip.total_budget,
  }

  // Prepare stops without IDs and trip_id, but keep original ID for mapping
  const newStops = stops.map(({ id, trip_id, ...stop }) => ({
    ...stop,
    order_index: stop.order_index || 0,
    _original_stop_id: id, // Store for mapping activities
  }))

  // Prepare activities without IDs and trip_stop_id
  // We'll need to map old stop IDs to new ones after insertion
  const newActivities = activities.map(({ id, trip_stop_id, ...activity }) => ({
    ...activity,
    order_index: activity.order_index || 0,
    _original_stop_id: trip_stop_id, // Store original stop_id for mapping
  }))

  return {
    trip: newTrip,
    stops: newStops,
    activities: newActivities,
  }
}

