"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getAppointments, getCurrentUser } from "@/app/services/api";
import { NavLink } from "@/app/components/ui/nav-link";
import { Scissors, Calendar, Clock, User, ChevronRight, Star } from "lucide-react";

type Appointment = {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  barber: string;
  userId?: string;
};

const BARBERS = ["João", "Carlos", "Rafael"];

const SERVICE_PRICE: Record<string, number> = {
  "Corte": 35,
  "Barba": 25,
  "Corte + Barba": 55,
};

// ─── Vista do ADMIN ───────────────────────────────────────────────────────────
function AdminHome({
  appointments,
  loading,
  notification,
}: {
  appointments: Appointment[];
  loading: boolean;
  notification: string | null;
}) {
  const today = new Date().toISOString().split("T")[0];
  const todayAll = appointments.filter((a) => a.date === today).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-[#C6A75E]">Painel Admin</h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      {notification && (
        <div className="rounded-xl bg-[#C6A75E]/15 border border-[#C6A75E]/40 px-4 py-3 text-[#C6A75E] font-medium text-sm">
          🔔 {notification}
        </div>
      )}

      {/* Cards de resumo do dia */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#121212] border border-[#2a2a2a] p-4">
          <p className="text-gray-500 text-xs">Hoje — total</p>
          <p className="text-3xl font-bold text-white mt-1">{todayAll.length}</p>
        </div>
        {BARBERS.map((b) => {
          const count = todayAll.filter((a) => a.barber === b).length;
          return (
            <div key={b} className="rounded-xl bg-[#121212] border border-[#2a2a2a] p-4">
              <p className="text-gray-500 text-xs">{b}</p>
              <p className="text-3xl font-bold text-[#C6A75E] mt-1">{count}</p>
            </div>
          );
        })}
      </section>

      {/* Agenda de hoje por barbeiro */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Agenda de hoje
        </h2>
        {loading && <p className="text-gray-600">Carregando...</p>}
        {!loading && todayAll.length === 0 && (
          <p className="text-gray-600">Nenhum agendamento para hoje.</p>
        )}
        {!loading && todayAll.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4">
            {BARBERS.map((barber) => {
              const barberToday = todayAll.filter((a) => a.barber === barber);
              return (
                <div key={barber} className="rounded-xl bg-[#121212] border border-[#2a2a2a] p-4 space-y-2">
                  <h3 className="text-[#C6A75E] font-semibold text-sm">{barber}</h3>
                  {barberToday.length === 0 && (
                    <p className="text-gray-700 text-xs">Sem atendimentos hoje</p>
                  )}
                  {barberToday.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-mono">{a.time}</span>
                      <span className="text-gray-400 truncate mx-2">{a.clientName.split(" ")[0]}</span>
                      <span className="text-gray-600">{a.service}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Ações rápidas */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <NavLink href="/home/Agendar">
            <div className="flex items-center gap-3 w-full rounded-xl bg-[#C6A75E] p-4 text-black font-semibold">
              <Calendar size={20} />
              Agendar Cliente
              <ChevronRight size={16} className="ml-auto" />
            </div>
          </NavLink>
          <NavLink href="/home/Editar">
            <div className="flex items-center gap-3 w-full rounded-xl bg-[#1a1a1a] border border-[#3c3c3c] p-4 text-gray-300 font-medium hover:border-[#C6A75E]/50 transition-colors">
              <Clock size={20} className="text-[#C6A75E]" />
              Editar Horário
              <ChevronRight size={16} className="ml-auto text-gray-600" />
            </div>
          </NavLink>
          <NavLink href="/home/Cancelar">
            <div className="flex items-center gap-3 w-full rounded-xl bg-[#1a1a1a] border border-[#3c3c3c] p-4 text-gray-300 font-medium hover:border-red-500/40 transition-colors">
              <Scissors size={20} className="text-red-400" />
              Cancelar Atendimento
              <ChevronRight size={16} className="ml-auto text-gray-600" />
            </div>
          </NavLink>
        </div>
      </section>
    </div>
  );
}

// ─── Vista do CLIENTE ─────────────────────────────────────────────────────────
function CustomerHome({
  appointments,
  loading,
}: {
  appointments: Appointment[];
  loading: boolean;
}) {
  const currentUser = getCurrentUser();
  const myAppointment = appointments.find(
    (a) => a.userId === currentUser?.id
  );

  function formatDate(iso: string) {
    return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  }

  return (
    <div className="space-y-8">
      {/* Hero da barbearia */}
      <section className="rounded-2xl bg-gradient-to-br from-[#1a1610] via-[#161410] to-[#0e0c08] border border-[#C6A75E]/20 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C6A75E]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C6A75E]/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Scissors size={16} className="text-[#C6A75E]" />
            <span className="text-[#C6A75E] text-xs font-semibold uppercase tracking-widest">
              Bem-vindo
            </span>
          </div>
          <h1 className="text-4xl font-black text-white mb-1">
            Old Crown <span className="text-[#C6A75E]">Barbearia</span>
          </h1>
          <p className="text-gray-400 max-w-sm">
            Estilo, precisão e tradição. O melhor atendimento da cidade, para você que valoriza um corte de qualidade.
          </p>
          <div className="flex items-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={14} fill="#C6A75E" className="text-[#C6A75E]" />
            ))}
            <span className="text-gray-500 text-xs ml-2">Avaliação top da cidade</span>
          </div>
        </div>
      </section>

      {/* Meu agendamento */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Meu agendamento
        </h2>
        {loading && <p className="text-gray-600">Carregando...</p>}

        {!loading && !myAppointment && (
          <div className="rounded-xl bg-[#121212] border border-dashed border-[#3c3c3c] p-6 text-center">
            <p className="text-gray-500 mb-4">Você não tem nenhum agendamento ativo.</p>
            <NavLink href="/home/Agendar">
              <div className="inline-flex items-center gap-2 rounded-xl bg-[#C6A75E] px-6 py-3 text-black font-semibold">
                <Calendar size={18} />
                Agendar agora
              </div>
            </NavLink>
          </div>
        )}

        {!loading && myAppointment && (
          <div className="rounded-xl bg-[#121212] border border-[#C6A75E]/30 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#C6A75E] font-bold text-lg">
                  {formatDate(myAppointment.date)}
                </p>
                <p className="text-white text-2xl font-black">{myAppointment.time}</p>
              </div>
              <span className="rounded-full bg-green-500/15 text-green-400 text-xs font-semibold px-3 py-1 border border-green-500/30">
                Confirmado
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-[#2a2a2a] pt-4">
              <div>
                <p className="text-gray-600 text-xs">Barbeiro</p>
                <p className="text-gray-200 text-sm font-medium">{myAppointment.barber}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Serviço</p>
                <p className="text-gray-200 text-sm font-medium">{myAppointment.service}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Valor</p>
                <p className="text-[#C6A75E] text-sm font-bold">
                  R$ {(SERVICE_PRICE[myAppointment.service] ?? 0).toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <NavLink href="/home/Editar">
                <div className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] px-4 py-2 text-gray-300 text-sm font-medium hover:border-[#C6A75E]/40 transition-colors">
                  <Clock size={15} />
                  Editar horário
                </div>
              </NavLink>
              <NavLink href="/home/Cancelar">
                <div className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] px-4 py-2 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
                  <Scissors size={15} />
                  Cancelar
                </div>
              </NavLink>
            </div>
          </div>
        )}
      </section>

      {/* Nossos serviços */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Nossos serviços
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: "Corte", price: 35, desc: "Corte moderno com acabamento perfeito" },
            { name: "Barba", price: 25, desc: "Barba alinhada e aparada com navalha" },
            { name: "Corte + Barba", price: 55, desc: "Combo completo com desconto especial" },
          ].map((s) => (
            <div key={s.name} className="rounded-xl bg-[#121212] border border-[#2a2a2a] p-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">{s.name}</p>
                <p className="text-[#C6A75E] font-bold">R$ {s.price}</p>
              </div>
              <p className="text-gray-600 text-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Nossos barbeiros */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Nossos barbeiros
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {BARBERS.map((b) => (
            <div key={b} className="rounded-xl bg-[#121212] border border-[#2a2a2a] p-4 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#C6A75E]/15 border border-[#C6A75E]/30 flex items-center justify-center">
                <User size={22} className="text-[#C6A75E]" />
              </div>
              <p className="text-white font-medium text-sm">{b}</p>
              <p className="text-gray-600 text-xs">Barbeiro profissional</p>
            </div>
          ))}
        </div>
      </section>

      {/* Horário de funcionamento */}
      <section className="rounded-xl bg-[#121212] border border-[#2a2a2a] p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Horário de funcionamento
        </h2>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Segunda a Sábado</span>
          <span className="text-white font-medium">08:00 — 18:00</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Domingo</span>
          <span className="text-red-400 font-medium">Fechado</span>
        </div>
      </section>
    </div>
  );
}

// ─── Vista do BARBEIRO ────────────────────────────────────────────────────────
function BarberHome({
  appointments,
  loading,
  notification,
}: {
  appointments: Appointment[];
  loading: boolean;
  notification: string | null;
}) {
  const currentUser = getCurrentUser();
  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  const total = appointments.length;
  const todayCount = todayAppts.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-[#C6A75E]">
          Minha Agenda — {currentUser?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      {notification && (
        <div className="rounded-xl bg-[#C6A75E]/15 border border-[#C6A75E]/40 px-4 py-3 text-[#C6A75E] font-medium text-sm">
          🔔 {notification}
        </div>
      )}

      {/* Resumo */}
      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#121212] border border-[#2a2a2a] p-4">
          <p className="text-gray-500 text-xs">Hoje</p>
          <p className="text-3xl font-bold text-[#C6A75E] mt-1">{todayCount}</p>
        </div>
        <div className="rounded-xl bg-[#121212] border border-[#2a2a2a] p-4">
          <p className="text-gray-500 text-xs">Esta semana</p>
          <p className="text-3xl font-bold text-white mt-1">{total}</p>
        </div>
      </section>

      {/* Lista de hoje */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Atendimentos de hoje
        </h2>
        {loading && <p className="text-gray-600">Carregando...</p>}
        {!loading && todayAppts.length === 0 && (
          <p className="text-gray-600">Nenhum atendimento hoje.</p>
        )}
        {!loading && todayAppts.length > 0 && (
          <div className="space-y-2">
            {todayAppts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-[#121212] border border-[#2a2a2a] px-4 py-3">
                <span className="text-gray-300 font-mono text-sm">{a.time}</span>
                <span className="text-white font-medium text-sm">{a.clientName}</span>
                <span className="text-gray-500 text-xs">{a.service}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ações rápidas */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <NavLink href="/home/Agendar">
            <div className="flex items-center gap-3 w-full rounded-xl bg-[#C6A75E] p-4 text-black font-semibold">
              <Calendar size={20} />
              Agendar Cliente
              <ChevronRight size={16} className="ml-auto" />
            </div>
          </NavLink>
          <NavLink href="/home/Editar">
            <div className="flex items-center gap-3 w-full rounded-xl bg-[#1a1a1a] border border-[#3c3c3c] p-4 text-gray-300 font-medium hover:border-[#C6A75E]/50 transition-colors">
              <Clock size={20} className="text-[#C6A75E]" />
              Editar Horário
              <ChevronRight size={16} className="ml-auto text-gray-600" />
            </div>
          </NavLink>
          <NavLink href="/home/Cancelar">
            <div className="flex items-center gap-3 w-full rounded-xl bg-[#1a1a1a] border border-[#3c3c3c] p-4 text-gray-300 font-medium hover:border-red-500/40 transition-colors">
              <Scissors size={20} className="text-red-400" />
              Cancelar Atendimento
              <ChevronRight size={16} className="ml-auto text-gray-600" />
            </div>
          </NavLink>
        </div>
      </section>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Home() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const today = new Date().toISOString().split("T")[0];

  async function loadAppointments() {
    try {
      setAppointments(await getAppointments());
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadAppointments();

    const socket = io("http://localhost:3333");

    socket.on("appointment:created", (appt: Appointment) => {
      if (isAdmin) {
        setNotification(`Novo agendamento: ${appt.clientName} às ${appt.time}`);
        setTimeout(() => setNotification(null), 4000);
      }
      if (appt.date === today) {
        setAppointments((prev) =>
          [...prev, appt].sort((a, b) => a.time.localeCompare(b.time))
        );
      }
    });

    socket.on("appointment:canceled", ({ id }: { id: string }) => {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    });

    socket.on("appointment:updated", (appt: Appointment) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? appt : a))
      );
    });

    return () => { socket.disconnect(); };
  }, []);

  if (isAdmin) {
    return <AdminHome appointments={appointments} loading={loading} notification={notification} />;
  }

  if (currentUser?.role === "BARBER") {
    return <BarberHome appointments={appointments} loading={loading} notification={notification} />;
  }

  return <CustomerHome appointments={appointments} loading={loading} />;
}
