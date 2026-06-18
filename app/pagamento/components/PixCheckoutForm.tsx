"use client";

import { FormEvent, useEffect, useState } from "react";

export type PaymentCreated = {
  id: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  amount: number;
};

type PixCheckoutFormProps = {
  onSuccess: (payment: PaymentCreated) => void;
};

type PaymentConfig = {
  mode: "unconfigured" | "test_seller" | "real_seller_test_token";
  suggestedPayerEmail?: string;
  collector?: { email: string };
};

const BASE_DEFAULTS = {
  amount: "0.01",
  name: "APRO",
  email: "comprador.exemplo@email.com",
  cpf: "12345678909",
  description: "Participação no bolão (teste)",
};

export function PixCheckoutForm({ onSuccess }: PixCheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [defaults, setDefaults] = useState(BASE_DEFAULTS);

  useEffect(() => {
    void fetch("/api/payments/config")
      .then((response) => response.json())
      .then((data: PaymentConfig) => {
        setConfig(data);
        if (data.suggestedPayerEmail) {
          setDefaults((current) => ({
            ...current,
            email: data.suggestedPayerEmail!,
          }));
        }
      })
      .catch(() => setConfig(null));
  }, []);

  function fillTestData() {
    setDefaults({
      ...BASE_DEFAULTS,
      email: config?.suggestedPayerEmail ?? BASE_DEFAULTS.email,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const amount = Number(formData.get("amount"));

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          name: formData.get("name"),
          email: formData.get("email"),
          cpf: formData.get("cpf"),
          description: formData.get("description") || "Pagamento via Pix",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao criar pagamento");
      }

      onSuccess(data as PaymentCreated);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro ao criar pagamento",
      );
    } finally {
      setLoading(false);
    }
  }

  const isTestSeller = config?.mode === "test_seller";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <button
        type="button"
        onClick={fillTestData}
        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
      >
        Preencher dados de teste (APRO + CPF)
      </button>

      {isTestSeller && (
        <div className="flex flex-col gap-1">
          <label htmlFor="buyerUserId" className="text-sm font-medium text-zinc-700">
            User ID do Comprador (painel MP)
          </label>
          <input
            id="buyerUserId"
            type="text"
            inputMode="numeric"
            placeholder="3482484774"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
            onChange={(event) => {
              const userId = event.target.value.replace(/\D/g, "");
              if (userId) {
                setDefaults((current) => ({
                  ...current,
                  email: `test_user_${userId}@testuser.com`,
                }));
              }
            }}
          />
          <p className="text-xs text-zinc-500">
            Só use este campo se o token for da conta Vendedor de teste.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="amount" className="text-sm font-medium text-zinc-700">
          Valor (R$)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaults.amount}
          key={`amount-${defaults.amount}`}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-zinc-700">
          Nome completo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="APRO"
          defaultValue={defaults.name}
          key={`name-${defaults.name}`}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          E-mail do pagador
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={
            isTestSeller
              ? "test_user_3482484774@testuser.com"
              : "comprador.exemplo@email.com"
          }
          value={defaults.email}
          onChange={(event) =>
            setDefaults((current) => ({ ...current, email: event.target.value }))
          }
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
        />
        {config?.collector?.email && !isTestSeller && (
          <p className="text-xs text-zinc-500">
            Deve ser diferente de {config.collector.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cpf" className="text-sm font-medium text-zinc-700">
          CPF
        </label>
        <input
          id="cpf"
          name="cpf"
          type="text"
          required
          placeholder="12345678909"
          defaultValue={defaults.cpf}
          key={`cpf-${defaults.cpf}`}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="description"
          className="text-sm font-medium text-zinc-700"
        >
          Descrição (opcional)
        </label>
        <input
          id="description"
          name="description"
          type="text"
          placeholder="Participação no bolão"
          defaultValue={defaults.description}
          key={`description-${defaults.description}`}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Gerando Pix..." : "Gerar QR Code Pix"}
      </button>
    </form>
  );
}
