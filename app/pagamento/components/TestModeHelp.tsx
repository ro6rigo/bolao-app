"use client";

import { useEffect, useState } from "react";

type PaymentConfig = {
  configured: boolean;
  mode: "unconfigured" | "test_seller" | "real_seller_test_token";
  collector?: {
    id: number;
    email: string;
    nickname: string;
  };
  hint?: string;
  suggestedPayerEmail?: string;
};

export function TestModeHelp() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    void fetch("/api/payments/config")
      .then((response) => response.json())
      .then((data: PaymentConfig) => setConfig(data))
      .catch(() => setConfig(null));
  }, []);

  const isRealSeller =
    config?.mode === "real_seller_test_token" && config.collector;

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-medium">Modo teste (sandbox)</p>

      {isRealSeller ? (
        <>
          <p className="mt-2 text-amber-900">
            Seu token TEST está vinculado à conta real{" "}
            <strong>{config.collector?.email}</strong> (User ID{" "}
            {config.collector?.id}). Neste cenário:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900">
            <li>
              <strong>Não use</strong> e-mail{" "}
              <code className="rounded bg-amber-100 px-1">@testuser.com</code>{" "}
              — por isso test_user / test_payer falham
            </li>
            <li>
              Use e-mail fictício <strong>diferente</strong> do seu Mercado Pago
              (ex.:{" "}
              <code className="rounded bg-amber-100 px-1">
                comprador.exemplo@email.com
              </code>
              )
            </li>
            <li>
              <strong>Nome:</strong>{" "}
              <code className="rounded bg-amber-100 px-1">APRO</code>
            </li>
            <li>
              <strong>CPF:</strong>{" "}
              <code className="rounded bg-amber-100 px-1">12345678909</code>
            </li>
          </ul>
        </>
      ) : (
        <>
          <p className="mt-2 text-amber-900">
            Conta vendedora de teste detectada. Use o User ID do{" "}
            <strong>Comprador</strong> (Contas de teste → Comprador):
          </p>
          <p className="mt-2 rounded bg-amber-100 px-2 py-1 font-mono text-xs">
            test_user_{"{User ID}"}@testuser.com
          </p>
          <p className="mt-2 text-amber-900">
            User ID <strong>3482484774</strong> só funciona se o token for da
            conta <strong>Vendedor de teste</strong>, não da conta real.
          </p>
        </>
      )}

      <p className="mt-3 text-xs text-amber-800">
        User ID / Usuário / Senha / Código do painel = login no app Mercado
        Pago, não vão no formulário. No sandbox o Pix fica pendente — use
        &quot;Simular aprovação (dev)&quot; na tela do QR ou pague de verdade em
        produção.
      </p>
    </div>
  );
}
