# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slots.spec.ts >> Dog House reveal показывает ровно девять серверных значений
- Location: tests/e2e/slots.spec.ts:30:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.dogslot-bonus-pick')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('.dogslot-bonus-pick')

```

```yaml
- banner:
  - text: Development only
  - heading "Casa degli Sposi Lab" [level=1]
  - button "normal"
  - button "Reduced"
- main:
  - grid "Пять барабанов, три ряда":
    - gridcell "J":
      - img "J"
    - gridcell "Бонусная лапа":
      - img "Бонусная лапа": BONUS
    - gridcell "J":
      - img "J"
    - gridcell "Q":
      - img "Q"
    - gridcell "Q":
      - img "Q"
    - gridcell "Мопс":
      - img "Мопс"
    - gridcell "Бонусная лапа":
      - img "Бонусная лапа": BONUS
    - gridcell "A":
      - img "A"
    - gridcell "Бруно":
      - img "Бруно"
    - gridcell "Q":
      - img "Q"
    - gridcell "Мопс":
      - img "Мопс"
    - gridcell "Мопс":
      - img "Мопс"
    - gridcell "Мопс":
      - img "Мопс"
    - gridcell "Бруно":
      - img "Бруно"
    - gridcell "Бонусная лапа":
      - img "Бонусная лапа": BONUS
  - code: entering-bonus
  - complementary:
    - button "Payline geometry QA"
    - button "Losing spin"
    - button "Simple payline"
    - button "Many paylines"
    - button "Wild 2X"
    - button "Wild 2X + 3X"
    - button "Anticipation miss"
    - button "Anticipation hit"
    - button "Bonus reveal 9"
    - button "Bonus reveal 18"
    - button "Bonus reveal 27"
    - button "First Sticky Wild"
    - button "Multiple Sticky Wild"
    - button "Big win"
    - button "FF during reels"
    - button "FF during reveal"
    - button "FF during free spins"
    - button "FAST-FORWARD / phase"
