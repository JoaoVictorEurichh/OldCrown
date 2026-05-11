const API_URL = "http://localhost:3001/appointments";

export async function getAppointments() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Erro ao buscar");
  return res.json();
}

export async function createAppointment(data: any) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar");
  return res.json();
}

export async function deleteAppointment(id: string) {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao deletar");
}

export async function updateAppointment(id: string, data: any) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar");
  return res.json();
}