"use client";
import type { DogHouseDisplayModel } from "../animation/display-reels";
import type { DogHouseSpeed } from "../animation/animation-types";
import type { DogHouseLineWin } from "@/domain/slots/dog-house/types";
import { DogHouseReel } from "./dog-house-reel";
import { PaylineOverlay } from "./payline-overlay";
export function DogHouseGrid({model,stoppedReels,stoppingReel,speed,reducedMotion,line}:{model:DogHouseDisplayModel;stoppedReels:number;stoppingReel:number;speed:DogHouseSpeed;reducedMotion:boolean;line?:DogHouseLineWin}){return <div className="dogslot-reels dogslot-reels-v2" role="grid" aria-label="Пять барабанов, три ряда">{[0,1,2,3,4].map((reel)=><DogHouseReel key={reel} reel={reel} cells={model.cells.filter((cell)=>cell.reel===reel).sort((a,b)=>a.row-b.row)} spinning={reel>=stoppedReels} stopping={reel===stoppingReel} speed={speed} reducedMotion={reducedMotion}/>)}<PaylineOverlay line={line}/></div>}

