"use client";
import React from "react";
import { User } from "firebase/auth";
import { AdminLogin } from "./AdminLogin";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

interface AdminProtectedProps {
  children: React.ReactNode;
}

export function AdminProtected({ children }: AdminProtectedProps) {
  const { user, loading } = useAuth();

  const handleLoginSuccess = (user: User) => {
    toast.success(`👋 Benvenuto, ${user.email}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
        <div className="text-center mt-8">
          <p className="text-sm text-foreground/60">
            Hai problemi di accesso? Scrivi a <a href="mailto:fitnutriweb@gmail.com" className="underline text-primary">fitnutriweb@gmail.com</a>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
