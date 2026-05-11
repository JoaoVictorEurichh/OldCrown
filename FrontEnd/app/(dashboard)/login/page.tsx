import Link from "next/link";
import Sidebar from "../../components/layout/sidebar";
import LoginForm from "../../components/molecules/LoginForm";

export default function DashboardLoginPage() {
  return (
      <div className="mx-auto w-full max-w-md rounded-xl border border-[#3c3c3c] bg-[#121212] p-6">
        <h1 className="mb-4 text-3xl font-bold text-[#C6A75E]">Entrar</h1>
        <LoginForm />
      </div>
  );
}