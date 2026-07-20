import type { DogHouseSlotRound } from "@/domain/models";
import type { DogHouseSpin } from "@/domain/slots/dog-house/types";
import { abortableWait } from "./animation-abort";
import { timingsFor } from "./animation-config";
import type { DogHouseAnimationContext, DogHouseAnimationState, DogHouseAnimationStep, DogHouseSpeed } from "./animation-types";

const bonusOnReel=(spin:DogHouseSpin,reel:number)=>[0,1,2].some((row)=>spin.grid[row*5+reel]?.symbol==="BONUS");
export function buildDogHouseTimeline(round:DogHouseSlotRound):DogHouseAnimationStep[]{
  const steps:DogHouseAnimationStep[]=[];
  const appendSpin=(spin:DogHouseSpin,spinIndex:number,isFreeSpin:boolean,freeSpinNumber?:number,previousSticky=new Set<number>())=>{
    const common={spin,spinIndex,isFreeSpin,freeSpinNumber};
    steps.push({state:isFreeSpin?"playing-free-spin":"starting-reels",duration:"buttonPress",...common},{state:"spinning",duration:"minimumSpin",...common});
    for(let reel=0;reel<5;reel+=1){if(!isFreeSpin&&reel===4&&bonusOnReel(spin,0)&&bonusOnReel(spin,2))steps.push({state:"anticipating-bonus",duration:"anticipationExtra",reel,...common});steps.push({state:"stopping-reel",duration:"reelDeceleration",reel,...common});}
    const newStickyIndices=isFreeSpin?spin.stickyWilds.map((item)=>item.index).filter((index)=>!previousSticky.has(index)):[];
    if(newStickyIndices.length)steps.push({state:"locking-sticky-wild",duration:"stickyLock",newStickyIndices,...common});
    steps.push({state:"evaluating",duration:"evaluationPause",...common});
    spin.wins.forEach((line,lineIndex)=>{steps.push({state:"highlighting-line",duration:"lineHighlight",line,lineIndex,...common},{state:"showing-line-win",duration:"lineValueHold",line,lineIndex,...common},{state:"collecting-win",duration:"winCollect",line,lineIndex,...common});});
    if(spin.payout>0)steps.push({state:isFreeSpin?"showing-free-spin-win":"showing-base-win",duration:"evaluationPause",...common});
    if(spin.payout/round.stake>=5)steps.push({state:"showing-big-win",duration:"bigWinCount",...common});
  };
  appendSpin(round.result.base,0,false);
  if(round.result.bonusTriggered){steps.push({state:"entering-bonus",duration:"bonusTrigger",spin:round.result.base,spinIndex:0,isFreeSpin:false});round.result.freeSpinReveal.forEach((tokenValue,tokenIndex)=>steps.push({state:"revealing-free-spins",duration:"bonusTokenReveal",spin:round.result.base,spinIndex:0,isFreeSpin:false,tokenIndex,tokenValue}));steps.push({state:"showing-free-spin-award",duration:"freeSpinsIntro",spin:round.result.base,spinIndex:0,isFreeSpin:false},{state:"starting-free-spins",duration:"buttonPress",spin:round.result.freeSpins[0]??round.result.base,spinIndex:1,isFreeSpin:true,freeSpinNumber:1});let sticky=new Set<number>();round.result.freeSpins.forEach((spin,index)=>{appendSpin(spin,index+1,true,index+1,sticky);sticky=new Set(spin.stickyWilds.map((item)=>item.index));});steps.push({state:"bonus-summary",spin:round.result.freeSpins.at(-1)??round.result.base,spinIndex:round.result.freeSpins.length,isFreeSpin:true,freeSpinNumber:round.result.freeSpins.length});}
  steps.push({state:"round-complete",spin:round.result.freeSpins.at(-1)??round.result.base,spinIndex:round.result.freeSpins.length,isFreeSpin:Boolean(round.result.freeSpins.length)});return steps;
}

export interface DogHouseDirectorCallbacks{onStep:(step:DogHouseAnimationContext)=>void|Promise<void>;onComplete:(kind:"completed"|"skipped")=>void|Promise<void>;onState?:(state:DogHouseAnimationState)=>void}
export class DogHouseAnimationDirector{
  private controller?:AbortController;private phase?:AbortController;private speed:DogHouseSpeed;private reduced:boolean;private disposed=false;private skipEnd=false;private paused=false;private resumeWaiters:Array<()=>void>=[];private wait:(milliseconds:number,signal:AbortSignal)=>Promise<void>;
  constructor({speed="normal",reducedMotion=false,wait=abortableWait}:{speed?:DogHouseSpeed;reducedMotion?:boolean;wait?:(milliseconds:number,signal:AbortSignal)=>Promise<void>}={}){this.speed=speed;this.reduced=reducedMotion;this.wait=wait;}
  get timings(){return timingsFor(this.speed,this.reduced);}
  setSpeed(speed:DogHouseSpeed){this.speed=speed;}setReducedMotion(value:boolean){this.reduced=value;}activate(){this.disposed=false;}
  skipCurrentPhase(){this.phase?.abort();}skipToRoundEnd(){this.skipEnd=true;this.phase?.abort();}
  pause(){this.paused=true;}resume(){this.paused=false;this.resumeWaiters.splice(0).forEach((resolve)=>resolve());}
  cancel(){this.controller?.abort();this.phase?.abort();}dispose(){this.disposed=true;this.cancel();this.resume();}
  private async waitForResume(){if(this.paused)await new Promise<void>((resolve)=>this.resumeWaiters.push(resolve));}
  async playRound(round:DogHouseSlotRound,callbacks:DogHouseDirectorCallbacks){this.cancel();this.skipEnd=false;const controller=new AbortController();this.controller=controller;for(const step of buildDogHouseTimeline(round)){if(this.disposed||controller.signal.aborted)return"aborted" as const;if(this.skipEnd&&step.state!=="round-complete")continue;await this.waitForResume();if(this.disposed||controller.signal.aborted)return"aborted" as const;const context={...step,roundId:round.id,speed:this.speed,reducedMotion:this.reduced};callbacks.onState?.(step.state);await callbacks.onStep(context);if(step.duration){this.phase=new AbortController();await this.wait(this.timings[step.duration],this.phase.signal);}}
    const kind=this.skipEnd?"skipped":"completed";await callbacks.onComplete(kind);return kind;}
}
