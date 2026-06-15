"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "../components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && pathname !== "/login" && pathname !== "/cadastro") {
      router.replace("/login");
    }
  }, [pathname]);

  if (pathname === "/login" || pathname === "/cadastro") {
    return <div className="min-h-screen bg-[#0a0a0a]">{children}</div>;
  }

  return (
    <Sidebar>
      <main>{children}</main>
    </Sidebar>
  );
}
