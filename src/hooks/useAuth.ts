"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "react-hot-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (!auth) return;
    
    try {
      await signOut(auth);
      toast.success("👋 Logout effettuato con successo");
    } catch (error) {
      console.error("Errore logout:", error);
      toast.error("❌ Errore durante il logout");
    }
  };

  return { user, loading, logout };
}
