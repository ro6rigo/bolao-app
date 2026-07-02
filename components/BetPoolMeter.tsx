"use client";

import { useEffect, useRef, useState } from "react";

type PoolStats = {
  totalPaid: number;
  paidCount: number;
};

type BetPoolMeterProps = {
  gameId: string;
  pollIntervalMs?: number;
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function BetPoolMeter({ gameId, pollIntervalMs = 4000 }: BetPoolMeterProps) {
  const [stats, setStats] = useState<PoolStats>({ totalPaid: 0, paidCount: 0 });
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPool() {
      try {
        const response = await fetch("/api/games/active/pool");
        const data = (await response.json()) as PoolStats & { gameId?: string | null };
        if (!cancelled && response.ok && data.gameId === gameId) {
          setStats({ totalPaid: data.totalPaid, paidCount: data.paidCount });
        }
      } catch {
        // mantém último valor exibido
      }
    }

    void fetchPool();
    const interval = window.setInterval(fetchPool, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [gameId, pollIntervalMs]);

  useEffect(() => {
    const target = stats.totalPaid;
    const start = displayValue;
    if (Math.abs(target - start) < 0.005) {
      setDisplayValue(target);
      return;
    }

    const startTime = performance.now();
    const duration = 700;

    function frame(now: number) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(start + (target - start) * eased);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(frame);
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(frame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- anima a partir do valor atual na tela
  }, [stats.totalPaid]);

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 shadow-lg ring-1 ring-red-700/40">
      <div className="border-b border-red-700/50 bg-red-950/80 px-4 py-2 text-center">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-400" />
          Total apostado ao vivo
        </p>
      </div>
      <div className="px-4 py-5 text-center">
        <p className="font-mono text-3xl font-bold tabular-nums tracking-tight text-amber-300 sm:text-4xl">
          {formatCurrency(displayValue)}
        </p>
        <p className="mt-2 text-sm text-red-100/80">
          {stats.paidCount}{" "}
          {stats.paidCount === 1 ? "palpite pago" : "palpites pagos"} neste jogo
        </p>
      </div>
    </div>
  );
}
