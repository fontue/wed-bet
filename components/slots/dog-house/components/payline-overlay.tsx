"use client";

import type { DogHouseLineWin } from "@/domain/slots/dog-house/types";

interface Point { x:number; y:number }

export function dogHousePaylinePoint(index:number):Point{
  const reel=index%5,row=Math.floor(index/5);
  return{x:reel*100+50,y:row*100+50};
}

export function PaylineOverlay({line}:{line?:DogHouseLineWin}){
  if(!line)return null;
  const coordinates=line.positions.map(dogHousePaylinePoint),points=coordinates.map(({x,y})=>`${x},${y}`).join(" "),end=coordinates.at(-1);
  if(!end)return null;
  return <svg className="dogslot-payline-overlay" viewBox="0 0 500 300" preserveAspectRatio="none" aria-hidden="true" data-line={line.line} data-measured="grid">
    <polyline className="dogslot-payline-trail" points={points} pathLength="1"/>
    <polyline className="dogslot-payline-main" points={points} pathLength="1"/>
    {coordinates.map(({x,y},index)=><circle data-cell-index={line.positions[index]} className={index===coordinates.length-1?"is-end":""} key={line.positions[index]} cx={x} cy={y} r={index===coordinates.length-1?"13":"8"}/>) }
    <g className="dogslot-payline-endpoint" transform={`translate(${end.x} ${end.y})`}><circle r="19"/><text textAnchor="middle" dominantBaseline="central">{line.line}</text></g>
  </svg>;
}
