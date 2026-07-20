import type { Bet, BonusDefinition, MarketEvent, NewsPost, User, WalletTransaction } from "@/domain/models";

const now = new Date();
const inHours = (hours: number) => new Date(now.getTime() + hours * 3_600_000).toISOString();
const agoHours = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();

export const seedUsers: User[] = [
  { id: "u-sofia", displayName: "София Романо", loginCode: "SOFIA-7", role: "USER", status: "ACTIVE", balance: 2_450, tableNumber: "7", team: "Лимончелло", avatar: "СР", createdAt: agoHours(48) },
  { id: "u-misha", displayName: "Миша Волков", loginCode: "MISHA-3", role: "USER", status: "ACTIVE", balance: 3_120, tableNumber: "3", team: "Аморе", avatar: "МВ", createdAt: agoHours(48) },
  { id: "u-lena", displayName: "Лена Орлова", loginCode: "LENA-5", role: "USER", status: "ACTIVE", balance: 1_880, tableNumber: "5", team: "Dolce Vita", avatar: "ЛО", createdAt: agoHours(48) },
  { id: "u-anton", displayName: "Антон Белый", loginCode: "ANTON-9", role: "USER", status: "ACTIVE", balance: 4_360, tableNumber: "9", team: "Лимончелло", avatar: "АБ", createdAt: agoHours(48) },
  { id: "u-admin", displayName: "Марко · крупье", loginCode: "MARCO-1", role: "ADMIN", status: "ACTIVE", balance: 50_000, avatar: "МК", createdAt: agoHours(72) },
];

export const seedEvents: MarketEvent[] = [
  {
    id: "e-toast", slug: "first-toast", title: "Кто первым растрогается во время тоста?", description: "Слеза, дрогнувший голос или срочно понадобившаяся салфетка — всё считается. Решение за свадебным крупье.", category: "Церемония", emoji: "🥂", status: "OPEN", closesAt: inHours(3), createdAt: agoHours(2), featured: true,
    outcomes: [
      { id: "o-groom", title: "Жених", order: 0, initialProbabilityBps: 4200, seedPool: 420, pool: 1_760, bettorsCount: 12 },
      { id: "o-bride", title: "Невеста", order: 1, initialProbabilityBps: 3800, seedPool: 380, pool: 1_320, bettorsCount: 9 },
      { id: "o-mom", title: "Кто-то из мам", order: 2, initialProbabilityBps: 2000, seedPool: 200, pool: 860, bettorsCount: 6 },
    ],
  },
  {
    id: "e-dance", slug: "first-dancefloor", title: "Кто первым захватит танцпол?", description: "Считается первый гость, который выйдет танцевать без приглашения ведущего.", category: "Танцы", emoji: "🕺", status: "OPEN", closesAt: inHours(5), createdAt: agoHours(1),
    outcomes: [
      { id: "o-anton", title: "Антон", order: 0, initialProbabilityBps: 3500, seedPool: 350, pool: 2_130, bettorsCount: 18 },
      { id: "o-aunt", title: "Тётя Люда", order: 1, initialProbabilityBps: 2500, seedPool: 250, pool: 1_420, bettorsCount: 11 },
      { id: "o-friend", title: "Друг жениха", order: 2, initialProbabilityBps: 2200, seedPool: 220, pool: 970, bettorsCount: 7 },
      { id: "o-other", title: "Другой гость", order: 3, initialProbabilityBps: 1800, seedPool: 180, pool: 760, bettorsCount: 5 },
    ],
  },
  {
    id: "e-cake", slug: "cake-time", title: "Во сколько подадут торт?", description: "Засекаем момент, когда торт полностью появится в зале.", category: "Банкет", emoji: "🎂", status: "OPEN", closesAt: inHours(7), createdAt: agoHours(5),
    outcomes: [
      { id: "o-before", title: "До 21:00", order: 0, initialProbabilityBps: 2000, seedPool: 200, pool: 740, bettorsCount: 4 },
      { id: "o-between", title: "21:00–22:00", order: 1, initialProbabilityBps: 5500, seedPool: 550, pool: 2_890, bettorsCount: 21 },
      { id: "o-after", title: "После 22:00", order: 2, initialProbabilityBps: 2500, seedPool: 250, pool: 1_130, bettorsCount: 8 },
    ],
  },
  {
    id: "e-bottle", slug: "anton-bottle", title: "Выпьет ли Антон из горла?", description: "Бокалы рядом не считаются оправданием.", category: "Инсайд", emoji: "🍾", status: "OPEN", closesAt: inHours(4), createdAt: agoHours(8),
    outcomes: [
      { id: "o-yes", title: "Да, конечно", order: 0, initialProbabilityBps: 6500, seedPool: 650, pool: 3_480, bettorsCount: 27 },
      { id: "o-no", title: "Нет, удержится", order: 1, initialProbabilityBps: 3500, seedPool: 350, pool: 1_220, bettorsCount: 9 },
    ],
  },
];

