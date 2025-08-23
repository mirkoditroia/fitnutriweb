export function Footer() {
  return (
    <footer className="border-t border-foreground/10 mt-16">
      <div className="container py-8 text-sm text-foreground/70 flex items-center justify-between">
        <p>© {new Date().getFullYear()} GZnutrition</p>
        <nav className="hidden sm:flex gap-4">
          <a href="#pacchetti" className="hover:text-primary">Pacchetti</a>
          <a href="#faq" className="hover:text-primary">FAQ</a>
        </nav>
      </div>
    </footer>
  );
}


