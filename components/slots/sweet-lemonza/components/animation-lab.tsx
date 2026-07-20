"use client";

import { useEffect, useState } from "react";
import type { LemonzaCell } from "@/domain/slots/sweet-lemonza/types";
import type { GameAnimationState } from "../animation/states";
import { displayGrid, type DisplaySymbol } from "../animation/display-grid";
import { BigWinOverlay, BonusIntro, BonusSpinCounter, CascadeWinLabel, ScatterOverlay } from "./animation-overlays";
import { GameGrid } from "./game-grid";

const SYMBOLS:LemonzaCell["symbol"][]=["LEMON","RINGS","OLIVES","PROSECCO","GRAPES","LIMONCELLO","CAKE","OLIVES","WINE","LEMON","BOUQUET","GRAPES","GRAPES","PROSECCO","LEMON","RINGS","LEMON","OLIVES","BOUQUET","CAKE","LIMONCELLO","BOUQUET","WINE","GRAPES","OLIVES","LEMON","RINGS","PROSECCO","OLIVES","BOUQUET"];
const CELLS=SYMBOLS.map((symbol,index)=>({id:index+1,symbol}));

function winning(symbols:DisplaySymbol[],removing=false){return symbols.map((symbol,index)=>({...symbol,isNew:false,isWinning:index<8,isRemoving:removing&&index<8}));}

