/**
 * Local Data Layer - Offline-First Architecture
 * 
 * This module provides a local-first data layer that works without internet.
 * It uses localStorage for persistence and provides a clean API that mimics
 * a backend service. This demonstrates proper data modeling and separation
 * of concerns.
 * 
 * Architecture:
 * - All data is stored in localStorage with clear keys
 * - Static datasets (cities, activities) are embedded for offline use
 * - The API layer abstracts storage details from components
 * - Fallback to Supabase when online (optional enhancement)
 */

import { City, Activity, ActivityCategory, Trip, TripStop, TripActivity, Profile } from './supabase'

// Storage keys for localStorage
const STORAGE_KEYS = {
  PROFILES: 'globetrotter_profiles',
  TRIPS: 'globetrotter_trips',
  TRIP_STOPS: 'globetrotter_trip_stops',
  TRIP_ACTIVITIES: 'globetrotter_trip_activities',
  CITIES: 'globetrotter_cities',
  ACTIVITIES: 'globetrotter_activities',
  ACTIVITY_CATEGORIES: 'globetrotter_activity_categories',
}

/**
 * Static city dataset with images for offline use
 * Images are mapped to Unsplash URLs that work reliably
 */
// Extended city type with additional fields for smart previews
export type EnhancedCity = City & {
  best_season?: string
  why_visit?: string
}

export const STATIC_CITIES: EnhancedCity[] = [
  {
    id: 'city-jaipur',
    name: 'Jaipur',
    country: 'India',
    region: 'Asia',
    cost_index: 45,
    popularity: 85,
    image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&h=600&fit=crop',
    description: 'The Pink City - capital of Rajasthan known for royal palaces and vibrant bazaars',
    best_season: 'Oct - Mar',
    why_visit: 'Royal palaces, vibrant bazaars, and rich Rajasthani heritage',
    latitude: 26.9124,
    longitude: 75.7873,
  },
  {
    id: 'city-udaipur',
    name: 'Udaipur',
    country: 'India',
    region: 'Asia',
    cost_index: 50,
    popularity: 80,
    image_url: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800&h=600&fit=crop',
    description: 'City of Lakes with stunning palaces and romantic boat rides',
    best_season: 'Oct - Mar',
    why_visit: 'Romantic lakeside palaces and stunning sunset views',
    latitude: 24.5854,
    longitude: 73.7125,
  },
  {
    id: 'city-jodhpur',
    name: 'Jodhpur',
    country: 'India',
    region: 'Asia',
    cost_index: 40,
    popularity: 75,
    image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    description: 'The Blue City with magnificent Mehrangarh Fort',
    best_season: 'Oct - Mar',
    why_visit: 'Iconic blue architecture and one of India\'s largest forts',
    latitude: 26.2389,
    longitude: 73.0243,
  },
  {
    id: 'city-goa',
    name: 'Goa',
    country: 'India',
    region: 'Asia',
    cost_index: 55,
    popularity: 90,
    image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop',
    description: 'Beach paradise with Portuguese heritage and vibrant nightlife',
    best_season: 'Nov - Feb',
    why_visit: 'Pristine beaches, Portuguese architecture, and vibrant nightlife',
    latitude: 15.2993,
    longitude: 74.1240,
  },
  {
    id: 'city-kerala',
    name: 'Kerala',
    country: 'India',
    region: 'Asia',
    cost_index: 50,
    popularity: 88,
    image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&h=600&fit=crop',
    description: 'God\'s Own Country - backwaters, beaches, and lush greenery',
    best_season: 'Sep - Mar',
    why_visit: 'Serene backwaters, lush tea gardens, and authentic Ayurveda',
    latitude: 10.1632,
    longitude: 76.6413,
  },
  {
    id: 'city-manali',
    name: 'Manali',
    country: 'India',
    region: 'Asia',
    cost_index: 45,
    popularity: 82,
    image_url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&h=600&fit=crop',
    description: 'Popular hill station with snow-capped mountains and adventure activities',
    best_season: 'Mar - Jun, Oct - Feb',
    why_visit: 'Snow-capped peaks, adventure sports, and cool mountain climate',
    latitude: 32.2432,
    longitude: 77.1892,
  },
  {
    id: 'city-london',
    name: 'London',
    country: 'United Kingdom',
    region: 'Europe',
    cost_index: 85,
    popularity: 95,
    image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
    description: 'A global hub of history, culture, and iconic landmarks',
    best_season: 'Apr - Oct',
    why_visit: 'Historic landmarks, world-class museums, and royal heritage',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    id: 'city-paris',
    name: 'Paris',
    country: 'France',
    region: 'Europe',
    cost_index: 90,
    popularity: 98,
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
    description: 'The City of Light - romance, art, and world-class cuisine',
    best_season: 'Apr - Oct',
    why_visit: 'Iconic Eiffel Tower, world-class art, and romantic ambiance',
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    id: 'city-tokyo',
    name: 'Tokyo',
    country: 'Japan',
    region: 'Asia',
    cost_index: 80,
    popularity: 92,
    image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
    description: 'Modern metropolis blending tradition and cutting-edge technology',
    best_season: 'Mar - May, Sep - Nov',
    why_visit: 'Futuristic technology meets ancient temples and incredible cuisine',
    latitude: 35.6762,
    longitude: 139.6503,
  },
  {
    id: 'city-bali',
    name: 'Bali',
    country: 'Indonesia',
    region: 'Asia',
    cost_index: 60,
    popularity: 93,
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
    description: 'Tropical paradise with stunning beaches and rich culture',
    best_season: 'Apr - Oct',
    why_visit: 'Tropical beaches, ancient temples, and world-class surfing',
    latitude: -8.3405,
    longitude: 115.0920,
  },
  {
    id: 'city-dubai',
    name: 'Dubai',
    country: 'UAE',
    region: 'Middle East',
    cost_index: 75,
    popularity: 87,
    image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
    description: 'Ultra-modern city with luxury shopping and stunning architecture',
    best_season: 'Nov - Mar',
    why_visit: 'Luxury shopping, futuristic architecture, and desert adventures',
    latitude: 25.2048,
    longitude: 55.2708,
  },
  {
    id: 'city-newyork',
    name: 'New York',
    country: 'USA',
    region: 'North America',
    cost_index: 88,
    popularity: 96,
    image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
    description: 'The city that never sleeps - iconic landmarks and vibrant culture',
    best_season: 'Apr - Jun, Sep - Nov',
    why_visit: 'Iconic skyline, Broadway shows, and endless cultural experiences',
    latitude: 40.7128,
    longitude: -74.0060,
  },
]

