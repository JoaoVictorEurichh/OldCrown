"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/app/services/api";

export default function CadastroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace("/login?cadastro=ok");
    } catch (err: any) {
      setError(err.message ?? "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-[#C6A75E]">Old Crown</h1>
          <p className="text-gray-500 mt-2">Barbearia</p>
        </div>

        <div className="rounded-2xl border border-[#3c3c3c] bg-[#121212] p-8 space-y-5">
          <h2 className="text-2xl font-semibold text-white">Criar conta</h2>

          {error && (
            <div className="rounded-lg bg-red-600/20 border border-red-600 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                required
                className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white placeholder-gray-600 outline-none focus:border-[#C6A75E] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white placeholder-gray-600 outline-none focus:border-[#C6A75E] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white placeholder-gray-600 outline-none focus:border-[#C6A75E] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400">Confirmar senha</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                required
                className="w-full rounded-lg bg-[#1a1a1a] border border-[#3c3c3c] p-3 text-white placeholder-gray-600 outline-none focus:border-[#C6A75E] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#C6A75E] p-3 font-semibold text-black hover:bg-[#b8974e] transition-colors disabled:opacity-50"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-[#C6A75E] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
