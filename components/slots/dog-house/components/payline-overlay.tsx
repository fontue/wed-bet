"use client";

import { useId, useLayoutEffect, useState, type RefObject } from "react";
import type { DogHouseLineWin } from "@/domain/slots/dog-house/types";

interface Point { x:number; y:number }
interface Geometry { width:number; height:number; centers:Map<number,Point> }

export function PaylineOverlay({line,gridRef}:{line?:DogHouseLineWin;gridRef:RefObject<HTMLDivElement|null>}){
  const glowId=useId().replaceAll(":","");
  const [geometry,setGeometry]=useState<Geometry>();
  useLayoutEffect(()=>{
    const grid=gridRef.current;
    if(!grid)return;
    let frame=0;
    const measure=()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const container=grid.getBoundingClientRect(),centers=new Map<number,Point>();
        grid.querySelectorAll<HTMLElement>("[data-cell-index]").forEach((cell)=>{
          const index=Number(cell.dataset.cellIndex),rect=cell.getBoundingClientRect();
          if(Number.isInteger(index))centers.set(index,{x:rect.left-container.left+rect.width/2,y:rect.top-container.top+rect.height/2});
        });
        setGeometry({width:container.width,height:container.height,centers});
      });
    };
    measure();
    const observer=new ResizeObserver(measure);observer.observe(grid);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[gridRef]);
  if(!line||!geometry)return null;
  const coordinates=line.positions.map((index)=>geometry.centers.get(index)).filter((point):point is Point=>Boolean(point));
  if(coordinates.length!==line.positions.length)return null;
  const points=coordinates.map(({x,y})=>`${x},${y}`).join(" "),end=coordinates.at(-1)!;
  return <svg className="dogslot-payline-overlay" viewBox={`0 0 ${geometry.width} ${geometry.height}`} preserveAspectRatio="none" aria-hidden="true" data-line={line.line} data-measured="true">
    <defs><filter id={glowId}><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <polyline className="dogslot-payline-trail" points={points}/><polyline className="dogslot-payline-main" points={points} pathLength="1" filter={`url(#${glowId})`}/>
    {coordinates.map(({x,y},index)=><circle data-cell-index={line.positions[index]} className={index===coordinates.length-1?"is-end":""} key={line.positions[index]} cx={x} cy={y} r={index===coordinates.length-1?"13":"8"}/>) }
    <g className="dogslot-payline-endpoint" transform={`translate(${end.x} ${end.y})`}><circle r="19"/><text textAnchor="middle" dominantBaseline="central">{line.line}</text></g>
  </svg>;
}
