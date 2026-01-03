"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, Profile } from './supabase'

type AuthContextType = {
  user: Profile | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  logout: () => void
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('globetrotter_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const passwordHash = await hashPassword(password)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password_hash', passwordHash)
      .single()

    if (error || !data) {
      return { error: 'Invalid email or password' }
    }

    const profile: Profile = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      language: data.language,
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    setUser(profile)
    localStorage.setItem('globetrotter_user', JSON.stringify(profile))
    return {}
  }

  const signup = async (email: string, password: string, fullName: string) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return { error: 'Email already registered' }
    }

    const passwordHash = await hashPassword(password)

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName
      })
      .select()
      .single()

    if (error) {
      return { error: 'Failed to create account' }
    }

    const profile: Profile = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      language: data.language,
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    setUser(profile)
    localStorage.setItem('globetrotter_user', JSON.stringify(profile))
    return {}
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('globetrotter_user')
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not logged in' }

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      return { error: 'Failed to update profile' }
    }

    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('globetrotter_user', JSON.stringify(updatedUser))
    return {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