- alert
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | 
  3  | const errors:string[]=[];
  4  | async function authenticate(page:Page){const response=await page.request.post("/api/auth/exchange",{data:{token:"admin-demo"}});expect(response.ok()).toBeTruthy();}
  5  | function watchErrors(page:Page){errors.length=0;page.on("pageerror",(error)=>errors.push(error.message));page.on("console",(message)=>{if(message.type()==="error"&&!message.text().includes("favicon"))errors.push(message.text());});}
  6  | async function expectHealthy(page:Page){expect(errors,errors.join("\n")).toEqual([]);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow).toBeLessThanOrEqual(1);}
  7  | 
  8  | test.beforeEach(async({page})=>{watchErrors(page);await authenticate(page);});
  9  | 
  10 | test("модальные окна обоих слотов удерживают focus, закрываются Escape и возвращают focus",async({page})=>{
  11 |   const login=await page.request.post("/api/auth/exchange",{data:{token:"guest-demo"}});expect(login.ok()).toBeTruthy();
  12 |   for(const item of [{path:"/slots/casa-degli-sposi",name:"?"},{path:"/slots/sweet-lemonza",name:"Правила"}]){
  13 |     await page.goto(item.path);const opener=page.getByRole("button",{name:item.name,exact:true});await opener.focus();await opener.click();const dialog=page.getByRole("dialog");await expect(dialog).toBeVisible();await expect(dialog).toBeFocused();expect(await page.locator("body").evaluate((body)=>body.style.overflow)).toBe("hidden");await page.keyboard.press("Escape");await expect(dialog).toBeHidden();await expect(opener).toBeFocused();
  14 |   }
  15 |   await expectHealthy(page);
  16 | });
  17 | 
  18 | test("Dog House payline проходит через измеренные центры ячеек",async({page})=>{
  19 |   await page.goto("/dev/casa-degli-sposi-animation-lab");
  20 |   await page.getByRole("button",{name:"Payline geometry QA"}).click();
  21 |   const overlay=page.locator(".dogslot-payline-overlay[data-measured='true']");await expect(overlay).toBeVisible();
  22 |   const deviation=await overlay.evaluate((svg)=>{const box=svg.getBoundingClientRect();return Math.max(...[...svg.querySelectorAll<SVGCircleElement>("circle[data-cell-index]")].map((circle)=>{const cell=document.querySelector<HTMLElement>(`[data-cell-index='${circle.dataset.cellIndex}']`)!;const rect=cell.getBoundingClientRect(),x=Number(circle.getAttribute("cx"))+box.left,y=Number(circle.getAttribute("cy"))+box.top;return Math.hypot(x-(rect.left+rect.width/2),y-(rect.top+rect.height/2));}));});
  23 |   expect(deviation).toBeLessThanOrEqual(3);await page.screenshot({path:"docs/qa-screenshots/dog-house-payline.png"});await expectHealthy(page);
  24 | });
  25 | 
  26 | for(const scenario of [{button:"Anticipation miss",file:"dog-house-anticipation-miss.png"},{button:"Anticipation hit",file:"dog-house-anticipation-hit.png"}])test(`Dog House ${scenario.button}`,async({page})=>{
  27 |   await page.setViewportSize({width:390,height:844});await page.goto("/dev/casa-degli-sposi-animation-lab");await page.getByRole("button",{name:scenario.button,exact:true}).click();await expect(page.locator(".dogslot-anticipation.is-active")).toBeVisible();await page.screenshot({path:`docs/qa-screenshots/${scenario.file}`});await expectHealthy(page);
  28 | });
  29 | 
  30 | test("Dog House reveal показывает ровно девять серверных значений",async({page})=>{
> 31 |   await page.setViewportSize({width:390,height:844});await page.goto("/dev/casa-degli-sposi-animation-lab");await page.getByRole("button",{name:"Bonus reveal 9"}).click();const reveal=page.locator(".dogslot-bonus-pick");await expect(reveal).toBeVisible();await expect(reveal.locator("i")).toHaveCount(9);await page.screenshot({path:"docs/qa-screenshots/dog-house-bonus-reveal.png"});await expectHealthy(page);
     |                                                                                                                                                                                                                                                  ^ Error: expect(locator).toBeVisible() failed
  32 | });
  33 | 
  34 | test("Dog House Sticky Wild сохраняет стабильную identity",async({page})=>{
  35 |   await page.goto("/dev/casa-degli-sposi-animation-lab");await page.getByRole("button",{name:"First Sticky Wild"}).click();const sticky=page.locator(".dogslot-cell.is-sticky").first();await expect(sticky).toBeVisible({timeout:30_000});const id=await sticky.getAttribute("data-animation-id");expect(id).toMatch(/^sticky-/);await page.screenshot({path:"docs/qa-screenshots/dog-house-sticky-wild.png"});
  36 | });
  37 | 
  38 | test("Lemonza cascade и multiplier collection стабильны на mobile",async({page})=>{
  39 |   await page.setViewportSize({width:390,height:844});await page.goto("/dev/sweet-lemonza-animation-lab");await page.getByRole("button",{name:"1 cascade",exact:true}).click();await expect(page.getByText("state: dropping-new-symbols")).toBeVisible({timeout:8_000});await page.screenshot({path:"docs/qa-screenshots/lemonza-cascade.png"});await page.getByRole("button",{name:"Multiplier sum"}).click();await expect(page.getByText("state: revealing-multipliers")).toBeVisible();await page.screenshot({path:"docs/qa-screenshots/lemonza-multiplier-collection.png"});await expectHealthy(page);
  40 | });
  41 | 
  42 | for(const game of [{path:"/dev/casa-degli-sposi-animation-lab",name:"dog-house"},{path:"/dev/sweet-lemonza-animation-lab",name:"lemonza"}]){
  43 |   test(`${game.name} не переполняет critical viewports`,async({page})=>{for(const viewport of [{width:320,height:568,label:"320x568"},{width:360,height:800,label:"360x800"},{width:390,height:844,label:"390x844"},{width:844,height:390,label:"landscape"}]){await page.setViewportSize(viewport);await page.goto(game.path);await expectHealthy(page);if(viewport.label==="390x844"||viewport.label==="landscape")await page.screenshot({path:`docs/qa-screenshots/${game.name}-${viewport.label}.png`});}});
  44 | }
  45 | 
```