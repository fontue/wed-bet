import { runSweetLemonzaRound } from "../domain/slots/sweet-lemonza/engine";
import { createSeededRng } from "../domain/slots/sweet-lemonza/rng";
import { LEMONZA_BASE_GAME_SYMBOL_WEIGHTS, LEMONZA_BONUS_BUY_COST_X, LEMONZA_BONUS_BUY_MULTIPLIER_CHANCE_BPS, LEMONZA_BONUS_BUY_SYMBOL_WEIGHTS, LEMONZA_BOOST_FREE_SPINS_MULTIPLIER_CHANCE_BPS, LEMONZA_BOOST_SYMBOL_WEIGHTS, LEMONZA_FREE_SPINS_MULTIPLIER_CHANCE_BPS, LEMONZA_FREE_SPINS_SYMBOL_WEIGHTS, LEMONZA_MATH_VERSION, LEMONZA_MULTIPLIER_WEIGHTS, LEMONZA_SYMBOLS } from "../domain/slots/sweet-lemonza/config";
import type { LemonzaMode } from "../domain/slots/sweet-lemonza/types";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export interface CliOptions { spins: number; seed: string; stake: number; json: boolean; verbose: boolean; includeBonus: boolean; mode: LemonzaMode }
function parseOptions(): CliOptions {
  const args = new Map(process.argv.slice(2).map((argument) => { const [key, value = "true"] = argument.replace(/^--/, "").split("=", 2); return [key, value]; }));
  const spins = Number(args.get("spins") ?? 100_000), stake = Number(args.get("stake") ?? 100);
  const rawMode = (args.get("mode") ?? "standard").toLowerCase();
  const mode: LemonzaMode = rawMode === "boost" ? "LEMON_BOOST" : rawMode === "bonus-buy" ? "BONUS_BUY" : "STANDARD";
  if (!Number.isSafeInteger(spins) || spins <= 0 || !Number.isSafeInteger(stake) || stake <= 0) throw new Error("spins и stake должны быть положительными целыми числами");
  return { spins, stake, mode, seed: args.get("seed") ?? `${LEMONZA_MATH_VERSION}-${rawMode}`, json: args.has("json"), verbose: args.has("verbose"), includeBonus: !args.has("base-only") };
}
function percentile(frequencies: Map<number, number>, total: number, probability: number) { let seen = 0; const target = Math.ceil(total * probability); for (const [value, count] of [...frequencies].sort((a,b)=>a[0]-b[0])) { seen += count; if (seen >= target) return value; } return 0; }
function bucket(value: number) { if (!value) return "0x"; if (value < 1) return "0-1x"; if (value < 2) return "1-2x"; if (value < 5) return "2-5x"; if (value < 10) return "5-10x"; if (value < 25) return "10-25x"; if (value < 50) return "25-50x"; if (value < 100) return "50-100x"; return "100x+"; }
function bonusBucket(value:number){if(value<25)return"0-25x";if(value<50)return"25-50x";if(value<100)return"50-100x";if(value<250)return"100-250x";return"250x+";}

