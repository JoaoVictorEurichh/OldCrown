"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavLink } from "../ui/nav-link";
import { Home, BarChart2, LogOut, Scissors, Users } from "lucide-react";
import { getCurrentUser, type CurrentUser } from "@/app/services/api";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  }

  const isAdmin = user?.role === "ADMIN";
  const isBarber = user?.role === "BARBER";

  const roleLabel = isAdmin ? "Administrador" : isBarber ? "Barbeiro" : "Cliente";
  const homeLabel = isAdmin ? "Painel" : isBarber ? "Minha Agenda" : "Início";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar fixa à esquerda */}
      <aside className="w-56 shrink-0 flex flex-col bg-gradient-to-b from-[#161616] to-[#0e0e0e] border-r border-[#2a2a2a]">
        {/* Logo */}
        <header className="px-5 pt-6 pb-5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#C6A75E] flex items-center justify-center shrink-0">
              <Scissors size={16} className="text-black" />
            </div>
            <div>
              <h1 className="text-base font-black text-[#C6A75E] leading-none">OLD CROWN</h1>
              <p className="text-gray-600 text-[10px]">Barbearia</p>
            </div>
          </div>

          {user && (
            <div className="rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <p className="text-gray-500 text-[10px]">{roleLabel}</p>
            </div>
          )}
        </header>

        {/* Links de navegação */}
        <nav className="px-3 py-4 flex flex-col gap-1 flex-1">
          <NavLink href="/home">
            <Home size={17} />
            {homeLabel}
          </NavLink>

          {isAdmin && (
            <NavLink href="/barbeiros">
              <Users size={17} />
              Barbeiros
            </NavLink>
          )}

          {(isAdmin || isBarber) && (
            <NavLink href="/relatorios">
              <BarChart2 size={17} />
              {isAdmin ? "Relatórios" : "Meu Relatório"}
            </NavLink>
          )}
        </nav>

        {/* Rodapé */}
        <footer className="px-3 pb-5 border-t border-[#2a2a2a] pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={17} />
            Sair
          </button>
          <p className="text-center text-[10px] text-gray-700 mt-3">© 2026 Old Crown</p>
        </footer>
      </aside>

      {/* Área de conteúdo */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
