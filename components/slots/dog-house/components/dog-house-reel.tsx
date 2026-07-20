"use client";
import { memo } from "react";
import type { CSSProperties } from "react";
import type { DogHouseCell } from "@/domain/slots/dog-house/types";
import type { DogHouseSpeed } from "../animation/animation-types";
import type { DogHouseDisplayCell } from "../animation/display-reels";
import { DogHouseSymbolIcon } from "../../dog-house-symbol";

const STRIPS:DogHouseCell["symbol"][][]=[
  ["TEN","BRUNO","Q","BONUS","BONE","DACHSHUND"],["K","BELLA","WILD","COLLAR","J","PUG"],["A","BONUS","DACHSHUND","WILD","BONE","BRUNO"],["Q","PUG","COLLAR","WILD","TEN","BELLA"],["J","BONE","BRUNO","BONUS","K","DACHSHUND"],
];
export const DogHouseReel=memo(function DogHouseReel({reel,cells,spinning,stopping,speed,reducedMotion}:{reel:number;cells:DogHouseDisplayCell[];spinning:boolean;stopping:boolean;speed:DogHouseSpeed;reducedMotion:boolean}){const filler=STRIPS[reel].map((symbol,index)=>({id:-reel*100-index-1,symbol,...(symbol==="WILD"?{multiplier:(index%2?3:2) as 2|3}:{})})),targets=cells.map((cell)=>({id:Number(cell.roundCellId),symbol:cell.symbol,multiplier:cell.multiplier})),track=[...targets,...filler,...filler];return <div className={`dogslot-reel ${stopping?"is-stopping":""}`} data-reel={reel}><div className="dogslot-reel-result">{cells.map((cell)=><div className={`dogslot-cell ${cell.isWinning?"is-winning":""} ${cell.isDimmed?"is-dimmed":""} ${cell.isSticky?"is-sticky":""} ${cell.isNewSticky?"is-new-sticky":""}`} key={cell.animationId} data-animation-id={cell.animationId}><DogHouseSymbolIcon cell={{id:Number(cell.roundCellId),symbol:cell.symbol,multiplier:cell.multiplier}}/></div>)}</div>{spinning&&<div className={`dogslot-target-strip ${stopping?"is-stopping":""} ${reducedMotion?"is-reduced":""}`} style={{"--dog-reel-speed":speed==="turbo"?"150ms":speed==="quick"?"260ms":"390ms","--dog-stop-speed":speed==="turbo"?"100ms":speed==="quick"?"170ms":"300ms"} as CSSProperties} aria-hidden="true"><div>{track.map((cell,index)=><span key={`${cell.id}-${index}`}><DogHouseSymbolIcon cell={cell}/></span>)}</div></div>}</div>});
