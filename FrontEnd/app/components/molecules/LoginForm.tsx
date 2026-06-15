"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../atoms/Input";
import Button from "../atoms/Button";
import { login } from "@/app/services/api";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.access_token);
      router.push("/home");
    } catch {
      setError("E-mail ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-600 p-2 text-sm text-white">
          {error}
        </div>
      )}
      <div>
        <label className="block mb-1 text-sm text-gray-300">E-mail</label>
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1 text-sm text-gray-300">Senha</label>
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
      <div className="flex justify-between text-xs text-gray-400">
        <a href="#">Esqueceu a senha?</a>
        <a href="#">Registrar</a>
      </div>
    </form>
  );
}
