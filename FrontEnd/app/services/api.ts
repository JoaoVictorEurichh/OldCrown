const API_URL = "http://localhost:3333/appointments";

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getAppointments() {
  const res = await fetch(API_URL, { headers: authHeaders() });
  if (!res.ok) throw new Error("Erro ao buscar agendamentos");
  return res.json();
}

export async function createAppointment(data: {
  clientName: string;
  date: string;
  time: string;
  service: string;
  barber: string;
}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (res.status === 409) {
    const err = await res.json();
    throw new Error(err.message ?? "Horário já ocupado");
  }
  if (!res.ok) throw new Error("Erro ao criar agendamento");
  return res.json();
}

export async function deleteAppointment(id: string) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erro ao cancelar agendamento");
}

export async function updateAppointment(
  id: string,
  data: { clientName?: string; date?: string; time?: string; service?: string }
) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (res.status === 409) {
    const err = await res.json();
    throw new Error(err.message ?? "Horário já ocupado");
  }
  if (!res.ok) throw new Error("Erro ao atualizar agendamento");
  return res.json();
}

export type SlotBloqueado = {
  id: string;
  date: string;
  time: string;
  barber: string;
  motivo?: string;
};

export async function getBloqueios(): Promise<SlotBloqueado[]> {
  const res = await fetch("http://localhost:3333/bloqueios", { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function criarBloqueio(data: { date: string; time: string; barber: string; motivo?: string }) {
  const res = await fetch("http://localhost:3333/bloqueios", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao bloquear horário");
  return res.json();
}

export async function removerBloqueio(id: string) {
  const res = await fetch(`http://localhost:3333/bloqueios/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erro ao desbloquear horário");
}

export async function register(name: string, email: string, password: string) {
  const res = await fetch("http://localhost:3333/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (res.status === 409) throw new Error("E-mail já cadastrado");
  if (!res.ok) throw new Error("Erro ao criar conta");
  return res.json();
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? (JSON.parse(raw) as CurrentUser) : null;
}

export async function login(email: string, password: string) {
  const res = await fetch("http://localhost:3333/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Credenciais inválidas");
  const data = (await res.json()) as { access_token: string; user: CurrentUser };
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}
