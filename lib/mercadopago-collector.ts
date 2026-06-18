export type CollectorProfile = {
  id: number;
  email: string;
  nickname: string;
  isTestCollector: boolean;
};

export function isTestUserEmail(email: string): boolean {
  return /@testuser\.com$/i.test(email);
}

export async function getCollectorProfile(
  accessToken: string,
): Promise<CollectorProfile> {
  const response = await fetch("https://api.mercadopago.com/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível consultar a conta vendedora no Mercado Pago.");
  }

  const data = (await response.json()) as {
    id: number;
    email?: string;
    nickname?: string;
  };

  const email = data.email ?? "";

  return {
    id: data.id,
    email,
    nickname: data.nickname ?? "",
    isTestCollector: isTestUserEmail(email),
  };
}

export function validatePayerEmailForCollector(
  payerEmail: string,
  collector: CollectorProfile,
): string | null {
  const normalizedPayer = payerEmail.trim().toLowerCase();
  const normalizedCollector = collector.email.trim().toLowerCase();

  if (normalizedPayer === normalizedCollector) {
    return `O e-mail do pagador não pode ser o mesmo da conta vendedora (${collector.email}).`;
  }

  if (collector.isTestCollector) {
    if (!isTestUserEmail(normalizedPayer)) {
      return "Com credenciais de conta vendedora de teste, use e-mail no formato test_user_{UserID}@testuser.com do Comprador de teste.";
    }
    return null;
  }

  if (isTestUserEmail(normalizedPayer)) {
    return `Seu token TEST está vinculado à conta real ${collector.email}. Nesse caso, não use e-mail @testuser.com. Use outro e-mail (ex.: comprador.exemplo@email.com) e nome APRO.`;
  }

  return null;
}
