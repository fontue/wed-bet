"use client";
import type { DogHouseLineWin } from "@/domain/slots/dog-house/types";
export function PaylineOverlay({line}:{line?:DogHouseLineWin}){if(!line)return null;const points=line.positions.map((index)=>`${index%5*100+50},${Math.floor(index/5)*100+50}`).join(" ");return <svg className="dogslot-payline-overlay" viewBox="0 0 500 300" preserveAspectRatio="none" aria-hidden="true"><polyline points={points}/>{line.positions.map((index)=><circle key={index} cx={index%5*100+50} cy={Math.floor(index/5)*100+50} r="9"/>)}</svg>}

