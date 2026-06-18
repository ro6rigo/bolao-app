"use client";

import { FormEvent, useEffect, useState } from "react";

type Profile = {
  name: string;
  email: string;
  phone: string | null;
};

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/profile").then((r) => r.json()).then(setProfile);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
      }),
    });
    if (res.ok) setMessage("Perfil atualizado!");
  }

  if (!profile) return null;

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-8 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold">Meu perfil</h2>
      <input name="name" defaultValue={profile.name} required className="w-full rounded-lg border px-3 py-2" />
      <input name="email" type="email" defaultValue={profile.email} required className="w-full rounded-lg border px-3 py-2" />
      <input name="phone" defaultValue={profile.phone ?? ""} placeholder="Telefone" className="w-full rounded-lg border px-3 py-2" />
      {message && <p className="text-sm text-green-700">{message}</p>}
      <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-white">Salvar</button>
    </form>
  );
}
