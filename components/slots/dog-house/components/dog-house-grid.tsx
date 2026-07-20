"use client";
import { useRef } from "react";
import type { DogHouseDisplayModel } from "../animation/display-reels";
import type { DogHouseSpeed } from "../animation/animation-types";
import type { DogHouseLineWin } from "@/domain/slots/dog-house/types";
import { DogHouseReel } from "./dog-house-reel";
import { PaylineOverlay } from "./payline-overlay";
export function DogHouseGrid({model,stoppedReels,stoppingReel,speed,reducedMotion,line}:{model:DogHouseDisplayModel;stoppedReels:number;stoppingReel:number;speed:DogHouseSpeed;reducedMotion:boolean;line?:DogHouseLineWin}){const gridRef=useRef<HTMLDivElement>(null);return <div ref={gridRef} className="dogslot-reels dogslot-reels-v2" role="grid" aria-label="Пять барабанов, три ряда">{[0,1,2,3,4].map((reel)=><DogHouseReel key={reel} reel={reel} cells={model.cells.filter((cell)=>cell.reel===reel).sort((a,b)=>a.row-b.row)} spinning={reel>=stoppedReels} stopping={reel===stoppingReel} speed={speed} reducedMotion={reducedMotion} roundSeed={model.roundId} spinIndex={model.spinIndex} isFreeSpin={model.isFreeSpin}/>)}<PaylineOverlay line={line} gridRef={gridRef}/></div>}
