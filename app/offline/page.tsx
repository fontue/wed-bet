import Link from "next/link";
import { Logo } from "@/components/logo";
export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="card max-w-md p-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="my-7 text-6xl">🍋</div>
        <p className="eyebrow">Connessione perduta</p>
        <h1 className="serif mt-2 text-3xl font-bold">Итальянская пауза</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6e7a71]">
          Сети пока нет. Ранее открытые события доступны из кэша, а действия
          дождутся восстановления соединения.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Попробовать снова
        </Link>
      </section>
    </main>
  );
}
