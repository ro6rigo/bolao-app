import { AppHeader } from "@/components/AppHeader";

const links = [
  { href: "/palpitar", label: "Palpitar" },
  { href: "/palpites", label: "Meus palpites" },
  { href: "/palpites/acertos", label: "Acertos" },
  { href: "/perfil", label: "Perfil" },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-zinc-50">
      <AppHeader title="Bolão" links={links} />
      <main className="mx-auto max-w-3xl px-4 py-8 text-zinc-900">{children}</main>
    </div>
  );
}
