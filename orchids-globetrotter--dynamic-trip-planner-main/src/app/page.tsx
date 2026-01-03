/**
 * Main Application Page - Screen Router
 * 
 * This component serves as the central router for the application, managing
 * screen state and navigation flow. It demonstrates:
 * 
 * 1. Screen-based routing (single-page app architecture)
 * 2. Authentication flow integration
 * 3. Shared trip URL handling
 * 4. State management for selected trips and navigation
 * 
 * Architecture Notes:
 * - Uses a simple state machine pattern for screen management
 * - All screens are rendered conditionally based on current screen state
 * - Shared trip URLs are detected via query parameters
 * - Trip data flows through props to child components
 */

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { AuthScreen } from "@/components/auth-screen"
import { Dashboard } from "@/components/dashboard"
import { Navbar } from "@/components/navbar"
import { TripBuilder } from "@/components/trip-builder"
import { TripView } from "@/components/trip-view"
import { CitySearch } from "@/components/city-search"
import { ActivitySearch } from "@/components/activity-search"
import { BudgetScreen } from "@/components/budget-screen"
import { CalendarView } from "@/components/calendar-view"
import { SharedTripView } from "@/components/shared-trip-view"
import { ProfileScreen } from "@/components/profile-screen"
import { MyTrips } from "@/components/my-trips"
import { DestinationSuggestions } from "@/components/destination-suggestions"
import { Trip } from "@/lib/supabase"
import { Globe, Plane, MapPin, Compass } from "lucide-react"
import { toast } from "sonner"

type Screen = 
  "auth" 
  | "dashboard" 
  | "create-trip" 
  | "my-trips" 
  | "trip-view" 
  | "itinerary-builder"
  | "city-search" 
  | "activity-search" 
  | "budget" 
  | "calendar" 
  | "shared-trip" 
  | "profile"
  | "discover"

