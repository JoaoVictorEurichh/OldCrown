"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAppointments, deleteAppointment } from "@/app/services/api";

type Appointment = {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
};

export default function Cancelar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  async function loadAppointments() {
    const data = await getAppointments();
    setAppointments(data);
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Deseja cancelar este atendimento?")) return;

    await deleteAppointment(id);
    loadAppointments();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-[#C6A75E]">
        Cancelar Atendimento
      </h1>

      <ul className="space-y-3">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="flex justify-between rounded-lg bg-[#1a1a1a] p-3"
          >
            <span>
              {appt.date} • {appt.time} - {appt.clientName}
            </span>

            <button
              onClick={() => handleDelete(appt.id)}
              className="text-red-500 hover:text-red-400"
            >
              Cancelar
            </button>
          </li>
        ))}
      </ul>

      <Link href="/home" className="text-gray-400 underline">
        Voltar
      </Link>
    </div>
  );
}