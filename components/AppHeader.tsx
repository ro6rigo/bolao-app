import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

type AppHeaderProps = {
  title: string;
  links: { href: string; label: string }[];
};

export function AppHeader({ title, links }: AppHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-600 hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
