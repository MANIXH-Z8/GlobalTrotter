import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  language: string
  created_at: string
  updated_at: string
}

export type City = {
  id: string
  name: string
  country: string
  region: string | null
  cost_index: number
  popularity: number
  image_url: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
}

export type ActivityCategory = {
  id: string
  name: string
  icon: string | null
}

export type Activity = {
  id: string
  city_id: string
  category_id: string | null
  name: string
  description: string | null
  image_url: string | null
  estimated_cost: number
  duration_hours: number
  category?: ActivityCategory
  city?: City
}

export type Trip = {
  id: string
  user_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  cover_image: string | null
  is_public: boolean
  share_code: string | null
  total_budget: number
  created_at: string
  updated_at: string
  stops?: TripStop[]
}

export type TripStop = {
  id: string
  trip_id: string
  city_id: string | null
  city_name: string
  country: string | null
  start_date: string | null
  end_date: string | null
  order_index: number
  transport_cost: number
  accommodation_cost: number
  notes: string | null
  activities?: TripActivity[]
  city?: City
}

export type TripActivity = {
  id: string
  trip_stop_id: string
  activity_id: string | null
  name: string
  description: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  duration_hours: number
  estimated_cost: number
  order_index: number
  category: string | null
  is_custom: boolean
}

export type TripExpense = {
  id: string
  trip_id: string
  trip_stop_id: string | null
  category: string
  description: string | null
  amount: number
  date: string | null
}
