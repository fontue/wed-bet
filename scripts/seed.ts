import { seedEvents, seedUsers } from "../data/seed.ts";

if (process.env.NODE_ENV === "production") {
  throw new Error("Seed запрещён в production. Создавайте пользователей через админку.");
}

console.log("Демонстрационные данные готовы:");
console.table(seedUsers.map((user) => ({ name: user.displayName, role: user.role, loginCode: user.loginCode, balance: user.balance })));
console.log(`Событий: ${seedEvents.length}`);
console.log("Одноразовые dev-токены: guest-demo, admin-demo");