export function simulateSweetLemonza(options: CliOptions) {
  const rng = createSeededRng(options.seed), payoutFrequency = new Map<number, number>(), scatterDistribution = new Map<number, number>(), multiplierDistribution = new Map<number, number>();
  const ranges: Record<string, number> = { "0x":0,"0-1x":0,"1-2x":0,"2-5x":0,"5-10x":0,"10-25x":0,"25-50x":0,"50-100x":0,"100x+":0 };
  const bonusRanges:Record<string,number>={"0-25x":0,"25-50x":0,"50-100x":0,"100-250x":0,"250x+":0};
  let totalCharged=0,totalWin=0,baseWin=0,scatterWin=0,bonusWin=0,hits=0,bonuses=0,cascades=0,maxCascades=0,maxWin=0,bonusRoundsWin=0,totalFreeSpins=0,retriggeredRounds=0,maxMultiplierSum=1,mean=0,m2=0;
  for (let index=0; index<options.spins; index+=1) {
    const result=runSweetLemonzaRound(options.stake,rng,{captureDetails:false,includeBonus:options.includeBonus,mode:options.mode});
    totalCharged+=result.chargedAmount; totalWin+=result.totalPayout; baseWin+=result.baseGamePayout; scatterWin+=result.scatterPayout; bonusWin+=result.bonusPayout; cascades+=result.totalCascades; maxCascades=Math.max(maxCascades,result.totalCascades); maxWin=Math.max(maxWin,result.totalPayout);
    if(result.totalPayout>0)hits+=1; if(result.bonusTriggered){bonuses+=1;bonusRoundsWin+=result.scatterPayout+result.bonusPayout;totalFreeSpins+=result.totalFreeSpinsPlayed;if(result.totalFreeSpinsPlayed>10)retriggeredRounds+=1;bonusRanges[bonusBucket(result.totalPayout/options.stake)]+=1;}maxMultiplierSum=Math.max(maxMultiplierSum,result.maxMultiplier);
    if(result.base)scatterDistribution.set(result.base.scatterCount,(scatterDistribution.get(result.base.scatterCount)??0)+1);
    for(const play of result.freeSpins)for(const value of play.collectedMultipliers)multiplierDistribution.set(value,(multiplierDistribution.get(value)??0)+1);
    payoutFrequency.set(result.totalPayout,(payoutFrequency.get(result.totalPayout)??0)+1); ranges[bucket(result.totalPayout/result.chargedAmount)]+=1;
    const value=result.totalPayout/result.chargedAmount,delta=value-mean; mean+=delta/(index+1);m2+=delta*(value-mean);
    if(options.verbose&&(index+1)%Math.max(1,Math.floor(options.spins/20))===0)process.stderr.write(`\r${index+1}/${options.spins}`);
  }
  if(options.verbose)process.stderr.write("\n");
  const record=(map:Map<number,number>)=>Object.fromEntries([...map].sort((a,b)=>a[0]-b[0]));
  const p95=percentile(payoutFrequency,options.spins,.95),p99=percentile(payoutFrequency,options.spins,.99),p999=percentile(payoutFrequency,options.spins,.999);
  return { mathVersion:LEMONZA_MATH_VERSION,mode:options.mode,seed:options.seed,paidSpins:options.spins,totalPurchases:options.mode==="BONUS_BUY"?options.spins:0,stake:options.stake,bonusBuyCostX:LEMONZA_BONUS_BUY_COST_X,totalStake:totalCharged,totalWin,rtpPercent:totalWin/totalCharged*100,hitFrequencyPercent:hits/options.spins*100,bonusFrequency:bonuses?options.spins/bonuses:null,bonusFrequencyPercent:bonuses/options.spins*100,averageCascades:cascades/options.spins,maxCascades,averageWin:totalWin/options.spins,medianWin:percentile(payoutFrequency,options.spins,.5),medianWinX:percentile(payoutFrequency,options.spins,.5)/options.stake,maxWin,maxWinX:maxWin/options.stake,bucketsPercent:Object.fromEntries(Object.entries(ranges).map(([key,value])=>[key,value/options.spins*100])),bonusValueBucketsPercent:Object.fromEntries(Object.entries(bonusRanges).map(([key,value])=>[key,bonuses?value/bonuses*100:0])),rtpContributionPercent:{base:baseWin/totalCharged*100,scatter:scatterWin/totalCharged*100,bonus:bonusWin/totalCharged*100},scatterDistribution:record(scatterDistribution),multiplierDistribution:record(multiplierDistribution),averageBonusValue:bonuses?bonusRoundsWin/bonuses:0,averageBonusValueX:bonuses?bonusRoundsWin/bonuses/options.stake:0,averageFreeSpins:bonuses?totalFreeSpins/bonuses:0,retriggerFrequencyPercent:bonuses?retriggeredRounds/bonuses*100:0,maxMultiplierSum,percentiles:{p95,p99,p999},percentilesX:{p95:p95/options.stake,p99:p99/options.stake,p999:p999/options.stake},rtpStandardErrorPercent:Math.sqrt(m2/Math.max(1,options.spins-1)/options.spins)*100,config:{baseGameSymbolWeights:LEMONZA_BASE_GAME_SYMBOL_WEIGHTS,boostSymbolWeights:LEMONZA_BOOST_SYMBOL_WEIGHTS,freeSpinsSymbolWeights:LEMONZA_FREE_SPINS_SYMBOL_WEIGHTS,freeSpinsMultiplierChanceBps:LEMONZA_FREE_SPINS_MULTIPLIER_CHANCE_BPS,boostFreeSpinsMultiplierChanceBps:LEMONZA_BOOST_FREE_SPINS_MULTIPLIER_CHANCE_BPS,bonusBuySymbolWeights:LEMONZA_BONUS_BUY_SYMBOL_WEIGHTS,bonusBuyMultiplierChanceBps:LEMONZA_BONUS_BUY_MULTIPLIER_CHANCE_BPS,multiplierValueWeights:LEMONZA_MULTIPLIER_WEIGHTS,paytable:LEMONZA_SYMBOLS}};
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const options=parseOptions(),report=simulateSweetLemonza(options);
  if(options.json)console.log(JSON.stringify(report,null,2));else{console.log(`Sweet Lemonza ${report.mathVersion} · ${report.mode}`);console.log(`Спины: ${report.paidSpins.toLocaleString("ru-RU")} · seed: ${report.seed} · ставка: ${report.stake}`);console.log(`RTP: ${report.rtpPercent.toFixed(4)}% ± ${report.rtpStandardErrorPercent.toFixed(4)} п.п.`);console.log(`Hit frequency: ${report.hitFrequencyPercent.toFixed(3)}% · бонус: ${report.bonusFrequency?`1 / ${report.bonusFrequency.toFixed(1)}`:"не выпал"}`);console.log(`RTP base/scatter/bonus: ${report.rtpContributionPercent.base.toFixed(3)}% / ${report.rtpContributionPercent.scatter.toFixed(3)}% / ${report.rtpContributionPercent.bonus.toFixed(3)}%`);console.log(`Максимум: ${report.maxWinX.toFixed(2)}x · каскады: ${report.averageCascades.toFixed(3)} / ${report.maxCascades}`);console.log("Диапазоны:",report.bucketsPercent);}
}
