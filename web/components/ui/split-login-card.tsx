"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface SplitLoginCardProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SplitLoginCard({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onSubmit
}: SplitLoginCardProps) {
  return (
    <div className="flex flex-col md:flex-row w-full max-w-5xl mx-auto shadow-2xl rounded-2xl overflow-hidden bg-white border dark:border-white/10 dark:bg-[#09090b]">
      
      {/* Left Side: Welcome + Illustration */}
      <div className="md:w-1/2 bg-[#020617] relative text-white flex flex-col items-center justify-center overflow-hidden min-h-[400px]">
        {/* Background Aviation Image */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop")' }}
        ></div>
        
        <div className="relative z-10 flex flex-col items-center p-10 text-center">
          <img
            src="/logos/logo.png"
            alt="ERNAM Logo"
            className="w-24 mb-6 drop-shadow-lg"
          />
          <h2 className="text-3xl font-bold mb-4 tracking-tight">ERNAM Portal</h2>
          <p className="mb-6 text-gray-300 max-w-sm">
            Aviation Training, Governed Digitally. Sign in for authorized access to certification sessions and management.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-[#09090b]">
        <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white tracking-tight">Secure Sign In</h3>
        <p className="text-sm text-gray-500 mb-8">Please sign in to your authorized account</p>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
            <Label htmlFor="remember" className="text-sm font-normal text-gray-600 dark:text-gray-400 cursor-pointer">Remember me</Label>
          </div>

          {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  {error}
              </div>
          )}

          <Button type="submit" className="mt-4 w-full h-11 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in to Dashboard"}
          </Button>

          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
            Don’t have an ERNAM digital account? <br/>
            <Link href="/apply" className="text-blue-600 hover:underline font-medium mt-1 inline-block">Apply for authorization</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
