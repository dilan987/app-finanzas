export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="hidden border-t border-border-primary px-6 py-4 sm:block">
      <p className="text-center text-xs text-text-tertiary">
        &copy; {year} Finanzas App. Todos los derechos reservados.
      </p>
    </footer>
  );
}
