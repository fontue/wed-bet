"use client";
import { useId } from "react";
import type { DogHouseLineWin } from "@/domain/slots/dog-house/types";

export function PaylineOverlay({line}:{line?:DogHouseLineWin}){
  const glowId=useId().replaceAll(":","");
  if(!line)return null;
  const coordinates=line.positions.map((index)=>({x:index%5*100+50,y:Math.floor(index/5)*100+50})),points=coordinates.map(({x,y})=>`${x},${y}`).join(" "),end=coordinates.at(-1)!;
  return <svg className="dogslot-payline-overlay" viewBox="0 0 500 300" preserveAspectRatio="none" aria-hidden="true" data-line={line.line}>
    <defs><filter id={glowId}><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <polyline className="dogslot-payline-trail" points={points}/><polyline className="dogslot-payline-main" points={points} pathLength="1" filter={`url(#${glowId})`}/>
    {coordinates.map(({x,y},index)=><circle className={index===coordinates.length-1?"is-end":""} key={line.positions[index]} cx={x} cy={y} r={index===coordinates.length-1?"13":"8"}/>)}
    <g className="dogslot-payline-endpoint" transform={`translate(${end.x} ${end.y})`}><circle r="19"/><text textAnchor="middle" dominantBaseline="central">{line.line}</text></g>
  </svg>;
}
