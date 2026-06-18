import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

const links = [
  { href: "/admin/jogos", label: "Jogos" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/palpites", label: "Palpites" },
  { href: "/admin/ganhadores", label: "Ganhadores" },
  { href: "/alterar-senha", label: "Alterar senha" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-zinc-50">
      <AppHeader title="Admin — Bolão" links={links} />
      <main className="mx-auto max-w-5xl px-4 py-8 text-zinc-900">{children}</main>
    </div>
  );
}
