import { EventCard } from "@/components/event-card";
import { getNews, listEvents } from "@/infrastructure/mock/store";

export default function HomePage() {
  const events = listEvents().filter((event) => event.status === "OPEN");
  const news = getNews();
  const featured = events.find((event) => event.featured) ?? events[0];
  const popular = [...events].sort((a, b) => b.outcomes.reduce((sum, item) => sum + item.pool, 0) - a.outcomes.reduce((sum, item) => sum + item.pool, 0));
  return (
    <div className="page-shell">
      <section className="relative mb-8 overflow-hidden rounded-[1.8rem] bg-[#174b38] px-6 py-8 text-white md:px-10 md:py-10">
        <div className="absolute -right-12 -top-20 size-64 rounded-full border-[36px] border-[#f2cf55]/85" />
        <div className="absolute bottom-[-70px] right-28 size-32 rounded-full border-[20px] border-white/5" />
        <div className="relative max-w-xl"><p className="eyebrow !text-[#f2cf55]">Il mercato dell’amore</p><h1 className="serif mt-3 text-4xl font-bold leading-[1.05] md:text-5xl">Сегодня любовь<br />решает всё</h1><p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 md:text-base">Делайте прогнозы, следите за стаканами и забирайте лиры тех, кто ошибся. Коэффициенты живут до самого закрытия.</p></div>
      </section>

      <section className="mb-9">
        <div className="mb-4 flex items-end justify-between"><div><p className="eyebrow">Свежее с виллы</p><h2 className="serif mt-1 text-2xl font-bold">Новости и инсайды</h2></div><span className="text-2xl">🤌</span></div>
        <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {news.map((item) => <article key={item.id} className="card min-w-[82vw] snap-center p-4 sm:min-w-80"><div className="flex gap-3"><span className="text-2xl">{item.emoji}</span><div><h3 className="font-extrabold">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-[#6c796f]">{item.body}</p></div></div></article>)}
        </div>
      </section>

      <section className="mb-9">
        <div className="mb-4"><p className="eyebrow">Главная линия</p><h2 className="serif mt-1 text-2xl font-bold">Сейчас принимают ставки</h2></div>
        <div className="grid gap-4 md:grid-cols-2">{featured && <EventCard event={featured} featured />}{popular.filter((event) => event.id !== featured?.id).map((event) => <EventCard key={event.id} event={event} />)}</div>
      </section>
      <div className="rounded-2xl border border-[#c9983c]/25 bg-[#f2cf55]/14 p-4 text-center text-xs leading-relaxed text-[#6d623d]">Свадебные лиры — только игровая валюта. Их нельзя купить, пополнить или обменять на реальные деньги.</div>
    </div>
  );
}
