"use client";
import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

interface AdminLoginProps {
  onLoginSuccess: (user: User) => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!auth) {
      setError("Firebase non configurato");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success("✅ Accesso effettuato con successo!");
      onLoginSuccess(userCredential.user);
    } catch (error: any) {
      console.error("Errore login:", error);
      let errorMessage = "Errore durante l'accesso";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Utente non trovato";
          break;
        case "auth/wrong-password":
          errorMessage = "Password errata";
          break;
        case "auth/invalid-email":
          errorMessage = "Email non valida";
          break;
        case "auth/too-many-requests":
          errorMessage = "Troppi tentativi. Riprova più tardi";
          break;
        case "auth/network-request-failed":
          errorMessage = "Errore di connessione";
          break;
        default:
          errorMessage = error.message || "Errore sconosciuto";
      }
      
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">🔐 Admin Access</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="admin@gznutrition.it"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? "⏳ Accesso in corso..." : "🚀 Accedi"}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-foreground/50">
            Solo gli amministratori autorizzati possono accedere
          </p>
        </div>
      </div>
    </div>
  );
}

