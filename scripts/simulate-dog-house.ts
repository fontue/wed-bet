import { runDogHouseRound } from "../domain/slots/dog-house/engine.ts";
import { createSeededRng } from "../domain/slots/sweet-lemonza/rng.ts";

const rounds=Math.max(1,Number(process.argv[2]??200_000)),stake=100;
let wagered=0,won=0,baseWon=0,scatterWon=0,bonusWon=0,bonuses=0,hits=0,maxWin=0;
const rng=createSeededRng("casa-degli-sposi-rtp-v1");
for(let index=0;index<rounds;index+=1){const round=runDogHouseRound(stake,rng);wagered+=stake;won+=round.totalPayout;baseWon+=round.baseGamePayout;scatterWon+=round.bonusScatterPayout;bonusWon+=round.bonusPayout;if(round.bonusTriggered)bonuses+=1;if(round.totalPayout>0)hits+=1;maxWin=Math.max(maxWin,round.totalPayout);}
console.log(JSON.stringify({rounds,rtp:won/wagered,baseRtp:baseWon/wagered,scatterRtp:scatterWon/wagered,freeSpinsRtp:bonusWon/wagered,hitRate:hits/rounds,bonusFrequency:bonuses/rounds,averageBonusInterval:bonuses?rounds/bonuses:null,maxWinX:maxWin/stake},null,2));
