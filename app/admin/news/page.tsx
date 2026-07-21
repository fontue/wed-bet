import { NewsEditor } from "@/components/news-editor";
import { getNews } from "@/infrastructure/mock/store";
export default function AdminNewsPage() {
  const news = getNews();
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Notizie</p>
          <h1 className="serif mt-1 text-3xl font-bold">Новости и инсайды</h1>
        </div>
        <NewsEditor />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {news.map((item) => (
          <article className="card p-5" key={item.id}>
            <div className="flex gap-3">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <h2 className="font-extrabold">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#6d7970]">
                  {item.body}
                </p>
                <small className="mt-3 block text-[#8b8f88]">
                  {new Date(item.publishedAt).toLocaleString("ru-RU")}
                </small>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
