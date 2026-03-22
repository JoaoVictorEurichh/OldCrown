import Link from "next/link";

export default function Cancelar() {
  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-[#C6A75E]">
        Cancelar Atendimento
      </h1>
      <p className="text-gray-300">
        Selecione um atendimento para cancelar.
      </p>

      <ul className="space-y-3">
        <li className="flex justify-between rounded-lg bg-[#1a1a1a] p-3">
          <span>08:00 - João</span>
          <button className="text-red-500">Cancelar</button>
        </li>

        <li className="flex justify-between rounded-lg bg-[#1a1a1a] p-3">
          <span>10:00 - Pedro</span>
          <button className="text-red-500">Cancelar</button>
        </li>
      </ul>

      <Link href="/home" className="text-gray-400 underline">
        Voltar
      </Link>
    </div>
  );
}