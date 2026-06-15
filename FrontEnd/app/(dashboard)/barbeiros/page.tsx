"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Scissors } from "lucide-react";
import { getCurrentUser, getBarbers, criarBarbeiro, type BarberUser } from "@/app/services/api";

export default function Barbeiros() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [barbers, setBarbers] = useState<BarberUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    try {
      setBarbers(await getBarbers());
    } catch {}
  }

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      router.replace("/home");
      return;
    }
    setMounted(true);
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await criarBarbeiro({ name: name.trim(), email: email.trim(), password });
      setSuccess(`Barbeiro "${name.trim()}" cadastrado com sucesso!`);
      setName("");
      setEmail("");
      setPassword("");
      load();
    } catch (err: any) {
      setError(err.message ?? "Erro ao cadastrar");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-5xl font-bold text-[#C6A75E]">Barbeiros</h1>

      {/* Lista */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Equipe atual</h2>
        {barbers.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhum barbeiro cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {barbers.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl bg-[#161616] border border-[#2a2a2a] px-4 py-3"
              >
                <div className="w-9 h-9 rounded-full bg-[#C6A75E]/20 border border-[#C6A75E]/30 flex items-center justify-center shrink-0">
                  <Scissors size={15} className="text-[#C6A75E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{b.name}</p>
                  <p className="text-gray-500 text-xs truncate">{b.email}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C6A75E]/10 text-[#C6A75E] border border-[#C6A75E]/20">
                  BARBEIRO
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Formulário */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Cadastrar novo barbeiro</h2>

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

        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Nome</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pedro"
                className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white placeholder-gray-600 outline-none focus:border-[#C6A75E] transition-colors text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">E-mail</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pedro@oldcrown.com"
                className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white placeholder-gray-600 outline-none focus:border-[#C6A75E] transition-colors text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Senha</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white placeholder-gray-600 outline-none focus:border-[#C6A75E] transition-colors text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#C6A75E] px-5 py-3 text-sm font-semibold text-black hover:bg-[#b8974e] transition-colors disabled:opacity-50"
          >
            <UserPlus size={16} />
            {saving ? "Cadastrando..." : "Cadastrar Barbeiro"}
          </button>
        </form>
      </section>
    </div>
  );
}
