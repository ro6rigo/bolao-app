"use client";

import { FormEvent, useEffect, useState } from "react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  betCount: number;
};

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao carregar usuários");
      setUsers([]);
      return;
    }
    setUsers(Array.isArray(data) ? data : []);
  }

  useEffect(() => { void load(); }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        cpf: fd.get("cpf"),
        phone: fd.get("phone"),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    event.currentTarget.reset();
    await load();
  }

  async function toggleStatus(user: UserRow) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      }),
    });
    await load();
  }

  async function deleteUser(id: string) {
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Usuários</h2>

      <form onSubmit={handleCreate} className="rounded-xl bg-white p-6 shadow-sm space-y-3">
        <h3 className="font-medium">Novo usuário (senha: 123456)</h3>
        <input name="name" required placeholder="Nome" className="w-full rounded-lg border px-3 py-2" />
        <input name="email" type="email" required placeholder="E-mail" className="w-full rounded-lg border px-3 py-2" />
        <input name="cpf" required placeholder="CPF" className="w-full rounded-lg border px-3 py-2" />
        <input name="phone" required placeholder="Telefone" className="w-full rounded-lg border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-white">Cadastrar</button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="pb-2">Nome</th>
              <th className="pb-2">E-mail</th>
              <th className="pb-2">Telefone</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Palpites pagos</th>
              <th className="pb-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-50">
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.email}</td>
                <td className="py-2">{u.phone ?? "—"}</td>
                <td className="py-2">{u.status}</td>
                <td className="py-2">{u.betCount}</td>
                <td className="py-2 space-x-2">
                  <button onClick={() => toggleStatus(u)} className="text-blue-600 underline">
                    {u.status === "ACTIVE" ? "Inativar" : "Ativar"}
                  </button>
                  <button onClick={() => deleteUser(u.id)} className="text-red-600 underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