/**
 * Static activity categories
 */
export const STATIC_ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: 'cat-historical', name: 'Historical', icon: 'landmark' },
  { id: 'cat-nature', name: 'Nature', icon: 'tree' },
  { id: 'cat-beach', name: 'Beach', icon: 'waves' },
  { id: 'cat-adventure', name: 'Adventure', icon: 'mountain' },
  { id: 'cat-food', name: 'Food', icon: 'utensils' },
  { id: 'cat-shopping', name: 'Shopping', icon: 'shopping-bag' },
  { id: 'cat-culture', name: 'Culture', icon: 'camera' },
  { id: 'cat-nightlife', name: 'Nightlife', icon: 'moon' },
]

/**
 * Initialize local storage with static data if empty
 * This ensures the app works offline from the start
 */
export function initializeLocalData() {
  if (typeof window === 'undefined') return

  // Initialize cities if not present
  const existingCities = localStorage.getItem(STORAGE_KEYS.CITIES)
  if (!existingCities) {
    localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(STATIC_CITIES))
  }

  // Initialize activity categories if not present
  const existingCategories = localStorage.getItem(STORAGE_KEYS.ACTIVITY_CATEGORIES)
  if (!existingCategories) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_CATEGORIES, JSON.stringify(STATIC_ACTIVITY_CATEGORIES))
  }

  // Initialize other collections as empty arrays
  const collections = [
    STORAGE_KEYS.PROFILES,
    STORAGE_KEYS.TRIPS,
    STORAGE_KEYS.TRIP_STOPS,
    STORAGE_KEYS.TRIP_ACTIVITIES,
    STORAGE_KEYS.ACTIVITIES,
  ]

  collections.forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify([]))
    }
  })
}

/**
 * Generic storage helpers
 */
function getStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

function setStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

/**
 * City API - Returns cities from local storage or static data
 */
export const localCityAPI = {
  getAll: (): City[] => {
    const stored = getStorage<City>(STORAGE_KEYS.CITIES)
    // Merge with static cities, preferring stored data
    const staticMap = new Map(STATIC_CITIES.map(c => [c.id, c]))
    stored.forEach(c => staticMap.set(c.id, c))
    return Array.from(staticMap.values())
  },

  getById: (id: string): City | undefined => {
    return localCityAPI.getAll().find(c => c.id === id)
  },

  search: (query: string): City[] => {
    const q = query.toLowerCase()
    return localCityAPI.getAll().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.region?.toLowerCase().includes(q)
    )
  },
}

/**
 * Activity API - Returns activities from local storage
 */
export const localActivityAPI = {
  getAll: (): Activity[] => {
    return getStorage<Activity>(STORAGE_KEYS.ACTIVITIES)
  },

  getByCity: (cityId: string): Activity[] => {
    return localActivityAPI.getAll().filter(a => a.city_id === cityId)
  },

  getByCategory: (categoryId: string): Activity[] => {
    return localActivityAPI.getAll().filter(a => a.category_id === categoryId)
  },
}

