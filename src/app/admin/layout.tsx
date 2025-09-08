import Link from "next/link";
import { AdminProtected } from "@/components/AdminProtected";
import { AdminHeader } from "@/components/AdminHeader";

export const metadata = {
  title: "Admin | GZnutrition",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtected>
      <div className="min-h-screen bg-background">
        <AdminHeader />
      
        {/* Contenuto principale con padding-top per compensare l'header fisso */}
        <main className="container mx-auto px-4 py-8 pt-12">
          {children}
        </main>
      </div>
    </AdminProtected>
  );
}


