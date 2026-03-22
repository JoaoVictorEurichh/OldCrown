import Link from "next/link";

export default function Editar() {
  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-[#C6A75E]">
        Editar Horário
      </h1>
      <p className="text-gray-300">
        Atualize informações de um atendimento.
      </p>

      <form className="space-y-4 max-w-md">
        <select className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white">
          <option>08:00 - João</option>
          <option>10:00 - Pedro</option>
        </select>

        <input
          type="time"
          className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white outline-none"
        />

        <button className="w-full rounded-lg bg-[#C6A75E] p-3 font-semibold text-black">
          Salvar Alterações
        </button>
      </form>

      <Link href="/home" className="text-gray-400 underline">
        Voltar
      </Link>
    </div>
  );
}