"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DogHouseSlotRound } from "@/domain/models";
import type { DogHouseLineWin, DogHouseSpin } from "@/domain/slots/dog-house/types";
import { DogHouseAnimationDirector } from "./director";
import type { DogHouseAnimationState, DogHouseCelebrationTier, DogHouseSpeed } from "./animation-types";
import { clearWinningLine, createDisplayModel, withWinningLine, type DogHouseDisplayModel } from "./display-reels";
import { tweenDogHouseNumber } from "./number-tween";
import type { DogHouseSoundEvent } from "../audio/sound-events";

export interface DogHousePlaybackView{
  state:DogHouseAnimationState;model?:DogHouseDisplayModel;spin?:DogHouseSpin;round?:DogHouseSlotRound;
  stoppedReels:number;stoppingReel:number;activeLine?:DogHouseLineWin;displayWin:number;
  freeSpinNumber:number;freeSpinTotal:number;bonusMode:boolean;revealedTokens:number;revealTotal:number;
  newStickyIndices:number[];celebrationWin:number;celebrationTier?:DogHouseCelebrationTier;
  fastForward:boolean;anticipationLevel:0|1|2|3;anticipationHit:boolean;
}
const initial:DogHousePlaybackView={state:"idle",stoppedReels:5,stoppingReel:-1,displayWin:0,freeSpinNumber:0,freeSpinTotal:0,bonusMode:false,revealedTokens:0,revealTotal:0,newStickyIndices:[],celebrationWin:0,fastForward:false,anticipationLevel:0,anticipationHit:false};

