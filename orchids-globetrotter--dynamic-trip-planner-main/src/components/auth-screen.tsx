"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, Plane, Mail, Lock, User, Eye, EyeOff, Sparkles, MapPin, ArrowRight } from "lucide-react"
import { toast } from "sonner"

export function AuthScreen() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    confirmPassword: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (mode === "signup") {
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords don't match")
        setLoading(false)
        return
      }
      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters")
        setLoading(false)
        return
      }
      const result = await signup(formData.email, formData.password, formData.fullName)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Account created successfully!")
      }
    } else if (mode === "login") {
      const result = await login(formData.email, formData.password)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Welcome back!")
      }
    } else {
      toast.success("Password reset link sent to your email")
      setMode("login")
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/20 via-background to-accent/20 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center p-12"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="relative w-64 h-64 mx-auto mb-8"
          >
            <div className="absolute inset-0 rounded-full border border-primary/20" />
            <div className="absolute inset-4 rounded-full border border-accent/20" />
            <div className="absolute inset-8 rounded-full border border-primary/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="w-24 h-24 text-primary" />
            </div>
            <motion.div
              animate={{ 
                rotate: -360,
                x: [0, 20, 40, 20, 0],
                y: [0, -30, 0, 30, 0]
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-4 right-4"
            >
              <Plane className="w-8 h-8 text-accent" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-8 left-4"
            >
              <MapPin className="w-6 h-6 text-primary" />
            </motion.div>
          </motion.div>
          
            <h1 className="text-3xl font-bold mb-4">
              <span className="gradient-text">GlobeTrotter</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Plan your perfect journey with ease. Create itineraries, track budgets, and explore the world.
            </p>
            
            <div className="mt-12 flex items-center justify-center gap-8">
              {["Paris", "Tokyo", "Bali"].map((city, i) => (
                <motion.div
                  key={city}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.2 }}
                  className="glass-card px-4 py-2 rounded-full"
                >
                  <span className="text-xs text-muted-foreground font-medium">{city}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden mb-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Globe className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold gradient-text">GlobeTrotter</h1>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-8 border border-white/5">
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">
                  {mode === "login" && "Welcome back"}
                  {mode === "signup" && "Start your journey"}
                  {mode === "forgot" && "Reset password"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {mode === "login" && "Sign in to continue planning your adventures"}
                  {mode === "signup" && "Create an account to start exploring"}
                  {mode === "forgot" && "Enter your email to receive a reset link"}
                </p>
              </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      className="pl-10 bg-secondary/50 border-border/50"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 bg-secondary/50 border-border/50"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-secondary/50 border-border/50"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 bg-secondary/50 border-border/50"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    {mode === "login" && "Sign In"}
                    {mode === "signup" && "Create Account"}
                    {mode === "forgot" && "Send Reset Link"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {mode === "login" && (
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              )}
              {mode === "signup" && (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
              {mode === "forgot" && (
                <button
                  onClick={() => setMode("login")}
                  className="text-primary hover:underline font-medium"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
