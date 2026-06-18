"use client";

import { useEffect, useState } from "react";

type PixQrDisplayProps = {
  qrCode: string;
  qrCodeBase64: string;
  amount: number;
  expiresInMinutes?: number;
};

export function PixQrDisplay({
  qrCode,
  qrCodeBase64,
  amount,
  expiresInMinutes = 30,
}: PixQrDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expiresInMinutes * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm text-zinc-500">Valor a pagar</p>
        <p className="text-3xl font-semibold text-zinc-900">
          {amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code Pix"
          width={256}
          height={256}
          className="h-64 w-64"
        />
      </div>

      <div className="w-full rounded-lg bg-zinc-50 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Pix copia e cola
        </p>
        <p className="break-all text-sm text-zinc-700">{qrCode}</p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="w-full rounded-lg border border-zinc-300 px-4 py-3 font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
      >
        {copied ? "Código copiado!" : "Copiar código Pix"}
      </button>

      <p className="text-sm text-zinc-500">
        Expira em {minutes}:{seconds.toString().padStart(2, "0")}
      </p>
    </div>
  );
}
