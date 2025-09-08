"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

export default function AdminSetupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri");
      setLoading(false);
      return;
    }

    if (!auth) {
      setError("Firebase non configurato");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Aggiorna il profilo utente
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }

      toast.success("✅ Account admin creato con successo!");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");
    } catch (error: any) {
      console.error("Errore creazione admin:", error);
      let errorMessage = "Errore durante la creazione dell'account";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Email già in uso";
          break;
        case "auth/invalid-email":
          errorMessage = "Email non valida";
          break;
        case "auth/weak-password":
          errorMessage = "Password troppo debole";
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
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">🔧 Setup Admin</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Crea il primo account amministratore
        </p>
      </div>
      
      <form className="space-y-6" onSubmit={handleCreateAdmin}>
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
            Nome Admin
          </label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1"
            placeholder="Nome Amministratore"
          />
        </div>

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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Conferma Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1"
            placeholder="••••••••"
          />
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
            {loading ? "⏳ Creazione in corso..." : "🚀 Crea Account Admin"}
          </Button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm font-medium text-black mb-2">💡 Informazioni:</div>
        <div className="text-xs text-black/70 space-y-1">
          <div>• <strong>Sicurezza</strong>: Usa una password forte e unica</div>
          <div>• <strong>Email</strong>: Deve essere un indirizzo email valido</div>
          <div>• <strong>Accesso</strong>: Dopo la creazione potrai accedere con queste credenziali</div>
          <div>• <strong>Gestione</strong>: Puoi creare più account admin se necessario</div>
        </div>
      </div>
    </div>
  );
}
