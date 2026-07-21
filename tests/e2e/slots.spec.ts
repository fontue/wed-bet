import { expect, test, type Page, type TestInfo } from "@playwright/test";

const errors: string[] = [];
async function authenticate(page: Page) {
  const response = await page.request.post("/api/auth/exchange", {
    data: { token: "admin-demo" },
  });
  expect(response.ok()).toBeTruthy();
}
async function authenticateGuest(page: Page) {
  const response = await page.request.post("/api/auth/exchange", {
    data: { token: "guest-demo" },
  });
  expect(response.ok()).toBeTruthy();
}
function watchErrors(page: Page) {
  errors.length = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("favicon"))
      errors.push(message.text());
  });
}
async function expectHealthy(page: Page) {
  expect(errors, errors.join("\n")).toEqual([]);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}
async function capture(page: Page, testInfo: TestInfo, file: string) {
  await page.screenshot({
    path: testInfo.outputPath(file),
    animations: "disabled",
  });
}

test.beforeEach(async ({ page }) => {
  watchErrors(page);
  await authenticate(page);
});

test("модальные окна обоих слотов удерживают focus, закрываются Escape и возвращают focus", async ({
  page,
}) => {
  const login = await page.request.post("/api/auth/exchange", {
    data: { token: "guest-demo" },
  });
  expect(login.ok()).toBeTruthy();
  for (const item of [
    { path: "/slots/casa-degli-sposi", name: "Правила" },
    { path: "/slots/sweet-lemonza", name: "Правила" },
  ]) {
    await page.goto(item.path);
    const opener = page.getByRole("button", { name: item.name, exact: true });
    await opener.focus();
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeFocused();
    expect(
      await page.locator("body").evaluate((body) => body.style.overflow),
    ).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  }
  await expectHealthy(page);
});

test("Dog House payline проходит через измеренные центры ячеек", async ({
  page,
}, testInfo) => {
  await page.goto("/dev/casa-degli-sposi-animation-lab");
  await page.getByRole("button", { name: "Payline geometry QA" }).click();
  const overlay = page.locator(
    ".dogslot-payline-overlay[data-measured='grid']",
  );
  await expect(overlay).toBeVisible();
  const deviation = await overlay.evaluate((node) => {
    const svg = node as SVGSVGElement,
      matrix = svg.getScreenCTM();
    if (!matrix) throw new Error("SVG matrix unavailable");
    return Math.max(
      ...[
        ...svg.querySelectorAll<SVGCircleElement>("circle[data-cell-index]"),
      ].map((circle) => {
        const cell = document.querySelector<HTMLElement>(
          `[data-cell-index='${circle.dataset.cellIndex}']`,
        )!;
        const rect = cell.getBoundingClientRect(),
          point = svg.createSVGPoint();
        point.x = Number(circle.getAttribute("cx"));
        point.y = Number(circle.getAttribute("cy"));
        const screen = point.matrixTransform(matrix);
        return Math.hypot(
          screen.x - (rect.left + rect.width / 2),
          screen.y - (rect.top + rect.height / 2),
        );
      }),
    );
  });
  expect(deviation).toBeLessThanOrEqual(3);
  await capture(page, testInfo, "dog-house-payline.png");
  await expectHealthy(page);
});