export default function Home() {
  const { user, loading } = useAuth()
  const [screen, setScreen] = useState<Screen>("auth")
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const { scrollYProgress } = useScroll()

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -500])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -150])
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45])
  
  const smoothY1 = useSpring(y1, { damping: 15, stiffness: 100 })
  const smoothY2 = useSpring(y2, { damping: 15, stiffness: 100 })
  const smoothY3 = useSpring(y3, { damping: 15, stiffness: 100 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40
      })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    // Check for shared trip code in URL
    const urlParams = new URLSearchParams(window.location.search)
    const shareCode = urlParams.get('share')
    
    if (shareCode) {
      setScreen("shared-trip")
      // Store share code for shared trip view
      localStorage.setItem('globetrotter_share_code', shareCode)
    } else if (!loading) {
      if (user) {
        setScreen("dashboard")
      } else {
        setScreen("auth")
      }
    }
  }, [user, loading])

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip)
    setScreen("trip-view")
  }

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    setScreen("itinerary-builder")
  }

  const handleAddActivity = (stopId: string) => {
    setSelectedStopId(stopId)
    setScreen("activity-search")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center bg-grid overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 relative z-10"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 rounded-full border-2 border-primary/30 flex items-center justify-center"
            >
              <Globe className="w-12 h-12 text-primary" />
            </motion.div>
            <motion.div
              animate={{ 
                x: [0, 30, 60, 30, 0],
                y: [0, -20, 0, 20, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <Plane className="w-6 h-6 text-accent" />
            </motion.div>
          </div>
          <div className="flex items-center gap-2">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </motion.div>
        
        {/* Animated background elements for loading */}
        <div className="fixed inset-0 pointer-events-none">
          <motion.div
            animate={{ 
              x: [0, 100, 0],
              y: [0, 50, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              x: [0, -100, 0],
              y: [0, -50, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          className="absolute inset-0 bg-grid opacity-30"
          style={{ 
            x: mousePosition.x * 0.2,
            y: mousePosition.y * 0.2
          }}
        />
        
        <motion.div 
          className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"
          style={{ 
            x: mousePosition.x * -0.5,
            y: mousePosition.y * -0.5,
            translateY: smoothY1
          }}
        />
        <motion.div 
          className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]"
          style={{ 
            x: mousePosition.x * 0.5,
            y: mousePosition.y * 0.5,
            translateY: smoothY2
          }}
        />
        <motion.div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px]"
          style={{ 
            x: mousePosition.x * 0.1,
            y: mousePosition.y * 0.1,
            rotate
          }}
        />

        {/* Floating Icons */}
        <motion.div
          className="absolute top-20 right-[15%] text-primary/20"
          style={{ y: smoothY3, rotate: rotate }}
        >
          <MapPin size={80} strokeWidth={0.5} />
        </motion.div>
        <motion.div
          className="absolute bottom-40 left-[10%] text-accent/20"
          style={{ y: smoothY1, rotate: -rotate }}
        >
          <Compass size={100} strokeWidth={0.5} />
        </motion.div>
      </div>
      
      {user && screen !== "auth" && (
        <Navbar 
          currentScreen={screen}
          onNavigate={setScreen}
          onLogout={() => setScreen("auth")}
        />
      )}
      
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 1.02 }}
            transition={{ 
              type: "spring",
              damping: 20,
              stiffness: 100
            }}
            className="w-full"
          >
            {screen === "auth" && <AuthScreen />}
            
            {screen === "dashboard" && (
              <Dashboard 
                onCreateTrip={() => setScreen("create-trip")}
                onViewTrip={handleTripSelect}
                onViewAllTrips={() => setScreen("my-trips")}
                onExplore={() => setScreen("discover")}
              />
            )}
            
            {screen === "create-trip" && (
              <TripBuilder 
                trip={null}
                onSave={(trip) => {
                  setSelectedTrip(trip)
                  setScreen("itinerary-builder")
                }}
                onCancel={() => setScreen("dashboard")}
              />
            )}
            
            {screen === "my-trips" && (
              <MyTrips 
                onSelectTrip={handleTripSelect}
                onEditTrip={handleEditTrip}
                onCreateTrip={() => setScreen("create-trip")}
              />
            )}
            
            {screen === "trip-view" && selectedTrip && (
              <TripView 
                trip={selectedTrip}
                onEdit={() => setScreen("itinerary-builder")}
                onViewBudget={() => setScreen("budget")}
                onViewCalendar={() => setScreen("calendar")}
                onBack={() => setScreen("my-trips")}
              />
            )}
            
            {screen === "itinerary-builder" && selectedTrip && (
              <TripBuilder 
                trip={selectedTrip}
                onSave={(trip) => {
                  setSelectedTrip(trip)
                  setScreen("trip-view")
                }}
                onCancel={() => setScreen("trip-view")}
                onAddActivity={handleAddActivity}
                onSearchCity={() => setScreen("city-search")}
                onDiscover={() => setScreen("discover")}
              />
            )}
            
            {screen === "city-search" && (
              <CitySearch 
                trip={selectedTrip}
                onAddToTrip={() => {
                  if (selectedTrip) {
                    setScreen("itinerary-builder")
                  }
                }}
                onBack={() => selectedTrip ? setScreen("itinerary-builder") : setScreen("dashboard")}
              />
            )}
            
            {screen === "activity-search" && (
              <ActivitySearch 
                stopId={selectedStopId}
                onBack={() => setScreen("itinerary-builder")}
              />
            )}
            
            {screen === "budget" && selectedTrip && (
              <BudgetScreen 
                trip={selectedTrip}
                onBack={() => setScreen("trip-view")}
              />
            )}
            
            {screen === "calendar" && selectedTrip && (
              <CalendarView 
                trip={selectedTrip}
                onBack={() => setScreen("trip-view")}
              />
            )}
            
            {screen === "discover" && (
              <DestinationSuggestions 
                trip={selectedTrip}
                onAddToTrip={() => {}}
                onBack={() => selectedTrip ? setScreen("itinerary-builder") : setScreen("dashboard")}
              />
            )}
            
            {screen === "profile" && (
              <ProfileScreen 
                onBack={() => setScreen("dashboard")}
              />
            )}
            
            {screen === "shared-trip" && (
              <SharedTripView 
                shareCode={localStorage.getItem('globetrotter_share_code') || ''}
                onCopyTrip={(trip) => {
                  if (user) {
                    setSelectedTrip(trip)
                    setScreen("trip-view")
                  } else {
                    setScreen("auth")
                    toast.info("Please sign in to copy this trip")
                  }
                }}
                onBack={() => {
                  localStorage.removeItem('globetrotter_share_code')
                  if (user) {
                    setScreen("dashboard")
                  } else {
                    setScreen("auth")
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />
    </div>
  )
}
