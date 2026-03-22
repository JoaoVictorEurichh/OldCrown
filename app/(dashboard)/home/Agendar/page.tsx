import Link from "next/link";

export default function Agendar() {
  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-[#C6A75E]">Agendar Cliente</h1>
      <p className="text-gray-300">
        Cadastre um novo atendimento na agenda.
      </p>

      <form className="space-y-4 max-w-md">
        <input
          type="text"
          placeholder="Nome do cliente"
          className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white outline-none"
        />

        <input
          type="time"
          className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white outline-none"
        />

        <select className="w-full rounded-lg bg-[#1a1a1a] p-3 text-white">
          <option>Corte</option>
          <option>Barba</option>
          <option>Corte + Barba</option>
        </select>

        <button className="w-full rounded-lg bg-[#C6A75E] p-3 font-semibold text-black">
          Agendar
        </button>
      </form>

      <Link href="/home" className="text-gray-400 underline">
        Voltar
      </Link>
    </div>
  );
}