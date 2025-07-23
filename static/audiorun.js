
import {keyfrequency} from './scripts/client1.js'

let mintime=0
let maxtime=0
let gsegments=[]


function gpt_calcgraphval(x, segments) {
  function bezier(t, p0, c0, c1, p1) {
    const mt = 1 - t;
    return mt ** 3 * p0 +
           3 * mt ** 2 * t * c0 +
           3 * mt * t ** 2 * c1 +
           t ** 3 * p1;
  }

  function solveBezierTForX(seg, targetX, epsilon = 1e-5) {
    // Binary search to solve bezier(t) ≈ targetX
    let low = 0, high = 1, t = 0.5;
    for (let i = 0; i < 30; i++) {
      t = (low + high) / 2;
      const xAtT = bezier(t, seg.p0.x, seg.c0.x, seg.c1.x, seg.p1.x);
      if (Math.abs(xAtT - targetX) < epsilon) break;
      if (xAtT < targetX) low = t;
      else high = t;
    }
    return t;
  }

  // Find the segment where x falls between p0.x and p1.x
  const seg = segments.find(s => x >= s.p0.x && x <= s.p1.x);
  if (!seg) return null; // out of bounds

  const t = solveBezierTForX(seg, x);
  const y = bezier(t, seg.p0.y, seg.c0.y, seg.c1.y, seg.p1.y);
  return y;
}

