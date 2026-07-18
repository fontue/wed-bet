import { AdminBonusSettings } from "@/components/admin-bonus-settings";
import { getBonusDefinitions } from "@/infrastructure/mock/store";
export default function AdminBonusesPage() { const settings = getBonusDefinitions(); return <div><p className="eyebrow">La fortuna</p><h1 className="serif mt-1 text-3xl font-bold">Настройки колеса</h1><p className="mb-6 mt-2 text-sm text-[#6f7a72]">Результат всегда выбирается сервером по этим весам.</p><AdminBonusSettings initialDefinitions={settings.definitions} initialInterval={settings.intervalMinutes} /></div>; }
