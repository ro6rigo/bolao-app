"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PaymentStatusPoller } from "@/app/pagamento/components/PaymentStatusPoller";
import { PixQrDisplay } from "@/app/pagamento/components/PixQrDisplay";
import {
  DEZENA_EXTRA_HINTS,
  DEZENA_EXTRA_OPTIONS,
  type DezenaExtraCode,
  buildDezenaBetDetails,
  formatDezenaBetSummary,
} from "@/lib/games/dezena-options";
import {
  GRUPO_EXTRA_HINTS,
  GRUPO_EXTRA_OPTIONS,
  type GrupoExtraCode,
  buildGrupoBetDetails,
  formatGrupoBetSummary,
} from "@/lib/games/grupo-options";
import {
  MILHAR_EXTRA_OPTIONS,
  MILHAR_EXTRA_HINTS,
  type MilharExtraCode,
  buildMilharBetDetails,
  formatMilharBetSummary,
} from "@/lib/games/milhar-options";
import { PLAY_STYLES, type PlayStyle } from "@/lib/games/play-styles";
import { BET_AMOUNT_MAX, BET_AMOUNT_MIN } from "@/lib/validations/bet";

type Game = {
  id: string;
  matchDate: string;
  bettingClosesAt?: string;
  bettingCloseMinutesBefore?: number;
};

function formatCloseTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

type Step = "form" | "payment" | "done";

type ExtraLineState = {
  checked: boolean;
  amount: string;
};

type SelectedBet = {
  playStyle: PlayStyle;
  betNumber: string;
  summary?: string | null;
};

function emptyMilharExtraState(): Record<MilharExtraCode, ExtraLineState> {
  return MILHAR_EXTRA_OPTIONS.reduce(
    (acc, option) => {
      acc[option.code] = { checked: false, amount: "" };
      return acc;
    },
    {} as Record<MilharExtraCode, ExtraLineState>,
  );
}

function emptyGrupoExtraState(): Record<GrupoExtraCode, ExtraLineState> {
  return GRUPO_EXTRA_OPTIONS.reduce(
    (acc, option) => {
      acc[option.code] = { checked: false, amount: "" };
      return acc;
    },
    {} as Record<GrupoExtraCode, ExtraLineState>,
  );
}

function emptyDezenaExtraState(): Record<DezenaExtraCode, ExtraLineState> {
  return DEZENA_EXTRA_OPTIONS.reduce(
    (acc, option) => {
      acc[option.code] = { checked: false, amount: "" };
      return acc;
    },
    {} as Record<DezenaExtraCode, ExtraLineState>,
  );
}

