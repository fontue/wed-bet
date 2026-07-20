"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatLira } from "@/domain/market";
import type { DogHouseOperationalSettings, DogHouseSlotRound } from "@/domain/models";
import type { DogHouseCell, DogHouseSpin } from "@/domain/slots/dog-house/types";
import { createClientRequestId } from "@/lib/client-id";
import { createDisplayModel } from "./dog-house/animation/display-reels";
import type { DogHouseSpeed } from "./dog-house/animation/animation-types";
import { useDogHousePlayback } from "./dog-house/animation/use-dog-house-playback";
import { DogHouseSoundManagerV2 } from "./dog-house/audio/sound-manager";
import type { DogHouseSoundEvent } from "./dog-house/audio/sound-events";
import { AnimationStatus } from "./dog-house/components/animation-status";
import { BigWinOverlay, BonusAnticipation, BonusPickGrid, BonusSummary, LineWinLabel } from "./dog-house/components/animation-overlays";
import { DogHouseGrid } from "./dog-house/components/dog-house-grid";
import { DogHouseHistoryModal } from "./dog-house/components/history-modal";
import { DogHouseRulesModal } from "./dog-house/components/rules-modal";

type InitialState={settings:DogHouseOperationalSettings;balance:number;history:DogHouseSlotRound[]};
const PREVIEW:DogHouseCell["symbol"][]=["TEN","K","BONE","Q","DACHSHUND","A","PUG","COLLAR","J","BELLA","TEN","BRUNO","K","Q","BONE"];
const previewSpin:DogHouseSpin={grid:PREVIEW.map((symbol,index)=>({id:-index-1,symbol})),wins:[],payout:0,bonusCount:0,stickyWilds:[]};
function useReducedMotion(){const [reduced,setReduced]=useState(false);useEffect(()=>{const query=matchMedia("(prefers-reduced-motion: reduce)"),update=()=>setReduced(query.matches);update();query.addEventListener("change",update);return()=>query.removeEventListener("change",update);},[]);return reduced;}

