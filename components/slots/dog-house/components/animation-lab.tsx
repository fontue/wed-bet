"use client";

import { useCallback, useState } from "react";
import type { DogHouseLineWin } from "@/domain/slots/dog-house/types";
import type { DogHouseSpeed } from "../animation/animation-types";
import { createDisplayModel } from "../animation/display-reels";
import { useDogHousePlayback } from "../animation/use-dog-house-playback";
import { DOG_HOUSE_SCENARIOS } from "../dev/scenarios";
import { DogHouseGrid } from "./dog-house-grid";
import { BonusAnticipation, BonusPickGrid, LineWinLabel } from "./animation-overlays";

type LabScenario=(typeof DOG_HOUSE_SCENARIOS)[number];

export function DogHouseAnimationLab(){
  const [speed,setSpeed]=useState<DogHouseSpeed>("normal"),[reduced,setReduced]=useState(false),[selected,setSelected]=useState<LabScenario>(DOG_HOUSE_SCENARIOS[0]),[qaLine,setQaLine]=useState<DogHouseLineWin>();
  const sound=useCallback(()=>{},[]),complete=useCallback(()=>{},[]),playback=useDogHousePlayback({speed,reducedMotion:reduced,onSound:sound,onComplete:complete}),model=playback.view.model??createDisplayModel(selected.round.result.base,{roundId:selected.round.id,spinIndex:0});
  const play=(scenario:LabScenario,fastForwardAt?:number)=>{setQaLine(undefined);setSelected(scenario);void playback.start(scenario.round);if(fastForwardAt!==undefined)window.setTimeout(playback.skip,fastForwardAt);};
  const showMeasuredLine=()=>{const scenario=DOG_HOUSE_SCENARIOS[1];setSelected(scenario);setQaLine(scenario.round.result.base.wins[0]);};
  return <div className={`dogslot-screen dogslot-v2 ${playback.view.bonusMode?"is-bonus-mode":""} ${playback.view.fastForward?"is-fast-forward":""}`}>
    <header className="dogslot-lab-head"><div><small>Development only</small><h1>Casa degli Sposi Lab</h1></div><div><button onClick={()=>setSpeed((value)=>value==="normal"?"quick":value==="quick"?"turbo":"normal")}>{speed}</button><button onClick={()=>setReduced((value)=>!value)}>{reduced?"Reduced ✓":"Reduced"}</button></div></header>
    <main className="dogslot-lab-main"><section><div className={`dogslot-machine is-${playback.view.state}`}><DogHouseGrid model={model} stoppedReels={playback.view.stoppedReels} stoppingReel={playback.view.stoppingReel} speed={speed} reducedMotion={reduced} line={playback.view.activeLine??qaLine}/><BonusAnticipation active={playback.view.state==="anticipating-bonus"}/><LineWinLabel line={playback.view.activeLine??qaLine}/></div><code>{playback.view.state}</code></section><aside><button onClick={showMeasuredLine}>Payline geometry QA</button>{DOG_HOUSE_SCENARIOS.map((scenario)=><button key={scenario.id} onClick={()=>play(scenario)}>{scenario.title}</button>)}<button onClick={()=>play(DOG_HOUSE_SCENARIOS[5],180)}>FF during reels</button><button onClick={()=>play(DOG_HOUSE_SCENARIOS[8],1700)}>FF during reveal</button><button onClick={()=>play(DOG_HOUSE_SCENARIOS[11],3800)}>FF during free spins</button><button onClick={playback.skip}>FAST-FORWARD / phase</button></aside></main>
    {["revealing-free-spins","showing-free-spin-award"].includes(playback.view.state)&&playback.view.round&&<div className="dogslot-overlay"><BonusPickGrid values={playback.view.round.result.freeSpinReveal} revealed={playback.view.revealedTokens} total={playback.view.revealTotal}/></div>}
  </div>;
}
