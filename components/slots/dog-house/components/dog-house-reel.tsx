"use client";
import { memo } from "react";
import type { CSSProperties } from "react";
import type { DogHouseSpeed } from "../animation/animation-types";
import type { DogHouseDisplayCell } from "../animation/display-reels";
import { buildPresentationStrip } from "../animation/presentation-strips";
import { DogHouseSymbolIcon } from "../../dog-house-symbol";

export const DogHouseReel=memo(function DogHouseReel({reel,cells,spinning,stopping,speed,reducedMotion,roundSeed,spinIndex,isFreeSpin}:{reel:number;cells:DogHouseDisplayCell[];spinning:boolean;stopping:boolean;speed:DogHouseSpeed;reducedMotion:boolean;roundSeed:string;spinIndex:number;isFreeSpin:boolean}){
  const filler=buildPresentationStrip({reel,roundSeed,spinIndex,isFreeSpin}),targets=cells.map((cell)=>({id:Number(cell.roundCellId),symbol:cell.symbol,multiplier:cell.multiplier})),track=[...targets,...filler,...filler],rows=track.length,start=-(3+filler.length)/rows*100,end=-3/rows*100;
  const style={"--dog-reel-speed":speed==="turbo"?"135ms":speed==="quick"?"240ms":"380ms","--dog-stop-speed":speed==="turbo"?"90ms":speed==="quick"?"165ms":reel===4&&stopping?"420ms":"300ms","--dog-track-height":`${rows/3*100}%`,"--dog-track-rows":rows,"--dog-loop-start":`${start}%`,"--dog-loop-end":`${end}%`} as CSSProperties;
  return <div className={`dogslot-reel ${stopping?"is-stopping":""}`} data-reel={reel}><div className={`dogslot-reel-result ${spinning?"is-spinning":"is-landed"}`}>{cells.map((cell)=><div className={`dogslot-cell ${cell.isWinning?"is-winning":""} ${cell.isDimmed?"is-dimmed":""} ${cell.isSticky?"is-sticky":""} ${cell.isNewSticky?"is-new-sticky":""} ${cell.isBonus?"is-bonus":""}`} key={cell.animationId} data-animation-id={cell.animationId}><DogHouseSymbolIcon cell={{id:Number(cell.roundCellId),symbol:cell.symbol,multiplier:cell.multiplier}}/></div>)}</div>{spinning&&<div className={`dogslot-target-strip ${stopping?"is-stopping":""} ${reducedMotion?"is-reduced":""}`} style={style} aria-hidden="true"><div>{track.map((cell,index)=><span key={`${cell.id}-${index}`}><DogHouseSymbolIcon cell={cell}/></span>)}</div></div>}</div>;
});
