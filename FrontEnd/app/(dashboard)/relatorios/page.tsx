"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAppointments, getCurrentUser } from "@/app/services/api";
import { TrendingUp, Scissors, DollarSign, Calendar } from "lucide-react";

type Appointment = {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  barber: string;
};

type Periodo = "semanal" | "mensal";

const BARBERS = ["João", "Carlos", "Rafael"];

const SERVICE_PRICE: Record<string, number> = {
  "Corte": 35,
  "Barba": 25,
  "Corte + Barba": 55,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRange(periodo: Periodo) {
  const now = new Date();
  if (periodo === "semanal") {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
      label: `${fmt(monday)} – ${fmt(sunday)}`,
    };
  } else {
    const year = now.getFullYear();
    const month = now.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      label: now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  }
}

function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  const cur = new Date(start + "T12:00:00");
  const endDate = new Date(end + "T12:00:00");
  while (cur <= endDate) {
    if (cur.getDay() !== 0) days.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function calcStats(appts: Appointment[]) {
  const total = appts.length;
  const receita = appts.reduce((s, a) => s + (SERVICE_PRICE[a.service] ?? 0), 0);
  const ticketMedio = total > 0 ? receita / total : 0;
  const servicos = appts.reduce<Record<string, number>>((acc, a) => {
    acc[a.service] = (acc[a.service] ?? 0) + 1;
    return acc;
  }, {});
  return { total, receita, ticketMedio, servicos };
}

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Seletor de período ───────────────────────────────────────────────────────

function PeriodoTabs({ value, onChange }: { value: Periodo; onChange: (p: Periodo) => void }) {
  return (
    <div className="flex gap-2">
      {(["semanal", "mensal"] as Periodo[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
            value === p
              ? "bg-[#C6A75E] text-black"
              : "bg-[#1a1a1a] text-gray-400 border border-[#3c3c3c] hover:bg-[#252525]"
          }`}
        >
          {p === "semanal" ? "Semanal" : "Mensal"}
        </button>
      ))}
    </div>
  );
}

// ─── Vista do BARBEIRO ────────────────────────────────────────────────────────

function BarberReport({ appointments }: { appointments: Appointment[] }) {
  const currentUser = getCurrentUser();
  const [periodo, setPeriodo] = useState<Periodo>("semanal");

  const range = getRange(periodo);
  const filtered = appointments.filter(
    (a) => a.date >= range.start && a.date <= range.end
  );
  const stats = calcStats(filtered);
  const days = getDaysInRange(range.start, range.end);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#C6A75E]">
            Meu Relatório
          </h1>
          <p className="text-gray-500 mt-1">
            {currentUser?.name} · {range.label}
          </p>
        </div>
        <PeriodoTabs value={periodo} onChange={setPeriodo} />
      </div>

      {/* Cards de resumo */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#121212] border border-[#C6A75E]/40 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#C6A75E]/15 flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-[#C6A75E]" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Atendimentos</p>
            <p className="text-3xl font-black text-[#C6A75E]">{stats.total}</p>
          </div>
        </div>

        <div className="rounded-xl bg-[#121212] border border-[#C6A75E]/40 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#C6A75E]/15 flex items-center justify-center shrink-0">
            <DollarSign size={18} className="text-[#C6A75E]" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Receita</p>
            <p className="text-3xl font-black text-[#C6A75E]">R$ {fmt(stats.receita)}</p>
          </div>
        </div>

        <div className="rounded-xl bg-[#121212] border border-[#C6A75E]/40 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#C6A75E]/15 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-[#C6A75E]" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Ticket médio</p>
            <p className="text-3xl font-black text-[#C6A75E]">R$ {fmt(stats.ticketMedio)}</p>
          </div>
        </div>
      </section>

      {/* Serviços + dia a dia */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Por serviço */}
        <div className="rounded-xl bg-[#121212] border border-[#2a2a2a] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Por serviço</h2>
          {Object.keys(SERVICE_PRICE).map((s) => {
            const count = stats.servicos[s] ?? 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={s} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{s}</span>
                  <span className="text-[#C6A75E] font-medium">
                    {count}x · R$ {fmt(count * SERVICE_PRICE[s])}
                  </span>
                </div>
                <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C6A75E] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {stats.total === 0 && <p className="text-gray-600 text-sm">Sem atendimentos no período</p>}
        </div>

        {/* Dia a dia */}
        <div className="rounded-xl bg-[#121212] border border-[#2a2a2a] p-5 space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {periodo === "semanal" ? "Dia a dia" : "Por semana"}
          </h2>
          {periodo === "semanal"
            ? days.map((date) => {
                const dayAppts = filtered.filter((a) => a.date === date);
                const dayReceita = dayAppts.reduce((s, a) => s + (SERVICE_PRICE[a.service] ?? 0), 0);
                const label = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "short", day: "2-digit", month: "2-digit",
                });
                return (
                  <div key={date} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 capitalize w-28">{label}</span>
                    <span className="text-white font-medium w-8 text-center">{dayAppts.length}</span>
                    <span className="text-[#C6A75E] font-medium">R$ {fmt(dayReceita)}</span>
                  </div>
                );
              })
            : (() => {
                // Agrupa por semana do mês
                const weeks: Record<string, Appointment[]> = {};
                filtered.forEach((a) => {
                  const d = new Date(a.date + "T12:00:00");
                  const weekNum = Math.ceil(d.getDate() / 7);
                  const key = `Semana ${weekNum}`;
                  weeks[key] = [...(weeks[key] ?? []), a];
                });
                return Object.entries(weeks).map(([week, wAppts]) => {
                  const wReceita = wAppts.reduce((s, a) => s + (SERVICE_PRICE[a.service] ?? 0), 0);
                  return (
                    <div key={week} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{week}</span>
                      <span className="text-white font-medium">{wAppts.length} atend.</span>
                      <span className="text-[#C6A75E] font-medium">R$ {fmt(wReceita)}</span>
                    </div>
                  );
                });
              })()
          }
        </div>
      </div>

      <Link href="/home" className="text-gray-400 underline text-sm">Voltar</Link>
    </div>
  );
}

// ─── Vista do ADMIN ───────────────────────────────────────────────────────────

function AdminReport({ appointments }: { appointments: Appointment[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("semanal");

  const range = getRange(periodo);
  const filtered = appointments.filter(
    (a) => a.date >= range.start && a.date <= range.end
  );
  const totalStats = calcStats(filtered);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#C6A75E]">Relatórios</h1>
          <p className="text-gray-500 mt-1">{range.label}</p>
        </div>
        <PeriodoTabs value={periodo} onChange={setPeriodo} />
      </div>

      {/* Total da barbearia */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Total da Barbearia
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#121212] border border-[#C6A75E]/40 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#C6A75E]/15 flex items-center justify-center shrink-0">
              <Calendar size={18} className="text-[#C6A75E]" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Atendimentos</p>
              <p className="text-3xl font-black text-[#C6A75E]">{totalStats.total}</p>
            </div>
          </div>

          <div className="rounded-xl bg-[#121212] border border-[#C6A75E]/40 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#C6A75E]/15 flex items-center justify-center shrink-0">
              <DollarSign size={18} className="text-[#C6A75E]" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Receita</p>
              <p className="text-3xl font-black text-[#C6A75E]">R$ {fmt(totalStats.receita)}</p>
            </div>
          </div>

          <div className="rounded-xl bg-[#121212] border border-[#C6A75E]/40 p-5">
            <p className="text-gray-400 text-xs mb-2">Por serviço</p>
            {Object.keys(SERVICE_PRICE).map((s) => {
              const count = totalStats.servicos[s] ?? 0;
              return (
                <div key={s} className="flex justify-between text-sm">
                  <span className="text-gray-300">{s}</span>
                  <span className="text-[#C6A75E] font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Por barbeiro */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Por Barbeiro
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BARBERS.map((barber) => {
            const barberAppts = filtered.filter((a) => a.barber === barber);
            const stats = calcStats(barberAppts);
            const pct = totalStats.total > 0 ? Math.round((stats.total / totalStats.total) * 100) : 0;

            return (
              <div key={barber} className="rounded-xl bg-[#121212] border border-[#3c3c3c] p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C6A75E]/15 border border-[#C6A75E]/30 flex items-center justify-center">
                    <Scissors size={15} className="text-[#C6A75E]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#C6A75E]">{barber}</h3>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Atendimentos</span>
                    <span className="text-white font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Receita</span>
                    <span className="text-white font-semibold">R$ {fmt(stats.receita)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Ticket médio</span>
                    <span className="text-white font-semibold">R$ {fmt(stats.ticketMedio)}</span>
                  </div>
                </div>

                {stats.total > 0 ? (
                  <div className="space-y-1 border-t border-[#2a2a2a] pt-3">
                    <p className="text-gray-500 text-xs mb-1">Serviços</p>
                    {Object.entries(stats.servicos).map(([s, n]) => (
                      <div key={s} className="flex justify-between text-xs">
                        <span className="text-gray-400">{s}</span>
                        <span className="text-gray-300">{n}x</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">Sem atendimentos no período</p>
                )}

                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Participação</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C6A75E] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Link href="/home" className="text-gray-400 underline text-sm">Voltar</Link>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Relatorios() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "BARBER")) {
      router.replace("/home");
      return;
    }
    setRole(user.role);
    getAppointments()
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-500">Carregando relatório...</p>
      </div>
    );
  }

  if (role === "BARBER") return <BarberReport appointments={appointments} />;
  return <AdminReport appointments={appointments} />;
}
