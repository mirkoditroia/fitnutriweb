import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-foreground/10">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="font-extrabold tracking-tight text-lg">
          <span className="text-primary">GZ</span>nutrition
        </Link>
        <nav className="hidden sm:flex gap-6 text-sm">
          <Link href="#pacchetti" className="hover:text-primary">Pacchetti</Link>
          <Link href="#faq" className="hover:text-primary">FAQ</Link>
          <Link href="/admin" className="hover:text-primary">Admin</Link>
        </nav>
      </div>
    </header>
  );
}


