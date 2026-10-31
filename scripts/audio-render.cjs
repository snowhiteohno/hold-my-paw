// Run against a Vite development server so the original score can be imported.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{const b=await chromium.launch();try{const p=await b.newPage();await p.goto(process.env.AUDIO_DEV_URL||'http://127.0.0.1:4176');const results=await p.evaluate(async()=>{
 const {Soundscape}=await import('/src/audio.ts');
 const tempos={meadow:82,town:96,rain:68,home:78};const result=[];
 for(const mood of Object.keys(tempos)){
  const beat=30/tempos[mood], length=48*beat+4;
  const context=new OfflineAudioContext(1,Math.ceil(length*22050),22050);
  const s=new Soundscape();s.context=context;s.enabled=true;s.mood=mood;
  s.gain=context.createGain();s.gain.gain.value=.55*.8;s.gain.connect(context.destination);
  s.echo=context.createDelay(1);s.echo.delayTime.value=.27;
  const wet=context.createGain();wet.gain.value=.16;s.echo.connect(wet);wet.connect(s.gain);
  for(let i=0;i<48;i++)s.music(i,.05+i*beat,beat);
  const rendered=await context.startRendering();const pcm=rendered.getChannelData(0);
  let peak=0,sum=0;const windows=[];
  for(let i=0;i<pcm.length;i++){peak=Math.max(peak,Math.abs(pcm[i]));sum+=pcm[i]*pcm[i];}
  for(let start=0;start<48*beat*22050;start+=22050){let energy=0;for(let i=start;i<Math.min(start+22050,pcm.length);i++)energy+=pcm[i]*pcm[i];windows.push(Math.sqrt(energy/22050));}
  result.push({mood,peak,rms:Math.sqrt(sum/pcm.length),windows,pcm:Array.from(pcm)});
 }return result;
});fs.mkdirSync('artifacts',{recursive:true});for(const r of results){assert(r.peak>.005&&r.peak<.9);assert(r.windows.slice(0,-2).every(v=>v>.0001));const wav=Buffer.alloc(44+r.pcm.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(22050,24);wav.writeUInt32LE(44100,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(r.pcm.length*2,40);r.pcm.forEach((v,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));fs.writeFileSync(`artifacts/music-${r.mood}.wav`,wav);console.log(`${r.mood}: peak ${r.peak.toFixed(3)}, RMS ${r.rms.toFixed(3)}, full phrase rendered with continuous accompaniment and no clipping`);}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
