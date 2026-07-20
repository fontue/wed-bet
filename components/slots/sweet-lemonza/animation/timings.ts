export interface AnimationTimings {
  spinButtonPress:number; anticipation:number; columnDelay:number; initialDrop:number; landingBounce:number;
  evaluationPause:number; winHighlight:number; winValueHold:number; symbolRemoval:number; collapse:number;
  newSymbolDrop:number; cascadePause:number; scatterAnticipation:number; multiplierReveal:number; multiplierCollect:number;
  multiplierApply:number; smallWinCount:number; mediumWinCount:number; bigWinIntro:number;
  bigWinCount:number; bonusTransition:number; bonusSummary:number; losingPause:number;
}

export const ANIMATION_TIME_SCALE=2;
const scaled=(timings:AnimationTimings):AnimationTimings=>Object.fromEntries(Object.entries(timings).map(([key,value])=>[key,value*ANIMATION_TIME_SCALE])) as unknown as AnimationTimings;

export const NORMAL_TIMINGS: AnimationTimings = scaled({
  spinButtonPress:90, anticipation:140, columnDelay:55, initialDrop:360, landingBounce:180,
  evaluationPause:100, winHighlight:380, winValueHold:300, symbolRemoval:240, collapse:300,
  newSymbolDrop:320, cascadePause:90, scatterAnticipation:650, multiplierReveal:260, multiplierCollect:260,
  multiplierApply:700, smallWinCount:450, mediumWinCount:900, bigWinIntro:350,
  bigWinCount:1800, bonusTransition:1100, bonusSummary:2200, losingPause:20,
});
export const TURBO_TIMINGS: AnimationTimings = scaled({
  spinButtonPress:50, anticipation:40, columnDelay:18, initialDrop:160, landingBounce:80,
  evaluationPause:25, winHighlight:120, winValueHold:90, symbolRemoval:100, collapse:120,
  newSymbolDrop:155, cascadePause:20, scatterAnticipation:250, multiplierReveal:120, multiplierCollect:100,
  multiplierApply:300, smallWinCount:140, mediumWinCount:300, bigWinIntro:180,
  bigWinCount:700, bonusTransition:500, bonusSummary:900, losingPause:8,
});
export const REDUCED_MOTION_TIMINGS: AnimationTimings = {
  ...TURBO_TIMINGS, anticipation:40, initialDrop:180, winHighlight:200, winValueHold:160,
  symbolRemoval:140, collapse:160, newSymbolDrop:180, scatterAnticipation:300,
  multiplierReveal:180, multiplierCollect:140, multiplierApply:360, bigWinIntro:200, bigWinCount:600,
  bonusTransition:520, bonusSummary:1200,
};

export const CASCADE_SPEED = (index:number) => Math.max(.72, 1-index*.06);
