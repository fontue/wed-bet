"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DraftOutcome {
  title: string;
  probability: number;
}
export function NewEventForm() {
  const router = useRouter();
  const [outcomes, setOutcomes] = useState<DraftOutcome[]>([
    { title: "Да", probability: 50 },
    { title: "Нет", probability: 50 },
  ]);
  const [error, setError] = useState("");
  const total = outcomes.reduce(
    (sum, item) => sum + Number(item.probability),
    0,
  );
  async function submit(form: FormData) {
    setError("");
    const data = Object.fromEntries(form);
    const response = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...data,
        liquidity: Number(data.liquidity),
        outcomes,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    router.push(`/admin/events/${body.id}`);
    router.refresh();
  }
  return (
    <form
      action={(form) => void submit(form)}
      className="grid gap-6 lg:grid-cols-[1fr_20rem]"
    >
      <section className="card space-y-4 p-5">
        <div>
          <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider">
            Название
          </label>
          <input
            className="input"
            name="title"
            required
            placeholder="Что случится на свадьбе?"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider">
            Описание
          </label>
          <textarea
            className="input min-h-24 resize-y"
            name="description"
            required
            placeholder="Чёткие условия расчёта события"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider">
              Категория
            </label>
            <input
              className="input"
              name="category"
              required
              placeholder="Банкет"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider">
              Эмодзи
            </label>
            <input className="input" name="emoji" defaultValue="🍋" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider">
              Закрытие
            </label>
            <input
              className="input"
              name="closesAt"
              required
              type="datetime-local"
            />
          </div>
        </div>
        <div className="border-t border-[#174b38]/10 pt-5">
          <div className="flex items-center justify-between">
            <h2 className="serif text-xl font-bold">Исходы</h2>
            <button
              type="button"
              className="btn-secondary !min-h-9 text-xs"
              onClick={() =>
                setOutcomes((items) => [
                  ...items,
                  { title: "", probability: 0 },
                ])
              }
            >
              + Добавить
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {outcomes.map((outcome, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_5.5rem_2.5rem] gap-2"
              >
                <input
                  className="input"
                  placeholder={`Исход ${index + 1}`}
                  value={outcome.title}
                  onChange={(e) =>
                    setOutcomes((items) =>
                      items.map((item, i) =>
                        i === index ? { ...item, title: e.target.value } : item,
                      ),
                    )
                  }
                />
                <div className="relative">
                  <input
                    className="input pr-7"
                    type="number"
                    min={0}
                    max={100}
                    value={outcome.probability}
                    onChange={(e) =>
                      setOutcomes((items) =>
                        items.map((item, i) =>
                          i === index
                            ? { ...item, probability: Number(e.target.value) }
                            : item,
                        ),
                      )
                    }
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                    %
                  </span>
                </div>
                <button
                  type="button"
                  className="rounded-xl text-[#a84735] hover:bg-[#a84735]/8"
                  onClick={() =>
                    setOutcomes((items) => items.filter((_, i) => i !== index))
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p
            className={`mt-2 text-xs font-bold ${total === 100 ? "text-[#2f7251]" : "text-[#a84735]"}`}
          >
            Сумма вероятностей: {total}%{" "}
            {total === 100 ? "✓" : "— нужна ровно 100%"}
          </p>
        </div>
      </section>
      <aside className="card h-fit p-5">
        <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider">
          Стартовая ликвидность
        </label>
        <input
          className="input"
          name="liquidity"
          type="number"
          defaultValue={1000}
          min={1}
        />
        <p className="mt-2 text-xs leading-relaxed text-[#788078]">
          Системные лиры распределятся по начальным вероятностям и сформируют
          первые стаканы.
        </p>
        {error && (
          <p className="mt-3 text-xs font-bold text-[#a84735]">{error}</p>
        )}
        <button
          className="btn-primary mt-5 w-full"
          disabled={total !== 100 || outcomes.length < 2}
        >
          Сохранить черновик
        </button>
      </aside>
    </form>
  );
}