export function SweetLemonzaAnimationLab(){
  const [symbols,setSymbols]=useState(()=>displayGrid(CELLS,new Set())),[state,setState]=useState<GameAnimationState>("idle"),[scatter,setScatter]=useState(0),[multipliers,setMultipliers]=useState<number[]>([]),[bonus,setBonus]=useState(false),[bigWin,setBigWin]=useState(0),[win,setWin]=useState(0),[turbo,setTurbo]=useState(false),[reduced,setReduced]=useState(false);
  const [timers]=useState(()=>new Set<number>());
  useEffect(()=>()=>timers.forEach(clearTimeout),[timers]);
  const later=(delay:number,run:()=>void)=>{const timer=window.setTimeout(()=>{timers.delete(timer);run();},delay);timers.add(timer);};
  const clear=()=>{timers.forEach(clearTimeout);timers.clear();setScatter(0);setMultipliers([]);setBonus(false);setBigWin(0);setWin(0);};
  const resetGrid=(cells=CELLS)=>{setSymbols(displayGrid(cells,new Set()));setState("evaluating");};
  const drop=()=>{clear();setSymbols([]);setState("anticipation");requestAnimationFrame(()=>{setSymbols(displayGrid(CELLS));setState("initial-drop");});};
  const normalWin=()=>{clear();resetGrid();requestAnimationFrame(()=>{setSymbols((items)=>winning(items));setState("highlighting-win");setWin(80);});};
  const remove=()=>{normalWin();later(450,()=>{setSymbols((items)=>winning(items,true));setState("removing-symbols");});};
  const cascades=(count:number)=>{clear();resetGrid();for(let index=0;index<count;index+=1){const start=index*(turbo?480:1050);later(start,()=>{setSymbols((items)=>winning(items));setState("highlighting-win");setWin((index+1)*80);});later(start+(turbo?120:330),()=>{setSymbols((items)=>winning(items,true));setState("removing-symbols");});later(start+(turbo?240:580),()=>{setSymbols(displayGrid(CELLS.map((cell,cellIndex)=>cellIndex<8?{...cell,id:1000+index*10+cellIndex}:cell)));setState("dropping-new-symbols");});}};
  const showScatter=(count:number)=>{clear();const cells=CELLS.map((cell,index)=>index>=30-count?{id:2000+index,symbol:"SCATTER" as const}:cell);setSymbols(displayGrid(cells,new Set(cells.slice(-count).map((cell)=>cell.id))));setScatter(count);setState("showing-scatter-result");};
  const showMultiplier=(values:number[])=>{clear();const cells=CELLS.map((cell,index)=>index<values.length?{id:3000+index,symbol:"MULTIPLIER" as const,multiplier:values[index]}:cell);setSymbols(displayGrid(cells,new Set(cells.slice(0,values.length).map((cell)=>cell.id))));setMultipliers(values);setState("revealing-multipliers");};
  const actions:[string,()=>void][]=[["Initial drop",drop],["Normal win",normalWin],["Symbol removal",remove],["1 cascade",()=>cascades(1)],["5 cascades",()=>cascades(5)],["Scatter 1",()=>showScatter(1)],["Scatter 2",()=>showScatter(2)],["Scatter 3",()=>showScatter(3)],["Scatter 4",()=>showScatter(4)],["Bonus intro",()=>{clear();setBonus(true);setState("entering-bonus");}],["Multiplier 2X",()=>showMultiplier([2])],["Multiplier 25X",()=>showMultiplier([25])],["Multiplier 100X",()=>showMultiplier([100])],["Multiplier sum",()=>showMultiplier([2,5,25])],["Retrigger",()=>{showScatter(3);setBonus(true);}],["Small win",()=>{normalWin();setWin(240);}],["Medium win",()=>{normalWin();setWin(900);}],["Big win",()=>{clear();setBigWin(5500);setState("showing-big-win");}]];
  return <div className={`lemonza-screen relative ${turbo?"is-turbo":""} ${reduced?"is-reduced-motion":""}`}>
    <div className="lemonza-background"/><div className="lemonza-water"/><div className="lemonza-leaves"/>
    <header className="relative z-40 flex items-center justify-between gap-3 bg-[#fff9e8]/90 px-4 py-3"><div><p className="text-[.65rem] font-black uppercase tracking-[.2em] text-[#a8782c]">Development only</p><h1 className="serif text-xl font-black">Sweet Lemonza Animation Lab</h1></div><div className="flex gap-2"><button className={`rounded-full px-3 py-2 text-xs font-black ${turbo?"bg-[#174b38] text-white":"bg-black/5"}`} onClick={()=>setTurbo((value)=>!value)}>⚡ Turbo</button><button className={`rounded-full px-3 py-2 text-xs font-black ${reduced?"bg-[#174b38] text-white":"bg-black/5"}`} onClick={()=>setReduced((value)=>!value)}>Reduced</button></div></header>
    <main className="relative z-10 grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(22rem,31rem)_1fr] lg:place-content-center"><section className="self-center"><div className="mb-1 flex justify-end"><BonusSpinCounter win={win||80} baseWin={win||80} multiplier={multipliers.reduce((sum,value)=>sum+value,0)} multiplierActive={multipliers.length>0}/></div><div className="relative rounded-[1.25rem] border-[6px] border-[#fff4d6] bg-[#286f95] p-1.5 shadow-2xl"><GameGrid symbols={symbols} state={state} cascadeIndex={0} reducedMotion={reduced}/><CascadeWinLabel value={win} visible={win>0}/><ScatterOverlay count={scatter} isFreeSpin={bonus}/></div><p className="mt-2 rounded-full bg-white/80 px-3 py-1 text-center font-mono text-xs">state: {state}</p></section><section className="self-center rounded-3xl bg-[#fffdf7]/95 p-4 shadow-xl"><h2 className="serif text-xl font-bold">Ручные сценарии</h2><p className="mb-3 text-xs text-[#66756d]">Каждый эффект запускается без API и не меняет баланс или серверную математику.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{actions.map(([label,action])=><button key={label} onClick={action} className="rounded-xl border border-[#174b38]/10 bg-white px-3 py-2 text-xs font-bold shadow-sm hover:bg-[#f5d84d]/20">{label}</button>)}</div><button className="mt-3 w-full rounded-xl bg-[#174b38] px-3 py-2 text-xs font-black text-white" onClick={()=>{clear();resetGrid();}}>Reset</button></section></main>
    {bonus&&state==="entering-bonus"&&<BonusIntro total={10} onContinue={()=>{setBonus(false);setState("evaluating");}}/>} {bigWin>0&&<BigWinOverlay win={bigWin} stake={100} onContinue={()=>{setBigWin(0);setState("round-complete");}}/>}
  </div>;
}
