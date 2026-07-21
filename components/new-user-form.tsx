"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function NewUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    const payload = Object.fromEntries(form);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, balance: Number(payload.balance) }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }
  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Создать гостя
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] grid items-end bg-[#102c22]/55 p-3 sm:place-items-center">
          <form
            action={(form) => void submit(form)}
            className="card w-full max-w-lg space-y-3 p-6"
          >
            <h2 className="serif text-2xl font-bold">Новый гость</h2>
            <input
              className="input"
              name="displayName"
              required
              placeholder="Отображаемое имя"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input"
                name="loginCode"
                required
                placeholder="Уникальный код"
              />
              <input
                className="input"
                name="balance"
                required
                type="number"
                min={0}
                defaultValue={2000}
                placeholder="Баланс"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" name="tableNumber" placeholder="Стол" />
              <input className="input" name="team" placeholder="Команда" />
            </div>
            <select className="input" name="role">
              <option value="USER">Пользователь</option>
              <option value="ADMIN">Администратор</option>
            </select>
            {error && (
              <p className="text-sm font-bold text-[#a84735]">{error}</p>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
              >
                Отмена
              </button>
              <button className="btn-primary">Создать</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
