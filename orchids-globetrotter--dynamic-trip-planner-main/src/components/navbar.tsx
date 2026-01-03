"use client"

import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { 
  Globe, 
  Home, 
  Map, 
  User, 
  LogOut, 
  Plus,
  Sparkles,
  Menu,
  X
} from "lucide-react"
import { useState } from "react"

type Screen = 
  | "auth" 
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

type NavbarProps = {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
  onLogout: () => void
}

export function Navbar({ currentScreen, onNavigate, onLogout }: NavbarProps) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const navItems = [
    { screen: "dashboard" as Screen, icon: Home, label: "Home" },
    { screen: "my-trips" as Screen, icon: Map, label: "My Trips" },
    { screen: "discover" as Screen, icon: Sparkles, label: "Discover" },
    { screen: "profile" as Screen, icon: User, label: "Profile" },
  ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass border-b border-border/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 group"
          >
            <motion.div
              whileHover={{ rotate: 20 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Globe className="w-8 h-8 text-primary" />
            </motion.div>
            <span className="text-xl font-bold gradient-text hidden sm:block">GlobeTrotter</span>
          </button>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.screen}
                  variant={currentScreen === item.screen ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate(item.screen)}
                  className="gap-2 relative group"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <item.icon className={`w-4 h-4 ${currentScreen === item.screen ? "text-primary" : "text-muted-foreground"}`} />
                  </motion.div>
                  {item.label}
                  {currentScreen === item.screen && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary/10 rounded-md -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => onNavigate("create-trip")}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 hidden sm:flex shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  New Trip
                </Button>
              </motion.div>


            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-medium">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
                <span className="text-sm font-medium max-w-[100px] truncate">
                  {user?.full_name || user?.email?.split("@")[0] || "User"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur"
        >
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.screen}
                variant={currentScreen === item.screen ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => {
                  onNavigate(item.screen)
                  setMobileMenuOpen(false)
                }}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            ))}
            <Button
              onClick={() => {
                onNavigate("create-trip")
                setMobileMenuOpen(false)
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-3 justify-start"
            >
              <Plus className="w-5 h-5" />
              New Trip
            </Button>
            <div className="border-t border-border/50 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-medium">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-medium">
                    {user?.full_name || user?.email?.split("@")[0] || "User"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
