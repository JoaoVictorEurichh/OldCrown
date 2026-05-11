"use client";

import { useEffect, useState } from "react";
import { getAppointments } from "@/app/services/api";
import { NavLink } from "@/app/components/ui/nav-link";

type Appointment = {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
};

export default function Home() {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const data = await getAppointments();

        // pega data de hoje no formato yyyy-mm-dd
        const today = new Date().toISOString().split("T")[0];

        // filtra somente agendamentos de hoje
        const todayList = data.filter((item: Appointment) => item.date === today);

        // ordena por horário
        todayList.sort((a: Appointment, b: Appointment) =>
          a.time.localeCompare(b.time)
        );

        setTodayAppointments(todayList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-[#C6A75E]">Sua Agenda</h1>
      <p className="text-gray-300">
        Acompanhe seus horários, confirme os atendimentos e visualize o calendário.
      </p>

      <section className="grid gap-4 lg:grid-cols-3">
        
        <article className="rounded-xl border border-[#3c3c3c] bg-[#121212] p-4">
          <h2 className="text-xl font-semibold text-[#C6A75E] mb-3">Hoje</h2>

          {loading && <p className="text-gray-400">Carregando...</p>}

          {!loading && todayAppointments.length === 0 && (
            <p className="text-gray-400">Nenhum corte agendado hoje ✂️</p>
          )}

          {!loading &&
            todayAppointments.map((appt) => (
              <p key={appt.id} className="text-gray-300">
                {appt.time} - {appt.clientName} ({appt.service})
              </p>
            ))}
        </article>

        <article className="rounded-xl border border-[#3c3c3c] bg-[#121212] p-4">
          <h2 className="text-xl font-semibold text-[#C6A75E]">Ações rápidas</h2>
          <ul className="list-disc pl-5 text-gray-400 space-y-1">
            <NavLink href="/home/Agendar">Agendar cliente</NavLink>
            <NavLink href="/home/Cancelar">Cancelar atendimento</NavLink>
            <NavLink href="/home/Editar">Editar horário</NavLink>
          </ul>
        </article>

        <article className="rounded-xl border border-[#3c3c3c] bg-[#121212] p-4">
          <h2 className="text-xl font-semibold text-[#C6A75E]">Próximos dias</h2>
          <p className="text-gray-400">Em breve 👀</p>
        </article>

      </section>
    </div>
  );
}