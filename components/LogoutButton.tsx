"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`text-sm font-medium !text-red-600 hover:!text-red-800 ${className ?? ""}`}
    >
      Sair
    </button>
  );
}
