import Link from "next/link";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-200 hover:bg-[#1f1f1f] hover:text-[#C6A75E] transition"
    >
      {children}
    </Link>
  );
}
