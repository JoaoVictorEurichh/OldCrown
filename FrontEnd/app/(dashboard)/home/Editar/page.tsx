"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAppointments, updateAppointment, getCurrentUser, getBloqueios, type SlotBloqueado } from "@/app/services/api";
import { Lock } from "lucide-react";

const BARBERS = ["João", "Carlos", "Rafael"];

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

export default function Editar() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const isBarber = currentUser?.role === "BARBER";
  const canManageClients = isAdmin || isBarber;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bloqueios, setBloqueios] = useState<SlotBloqueado[]>([]);
  const [selectedBarber, setSelectedBarber] = useState(BARBERS[0]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [adminTarget, setAdminTarget] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    try {
      const [data, blqs] = await Promise.all([getAppointments(), getBloqueios()]);
      setAppointments(data);
      setBloqueios(blqs);
    } catch {}
  }

  useEffect(() => { load(); }, []);

  const myAppointment = !canManageClients
    ? appointments.find((a) => a.userId === currentUser?.id)
    : null;

  const targetAppt = canManageClients ? adminTarget : myAppointment;

  // Barbeiro ativo: barbeiro = nome próprio | admin = selecionado | cliente = do seu agendamento
  const activeBarber = isBarber
    ? (currentUser?.name ?? BARBERS[0])
    : !isAdmin && myAppointment
    ? myAppointment.barber
    : selectedBarber;

  const barberAppts = appointments.filter((a) => a.barber === activeBarber);

  function getAppointmentAt(date: string, time: string) {
    return barberAppts.find((a) => a.date === date && a.time === time);
  }

  function getBloqueioAt(date: string, time: string) {
    return bloqueios.find((b) => b.barber === activeBarber && b.date === date && b.time === time);
  }

  function isPast(date: string, time: string): boolean {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    if (date < today) return true;
    if (date > today) return false;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
  }

  async function handleReschedule() {
    if (!selected || !targetAppt) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateAppointment(targetAppt.id, {
        date: selected.date,
        time: selected.time,
      });
      setSuccess("Horário atualizado com sucesso!");
      setSelected(null);
      setAdminTarget(null);
      load();
    } catch (err: any) {
      setError(err.message ?? "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-[#C6A75E]">Editar Horário</h1>

      {!canManageClients && !myAppointment && (
        <div className="rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-4 text-gray-400">
          Você não possui nenhum agendamento ativo para editar.
        </div>
      )}

      {/* Admin / Barbeiro: seletor de agendamento a mover */}
      {canManageClients && (
        <div className="space-y-3 max-w-md">
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">Barbeiro:</p>
            <div className="flex gap-3">
              {BARBERS.map((b) => (
                <button
                  key={b}
                  onClick={() => { setSelectedBarber(b); setAdminTarget(null); setSelected(null); }}
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
          {/* Seletor de barbeiro — somente para admin */}
          {isAdmin && (
            <div className="space-y-2">
              <p className="text-gray-400 text-sm">Barbeiro:</p>
              <div className="flex gap-3">
                {BARBERS.map((b) => (
                  <button
                    key={b}
                    onClick={() => { setSelectedBarber(b); setAdminTarget(null); setSelected(null); }}
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

          {isBarber && (
            <div className="space-y-1">
              <p className="text-gray-400 text-sm">Barbeiro:</p>
              <div className="px-5 py-2 rounded-lg bg-[#C6A75E] text-black font-semibold text-sm inline-block">
                {currentUser?.name}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Agendamento a mover:</p>
            <select
              value={adminTarget?.id ?? ""}
              onChange={(e) => {
                const appt = appointments.find((a) => a.id === e.target.value) ?? null;
                setAdminTarget(appt);
                if (appt && isAdmin) setSelectedBarber(appt.barber);
                setSelected(null);
              }}
              className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white"
            >
              <option value="">Selecione...</option>
              {appointments.filter((a) => a.barber === activeBarber).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.date} {a.time} — {a.clientName} ({a.service})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Status e legenda */}
      {targetAppt && (
        <p className="text-sm text-gray-400">
          Agendamento atual:{" "}
          <span className="text-[#C6A75E] font-medium">
            {targetAppt.date} às {targetAppt.time} — {targetAppt.clientName}
          </span>
          {" · "}Clique em um novo horário para reagendar.
        </p>
      )}

      <p className="text-gray-500 text-xs flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#C6A75E]" /> Seu agendamento
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-600" /> Ocupado
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-600" /> Novo horário selecionado
        </span>
      </p>

      {success && (
        <div className="rounded-lg bg-green-600/20 border border-green-600 p-3 text-sm text-green-400">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-600/20 border border-red-600 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

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
                  const isMySlot = targetAppt && appt?.id === targetAppt.id;
                  const isBooked = !!appt && !isMySlot;
                  const isBlocked = !!bloqueio;
                  const past = isPast(d.date, time);
                  const isNewSelected = selected?.date === d.date && selected?.time === time;

                  const canClick = !isBooked && !past && !isMySlot && !isBlocked && !!targetAppt;

                  return (
                    <td key={d.date} className="p-1">
                      <button
                        onClick={() => canClick && setSelected({ date: d.date, time })}
                        disabled={!canClick}
                        title={
                          isMySlot ? `Agendamento atual de ${targetAppt?.clientName}`
                          : isBooked ? `${appt!.clientName} — ${appt!.service}`
                          : isBlocked ? `Bloqueado${bloqueio.motivo ? `: ${bloqueio.motivo}` : ""}`
                          : past ? "Horário já passou"
                          : !targetAppt ? "Selecione um agendamento primeiro"
                          : "Clique para mover aqui"
                        }
                        className={`w-full h-9 rounded text-xs font-medium transition-all ${
                          isMySlot
                            ? "bg-[#C6A75E] text-black cursor-default"
                            : isNewSelected
                            ? "bg-green-600 text-white ring-2 ring-green-400 ring-offset-1 ring-offset-black"
                            : isBooked
                            ? "bg-red-600/80 text-white cursor-not-allowed"
                            : isBlocked
                            ? "bg-amber-600/60 text-amber-200 cursor-not-allowed"
                            : past
                            ? "bg-[#111] text-gray-700 cursor-not-allowed border border-[#1e1e1e]"
                            : canClick
                            ? "bg-[#1a1a1a] text-gray-500 hover:bg-[#252525] hover:text-white border border-[#2a2a2a]"
                            : "bg-[#111] text-gray-700 cursor-not-allowed border border-[#1a1a1a]"
                        }`}
                      >
                        {isMySlot ? targetAppt?.clientName.split(" ")[0]
                          : isBooked ? appt!.clientName.split(" ")[0]
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

      {/* Confirmar reagendamento */}
      {selected && targetAppt && (
        <div className="flex items-center gap-4 rounded-xl border border-green-600/40 bg-green-600/10 p-4">
          <p className="text-green-400 text-sm flex-1">
            Mover para <strong>{selected.date} às {selected.time}</strong>?
          </p>
          <button
            onClick={() => setSelected(null)}
            className="text-gray-400 hover:text-white text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleReschedule}
            disabled={saving}
            className="rounded-lg bg-[#C6A75E] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      )}

      <Link href="/home" className="text-gray-400 underline text-sm">
        Voltar
      </Link>
    </div>
  );
}