for (const scenario of [
  { button: "Anticipation miss", file: "dog-house-anticipation-miss.png" },
  { button: "Anticipation hit", file: "dog-house-anticipation-hit.png" },
])
  test(`Dog House ${scenario.button}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dev/casa-degli-sposi-animation-lab");
    await page
      .getByRole("button", { name: scenario.button, exact: true })
      .click();
    await expect(page.locator(".dogslot-anticipation.is-active")).toBeVisible();
    await capture(page, testInfo, scenario.file);
    await expectHealthy(page);
  });

test("Dog House anticipation исчезает после окна ожидания", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev/casa-degli-sposi-animation-lab");
  await page
    .getByRole("button", { name: "Anticipation hit", exact: true })
    .click();
  const anticipation = page.locator(".dogslot-anticipation.is-active");
  await expect(anticipation).toBeVisible({ timeout: 20_000 });
  await expect(anticipation).toBeHidden({ timeout: 20_000 });
  await expectHealthy(page);
});

test("Dog House reveal показывает ровно девять серверных значений", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev/casa-degli-sposi-animation-lab");
  await page.getByRole("button", { name: "Bonus reveal 9" }).click();
  const reveal = page.locator(".dogslot-bonus-pick");
  await expect(reveal).toBeVisible({ timeout: 30_000 });
  await expect(reveal.locator("i")).toHaveCount(9);
  await capture(page, testInfo, "dog-house-bonus-reveal.png");
  await expectHealthy(page);
});

test("Dog House Sticky Wild сохраняет стабильную identity", async ({
  page,
}, testInfo) => {
  await page.goto("/dev/casa-degli-sposi-animation-lab");
  await page.getByRole("button", { name: "First Sticky Wild" }).click();
  const sticky = page.locator(".dogslot-cell.is-sticky").first();
  await expect(sticky).toBeVisible({ timeout: 30_000 });
  const id = await sticky.getAttribute("data-animation-id");
  expect(id).toMatch(/^sticky-/);
  await capture(page, testInfo, "dog-house-sticky-wild.png");
});

test("Lemonza cascade и multiplier collection стабильны на mobile", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev/sweet-lemonza-animation-lab");
  await page.getByRole("button", { name: "1 cascade", exact: true }).click();
  await expect(page.getByText("state: dropping-new-symbols")).toBeVisible({
    timeout: 8_000,
  });
  await capture(page, testInfo, "lemonza-cascade.png");
  await page.getByRole("button", { name: "Multiplier sum" }).click();
  await expect(page.getByText("state: revealing-multipliers")).toBeVisible();
  await capture(page, testInfo, "lemonza-multiplier-collection.png");
  await expectHealthy(page);
});

for (const game of [
  { path: "/dev/casa-degli-sposi-animation-lab", name: "dog-house" },
  { path: "/dev/sweet-lemonza-animation-lab", name: "lemonza" },
]) {
  test(`${game.name} не переполняет critical viewports`, async ({
    page,
  }, testInfo) => {
    for (const viewport of [
      { width: 320, height: 568, label: "320x568" },
      { width: 375, height: 812, label: "375x812" },
      { width: 390, height: 844, label: "390x844" },
      { width: 1280, height: 800, label: "desktop" },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(game.path);
      await expectHealthy(page);
      if (viewport.label === "390x844" || viewport.label === "desktop")
        await capture(page, testInfo, `${game.name}-${viewport.label}.png`);
    }
  });
}

for (const game of [
  { path: "/slots/casa-degli-sposi", rules: "Правила" },
  { path: "/slots/sweet-lemonza", rules: "Правила" },
])
  test(`${game.path} production UI стабилен на mobile и desktop`, async ({
    page,
  }) => {
    await authenticateGuest(page);
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(game.path);
      await expect(
        page.getByRole("button", { name: "Открыть тестовые сценарии" }),
      ).toHaveCount(0);
      const rules = page.getByRole("button", { name: game.rules, exact: true });
      await rules.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expectHealthy(page);
    }
  });

for (const game of [
  {
    name: "Sweet Lemonza",
    path: "/slots/sweet-lemonza",
    api: "/api/slots/sweet-lemonza/spin",
    key: "sweet-lemonza",
    spin: /^Spin$/,
  },
  {
    name: "Casa degli Sposi",
    path: "/slots/casa-degli-sposi",
    api: "/api/slots/casa-degli-sposi/spin",
    key: "casa-degli-sposi",
    spin: /^SPIN/,
  },
])
  test(`прерванный ${game.name} round восстанавливает показ без второго /spin и изменения серверного баланса`, async ({
    page,
  }) => {
    await authenticateGuest(page);
    await page.setViewportSize({ width: 390, height: 844 });
    let spinRequests = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes(game.api))
        spinRequests += 1;
    });
    await page.goto(game.path);
    const balance = page.locator("header > div").first(),
      responsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().includes(game.api),
      );
    await page.getByRole("button", { name: game.spin }).click();
    await responsePromise;
    await page.waitForFunction(
      (key) =>
        Object.keys(localStorage).some((item) =>
          item.includes(`slot-presentation:v1:${key}`),
        ),
      game.key,
    );
    await page.reload();
    await expect(
      page.getByText("Есть завершённый раунд, показ которого прервался."),
    ).toBeVisible();
    const serverBalance = await balance.textContent();
    await page.getByRole("button", { name: "Показать результат" }).click();
    await expect(
      page.getByText("Есть завершённый раунд, показ которого прервался."),
    ).toBeHidden();
    expect(await balance.textContent()).toBe(serverBalance);
    expect(spinRequests).toBe(1);
    expect(
      await page.evaluate(
        (key) =>
          Object.keys(localStorage).some((item) =>
            item.includes(`slot-presentation:v1:${key}`),
          ),
        game.key,
      ),
    ).toBeFalsy();
    await expectHealthy(page);
  });
