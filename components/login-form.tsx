"use client";

import { useState } from "react";

export function LoginForm({ token, showDemo }: { token?: string; showDemo: boolean }) {
  const [value, setValue] = useState(token ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(rawToken: string) {
    if (!rawToken.trim()) {
      setError("Введите код из карточки или выберите demo-аккаунт");
      return;
    }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/exchange", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: rawToken.trim() }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Не удалось войти"); return; }
      window.history.replaceState({}, "", "/login");
      window.location.assign(body.user.role === "ADMIN" ? "/admin" : "/");
    } catch {
      setError("Сервер входа недоступен. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={(event) => { event.preventDefault(); void login(value); }} className="space-y-3">
        <label className="block text-sm font-bold text-[#36594b]">Код из персональной карточки</label>
        <input className="input" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Вставьте одноразовый токен" autoComplete="one-time-code" />
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Открываем двери…" : "Войти на праздник"}</button>
      </form>
      {error && <p className="rounded-xl bg-[#a84735]/10 p-3 text-sm font-bold text-[#963f31]">{error}</p>}
      {showDemo && <div className="space-y-4">
        <div className="relative py-2 text-center text-xs font-bold uppercase tracking-widest text-[#8b907f] before:absolute before:left-0 before:top-1/2 before:w-[42%] before:border-t before:border-[#174b38]/10 after:absolute after:right-0 after:top-1/2 after:w-[42%] after:border-t after:border-[#174b38]/10">demo</div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`btn-secondary text-sm ${value === "guest-demo" ? "!border-[#c9983c] !bg-[#f2cf55]/15" : ""}`} disabled={loading} onClick={() => { setValue("guest-demo"); void login("guest-demo"); }}>Гость София</button>
          <button type="button" className={`btn-secondary text-sm ${value === "admin-demo" ? "!border-[#c9983c] !bg-[#f2cf55]/15" : ""}`} disabled={loading} onClick={() => { setValue("admin-demo"); void login("admin-demo"); }}>Крупье Марко</button>
        </div>
        <p className="text-center text-xs leading-relaxed text-[#778078]">Demo-входы доступны только локально. Настоящие QR-ссылки остаются одноразовыми.</p>
      </div>}
    </div>
  );
}
