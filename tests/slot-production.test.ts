import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CompletionRegistry } from "../components/slots/shared/completion-registry";

function test(name:string,run:()=>void){try{run();console.log(`✓ ${name}`);}catch(error){console.error(`✗ ${name}`);throw error;}}

test("completion registry принимает round только один раз",()=>{const registry=new CompletionRegistry();assert.equal(registry.claim("round-a"),true);assert.equal(registry.claim("round-a"),false);});
test("completion registry ограничен и не растёт всю сессию",()=>{const registry=new CompletionRegistry(3);for(let index=0;index<20;index+=1)registry.claim(`round-${index}`);assert.equal(registry.size,3);});
test("оба playback hook имеют явный once и recovery path",()=>{for(const file of ["../components/slots/dog-house/animation/use-dog-house-playback.ts","../components/slots/sweet-lemonza/animation/use-round-playback.ts"]){const source=readFileSync(new URL(file,import.meta.url),"utf8");assert.ok(source.includes("new CompletionRegistry()"),file);assert.ok(source.includes("Анимация была восстановлена"),file);assert.ok(source.includes("generation.current"),file);}});
test("пользовательский UI не вызывает skipToRoundEnd",()=>{for(const file of ["../components/slots/dog-house-game.tsx","../components/slots/lemonza-game.tsx"]){const source=readFileSync(new URL(file,import.meta.url),"utf8");assert.equal(source.includes("skipToRoundEnd"),false,file);}});
test("service worker не перехватывает API и non-GET",()=>{const source=readFileSync(new URL("../public/sw.js",import.meta.url),"utf8");assert.ok(source.includes('request.method !== "GET"'));assert.ok(source.includes('url.pathname.startsWith("/api/")'));});

console.log("Все production-инварианты слотов пройдены.");
