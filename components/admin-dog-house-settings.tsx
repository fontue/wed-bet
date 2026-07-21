"use client";
import { useState } from "react";
import type { DogHouseOperationalSettings } from "@/domain/models";
import { DOG_HOUSE_BETS } from "@/domain/slots/dog-house/config";
export function AdminDogHouseSettings({
  initial,
}: {
  initial: DogHouseOperationalSettings;
}) {
  const [settings, setSettings] = useState(initial),
    [message, setMessage] = useState("");
  async function save() {
    const response = await fetch("/api/admin/slots/casa-degli-sposi", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    setMessage(response.ok ? "Настройки сохранены" : "Не удалось сохранить");
  }
  function toggleBet(bet: number, checked: boolean) {
    setSettings((value) => ({
      ...value,
      allowedBets: checked
        ? [...value.allowedBets, bet].sort((a, b) => a - b)
        : value.allowedBets.filter((item) => item !== bet),
    }));
  }
  return (
    <section className="card p-5">
      <h2 className="serif text-xl font-bold">Casa degli Sposi</h2>
      <p className="mt-1 text-xs text-[#748078]">
        Операционные настройки без доступа к математике.
      </p>
      {(["enabled", "spinsEnabled"] as const).map((key) => (
        <label
          key={key}
          className="mt-2 flex items-center justify-between rounded-xl bg-[#174b38]/5 p-3 text-sm font-bold"
        >
          <span>{key === "enabled" ? "Игра видна" : "Spin разрешён"}</span>
          <input
            type="checkbox"
            checked={settings[key]}
            onChange={() =>
              setSettings((value) => ({ ...value, [key]: !value[key] }))
            }
          />
        </label>
      ))}
      <p className="mt-4 text-xs font-bold">Доступные ставки</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {DOG_HOUSE_BETS.map((bet) => (
          <label
            key={bet}
            className="rounded-full bg-[#174b38]/6 px-3 py-2 text-xs font-bold"
          >
            <input
              className="mr-2"
              type="checkbox"
              checked={settings.allowedBets.includes(bet)}
              onChange={(event) => toggleBet(bet, event.target.checked)}
            />
            {bet}
          </label>
        ))}
      </div>
      <button className="btn-primary mt-4 w-full" onClick={() => void save()}>
        Сохранить
      </button>
      {message && <p className="mt-2 text-center text-xs">{message}</p>}
    </section>
  );
}
