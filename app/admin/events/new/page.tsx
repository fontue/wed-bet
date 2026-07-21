import { NewEventForm } from "@/components/new-event-form";
export default function NewEventPage() {
  return (
    <div>
      <p className="eyebrow">Nuovo mercato</p>
      <h1 className="serif mt-1 text-3xl font-bold">Новое событие</h1>
      <p className="mb-6 mt-2 text-sm text-[#6f7a72]">
        Добавьте любое количество исходов. Начальные вероятности должны дать
        ровно 100%.
      </p>
      <NewEventForm />
    </div>
  );
}