function parsemath(exp, localvars, lvarstack = [], returnfloat) {
    if (typeof exp !== 'string') exp = String(exp);

    if (exp.slice(0,2)=="g!") {
        const jsp=JSON.parse(exp.slice(2))
        const evalu=jsp.min+(jsp.max-jsp.min)*gpt_calcgraphval(((localvars.t-mintime)/(maxtime-mintime)),jsp.segments)

        if (returnfloat) {
            return evalu;
        } else {
            return evalu.toString();
        }

    } else {
        const matches = [...exp.matchAll(/\$([^#]+)#/g)];
    const qvars = matches.map(m => m[1]);

    qvars.forEach(qvar => {
        if (lvarstack.includes(qvar)) {
            console.warn(`Circular reference detected: ${lvarstack.join(" → ")} → ${qvar}`);
            exp = "0"; // Optional: neutral fallback
        } else if (qvar in localvars) {
            const newStack = [...lvarstack, qvar]; // create a new stack for recursion
            const reg = new RegExp(`\\$${qvar}#`, 'g');
            const subexp = parsemath(localvars[qvar], localvars, newStack);
            exp = exp.replace(reg, subexp);
        }
    });

    if (exp.includes("#")) {
        console.warn("ERROR DETECTED: unresolved variable");
        return "0";
    }

    let returnv = "eval.toString()";
    if (returnfloat === true) {
        returnv = "parseFloat(eval.toString())";
    }
    const res = new Function(`const eval=${exp}; return ${returnv};`)();
    return res;
    }
    
}







function cartesarrays(arrays) {
  return arrays.reduce((acc, curr) => {
    return acc.flatMap(a => curr.map(b => [...a, b]));
  }, [[]]);
}
function getrawwaves(t,variables,waveformdata) {
    const newvars={...variables,...{"t":`${String(t)}`,"F":`${String(keyfrequency[0])}`}}

    // if (playing==false) {
    //     return {};
    // }


    let newdata=[];
    //console.log(waveformdata)
    waveformdata.forEach((item)=>{
      
        
        let m=false
        if (item.modifiers.length>0) {
            let modvars=[]
            let modvariter=[]
            item.modifiers.forEach((mod)=>{
                const start=parsemath(mod.start,variables,[],true);
                const end=parsemath(mod.end,variables,[],true);
                const step=parsemath(mod.step,variables,[],true);
                let mv=[]
                for (let i=start;i<end;i+=step) {
                    mv.push(i);
                }
                modvariter.push(mv);
                modvars.push(mod.var)
             });
            let allpossvarvals=cartesarrays(modvariter)
            // console.log("all poss var vals "+allpossvarvals)
            // console.log("modvars "+modvars)
            // console.log("modvariter "+modvariter)
            allpossvarvals.forEach((varps)=>{
                let varvalmap={}
                const wavetab={}
                for (let i=0;i<modvars.length;i++) {
                    varvalmap[modvars[i]]=String(varps[i])
                }
                let finvars={...newvars,...varvalmap};
                //console.log(finvars)
                wavetab.waveform=item.waveform;
                wavetab.frequency=Number(parsemath(item.frequency,finvars,[]));
                wavetab.amplitude=Number(parsemath(item.amplitude,finvars,[]));
                wavetab.phase=Number(parsemath(item.phase,finvars,[]));
                wavetab.pan=Number(parsemath(item.pan,finvars,[]))
                newdata.push(wavetab)

            });
        } else {
          const wavetab={}
          wavetab.waveform=item.waveform;
          wavetab.frequency=Number(parsemath(item.frequency,newvars,[]));
          wavetab.amplitude=Number(parsemath(item.amplitude,newvars,[]));
          wavetab.phase=Number(parsemath(item.phase,newvars,[]));
          wavetab.pan=Number(parsemath(item.pan,newvars,[]))
          newdata.push(wavetab)
        }
      
    });
    //console.log(newdata)
    return newdata
}


export function generateAudioBuffer(context, startTime, endTime, waveformdata,variables,blocksize,phases=[],segments,sampleRate = 44100) {
  const duration = endTime - startTime;
  const frameCount = duration * sampleRate;
  const buffer = context.createBuffer(2, frameCount, sampleRate);
  const ldata = buffer.getChannelData(0);
  const rdata=buffer.getChannelData(1);
  mintime=startTime;
  maxtime=endTime;
  gsegments=segments;
  
 let waves=null;   
 
  for (let i = 0; i < frameCount; i++) {
    const t = startTime + i / sampleRate;

  
    
    if (i%blocksize==0) {
        waves=getrawwaves(t,variables,waveformdata);
        //console.log(waves)

    }
    let lsampleval=0
    let rsampleval=0
   // console.log(waves)
    
    if (!waves) {continue;}
    if (phases.length !== waves.length) {
        phases.length=0;
        for (let i = 0; i < waves.length; i++) {
            phases.push(0)
        }
    }
    for (let j = 0; j < waves.length; j++) {
    
        const { waveform, frequency, amplitude, pan,phase } = waves[j];
        //console.log(waves[j])
        const inc = 2 * Math.PI * frequency / sampleRate;
        phases[j] += inc;
        if (phases[j] > 2 * Math.PI) {
            phases[j] -= 2 * Math.PI;
        }
        const totphase = phases[j] + phase;
        
        let val = 0;
        switch (waveform) {
            case "sine":
                val = Math.sin(totphase);
                break;
            case "square":
                val = Math.sign(Math.sin(totphase));
                break;
            case "sawtooth":
                val = 2 * (totphase / (2 * Math.PI) - Math.floor(totphase / (2 * Math.PI) + 0.5));
                break;
            case "triangle":
                val = 2 * Math.abs(2 * (totphase / (2 * Math.PI) - Math.floor(totphase / Math.PI + 0.5))) - 1;
                break;
            case "whitenoise":
                val=-1+2*Math.random();
        }

        lsampleval+=amplitude * val*(1-(pan+1)/2);
        rsampleval+=amplitude * val*((pan+1)/2)
        phases[j] = totphase
        if (phases[j] > 2 * Math.PI) phases[j] -= 2 * Math.PI;
        
    }

    ldata[i] = lsampleval
    rdata[i]=rsampleval
   
    
  }
  //console.log(data)
  //console.log(buffer.getChannelData(0))
  return [buffer,phases];
}

