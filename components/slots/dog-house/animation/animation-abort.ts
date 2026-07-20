export const abortableWait=(milliseconds:number,signal:AbortSignal)=>new Promise<void>((resolve)=>{let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener("abort",finish);resolve();},timer=setTimeout(finish,milliseconds);signal.addEventListener("abort",finish,{once:true});});