export const seedBets: Bet[] = [
  { id: "b-1", userId: "u-sofia", eventId: "e-bottle", outcomeId: "o-yes", amount: 300, status: "ACCEPTED", projectedCoefficient: 1.39, probabilityAfterBps: 7191, idempotencyKey: "seed-b1", createdAt: agoHours(1) },
  { id: "b-2", userId: "u-sofia", eventId: "e-cake", outcomeId: "o-between", amount: 200, status: "ACCEPTED", projectedCoefficient: 1.61, probabilityAfterBps: 6218, idempotencyKey: "seed-b2", createdAt: agoHours(3) },
  { id: "b-3", userId: "u-sofia", eventId: "e-old-win", outcomeId: "o-old", amount: 150, status: "WON", projectedCoefficient: 2.2, probabilityAfterBps: 4545, payout: 330, idempotencyKey: "seed-b3", createdAt: agoHours(30), settledAt: agoHours(25) },
  { id: "b-4", userId: "u-sofia", eventId: "e-old-lose", outcomeId: "o-old", amount: 100, status: "LOST", projectedCoefficient: 2.8, probabilityAfterBps: 3571, payout: 0, idempotencyKey: "seed-b4", createdAt: agoHours(25), settledAt: agoHours(20) },
];

export const seedTransactions: WalletTransaction[] = [
  { id: "t-init", userId: "u-sofia", amount: 2_500, type: "INITIAL_BALANCE", reason: "Стартовый баланс гостя", balanceAfter: 2_500, operationKey: "seed-init", createdAt: agoHours(48) },
  { id: "t-b1", userId: "u-sofia", amount: -300, type: "BET", reason: "Выпьет ли Антон из горла?", balanceAfter: 2_200, operationKey: "seed-b1", createdAt: agoHours(3) },
  { id: "t-win", userId: "u-sofia", amount: 330, type: "WIN", reason: "Поймает ли букет подруга невесты?", balanceAfter: 2_530, operationKey: "seed-win", createdAt: agoHours(25) },
  { id: "t-b2", userId: "u-sofia", amount: -200, type: "BET", reason: "Во сколько подадут торт?", balanceAfter: 2_330, operationKey: "seed-b2", createdAt: agoHours(3) },
  { id: "t-gift", userId: "u-sofia", amount: 120, type: "BONUS", reason: "Подарок колеса фортуны", balanceAfter: 2_450, operationKey: "seed-gift", createdAt: agoHours(2) },
];

export const seedBonusDefinitions: BonusDefinition[] = [
  { id: "bonus-100", label: "+100 лир", kind: "LIRA", value: 100, weight: 22, color: "#f4c95d", validityMinutes: 0, active: true },
  { id: "bonus-free", label: "Ставка 150", kind: "FREE_BET", value: 150, weight: 16, color: "#1f5a45", validityMinutes: 180, active: true },
  { id: "bonus-x15", label: "Прибыль X1,5", kind: "MULTIPLIER", value: 150, weight: 10, color: "#e8a84c", validityMinutes: 180, active: true },
  { id: "bonus-back", label: "Возврат 30%", kind: "CASHBACK", value: 30, weight: 14, color: "#92a96f", validityMinutes: 180, active: true },
  { id: "bonus-50", label: "+50 лир", kind: "LIRA", value: 50, weight: 24, color: "#f7df96", validityMinutes: 0, active: true },
  { id: "bonus-none", label: "Неаполь плачет", kind: "NONE", value: 0, weight: 14, color: "#eee5d3", validityMinutes: 0, active: true },
];

export const seedNews: NewsPost[] = [
  { id: "n-1", title: "Инсайд из кухни", body: "Торт уже приехал, но кондитер загадочно молчит о времени выхода.", emoji: "🍋", publishedAt: agoHours(1) },
  { id: "n-2", title: "Замечен Антон", body: "У бара. Без бокала. Рынок начинает нервничать.", emoji: "👀", publishedAt: agoHours(2) },
];