/**
 * Trip API - Manages trips in local storage
 */
export const localTripAPI = {
  getAll: (userId?: string): Trip[] => {
    const trips = getStorage<Trip>(STORAGE_KEYS.TRIPS)
    return userId ? trips.filter(t => t.user_id === userId) : trips
  },

  getById: (id: string): Trip | undefined => {
    return localTripAPI.getAll().find(t => t.id === id)
  },

  create: (trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Trip => {
    const newTrip: Trip = {
      ...trip,
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const trips = getStorage<Trip>(STORAGE_KEYS.TRIPS)
    trips.push(newTrip)
    setStorage(STORAGE_KEYS.TRIPS, trips)
    return newTrip
  },

  update: (id: string, updates: Partial<Trip>): Trip | null => {
    const trips = getStorage<Trip>(STORAGE_KEYS.TRIPS)
    const index = trips.findIndex(t => t.id === id)
    if (index === -1) return null
    trips[index] = {
      ...trips[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    setStorage(STORAGE_KEYS.TRIPS, trips)
    return trips[index]
  },

  delete: (id: string): boolean => {
    const trips = getStorage<Trip>(STORAGE_KEYS.TRIPS)
    const filtered = trips.filter(t => t.id !== id)
    setStorage(STORAGE_KEYS.TRIPS, filtered)
    return filtered.length < trips.length
  },
}

/**
 * Trip Stop API - Manages trip stops in local storage
 */
export const localTripStopAPI = {
  getByTrip: (tripId: string): TripStop[] => {
    return getStorage<TripStop>(STORAGE_KEYS.TRIP_STOPS)
      .filter(s => s.trip_id === tripId)
      .sort((a, b) => a.order_index - b.order_index)
  },

  create: (stop: Omit<TripStop, 'id'>): TripStop => {
    const newStop: TripStop = {
      ...stop,
      id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    const stops = getStorage<TripStop>(STORAGE_KEYS.TRIP_STOPS)
    stops.push(newStop)
    setStorage(STORAGE_KEYS.TRIP_STOPS, stops)
    return newStop
  },

  update: (id: string, updates: Partial<TripStop>): TripStop | null => {
    const stops = getStorage<TripStop>(STORAGE_KEYS.TRIP_STOPS)
    const index = stops.findIndex(s => s.id === id)
    if (index === -1) return null
    stops[index] = { ...stops[index], ...updates }
    setStorage(STORAGE_KEYS.TRIP_STOPS, stops)
    return stops[index]
  },

  delete: (id: string): boolean => {
    const stops = getStorage<TripStop>(STORAGE_KEYS.TRIP_STOPS)
    const filtered = stops.filter(s => s.id !== id)
    setStorage(STORAGE_KEYS.TRIP_STOPS, filtered)
    return filtered.length < stops.length
  },

  reorder: (tripId: string, stopIds: string[]): void => {
    const stops = getStorage<TripStop>(STORAGE_KEYS.TRIP_STOPS)
    stopIds.forEach((id, index) => {
      const stop = stops.find(s => s.id === id && s.trip_id === tripId)
      if (stop) {
        stop.order_index = index
      }
    })
    setStorage(STORAGE_KEYS.TRIP_STOPS, stops)
  },
}

/**
 * Trip Activity API - Manages trip activities in local storage
 */
export const localTripActivityAPI = {
  getByStop: (stopId: string): TripActivity[] => {
    return getStorage<TripActivity>(STORAGE_KEYS.TRIP_ACTIVITIES)
      .filter(a => a.trip_stop_id === stopId)
      .sort((a, b) => a.order_index - b.order_index)
  },

  create: (activity: Omit<TripActivity, 'id'>): TripActivity => {
    const newActivity: TripActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    const activities = getStorage<TripActivity>(STORAGE_KEYS.TRIP_ACTIVITIES)
    activities.push(newActivity)
    setStorage(STORAGE_KEYS.TRIP_ACTIVITIES, activities)
    return newActivity
  },

  update: (id: string, updates: Partial<TripActivity>): TripActivity | null => {
    const activities = getStorage<TripActivity>(STORAGE_KEYS.TRIP_ACTIVITIES)
    const index = activities.findIndex(a => a.id === id)
    if (index === -1) return null
    activities[index] = { ...activities[index], ...updates }
    setStorage(STORAGE_KEYS.TRIP_ACTIVITIES, activities)
    return activities[index]
  },

  delete: (id: string): boolean => {
    const activities = getStorage<TripActivity>(STORAGE_KEYS.TRIP_ACTIVITIES)
    const filtered = activities.filter(a => a.id !== id)
    setStorage(STORAGE_KEYS.TRIP_ACTIVITIES, filtered)
    return filtered.length < activities.length
  },
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeLocalData()
}

