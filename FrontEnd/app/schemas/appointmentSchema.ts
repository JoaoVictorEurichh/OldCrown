import { z } from "zod";

export const appointmentSchema = z.object({
  clientName: z.string().min(2, "Nome obrigatório"),
  date: z.string().min(1, "Selecione a data"),
  time: z.string().min(1, "Selecione o horário"),
  service: z.string().min(1, "Selecione o serviço"),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;