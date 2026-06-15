"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Unlock } from "lucide-react";
import {
  getAppointments,
  createAppointment,
  getCurrentUser,
  getBloqueios,
  getBarbers,
  criarBloqueio,
  removerBloqueio,
  type SlotBloqueado,
} from "@/app/services/api";

type Appointment = {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  barber: string;
  userId?: string;
};

type Slot = { date: string; time: string };

const TIME_SLOTS: string[] = [];
for (let h = 8; h < 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

function getNextDays(count: number) {
  const days: { date: string; label: string }[] = [];
  const d = new Date();
  while (days.length < count) {
    if (d.getDay() !== 0) {
      days.push({
        date: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }),
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

const DAYS = getNextDays(7);

export default function Agendar() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const isBarber = currentUser?.role === "BARBER";
  const canManageClients = isAdmin || isBarber;

  const [barbers, setBarbers] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bloqueios, setBloqueios] = useState<SlotBloqueado[]>([]);
  const [selectedBarber, setSelectedBarber] = useState(
    isBarber ? (currentUser?.name ?? "") : ""
  );
  const [selected, setSelected] = useState<Slot | null>(null);
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modo, setModo] = useState<"agendar" | "bloquear">("agendar");
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
  const [bloqueioAlvo, setBloqueioAlvo] = useState<SlotBloqueado | null>(null);

  async function load() {
    try {
      const [appts, blqs, bs] = await Promise.all([
        getAppointments(),
        getBloqueios(),
        getBarbers(),
      ]);
      setAppointments(appts);
      setBloqueios(blqs);
      const names = bs.map((b) => b.name);
      setBarbers(names);
      if (!isBarber && !selectedBarber) setSelectedBarber(names[0] ?? "");
    } catch {}
  }

  useEffect(() => { load(); }, []);

  const barberAppts = appointments.filter((a) => a.barber === selectedBarber);

  function getAppointmentAt(date: string, time: string) {
    return barberAppts.find((a) => a.date === date && a.time === time);
  }

  function getBloqueioAt(date: string, time: string) {
    return bloqueios.find((b) => b.barber === selectedBarber && b.date === date && b.time === time);
  }

  function isPast(date: string, time: string): boolean {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    if (date < today) return true;
    if (date > today) return false;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
  }

  async function handleConfirm() {
    if (!selected || !service) return;
    if (canManageClients && !clientName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createAppointment({
        clientName: canManageClients ? clientName.trim() : (currentUser?.name ?? ""),
        date: selected.date,
        time: selected.time,
        service,
        barber: selectedBarber,
      });
      setSelected(null);
      setClientName("");
      setService("");
      load();
    } catch (err: any) {
      setError(err.message ?? "Erro ao agendar");
    } finally {
      setSaving(false);
    }
  }

  async function handleBloquear(slot: Slot) {
    setSaving(true);
    try {
      await criarBloqueio({ date: slot.date, time: slot.time, barber: selectedBarber, motivo: motivoBloqueio || undefined });
      setSelected(null);
      setMotivoBloqueio("");
      load();
    } catch (err: any) {
      setError(err.message ?? "Erro ao bloquear");
    } finally {
      setSaving(false);
    }
  }

  async function handleDesbloquear(bloqueio: SlotBloqueado) {
    try {
      await removerBloqueio(bloqueio.id);
      setBloqueioAlvo(null);
      load();
    } catch {}
  }

  function handleCellClick(date: string, time: string) {
    const appt = getAppointmentAt(date, time);
    const bloqueio = getBloqueioAt(date, time);
    const past = isPast(date, time);

    if (past || appt) return;

    if (modo === "bloquear") {
      if (bloqueio) {
        setBloqueioAlvo(bloqueio);
      } else {
        setSelected({ date, time });
      }
      return;
    }

    if (!bloqueio) {
      setSelected({ date, time });
    }
  }

  function formatDateLabel(iso: string) {
    return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-[#C6A75E]">Agendar Cliente</h1>

      {/* Seletor de barbeiro + modo */}
      <div className="flex flex-wrap items-end gap-4">
        {isBarber ? (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">Barbeiro:</p>
            <div className="px-5 py-2 rounded-lg bg-[#C6A75E] text-black font-semibold text-sm">
              {currentUser?.name}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">Escolha o barbeiro:</p>
            <div className="flex gap-3 flex-wrap">
              {barbers.map((b) => (
                <button
                  key={b}
                  onClick={() => { setSelectedBarber(b); setSelected(null); }}
                  className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
                    selectedBarber === b
                      ? "bg-[#C6A75E] text-black"
                      : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] border border-[#3c3c3c]"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modo bloquear — admin e barbeiro */}
        {(isAdmin || isBarber) && (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">Modo:</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setModo("agendar"); setSelected(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  modo === "agendar"
                    ? "bg-[#C6A75E] text-black"
                    : "bg-[#1a1a1a] text-gray-400 border border-[#3c3c3c] hover:bg-[#252525]"
                }`}
              >
                Agendar
              </button>
              <button
                onClick={() => { setModo("bloquear"); setSelected(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  modo === "bloquear"
                    ? "bg-amber-600 text-black"
                    : "bg-[#1a1a1a] text-gray-400 border border-[#3c3c3c] hover:bg-[#252525]"
                }`}
              >
                <Lock size={14} />
                Bloquear
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-gray-400 text-xs flex flex-wrap items-center gap-3">
        {modo === "bloquear"
          ? <span className="text-amber-400">Modo Bloqueio: clique em um horário livre para bloqueá-lo, ou em um bloqueado para remover.</span>
          : <>Clique em um horário disponível para agendar com <strong className="text-[#C6A75E]">{selectedBarber}</strong>.</>
        }
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-600" /> Ocupado
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-600" /> Bloqueado
        </span>
      </p>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-[#3c3c3c]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#3c3c3c]">
              <th className="p-3 text-gray-500 text-left w-20 font-normal">Hora</th>
              {DAYS.map((d) => (
                <th key={d.date} className="p-3 text-[#C6A75E] text-center font-medium capitalize min-w-[110px]">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((time, i) => (
              <tr key={time} className={`border-b border-[#1e1e1e] ${i % 2 === 0 ? "bg-[#0d0d0d]" : "bg-[#111111]"}`}>
                <td className="p-2 pl-3 text-gray-500 font-mono text-xs">{time}</td>
                {DAYS.map((d) => {
                  const appt = getAppointmentAt(d.date, time);
                  const bloqueio = getBloqueioAt(d.date, time);
                  const past = isPast(d.date, time);
                  const isSelected = selected?.date === d.date && selected?.time === time;
                  const isBooked = !!appt;
                  const isBlocked = !!bloqueio;

                  return (
                    <td key={d.date} className="p-1">
                      <button
                        onClick={() => handleCellClick(d.date, time)}
                        disabled={past || (isBooked && !isBlocked) || (isBlocked && modo !== "bloquear")}
                        title={
                          isBooked ? `${appt!.clientName} — ${appt!.service}`
                          : isBlocked ? `Bloqueado${bloqueio.motivo ? `: ${bloqueio.motivo}` : ""}`
                          : past ? "Horário já passou"
                          : "Disponível"
                        }
                        className={`w-full h-9 rounded text-xs font-medium transition-all ${
                          isBooked
                            ? "bg-red-600/80 text-white cursor-not-allowed"
                          : isBlocked
                            ? modo === "bloquear"
                              ? "bg-amber-600 text-black hover:bg-amber-500 cursor-pointer"
                              : "bg-amber-600/60 text-amber-200 cursor-not-allowed"
                          : past
                            ? "bg-[#111] text-gray-700 cursor-not-allowed border border-[#1e1e1e]"
                          : isSelected
                            ? "bg-[#C6A75E] text-black ring-2 ring-[#C6A75E] ring-offset-1 ring-offset-black"
                          : modo === "bloquear"
                            ? "bg-[#1a1a1a] text-gray-500 hover:bg-amber-900/40 hover:text-amber-300 border border-[#2a2a2a] cursor-pointer"
                          : "bg-[#1a1a1a] text-gray-500 hover:bg-[#252525] hover:text-white border border-[#2a2a2a]"
                        }`}
                      >
                        {isBooked ? appt!.clientName.split(" ")[0]
                          : isBlocked ? <Lock size={12} className="mx-auto" />
                          : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/home" className="text-gray-400 underline text-sm">Voltar</Link>

      {/* Modal de agendamento */}
      {selected && modo === "agendar" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] border border-[#3c3c3c] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-[#C6A75E]">Confirmar Agendamento</h2>
              <p className="text-gray-400 text-sm mt-1">
                {formatDateLabel(selected.date)} às {selected.time} · <span className="text-[#C6A75E]">{selectedBarber}</span>
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-600/20 border border-red-600 p-3 text-sm text-red-400">{error}</div>
            )}

            {canManageClients ? (
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do cliente"
                autoFocus
                className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white placeholder-gray-600 outline-none focus:border-[#C6A75E] transition-colors"
              />
            ) : (
              <div className="rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-gray-300">
                {currentUser?.name}
              </div>
            )}

            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white outline-none focus:border-[#C6A75E] transition-colors"
            >
              <option value="">Selecione o serviço</option>
              <option value="Corte">Corte — R$ 35</option>
              <option value="Barba">Barba — R$ 25</option>
              <option value="Corte + Barba">Corte + Barba — R$ 55</option>
            </select>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setSelected(null); setError(""); }}
                className="flex-1 rounded-lg border border-[#3c3c3c] p-3 text-gray-400 hover:bg-[#1a1a1a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving || (canManageClients && !clientName.trim()) || !service}
                className="flex-1 rounded-lg bg-[#C6A75E] p-3 font-semibold text-black hover:bg-[#b8974e] transition-colors disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de bloqueio */}
      {selected && modo === "bloquear" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] border border-amber-600/40 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                <Lock size={18} /> Bloquear Horário
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {formatDateLabel(selected.date)} às {selected.time} · {selectedBarber}
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-600/20 border border-red-600 p-3 text-sm text-red-400">{error}</div>
            )}

            <input
              value={motivoBloqueio}
              onChange={(e) => setMotivoBloqueio(e.target.value)}
              placeholder="Motivo (opcional)"
              className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white placeholder-gray-600 outline-none focus:border-amber-600 transition-colors"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setSelected(null); setError(""); setMotivoBloqueio(""); }}
                className="flex-1 rounded-lg border border-[#3c3c3c] p-3 text-gray-400 hover:bg-[#1a1a1a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleBloquear(selected)}
                disabled={saving}
                className="flex-1 rounded-lg bg-amber-600 p-3 font-semibold text-black hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                {saving ? "Bloqueando..." : "Confirmar Bloqueio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de desbloqueio */}
      {bloqueioAlvo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] border border-amber-600/40 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <Unlock size={18} /> Remover Bloqueio
            </h2>
            <p className="text-gray-300 text-sm">
              {bloqueioAlvo.date} às {bloqueioAlvo.time} · {bloqueioAlvo.barber}
            </p>
            {bloqueioAlvo.motivo && (
              <p className="text-gray-500 text-xs">Motivo: {bloqueioAlvo.motivo}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setBloqueioAlvo(null)}
                className="flex-1 rounded-lg border border-[#3c3c3c] p-3 text-gray-400 hover:bg-[#1a1a1a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDesbloquear(bloqueioAlvo)}
                className="flex-1 rounded-lg bg-amber-600 p-3 font-semibold text-black hover:bg-amber-500 transition-colors"
              >
                Remover Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
