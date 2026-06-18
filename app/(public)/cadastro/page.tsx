"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          cpf: formData.get("cpf"),
          phone: formData.get("phone") || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Erro ao cadastrar");

      router.push("/alterar-senha");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-zinc-900">Cadastrar</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Senha inicial: <strong>123456</strong> (troque no primeiro acesso)
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <input name="name" required placeholder="Nome completo" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="email" type="email" required placeholder="E-mail" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="cpf" required placeholder="CPF" inputMode="numeric" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="phone" placeholder="Telefone (opcional)" className="rounded-lg border border-zinc-300 px-3 py-2" />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <button type="submit" disabled={loading} className="rounded-lg bg-zinc-900 py-3 font-medium text-white disabled:opacity-60">
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/" className="underline">Voltar</Link>
        </p>
      </form>
    </div>
  );
}
