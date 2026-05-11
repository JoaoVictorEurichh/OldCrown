"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema, AppointmentFormData } from "@/app/schemas/appointmentSchema";
import { createAppointment } from "@/app/services/api";

export default function Agendar() {
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema)
  });

  async function onSubmit(data: AppointmentFormData) {
    try {
      await createAppointment(data);
      setSuccess(true);
      reset();
    } catch {
      alert("Erro ao salvar agendamento");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-[#C6A75E]">Agendar Cliente</h1>
      <p className="text-gray-300">Cadastre um novo atendimento na agenda.</p>

      {success && (
        <div className="rounded-lg bg-green-600 p-3 text-white">
          Agendamento criado com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">

        {/* Nome */}
        <div>
          <input
            {...register("clientName")}
            placeholder="Nome do cliente"
            className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white outline-none"
          />
          {errors.clientName && (
            <p className="text-red-400 text-sm">{errors.clientName.message}</p>
          )}
        </div>

        {/* DATA (NOVO CAMPO) */}
        <div>
          <input
            type="date"
            {...register("date")}
            className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white outline-none"
          />
          {errors.date && (
            <p className="text-red-400 text-sm">{errors.date.message}</p>
          )}
        </div>

        {/* Horário */}
        <div>
          <input
            type="time"
            {...register("time")}
            className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white outline-none"
          />
          {errors.time && (
            <p className="text-red-400 text-sm">{errors.time.message}</p>
          )}
        </div>

        {/* Serviço */}
        <div>
          <select
            {...register("service")}
            className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white"
          >
            <option value="">Selecione o serviço</option>
            <option value="Corte">Corte</option>
            <option value="Barba">Barba</option>
            <option value="Corte + Barba">Corte + Barba</option>
          </select>

          {errors.service && (
            <p className="text-red-400 text-sm">{errors.service.message}</p>
          )}
        </div>

        <button
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#C6A75E] p-3 font-semibold text-black disabled:opacity-50"
        >
          {isSubmitting ? "Salvando..." : "Agendar"}
        </button>
      </form>

      <Link href="/home" className="text-gray-400 underline">
        Voltar
      </Link>
    </div>
  );
}