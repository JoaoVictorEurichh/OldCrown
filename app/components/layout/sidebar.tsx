import { NavLink } from "../ui/nav-link";
import { Home, Package, Settings } from "lucide-react";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="min-h-screen bg-gradient-to-b from-[#1b1b1b] via-[#131313] to-[#0b0b0b] text-white">
      <header className="px-6 py-4">
        <h1 className="text-2xl font-black text-[#C6A75E]">OLD CROWN</h1>
        <p className="text-gray-400">Barbearia</p>
      </header>

      <nav className="px-6 flex items-center gap-4">
        <NavLink href="/home">
          <Home size={20} />
          Agenda
        </NavLink>
        <NavLink href="/login">
          <Package size={20} />
          Login
        </NavLink>
        <NavLink href="/relatorios">
          <Settings size={20} />
          Relatórios
        </NavLink>
      </nav>

      <main className="p-6">{children}</main>

      <footer className="border-t border-[#2a2a2a] p-4 text-center text-sm text-gray-500">
        © 2026 Old Crown Barbearia
      </footer>
    </aside>
  );
}