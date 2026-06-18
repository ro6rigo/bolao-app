import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 rounded-2xl bg-white p-10 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-zinc-900">Bolão App</h1>
          <p className="mt-3 text-zinc-600">
            Palpite nos jogos da Seleção e pague via Pix.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href="/cadastro"
            className="flex-1 rounded-lg border border-zinc-300 px-6 py-3 text-center font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Cadastrar
          </Link>
          <Link
            href="/login"
            className="flex-1 rounded-lg bg-zinc-900 px-6 py-3 text-center font-medium text-white hover:bg-zinc-700"
          >
            Acessar
          </Link>
        </div>
      </main>
    </div>
  );
}
