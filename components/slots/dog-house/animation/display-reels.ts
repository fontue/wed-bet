import type { DogHouseCell, DogHouseSpin } from "@/domain/slots/dog-house/types";

export interface DogHouseDisplayCell{animationId:string;roundCellId:number|string;reel:number;row:number;symbol:DogHouseCell["symbol"];multiplier?:2|3;isWild:boolean;isSticky:boolean;isNewSticky:boolean;isWinning:boolean;isDimmed:boolean;isBonus:boolean}
export interface DogHouseDisplayModel{cells:DogHouseDisplayCell[];stickyIds:Map<number,string>}
export const dogHouseIndex=(reel:number,row:number)=>row*5+reel;

export function createDisplayModel(spin:DogHouseSpin,{roundId,spinIndex,previousSticky=new Map<number,string>(),winning=new Set<number>(),dimmed=false}:{roundId:string;spinIndex:number;previousSticky?:Map<number,string>;winning?:Set<number>;dimmed?:boolean}):DogHouseDisplayModel{
  const stickyNow=new Map(spin.stickyWilds.map((item)=>[item.index,item.multiplier])),stickyIds=new Map<number,string>();
  const cells=spin.grid.map((cell,index)=>{const reel=index%5,row=Math.floor(index/5),isSticky=stickyNow.has(index),oldSticky=previousSticky.get(index),animationId=isSticky?(oldSticky??`sticky-${roundId}-${index}`):`cell-${roundId}-${spinIndex}-${cell.id}`;if(isSticky)stickyIds.set(index,animationId);return{animationId,roundCellId:cell.id,reel,row,symbol:cell.symbol,multiplier:cell.multiplier,isWild:cell.symbol==="WILD",isSticky,isNewSticky:isSticky&&!oldSticky,isWinning:winning.has(index),isDimmed:dimmed&&!winning.has(index),isBonus:cell.symbol==="BONUS"};});
  return{cells,stickyIds};
}

export function withWinningLine(model:DogHouseDisplayModel,positions:number[]):DogHouseDisplayModel{const winning=new Set(positions);return{stickyIds:model.stickyIds,cells:model.cells.map((cell,index)=>({...cell,isWinning:winning.has(index),isDimmed:!winning.has(index)}))};}
export function clearWinningLine(model:DogHouseDisplayModel):DogHouseDisplayModel{return{stickyIds:model.stickyIds,cells:model.cells.map((cell)=>({...cell,isWinning:false,isDimmed:false,isNewSticky:false}))};}

