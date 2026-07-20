export interface WinTier { min:number; max:number; label:string; className:string }
export const LEMONZA_WIN_TIERS:WinTier[]=[
  {min:10,max:25,label:"BELLA VINCITA!",className:"win-bello"},
  {min:25,max:50,label:"GRANDE!",className:"win-grande"},
  {min:50,max:100,label:"MAGNIFICO!",className:"win-magnifico"},
  {min:100,max:Number.POSITIVE_INFINITY,label:"LA DOLCE VITA!",className:"win-dolce-vita"},
];
export const MIN_CELEBRATION_MULTIPLIER=LEMONZA_WIN_TIERS[0].min;
export const winTierByMultiplier=(multiplier:number)=>LEMONZA_WIN_TIERS.find((tier)=>multiplier>=tier.min&&multiplier<tier.max)??LEMONZA_WIN_TIERS[0];
