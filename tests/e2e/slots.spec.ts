import { expect, test, type Page } from "@playwright/test";

const errors:string[]=[];
async function authenticate(page:Page){const response=await page.request.post("/api/auth/exchange",{data:{token:"admin-demo"}});expect(response.ok()).toBeTruthy();}
function watchErrors(page:Page){errors.length=0;page.on("pageerror",(error)=>errors.push(error.message));page.on("console",(message)=>{if(message.type()==="error"&&!message.text().includes("favicon"))errors.push(message.text());});}
async function expectHealthy(page:Page){expect(errors,errors.join("\n")).toEqual([]);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow).toBeLessThanOrEqual(1);}

test.beforeEach(async({page})=>{watchErrors(page);await authenticate(page);});

test("модальные окна обоих слотов удерживают focus, закрываются Escape и возвращают focus",async({page})=>{
  const login=await page.request.post("/api/auth/exchange",{data:{token:"guest-demo"}});expect(login.ok()).toBeTruthy();
  for(const item of [{path:"/slots/casa-degli-sposi",name:"?"},{path:"/slots/sweet-lemonza",name:"Правила"}]){
    await page.goto(item.path);const opener=page.getByRole("button",{name:item.name,exact:true});await opener.focus();await opener.click();const dialog=page.getByRole("dialog");await expect(dialog).toBeVisible();await expect(dialog).toBeFocused();expect(await page.locator("body").evaluate((body)=>body.style.overflow)).toBe("hidden");await page.keyboard.press("Escape");await expect(dialog).toBeHidden();await expect(opener).toBeFocused();
  }
  await expectHealthy(page);
});

test("Dog House payline проходит через измеренные центры ячеек",async({page})=>{
  await page.goto("/dev/casa-degli-sposi-animation-lab");
  await page.getByRole("button",{name:"Payline geometry QA"}).click();
  const overlay=page.locator(".dogslot-payline-overlay[data-measured='true']");await expect(overlay).toBeVisible();
  const deviation=await overlay.evaluate((svg)=>{const box=svg.getBoundingClientRect();return Math.max(...[...svg.querySelectorAll<SVGCircleElement>("circle[data-cell-index]")].map((circle)=>{const cell=document.querySelector<HTMLElement>(`[data-cell-index='${circle.dataset.cellIndex}']`)!;const rect=cell.getBoundingClientRect(),x=Number(circle.getAttribute("cx"))+box.left,y=Number(circle.getAttribute("cy"))+box.top;return Math.hypot(x-(rect.left+rect.width/2),y-(rect.top+rect.height/2));}));});
  expect(deviation).toBeLessThanOrEqual(3);await page.screenshot({path:"docs/qa-screenshots/dog-house-payline.png"});await expectHealthy(page);
});

for(const scenario of [{button:"Anticipation miss",file:"dog-house-anticipation-miss.png"},{button:"Anticipation hit",file:"dog-house-anticipation-hit.png"}])test(`Dog House ${scenario.button}`,async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto("/dev/casa-degli-sposi-animation-lab");await page.getByRole("button",{name:scenario.button,exact:true}).click();await expect(page.locator(".dogslot-anticipation.is-active")).toBeVisible();await page.screenshot({path:`docs/qa-screenshots/${scenario.file}`});await expectHealthy(page);
});

test("Dog House reveal показывает ровно девять серверных значений",async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto("/dev/casa-degli-sposi-animation-lab");await page.getByRole("button",{name:"Bonus reveal 9"}).click();const reveal=page.locator(".dogslot-bonus-pick");await expect(reveal).toBeVisible();await expect(reveal.locator("i")).toHaveCount(9);await page.screenshot({path:"docs/qa-screenshots/dog-house-bonus-reveal.png"});await expectHealthy(page);
});

test("Dog House Sticky Wild сохраняет стабильную identity",async({page})=>{
  await page.goto("/dev/casa-degli-sposi-animation-lab");await page.getByRole("button",{name:"First Sticky Wild"}).click();const sticky=page.locator(".dogslot-cell.is-sticky").first();await expect(sticky).toBeVisible({timeout:30_000});const id=await sticky.getAttribute("data-animation-id");expect(id).toMatch(/^sticky-/);await page.screenshot({path:"docs/qa-screenshots/dog-house-sticky-wild.png"});
});

test("Lemonza cascade и multiplier collection стабильны на mobile",async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto("/dev/sweet-lemonza-animation-lab");await page.getByRole("button",{name:"1 cascade",exact:true}).click();await expect(page.getByText("state: dropping-new-symbols")).toBeVisible({timeout:8_000});await page.screenshot({path:"docs/qa-screenshots/lemonza-cascade.png"});await page.getByRole("button",{name:"Multiplier sum"}).click();await expect(page.getByText("state: revealing-multipliers")).toBeVisible();await page.screenshot({path:"docs/qa-screenshots/lemonza-multiplier-collection.png"});await expectHealthy(page);
});

for(const game of [{path:"/dev/casa-degli-sposi-animation-lab",name:"dog-house"},{path:"/dev/sweet-lemonza-animation-lab",name:"lemonza"}]){
  test(`${game.name} не переполняет critical viewports`,async({page})=>{for(const viewport of [{width:320,height:568,label:"320x568"},{width:360,height:800,label:"360x800"},{width:390,height:844,label:"390x844"},{width:844,height:390,label:"landscape"}]){await page.setViewportSize(viewport);await page.goto(game.path);await expectHealthy(page);if(viewport.label==="390x844"||viewport.label==="landscape")await page.screenshot({path:`docs/qa-screenshots/${game.name}-${viewport.label}.png`});}});
}
