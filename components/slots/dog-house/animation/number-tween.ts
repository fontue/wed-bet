export async function tweenDogHouseNumber({from,to,duration,signal,onUpdate}:{from:number;to:number;duration:number;signal:AbortSignal;onUpdate:(value:number)=>void}){
  if(duration<=0||from===to||signal.aborted){onUpdate(to);return;}
  const started=performance.now();
  await new Promise<void>((resolve)=>{let frame=0,lastPaint=started-40,lastValue=from,finished=false;const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);if(lastValue!==to)onUpdate(to);resolve();};const tick=(now:number)=>{if(signal.aborted){finish();return;}const progress=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-progress,3),value=Math.floor(from+(to-from)*eased);if(progress>=1||now-lastPaint>=40){if(value!==lastValue)onUpdate(value);lastValue=value;lastPaint=now;}if(progress>=1)finish();else frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);});
}
