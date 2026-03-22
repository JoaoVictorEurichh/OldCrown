import Link from "next/link";
import { NavLink } from "@/app/components/ui/nav-link";

export default function Home() {
  return (
      <div className="space-y-6">
        <h1 className="text-5xl font-bold text-[#C6A75E]">Sua Agenda</h1>
        <p className="text-gray-300">Acompanhe seus horários, confirme os atendimentos e visualize o calendário.</p>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-[#3c3c3c] bg-[#121212] p-4">
            <h2 className="text-xl font-semibold text-[#C6A75E]">Hoje</h2>
            <p className="text-gray-400">8:00 - Corte de cabelo</p>
            <p className="text-gray-400">10:00 - Barba</p>
          </article>
          <article className="rounded-xl border border-[#3c3c3c] bg-[#121212] p-4">
            <h2 className="text-xl font-semibold text-[#C6A75E]">Ações rápidas</h2>
            <ul className="list-disc pl-5 text-gray-400">
              <NavLink href="/home/Agendar">
                  Agendar cliente
              </NavLink>
              <NavLink href="/home/Cancelar">
                  Cancelar atendimento
              </NavLink>
              <NavLink href="/home/Editar">
                  Editar horário
              </NavLink>
            </ul>
          </article>
          <article className="rounded-xl border border-[#3c3c3c] bg-[#121212] p-4">
            <h2 className="text-xl font-semibold text-[#C6A75E]">Próximos dias</h2>
            <p className="text-gray-400">Quarta-feira: 2 atendimentos</p>
            <p className="text-gray-400">Quinta-feira: 4 atendimentos</p>
          </article>
        </section>
      </div>
  );
}
