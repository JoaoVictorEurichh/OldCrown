import Link from "next/link";
import Sidebar from "../../components/layout/sidebar";

export default function RelatoriosPage() {
  return (
      <div className="space-y-4">
        <h1 className="text-5xl font-bold text-[#C6A75E]">Relatórios</h1>
        <p className="text-gray-300">Resumo financeiro e resultados do mês.</p>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-[#3c3c3c] bg-[#121212] p-4">
            <h2 className="text-xl font-semibold text-[#C6A75E]">Faturamento</h2>
            <p className="text-gray-400">R$ 12.450,00</p>
            <p className="text-gray-400">Crescimento: +18% em relação ao mês anterior</p>
          </article>
          <article className="rounded-xl border border-[#3c3c3c] bg-[#121212] p-4">
            <h2 className="text-xl font-semibold text-[#C6A75E]">Atendimentos</h2>
            <p className="text-gray-400">Total: 64</p>
            <p className="text-gray-400">Cancelados: 5</p>
          </article>
        </section>
      </div>
  );
}