function parseAmount(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  return amount;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatGameTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function PalpitarPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qr, setQr] = useState<{ qrCode: string; qrCodeBase64: string; amount: number } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [playStyle, setPlayStyle] = useState<PlayStyle | "">("");
  const [betNumber, setBetNumber] = useState("");
  const [milharAmount, setMilharAmount] = useState("");
  const [milharExtras, setMilharExtras] = useState(emptyMilharExtraState);
  const [grupoAmount, setGrupoAmount] = useState("");
  const [grupoExtras, setGrupoExtras] = useState(emptyGrupoExtraState);
  const [dezenaAmount, setDezenaAmount] = useState("");
  const [dezenaExtras, setDezenaExtras] = useState(emptyDezenaExtraState);
  const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null);

  const [loadingGame, setLoadingGame] = useState(true);

  const game = games.find((item) => item.id === selectedGameId) ?? games[0] ?? null;

  async function loadActiveGames() {
    try {
      const r = await fetch("/api/games/active");
      const text = await r.text();
      if (!text) {
        setError("Resposta inválida ao carregar os jogos.");
        return;
      }
      const data = JSON.parse(text) as Game[] | { error?: string };
      if (!r.ok) {
        setError("error" in data ? String(data.error) : "Erro ao carregar jogos.");
        return;
      }
      const list = Array.isArray(data) ? data : [];
      setGames(list);
      setError(null);
      setSelectedGameId((current) =>
        list.some((item) => item.id === current) ? current : (list[0]?.id ?? ""),
      );
    } catch {
      setError("Erro ao carregar jogos. Verifique se o servidor está rodando.");
    } finally {
      setLoadingGame(false);
    }
  }

  useEffect(() => {
    void loadActiveGames();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setGames((current) =>
        current.filter(
          (item) =>
            !item.bettingClosesAt || now < new Date(item.bettingClosesAt).getTime(),
        ),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedGameId || games.some((item) => item.id === selectedGameId)) return;
    setSelectedGameId(games[0]?.id ?? "");
    if (games.length === 0) {
      setError("Palpites encerrados para todos os horários deste dia.");
    }
  }, [games, selectedGameId]);

  function buildMilharPayload():
    | { milharAmount: number; extras: Array<{ code: MilharExtraCode; amount: number }> }
    | { error: string } {
    const mainAmount = parseAmount(milharAmount);
    if (mainAmount == null) {
      return { error: "Informe o valor do milhar" };
    }
    if (mainAmount < BET_AMOUNT_MIN || mainAmount > BET_AMOUNT_MAX) {
      return {
        error: `Valor do milhar entre ${formatCurrency(BET_AMOUNT_MIN)} e ${formatCurrency(BET_AMOUNT_MAX)}`,
      };
    }

    const extras: Array<{ code: MilharExtraCode; amount: number }> = [];
    for (const option of MILHAR_EXTRA_OPTIONS) {
      const line = milharExtras[option.code];
      if (!line.checked) continue;
      const amount = parseAmount(line.amount);
      if (amount == null) {
        return { error: `Informe o valor de ${option.label}` };
      }
      if (amount < BET_AMOUNT_MIN || amount > BET_AMOUNT_MAX) {
        return {
          error: `Valor de ${option.label} entre ${formatCurrency(BET_AMOUNT_MIN)} e ${formatCurrency(BET_AMOUNT_MAX)}`,
        };
      }
      extras.push({ code: option.code, amount });
    }

    return { milharAmount: mainAmount, extras };
  }

  function buildGrupoPayload():
    | { grupoAmount: number; grupoExtras: Array<{ code: GrupoExtraCode; amount: number }> }
    | { error: string } {
    const grupo = Number(betNumber.replace(/\D/g, ""));
    if (!Number.isFinite(grupo) || grupo < 1 || grupo > 25) {
      return { error: "Grupo deve ser de 1 a 25" };
    }

    const mainAmount = parseAmount(grupoAmount);
    if (mainAmount == null) {
      return { error: "Informe o valor do grupo" };
    }
    if (mainAmount < BET_AMOUNT_MIN || mainAmount > BET_AMOUNT_MAX) {
      return {
        error: `Valor do grupo entre ${formatCurrency(BET_AMOUNT_MIN)} e ${formatCurrency(BET_AMOUNT_MAX)}`,
      };
    }

    const grupoExtrasPayload: Array<{ code: GrupoExtraCode; amount: number }> = [];
    for (const option of GRUPO_EXTRA_OPTIONS) {
      const line = grupoExtras[option.code];
      if (!line.checked) continue;
      const amount = parseAmount(line.amount);
      if (amount == null) {
        return { error: `Informe o valor da opção ${option.label}` };
      }
      if (amount < BET_AMOUNT_MIN || amount > BET_AMOUNT_MAX) {
        return {
          error: `Valor da opção ${option.label} entre ${formatCurrency(BET_AMOUNT_MIN)} e ${formatCurrency(BET_AMOUNT_MAX)}`,
        };
      }
      grupoExtrasPayload.push({ code: option.code, amount });
    }

    return { grupoAmount: mainAmount, grupoExtras: grupoExtrasPayload };
  }

  function buildDezenaPayload():
    | { dezenaAmount: number; dezenaExtras: Array<{ code: DezenaExtraCode; amount: number }> }
    | { error: string } {
    const dezena = Number(betNumber.replace(/\D/g, ""));
    if (!Number.isFinite(dezena) || dezena < 10 || dezena > 99) {
      return { error: "Dezena deve ser de 10 a 99" };
    }

    const mainAmount = parseAmount(dezenaAmount);
    if (mainAmount == null) {
      return { error: "Informe o valor da dezena" };
    }
    if (mainAmount < BET_AMOUNT_MIN || mainAmount > BET_AMOUNT_MAX) {
      return {
        error: `Valor da dezena entre ${formatCurrency(BET_AMOUNT_MIN)} e ${formatCurrency(BET_AMOUNT_MAX)}`,
      };
    }

    const dezenaExtrasPayload: Array<{ code: DezenaExtraCode; amount: number }> = [];
    for (const option of DEZENA_EXTRA_OPTIONS) {
      const line = dezenaExtras[option.code];
      if (!line.checked) continue;
      const amount = parseAmount(line.amount);
      if (amount == null) {
        return { error: `Informe o valor da opção ${option.label}` };
      }
      if (amount < BET_AMOUNT_MIN || amount > BET_AMOUNT_MAX) {
        return {
          error: `Valor da opção ${option.label} entre ${formatCurrency(BET_AMOUNT_MIN)} e ${formatCurrency(BET_AMOUNT_MAX)}`,
        };
      }
      dezenaExtrasPayload.push({ code: option.code, amount });
    }

    return { dezenaAmount: mainAmount, dezenaExtras: dezenaExtrasPayload };
  }

  async function submitPrediction() {
    if (!game || !playStyle || !betNumber.trim()) return;
    setError(null);
    setSubmitting(true);

    let payload: Record<string, unknown> = {
      gameId: game.id,
      playStyle,
      betNumber: betNumber.trim(),
    };

    let betSummary: string | null = null;

    if (playStyle === "MILHAR") {
      const milhar = buildMilharPayload();
      if ("error" in milhar) {
        setError(milhar.error);
        setSubmitting(false);
        return;
      }
      payload = { ...payload, milharAmount: milhar.milharAmount, extras: milhar.extras };
      betSummary = formatMilharBetSummary(
        buildMilharBetDetails(betNumber.trim(), milhar.milharAmount, milhar.extras),
      );
    }

    if (playStyle === "GRUPO") {
      const grupo = buildGrupoPayload();
      if ("error" in grupo) {
        setError(grupo.error);
        setSubmitting(false);
        return;
      }
      payload = {
        ...payload,
        betNumber: String(Number(betNumber.replace(/\D/g, ""))),
        grupoAmount: grupo.grupoAmount,
        grupoExtras: grupo.grupoExtras,
      };
      betSummary = formatGrupoBetSummary(
        buildGrupoBetDetails(payload.betNumber as string, grupo.grupoAmount, grupo.grupoExtras),
      );
    }

    if (playStyle === "DEZENA") {
      const dezena = buildDezenaPayload();
      if ("error" in dezena) {
        setError(dezena.error);
        setSubmitting(false);
        return;
      }
      payload = {
        ...payload,
        betNumber: String(Number(betNumber.replace(/\D/g, ""))),
        dezenaAmount: dezena.dezenaAmount,
        dezenaExtras: dezena.dezenaExtras,
      };
      betSummary = formatDezenaBetSummary(
        buildDezenaBetDetails(payload.betNumber as string, dezena.dezenaAmount, dezena.dezenaExtras),
      );
    }

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSelectedBet({ playStyle, betNumber: betNumber.trim(), summary: betSummary });

      if (data.skipPix) {
        setStep("done");
        return;
      }

      setPaymentId(data.paymentId);
      setQr({ qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64, amount: data.amount });
      setStep("payment");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current?.reportValidity()) return;

    if (playStyle === "MILHAR") {
      const milhar = buildMilharPayload();
      if ("error" in milhar) {
        setError(milhar.error);
        return;
      }
    }

    if (playStyle === "GRUPO") {
      const grupo = buildGrupoPayload();
      if ("error" in grupo) {
        setError(grupo.error);
        return;
      }
    }

    if (playStyle === "DEZENA") {
      const dezena = buildDezenaPayload();
      if ("error" in dezena) {
        setError(dezena.error);
        return;
      }
    }

    setShowConfirmModal(true);
  }

  const handleApproved = useCallback(() => setStep("done"), []);

  if (loadingGame) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-zinc-600">Carregando jogo...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-zinc-600">
          {error ?? "Nenhum jogo aberto para palpite no momento."}
        </p>
      </div>
    );
  }

  const selectedGameTime = formatGameTime(game.matchDate);

  if (step === "done") {
    return (
      <div className="space-y-6">
        {selectedBet && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">{formatGameTime(game.matchDate)}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{selectedBet.playStyle}</p>
            <p className="text-sm text-zinc-700">{selectedBet.summary ?? selectedBet.betNumber}</p>
          </div>
        )}
        <div className="rounded-xl bg-white p-8 text-center shadow-sm space-y-4">
          <p className="text-lg font-medium text-green-700">Palpite confirmado!</p>
          <p className="text-sm text-zinc-600">
            Pagamento via Pix temporariamente desativado — palpite registrado como pago para testes.
          </p>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setPaymentId(null);
              setQr(null);
              setSelectedBet(null);
              setPlayStyle("");
              setBetNumber("");
              setMilharAmount("");
              setMilharExtras(emptyExtraState());
              setError(null);
              void loadActiveGames();
            }}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Fazer outro palpite
          </button>
        </div>
      </div>
    );
  }

  if (step === "payment" && qr && paymentId) {
    return (
      <div className="flex flex-col gap-6">
        {selectedBet && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">{formatGameTime(game.matchDate)}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{selectedBet.playStyle}</p>
            <p className="text-sm text-zinc-700">{selectedBet.summary ?? selectedBet.betNumber}</p>
          </div>
        )}
        <div className="flex flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold">Pague via Pix para confirmar</h2>
          <PixQrDisplay {...qr} />
          <PaymentStatusPoller paymentId={paymentId} onStatusChange={(s) => s === "approved" && handleApproved()} />
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        className="space-y-6"
      >
        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Horário do jogo</h2>
          </div>
          {games.length > 1 ? (
            <label className="flex flex-col gap-1 text-sm text-zinc-800">
              Escolha o horário
              <select
                required
                value={selectedGameId}
                onChange={(event) => {
                  setSelectedGameId(event.target.value);
                  setError(null);
                }}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              >
                {games.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatGameTime(item.matchDate)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-zinc-600">Jogo de {selectedGameTime}</p>
              <p className="text-xs text-zinc-500">
                Só este horário ainda aceita palpite; os demais do dia já encerraram.
              </p>
            </div>
          )}
          <h2 className="text-lg font-semibold text-zinc-900">Estilo de jogo</h2>
          <label className="flex flex-col gap-1 text-sm text-zinc-800">
            Escolha o estilo
            <select
              required
              value={playStyle}
              onChange={(event) => {
                const next = event.target.value as PlayStyle | "";
                setPlayStyle(next);
                setBetNumber("");
                setMilharAmount("");
                setMilharExtras(emptyMilharExtraState());
                setGrupoAmount("");
                setGrupoExtras(emptyGrupoExtraState());
                setDezenaAmount("");
                setDezenaExtras(emptyDezenaExtraState());
                setError(null);
              }}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            >
              <option value="">Selecione</option>
              {PLAY_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </label>
          {playStyle === "MILHAR" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-zinc-800">
                  Número
                  <input
                    name="betNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    pattern="[0-9]+"
                    maxLength={4}
                    value={betNumber}
                    onChange={(event) => setBetNumber(event.target.value.replace(/\D/g, ""))}
                    placeholder="Ex.: 1234"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-lg tracking-widest text-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-800">
                  Valor (R$)
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={milharAmount}
                    onChange={(event) => setMilharAmount(event.target.value.replace(/[^\d,.]/g, ""))}
                    placeholder="0,00"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  />
                </label>
              </div>

              <div className="space-y-2 border-t border-zinc-100 pt-4">
                {MILHAR_EXTRA_OPTIONS.map((option) => {
                  const line = milharExtras[option.code];
                  return (
                    <div
                      key={option.code}
                      className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2"
                    >
                      <label className="flex min-w-28 items-center gap-2 text-sm text-zinc-800">
                        <input
                          type="checkbox"
                          checked={line.checked}
                          onChange={(event) =>
                            setMilharExtras((current) => ({
                              ...current,
                              [option.code]: {
                                ...current[option.code],
                                checked: event.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 rounded border-zinc-300"
                        />
                        <span>{option.label}</span>
                      </label>
                      {line.checked && MILHAR_EXTRA_HINTS[option.code] ? (
                        <p className="w-full text-xs text-zinc-500">{MILHAR_EXTRA_HINTS[option.code]}</p>
                      ) : null}
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={!line.checked}
                        value={line.amount}
                        onChange={(event) =>
                          setMilharExtras((current) => ({
                            ...current,
                            [option.code]: {
                              ...current[option.code],
                              amount: event.target.value.replace(/[^\d,.]/g, ""),
                            },
                          }))
                        }
                        placeholder="Valor (R$)"
                        className="min-w-32 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {playStyle === "GRUPO" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-zinc-800">
                  Grupo (1 a 25)
                  <input
                    name="betNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    pattern="[0-9]+"
                    maxLength={2}
                    value={betNumber}
                    onChange={(event) => setBetNumber(event.target.value.replace(/\D/g, "").slice(0, 2))}
                    placeholder="Ex.: 13"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-lg tracking-widest text-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-800">
                  Valor (R$)
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={grupoAmount}
                    onChange={(event) => setGrupoAmount(event.target.value.replace(/[^\d,.]/g, ""))}
                    placeholder="0,00"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  />
                </label>
              </div>

              <div className="space-y-2 border-t border-zinc-100 pt-4">
                {GRUPO_EXTRA_OPTIONS.map((option) => {
                  const line = grupoExtras[option.code];
                  return (
                    <div
                      key={option.code}
                      className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2"
                    >
                      <label className="flex min-w-28 items-center gap-2 text-sm text-zinc-800">
                        <input
                          type="checkbox"
                          checked={line.checked}
                          onChange={(event) =>
                            setGrupoExtras((current) => ({
                              ...current,
                              [option.code]: {
                                ...current[option.code],
                                checked: event.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 rounded border-zinc-300"
                        />
                        <span>{option.label}</span>
                      </label>
                      {line.checked && GRUPO_EXTRA_HINTS[option.code] ? (
                        <p className="w-full text-xs text-zinc-500">{GRUPO_EXTRA_HINTS[option.code]}</p>
                      ) : null}
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={!line.checked}
                        value={line.amount}
                        onChange={(event) =>
                          setGrupoExtras((current) => ({
                            ...current,
                            [option.code]: {
                              ...current[option.code],
                              amount: event.target.value.replace(/[^\d,.]/g, ""),
                            },
                          }))
                        }
                        placeholder="Valor (R$)"
                        className="min-w-32 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {playStyle === "DEZENA" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-zinc-800">
                  Dezena (10 a 99)
                  <input
                    name="betNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    pattern="[0-9]+"
                    maxLength={2}
                    value={betNumber}
                    onChange={(event) => setBetNumber(event.target.value.replace(/\D/g, "").slice(0, 2))}
                    placeholder="Ex.: 45"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-lg tracking-widest text-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-800">
                  Valor (R$)
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={dezenaAmount}
                    onChange={(event) => setDezenaAmount(event.target.value.replace(/[^\d,.]/g, ""))}
                    placeholder="0,00"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  />
                </label>
              </div>

              <div className="space-y-2 border-t border-zinc-100 pt-4">
                {DEZENA_EXTRA_OPTIONS.map((option) => {
                  const line = dezenaExtras[option.code];
                  return (
                    <div
                      key={option.code}
                      className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2"
                    >
                      <label className="flex min-w-28 items-center gap-2 text-sm text-zinc-800">
                        <input
                          type="checkbox"
                          checked={line.checked}
                          onChange={(event) =>
                            setDezenaExtras((current) => ({
                              ...current,
                              [option.code]: {
                                ...current[option.code],
                                checked: event.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 rounded border-zinc-300"
                        />
                        <span>{option.label}</span>
                      </label>
                      {line.checked && DEZENA_EXTRA_HINTS[option.code] ? (
                        <p className="w-full text-xs text-zinc-500">{DEZENA_EXTRA_HINTS[option.code]}</p>
                      ) : null}
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={!line.checked}
                        value={line.amount}
                        onChange={(event) =>
                          setDezenaExtras((current) => ({
                            ...current,
                            [option.code]: {
                              ...current[option.code],
                              amount: event.target.value.replace(/[^\d,.]/g, ""),
                            },
                          }))
                        }
                        placeholder="Valor (R$)"
                        className="min-w-32 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {playStyle &&
            playStyle !== "MILHAR" &&
            playStyle !== "GRUPO" &&
            playStyle !== "DEZENA" && (
            <label className="flex flex-col gap-1 text-sm text-zinc-800">
              Número
              <input
                name="betNumber"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                required
                pattern="[0-9]+"
                maxLength={20}
                value={betNumber}
                onChange={(event) => setBetNumber(event.target.value.replace(/\D/g, ""))}
                placeholder="Digite o número"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-lg tracking-widest text-zinc-900"
              />
            </label>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Detalhes do palpite</h2>
          {game.bettingClosesAt && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Palpites encerram em{" "}
              <strong>{formatCloseTime(game.bettingClosesAt)}</strong>
              {game.bettingCloseMinutesBefore != null && game.bettingCloseMinutesBefore > 0 && (
                <span className="text-amber-800/80">
                  {" "}
                  ({game.bettingCloseMinutesBefore} min antes do jogo)
                </span>
              )}
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-zinc-900 py-3 font-medium text-white">
            Confirmar palpite
          </button>
        </div>
      </form>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-palpite-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
          >
            <h3 id="confirm-palpite-title" className="text-lg font-semibold text-zinc-900">
              Confirmar palpite
            </h3>
            <div className="mt-4 space-y-3 text-sm text-zinc-700">
              <p>
                A aposta deve ser realizada por uma pessoa <strong>maior de 18 anos</strong>.
              </p>
              <p>
                Estilo: <strong>{playStyle}</strong>
              </p>
              {playStyle === "MILHAR" ? (
                <p>
                  {(() => {
                    const milhar = buildMilharPayload();
                    if ("error" in milhar) return null;
                    return formatMilharBetSummary(
                      buildMilharBetDetails(betNumber.trim(), milhar.milharAmount, milhar.extras),
                    );
                  })()}
                </p>
              ) : playStyle === "GRUPO" ? (
                <p>
                  {(() => {
                    const grupo = buildGrupoPayload();
                    if ("error" in grupo) return null;
                    return formatGrupoBetSummary(
                      buildGrupoBetDetails(
                        String(Number(betNumber.replace(/\D/g, ""))),
                        grupo.grupoAmount,
                        grupo.grupoExtras,
                      ),
                    );
                  })()}
                </p>
              ) : playStyle === "DEZENA" ? (
                <p>
                  {(() => {
                    const dezena = buildDezenaPayload();
                    if ("error" in dezena) return null;
                    return formatDezenaBetSummary(
                      buildDezenaBetDetails(
                        String(Number(betNumber.replace(/\D/g, ""))),
                        dezena.dezenaAmount,
                        dezena.dezenaExtras,
                      ),
                    );
                  })()}
                </p>
              ) : betNumber ? (
                <p>
                  Número: <strong>{betNumber}</strong>
                </p>
              ) : null}
              <p>
                Horário: <strong>{selectedGameTime}</strong>
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  void submitPrediction();
                }}
                disabled={submitting}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
