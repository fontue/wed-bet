"use client";
import { useMemo } from "react";
import type { DogHouseDisplayModel } from "../animation/display-reels";
import type { DogHouseSpeed } from "../animation/animation-types";
import type { DogHouseLineWin } from "@/domain/slots/dog-house/types";
import { DogHouseReel } from "./dog-house-reel";
import { PaylineOverlay } from "./payline-overlay";
export function DogHouseGrid({model,stoppedReels,stoppingReel,speed,fastForward=false,reducedMotion,line}:{model:DogHouseDisplayModel;stoppedReels:number;stoppingReel:number;speed:DogHouseSpeed;fastForward?:boolean;reducedMotion:boolean;line?:DogHouseLineWin}){
  const reels=useMemo(()=>Array.from({length:5},(_,reel)=>model.cells.filter((cell)=>cell.reel===reel).sort((a,b)=>a.row-b.row)),[model.cells]);
  return <div className="dogslot-reels dogslot-reels-v2" role="grid" aria-label="Пять барабанов, три ряда">{reels.map((cells,reel)=><DogHouseReel key={reel} reel={reel} cells={cells} spinning={reel>=stoppedReels} stopping={reel===stoppingReel} speed={speed} fastForward={fastForward} reducedMotion={reducedMotion} roundSeed={model.roundId} spinIndex={model.spinIndex} isFreeSpin={model.isFreeSpin}/>)}<PaylineOverlay line={line}/></div>;
}
