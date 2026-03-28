"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAppointments, updateAppointment } from "@/app/services/api";

type Appointment = {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
};

export default function Editar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    async function load() {
      const data = await getAppointments();
      setAppointments(data);
    }
    load();
  }, []);

  async function handleUpdate(e: any) {
    e.preventDefault();

    const appt = appointments.find((a) => a.id === selectedId);
    if (!appt) return alert("Selecione um atendimento");

    await updateAppointment(selectedId, {
      ...appt,
      time: newTime,
    });

    alert("Horário atualizado!");
    setNewTime("");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-[#C6A75E]">
        Editar Horário
      </h1>

      <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white"
        >
          <option value="">Selecione atendimento</option>
          {appointments.map((appt) => (
            <option key={appt.id} value={appt.id}>
              {appt.date} • {appt.time} - {appt.clientName}
            </option>
          ))}
        </select>

        <input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white outline-none"
        />

        <button className="w-full rounded-lg bg-[#C6A75E] p-3 font-semibold text-black">
          Salvar Alterações
        </button>
      </form>

      <Link href="/home" className="text-gray-400 underline">
        Voltar
      </Link>
    </div>
  );
}