export function useDogHousePlayback({speed,reducedMotion,onSound,onComplete}:{speed:DogHouseSpeed;reducedMotion:boolean;onSound:(event:DogHouseSoundEvent,step?:number)=>void;onComplete:(round:DogHouseSlotRound)=>void}){
  const [view,setView]=useState(initial),[director]=useState(()=>new DogHouseAnimationDirector({speed,reducedMotion}));
  const stickyIds=useRef(new Map<number,string>()),accumulated=useRef(0),tween=useRef<AbortController|undefined>(undefined),overlayResolve=useRef<(()=>void)|undefined>(undefined),completedRounds=useRef(new Set<string>());
  useEffect(()=>director.setSpeed(speed),[director,speed]);
  useEffect(()=>director.setReducedMotion(reducedMotion),[director,reducedMotion]);
  useEffect(()=>{director.activate();const visibility=()=>document.hidden?director.pause():director.resume();document.addEventListener("visibilitychange",visibility);return()=>{document.removeEventListener("visibilitychange",visibility);overlayResolve.current?.();director.dispose();tween.current?.abort();};},[director]);
  const countTo=useCallback(async(value:number)=>{tween.current?.abort();const controller=new AbortController();tween.current=controller;await tweenDogHouseNumber({from:accumulated.current,to:value,duration:director.timings.winCollect,signal:controller.signal,onUpdate:(displayWin)=>setView((current)=>({...current,displayWin}))});accumulated.current=value;},[director]);
  const start=useCallback(async(round:DogHouseSlotRound)=>{
    stickyIds.current=new Map();accumulated.current=0;
    setView({...initial,state:"starting-reels",round,spin:round.result.base,freeSpinTotal:round.result.awardedFreeSpins,model:createDisplayModel(round.result.base,{roundId:round.id,spinIndex:0})});
    await director.playRound(round,{onStep:async(step)=>{
      const patch={state:step.state,spin:step.spin,freeSpinNumber:step.freeSpinNumber??0,freeSpinTotal:round.result.awardedFreeSpins};
      if(step.state==="starting-reels"||step.state==="playing-free-spin"){
        onSound(step.isFreeSpin?"free-spin-start":"reels-start");
        const model=createDisplayModel(step.spin,{roundId:round.id,spinIndex:step.spinIndex,isFreeSpin:step.isFreeSpin,previousSticky:stickyIds.current});
        setView((current)=>({...current,...patch,model,stoppedReels:0,stoppingReel:-1,activeLine:undefined,bonusMode:step.isFreeSpin||current.bonusMode,newStickyIndices:[],anticipationLevel:0,anticipationHit:false}));return;
      }
      if(step.state==="spinning"){setView((current)=>({...current,...patch,stoppedReels:0,stoppingReel:-1}));return;}
      if(step.state==="stopping-reel"){onSound("reel-stop",step.reel);setView((current)=>({...current,...patch,stoppedReels:step.reel??0,stoppingReel:step.reel??-1}));return;}
      if(step.state==="landing-bonus"){const level=step.reel===0?1:2;onSound(level===1?"paw-1":"paw-2");setView((current)=>({...current,...patch,stoppedReels:(step.reel??0)+1,stoppingReel:-1,anticipationLevel:level}));return;}
      if(step.state==="anticipating-bonus"){onSound("anticipation");setView((current)=>({...current,...patch,stoppedReels:4,stoppingReel:4,anticipationLevel:2}));return;}
      if(step.state==="confirming-bonus"){onSound("paw-3");setView((current)=>({...current,...patch,stoppedReels:5,stoppingReel:-1,anticipationLevel:3,anticipationHit:true}));return;}
      if(step.state==="locking-sticky-wild"){
        onSound("sticky-lock");const model=createDisplayModel(step.spin,{roundId:round.id,spinIndex:step.spinIndex,isFreeSpin:true,previousSticky:stickyIds.current});stickyIds.current=new Map(model.stickyIds);
        setView((current)=>({...current,...patch,model,stoppedReels:5,stoppingReel:-1,newStickyIndices:step.newStickyIndices??[]}));return;
      }
      if(step.state==="evaluating"){
        stickyIds.current=new Map(createDisplayModel(step.spin,{roundId:round.id,spinIndex:step.spinIndex,isFreeSpin:step.isFreeSpin,previousSticky:stickyIds.current}).stickyIds);
        setView((current)=>({...current,...patch,stoppedReels:5,stoppingReel:-1,model:current.model?clearWinningLine(current.model):current.model,activeLine:undefined,newStickyIndices:[],anticipationLevel:0,anticipationHit:false}));return;
      }
      if(step.state==="highlighting-line"){onSound("line-win",step.lineIndex);setView((current)=>({...current,...patch,model:current.model&&step.line?withWinningLine(current.model,step.line.positions):current.model,activeLine:step.line}));return;}
      if(step.state==="showing-line-win"){if((step.line?.wildMultiplier??1)>1)onSound("line-multiplier");setView((current)=>({...current,...patch,activeLine:step.line}));return;}
      if(step.state==="collecting-win"&&step.line){onSound("win-collect");await countTo(accumulated.current+step.line.payout);setView((current)=>({...current,...patch,model:current.model?clearWinningLine(current.model):current.model,activeLine:undefined}));return;}
      if(step.state==="entering-bonus"){onSound("bonus-trigger");await countTo(accumulated.current+round.result.bonusScatterPayout);setView((current)=>({...current,...patch,bonusMode:true,revealedTokens:0,revealTotal:0,anticipationLevel:3,anticipationHit:true}));return;}
      if(step.state==="revealing-free-spins"){onSound("token-flip",step.tokenIndex);setView((current)=>({...current,...patch,revealedTokens:Math.max(current.revealedTokens,(step.tokenIndex??0)+1),revealTotal:current.revealTotal+(step.tokenValue??0)}));return;}
      if(step.state==="showing-free-spin-award"){onSound("free-spins-awarded");setView((current)=>({...current,...patch}));return;}
      if(step.state==="showing-big-win"){onSound("big-win");setView((current)=>({...current,...patch,celebrationWin:step.spin.payout,celebrationTier:step.celebrationTier}));return;}
      if(step.state==="bonus-summary"){onSound("bonus-summary");setView((current)=>({...current,...patch,stoppedReels:5,stoppingReel:-1}));await new Promise<void>((resolve)=>{overlayResolve.current=resolve;});overlayResolve.current=undefined;return;}
      if(step.state==="round-complete"){const finalSpin=round.result.freeSpins.at(-1)??round.result.base,model=createDisplayModel(finalSpin,{roundId:round.id,spinIndex:round.result.freeSpins.length,isFreeSpin:Boolean(round.result.freeSpins.length),previousSticky:stickyIds.current});setView((current)=>({...current,...patch,model,spin:finalSpin,stoppedReels:5,stoppingReel:-1,displayWin:round.totalWin,activeLine:undefined,celebrationWin:0,celebrationTier:undefined,newStickyIndices:[],anticipationLevel:0,anticipationHit:false}));}
    },onComplete:()=>{
      tween.current?.abort();accumulated.current=round.totalWin;
      setView((current)=>({...current,state:"round-complete",displayWin:round.totalWin,stoppedReels:5,stoppingReel:-1,activeLine:undefined,celebrationWin:0,celebrationTier:undefined,fastForward:false,anticipationLevel:0,anticipationHit:false}));
      if(!completedRounds.current.has(round.id)){completedRounds.current.add(round.id);onComplete(round);}
    }});
  },[countTo,director,onComplete,onSound]);
  const requesting=useCallback(()=>setView((current)=>({...current,state:"requesting-spin",displayWin:0,fastForward:false})),[]);
  const reset=useCallback(()=>setView((current)=>({...current,state:"idle",activeLine:undefined,celebrationWin:0,celebrationTier:undefined,fastForward:false,anticipationLevel:0,anticipationHit:false})),[]);
  const skip=useCallback(()=>{tween.current?.abort();if(overlayResolve.current){overlayResolve.current();overlayResolve.current=undefined;}setView((current)=>({...current,state:"skipping",fastForward:true}));director.enableFastForwardForRound();director.accelerateCurrentPhase();},[director]);
  const continueOverlay=useCallback(()=>{overlayResolve.current?.();overlayResolve.current=undefined;},[]);
  return{view,start,requesting,reset,skip,continueOverlay,busy:!(["idle","round-complete"] as DogHouseAnimationState[]).includes(view.state)};
}
