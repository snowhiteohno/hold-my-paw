const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // This host has no headless audio output clock; test scheduling against elapsed wall time.
 await page.addInitScript(()=>{
   const Native=window.AudioContext;
   window.audioChecks={contexts:[], notes:[], connections:0};
   window.AudioContext=class extends Native {
     constructor(...args){super(...args);this.testStart=performance.now();window.audioChecks.contexts.push(this);}
     get currentTime(){return (performance.now()-this.testStart)/1000;}
     createGain(){const node=super.createGain();const connect=node.connect.bind(node);node.connect=(dest,...args)=>{
       if(dest===this.destination){window.audioChecks.connections++;window.audioChecks.master=node;const target=node.gain.setTargetAtTime.bind(node.gain);node.gain.setTargetAtTime=(v,...args)=>{window.audioChecks.target=v;return target(v,...args)};const analyser=this.createAnalyser();analyser.fftSize=2048;connect(analyser);window.audioChecks.analyser=analyser;}
       return connect(dest,...args);
     };return node;}
     createOscillator(){const node=super.createOscillator();const start=node.start.bind(node);node.start=(time)=>{window.audioChecks.notes.push({f:node.frequency.value,t:time});return start(time);};return node;}
   };
   localStorage.setItem('hold-my-paw-v1',JSON.stringify({unlocked:3,best:{}}));
 });
 await page.goto(process.env.GAME_URL||'http://localhost:4175');
 assert.equal(await page.evaluate(()=>window.audioChecks.contexts.length),0);
 await page.getByRole('button',{name:'Enable music',exact:true}).click();
 await page.waitForFunction(()=>window.audioChecks.notes.length>12);
 await page.getByRole('button',{name:'Mute music',exact:true}).click();
 await page.waitForTimeout(1800);
 assert.equal(await page.evaluate(()=>window.audioChecks.target),0);
 await page.getByRole('button',{name:'Enable music',exact:true}).click();
 await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>window.audioChecks.contexts.length),1);
 assert.equal(await page.evaluate(()=>window.audioChecks.connections),1);
 await page.getByRole('button',{name:/Play chapter 3:/}).click();
 await page.getByRole('button',{name:'We’ve got each other.'}).click();
 await page.keyboard.press('Escape');
 const volume=page.getByRole('slider',{name:'Sound volume'});
 await volume.fill('0');await volume.dispatchEvent('input');await page.waitForTimeout(1800);
 assert.equal(await page.evaluate(()=>window.audioChecks.target),0);
 await volume.fill('55');await volume.dispatchEvent('input');
 await page.waitForTimeout(1200);assert((await page.evaluate(()=>window.audioChecks.target))>0);
 assert.deepEqual(errors,[]);
 console.log('PASS opt-in audio, scheduled notes, mute, volume, one audio graph after toggling, chapter change, no browser errors');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