export function DogHouseGame({initialState}:{initialState:InitialState}){
  const bets=initialState.settings.allowedBets,[stake,setStake]=useState(bets[0]),[balance,setBalance]=useState(initialState.balance),[history,setHistory]=useState(initialState.history),[speed,setSpeed]=useState<DogHouseSpeed>("normal"),[muted,setMuted]=useState(false),[rules,setRules]=useState(false),[historyOpen,setHistoryOpen]=useState(false),[error,setError]=useState(""),reducedMotion=useReducedMotion(),[sound]=useState(()=>new DogHouseSoundManagerV2()),pending=useRef<{stake:number;idempotencyKey:string;debited:boolean}|undefined>(undefined);
  useEffect(()=>{sound.setMuted(muted);},[muted,sound]);useEffect(()=>()=>sound.dispose(),[sound]);useEffect(()=>{window.dispatchEvent(new CustomEvent("wedbet:balance",{detail:balance}));},[balance]);
  const onSound=useCallback((event:DogHouseSoundEvent,step?:number)=>{if(event!=="anticipation")sound.stopLoops();sound.play(event,step);},[sound]);
  const complete=useCallback((round:DogHouseSlotRound)=>{sound.stopLoops();setBalance(round.balanceAfter);setHistory((items)=>[round,...items.filter((item)=>item.id!==round.id)].slice(0,20));pending.current=undefined;},[sound]);
  const playback=useDogHousePlayback({speed,reducedMotion,onSound,onComplete:complete}),{view}=playback;
  const model=view.model??createDisplayModel(previewSpin,{roundId:"preview",spinIndex:0}),requesting=view.state==="requesting-spin",busy=playback.busy;
  async function spin(){
    if(busy){if(!requesting)playback.skip();return;}if(!navigator.onLine){setError("Spin требует сети. Полученный раунд можно доиграть offline, новый запуск запрещён.");return;}if(balance<stake&&!pending.current){setError("Недостаточно свадебных лир.");return;}if(!initialState.settings.enabled||!initialState.settings.spinsEnabled){setError("Игра временно закрыта крупье.");return;}
    await sound.unlock();onSound("spin-press");setError("");playback.requesting();const existing=pending.current,request=existing??{stake,idempotencyKey:createClientRequestId(),debited:true};if(!existing){pending.current=request;setBalance((value)=>value-request.stake);}
    try{const response=await fetch("/api/slots/casa-degli-sposi/spin",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({gameId:"casa-degli-sposi",stake:request.stake,idempotencyKey:request.idempotencyKey})}),body=await response.json() as {round?:DogHouseSlotRound;error?:string};if(!response.ok||!body.round){if(request.debited)setBalance((value)=>value+request.stake);pending.current=undefined;throw new Error(body.error??"Spin не выполнен");}setBalance(body.round.balanceBefore-body.round.chargedAmount);await playback.start(body.round);}catch(cause){playback.reset();if(pending.current)setError("Связь оборвалась. Повторите Spin — будет использован тот же ключ без нового списания.");else setError(cause instanceof Error?cause.message:"Spin не выполнен");}
  }
  function changeStake(direction:number){const index=bets.indexOf(stake);setStake(bets[Math.max(0,Math.min(bets.length-1,index+direction))]);}
  function cycleSpeed(){setSpeed((value)=>value==="normal"?"quick":value==="quick"?"turbo":"normal");}
  const bonusReveal=["entering-bonus","revealing-free-spins","showing-free-spin-award","starting-free-spins"].includes(view.state),showBig=view.state==="showing-big-win"&&view.celebrationWin>0;
  return <div className={`dogslot-screen dogslot-v2 ${view.bonusMode?"is-bonus-mode":""} is-speed-${speed} ${view.fastForward?"is-fast-forward":""} ${reducedMotion?"is-reduced-motion":""}`}><div className="dogslot-sky"/><header className="dogslot-top"><Link href="/slots" aria-label="Назад">←</Link><div><span>₤</span>{balance.toLocaleString("ru-RU")}</div><nav><button onClick={()=>setMuted((value)=>!value)} aria-label={muted?"Включить звук":"Выключить звук"}>{muted?"♩":"♫"}</button><button onClick={()=>setRules(true)}>?</button><button onClick={()=>setHistoryOpen(true)}>≡</button></nav></header><main><div className="dogslot-title"><small>Lucky Wedding Dogs {view.bonusMode&&"· BONUS"}</small><h1>Casa degli <b>Sposi</b></h1></div>{view.bonusMode&&view.freeSpinNumber>0&&<div className="dogslot-fs-counter">SPIN {view.freeSpinNumber} / {view.freeSpinTotal}</div>}<div className={`dogslot-machine is-${view.state}`}><DogHouseGrid model={model} stoppedReels={view.stoppedReels} stoppingReel={view.stoppingReel} speed={speed} reducedMotion={reducedMotion} line={view.activeLine}/><BonusAnticipation active={view.state==="anticipating-bonus"}/><LineWinLabel line={view.activeLine}/></div><div className="dogslot-status" aria-live="polite">{view.displayWin>0&&<strong>ВЫИГРЫШ · {formatLira(view.displayWin)}</strong>}{error&&<b>{error}</b>}</div></main><footer className="dogslot-controls dogslot-controls-v2"><div className="dogslot-bet"><button disabled={busy||bets.indexOf(stake)===0} onClick={()=>changeStake(-1)}>−</button><span><small>Ставка</small><b>{formatLira(stake)}</b></span><button disabled={busy||bets.indexOf(stake)===bets.length-1} onClick={()=>changeStake(1)}>+</button></div><button className="dogslot-spin" disabled={requesting} onClick={()=>void spin()}><b>{busy?"SKIP":"SPIN"}</b><small>{busy?"ускорить":formatLira(stake)}</small></button><button className={`dogslot-turbo is-${speed}`} disabled={requesting} onClick={cycleSpeed}><b>{speed==="normal"?"▶":speed==="quick"?"▶▶":"⚡"}</b><small>{speed}</small></button></footer>
  {bonusReveal&&view.round&&<div className="dogslot-overlay dogslot-bonus-stage">{view.state==="entering-bonus"?<div><span>CASA DEGLI SPOSI</span><strong>La festa dei cani</strong><small>Свадебный двор зажигает огни…</small></div>:<BonusPickGrid values={view.round.result.freeSpinReveal} revealed={view.revealedTokens} total={view.revealTotal}/>}</div>}{showBig&&view.round&&<BigWinOverlay win={view.celebrationWin} stake={view.round.stake} onSkip={playback.skip}/>} {view.state==="bonus-summary"&&view.round&&<BonusSummary round={view.round} onContinue={playback.continueOverlay}/>}<AnimationStatus state={view.state}/>{rules&&<DogHouseRulesModal stake={stake} onClose={()=>setRules(false)}/>} {historyOpen&&<DogHouseHistoryModal rounds={history} onClose={()=>setHistoryOpen(false)}/>}</div>;
}
