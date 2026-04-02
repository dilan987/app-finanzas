export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        &copy; {year} Finanzas App. Todos los derechos reservados.
      </p>
    </footer>
  );
}
