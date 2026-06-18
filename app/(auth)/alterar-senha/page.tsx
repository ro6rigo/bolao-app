"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AlterarSenhaPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword"));
    const confirm = String(formData.get("confirmPassword"));

    if (newPassword !== confirm) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.get("currentPassword"),
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Erro ao alterar senha");

      router.push(data.role === "ADMIN" ? "/admin/jogos" : "/palpitar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Alterar senha</h1>
        <p className="mt-2 text-sm text-zinc-500">Obrigatório no primeiro acesso</p>

        <div className="mt-6 flex flex-col gap-4">
          <input name="currentPassword" type="password" required placeholder="Senha atual (123456)" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="newPassword" type="password" required minLength={6} placeholder="Nova senha" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="confirmPassword" type="password" required minLength={6} placeholder="Confirmar nova senha" className="rounded-lg border border-zinc-300 px-3 py-2" />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 py-3 font-medium text-white disabled:opacity-60">
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </div>
      </form>
    </div>
  );
}
