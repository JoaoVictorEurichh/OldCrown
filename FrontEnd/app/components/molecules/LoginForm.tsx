"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../atoms/Input";
import Button from "../atoms/Button";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Simulação de autenticação do demo.
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 text-sm text-gray-300">E-mail</label>
        <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="block mb-1 text-sm text-gray-300">Senha</label>
        <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" variant="primary" className="w-full">Entrar</Button>
      <div className="flex justify-between text-xs text-gray-400">
        <a href="#">Esqueceu a senha?</a>
        <a href="#">Registrar</a>
      </div>
    </form>
  );
}