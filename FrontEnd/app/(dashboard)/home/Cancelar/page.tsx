"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAppointments, deleteAppointment, getCurrentUser, getBloqueios, type SlotBloqueado } from "@/app/services/api";
import { Lock } from "lucide-react";

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

export default function Cancelar() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const isBarber = currentUser?.role === "BARBER";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bloqueios, setBloqueios] = useState<SlotBloqueado[]>([]);
  const [selectedBarber, setSelectedBarber] = useState(BARBERS[0]);
  const [confirming, setConfirming] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [appts, blqs] = await Promise.all([getAppointments(), getBloqueios()]);
      setAppointments(appts);
      setBloqueios(blqs);
    } catch {}
  }

  useEffect(() => { load(); }, []);

  // Cliente: ajusta barbeiro para o da sua agenda. Barbeiro: trava no próprio nome.
  const myAppointment = !isAdmin && !isBarber
    ? appointments.find((a) => a.userId === currentUser?.id)
    : null;

  useEffect(() => {
    if (isBarber && currentUser?.name) {
      setSelectedBarber(currentUser.name);
    } else if (myAppointment) {
      setSelectedBarber(myAppointment.barber);
    }
  }, [myAppointment?.id, isBarber]);

  const barberAppts = appointments.filter((a) => a.barber === selectedBarber);

  function getAppointmentAt(date: string, time: string) {
    return barberAppts.find((a) => a.date === date && a.time === time);
  }

  function getBloqueioAt(date: string, time: string) {
    return bloqueios.find((b) => b.barber === selectedBarber && b.date === date && b.time === time);
  }

  function canCancel(appt: Appointment): boolean {
    if (isAdmin) return true;
    if (isBarber) return appt.barber === currentUser?.name;
    return appt.userId === currentUser?.id;
  }

  async function handleConfirmCancel() {
    if (!confirming) return;
    setLoading(true);
    setError("");
    try {
      await deleteAppointment(confirming.id);
      setConfirming(null);
      load();
    } catch (err: any) {
      setError(err.message ?? "Erro ao cancelar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-[#C6A75E]">Cancelar Atendimento</h1>

      {/* Seletor de barbeiro — oculto para barbeiro (fixo no próprio nome) */}
      <div className="space-y-2">
        <p className="text-gray-400 text-sm">Barbeiro:</p>
        {isBarber ? (
          <div className="px-5 py-2 rounded-lg bg-[#C6A75E] text-black font-semibold text-sm inline-block">
            {currentUser?.name}
          </div>
        ) : (
          <div className="flex gap-3">
            {BARBERS.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBarber(b)}
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
        )}
      </div>

      <p className="text-gray-400 text-xs flex items-center gap-3">
        {isAdmin
          ? "Clique em qualquer horário ocupado para cancelar."
          : "Clique no seu agendamento para cancelá-lo."}
        <span className="inline-flex items-center gap-1 ml-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-600" /> Ocupado (clicável)
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
                  const isOwn = appt?.userId === currentUser?.id;
                  const clickable = !!appt && canCancel(appt);

                  return (
                    <td key={d.date} className="p-1">
                      <button
                        onClick={() => clickable && setConfirming(appt!)}
                        disabled={(!clickable && !appt) || !!bloqueio}
                        title={
                          bloqueio
                            ? `Bloqueado${bloqueio.motivo ? `: ${bloqueio.motivo}` : ""}`
                            : appt
                            ? canCancel(appt)
                              ? `Cancelar: ${appt.clientName} — ${appt.service}`
                              : `${appt.clientName} — ${appt.service}`
                            : ""
                        }
                        className={`w-full h-9 rounded text-xs font-medium transition-all ${
                          bloqueio
                            ? "bg-amber-600/60 text-amber-200 cursor-not-allowed"
                            : !appt
                            ? "bg-[#111] border border-[#1a1a1a] cursor-default"
                            : isOwn
                            ? "bg-[#C6A75E] text-black hover:bg-red-500 hover:text-white cursor-pointer"
                            : clickable
                            ? "bg-red-600/80 text-white hover:bg-red-500 cursor-pointer"
                            : "bg-red-900/40 text-red-300 cursor-not-allowed"
                        }`}
                      >
                        {bloqueio
                          ? <Lock size={12} className="mx-auto" />
                          : appt ? appt.clientName.split(" ")[0] : ""}
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

      {/* Modal de confirmação */}
      {confirming && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] border border-[#3c3c3c] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-red-400">Cancelar Atendimento</h2>
            <p className="text-gray-300 text-sm">
              Tem certeza que deseja cancelar o atendimento de{" "}
              <strong>{confirming.clientName}</strong>?
            </p>
            <p className="text-gray-500 text-xs">
              {confirming.date} às {confirming.time} · {confirming.service} · {confirming.barber}
            </p>

            {error && (
              <div className="rounded-lg bg-red-600/20 border border-red-600 p-3 text-sm text-red-400">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setConfirming(null); setError(""); }}
                className="flex-1 rounded-lg border border-[#3c3c3c] p-3 text-gray-400 hover:bg-[#1a1a1a] transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-600 p-3 font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {loading ? "Cancelando..." : "Confirmar Cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
