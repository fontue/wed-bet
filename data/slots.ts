import { LEMONZA_GAME } from "@/domain/slots/sweet-lemonza/config";
import { DOG_HOUSE_GAME } from "@/domain/slots/dog-house/config";

export const slotCatalog = [
  {
    ...LEMONZA_GAME,
    href: "/slots/sweet-lemonza",
    badge: "Новая игра",
    coverTone: "lemon" as const,
  },
  {
    ...DOG_HOUSE_GAME,
    href: "/slots/casa-degli-sposi",
    badge: "Высокая волатильность",
    coverTone: "dogs" as const,
  },
];
