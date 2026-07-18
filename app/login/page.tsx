import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="card w-full max-w-md overflow-hidden">
        <div className="relative bg-[#174b38] px-8 py-10 text-white">
          <div className="absolute -right-8 -top-8 size-36 rounded-full border-[22px] border-[#f2cf55]/80" />
          <div className="relative [&_span]:text-white"><Logo /></div>
          <p className="serif relative mt-10 max-w-xs text-3xl font-bold leading-tight">Benvenuti на главную ставку вечера</p>
          <p className="relative mt-3 text-sm text-white/70">Только свадебные лиры. Никаких реальных денег — только азарт и семейный компромат.</p>
        </div>
        <div className="p-7"><LoginForm token={token} showDemo={process.env.NODE_ENV !== "production"} /></div>
      </section>
    </main>
  );
}
