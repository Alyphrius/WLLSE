//WARNING: DO NOT EDIT UNLESS YOU KNOW WHAT YOU ARE DOING.


const container = document.getElementById("container");
const addBtn = document.getElementById("addBtn");
const playBtn = document.getElementById("playBtn");
const startBtn = document.getElementById("startbtn");
const addvarb = document.getElementById("addvar");
const timesttxt=document.getElementById("timestart");
const timeend=document.getElementById("timeend");
const blocksizetxt=document.getElementById("blocksize");
const keyboarddiv=document.getElementById("keyboardcont")
const voicentxt=document.getElementById("voicenparam")
const propinput1=document.getElementById("valinput1");
const propinput2=document.getElementById("valinput2");
const exportsel=document.getElementById("exportselect");
const exportdesc=document.getElementById("exportdesc");
const exportbtn=document.getElementById("exportbtn");
const importbtn=document.getElementById("importbtn");
const fileinp=document.getElementById("fileimport");
const prevpresetbtn=document.getElementById("prevpreset");
const nextpresetbtn=document.getElementById("nextpreset");
const currpresetdd=document.getElementById("currentpreset");
const modgraphc=document.getElementById("modgraphc");
const gcmin=document.getElementById("gcmin");
const gcmax=document.getElementById("gcmax")


import { generateAudioBuffer} from '../audiorun.js';
let numvoices=1;

voicentxt.addEventListener('input',function() {
  numvoices=Number(voicentxt.value)
})


let audioContext;
let sourceNode;

const varcont=document.getElementById("variablecon");
let waveformdata=[


];


importbtn.addEventListener('click',function() {
  fileinp.click()
})
let preloadall=false //whether preload all keys when click load vs load on key press


let letterknotes=['Z','S','X','D','C','V','G','B','H','N','J','M','Q','2','W','3','E','R','5','T','6','Y','7','U','I','9','O','0','P']
let kboctave=2
export let keyfrequency=[0];
let currentnote=-1
let notedown=false

const localblackp=[37,108,223,291,360]

let voices={}

let cursnd;

let selectedwave=null
let selectedwrect=null


let presets={}
let currentmodvar=""


for (let o=0;o<6;o++) { //Generate the piano keyboard
  let p=0;
  let p2=0;
  for (let i=0;i<12;i++) {
    const v=12*o+i
    const sv=String(v);
    const key=document.createElement("div");
    if ([1,3,6,8,10].includes(i%12)) {
      
      key.className="black key";
      key.style.left=`${434*o+localblackp[p]}px`
      p+=1;
    } else {
      if (o==3) {
        key.className="white key midc";
      } else {
        key.className="white key";
      }
      
      //key.style.left=`${60*(p2+12*o)}px`;
      p2+=1;
    }
    const btn=document.createElement("button");
    btn.className="keybtn";
    function keydown() {
      console.log(voices)
      if (Object.keys(voices).length>=numvoices) {return;}
      currentnote=12*o+i;
      keyfrequency[0]=440*2**((currentnote-33)/12)
      notedown=true;
      start2(true,sv);
    }
    function keyup() {
      //if (notedown==false) {return;}
      
      if (voices[v]) {
        currentnote=-1;
      keyfrequency[0]=0;
      notedown=false;
        
        voices[sv].stop();
        delete voices[sv]
      }
    }
    keyboarddiv.appendChild(key)
    key.appendChild(btn);
    if (o>=kboctave && v<12*kboctave+letterknotes.length) {
        document.addEventListener("keydown",function(event){
          const target=event.target
          const istyping=(target.tagName=='INPUT' || target.tagName=='TEXTAREA' || target.isContentEditable)
          
          if (event.key==letterknotes[v-12*kboctave].toLowerCase() && !istyping) {
            key.classList.add('active')
            keydown()
          }
        })
        document.addEventListener("keyup",function(event){
          const target=event.target
          const istyping=(target.tagName=='INPUT' || target.tagName=='TEXTAREA' || target.isContentEditable)
          if (event.key==letterknotes[v-12*kboctave].toLowerCase() && !istyping) {
            key.classList.remove('active')
            keyup()
          }
        })
      }
    key.addEventListener('mousedown',function(){
      keydown()
      
      
      

  console.log("key down")
    });
    key.addEventListener('touchstart',function(){
      keydown()
    })
    key.addEventListener('mouseup',function(){
      keyup()
    });
    key.addEventListener('mouseleave',function(){
      keyup()
    })
    key.addEventListener('touchend',function(){
      keyup()
    })
  }
}



propinput1.addEventListener("input",function(){
  if (!selectedwave) return;
  selectedwave.frequency=propinput1.value;
  selectedwrect.querySelector(".freqinput").value=propinput1.value;

});
propinput2.addEventListener("input",function(){
  if (!selectedwave) return;
  selectedwave.amplitude=propinput2.value;
  selectedwrect.querySelector(".ampinput").value=propinput2.value;
});




fileinp.addEventListener("change",(event)=>{
  const file=event.target.files[0]
  const reader=new FileReader()
  reader.onload = function(e) {
    const fileContents = e.target.result;
    importfromstringdata(fileContents);
  };
  
  reader.readAsText(file)
})




function importfromstringdata(stringd) {
  variables={}
  waveformdata=[]
  container.replaceChildren()
  varcont.replaceChildren()
  console.log(stringd);
  let parts=stringd.split("Ω")
  let waves=parts[0].split("∇")
  if (waves && waves.length>0 && waves[0]) {
    waves.forEach(wave =>{
    let waved=wave.split("∏")
    console.log(waved)
     let waveform={waveform:waved[0],frequency:waved[1],amplitude:waved[2],phase:waved[3],modifiers:[]}
   let div=createWaveElement()
    div.querySelector(".freqinput").value=waveform.frequency;
    div.querySelector(".ampinput").value=waveform.amplitude;
    div.querySelector(".wformselect").value=waveform.waveform;

    console.log(waved.length)
    if (waved.length>4 && waved[4]) {
       let mods=waved[4].split("∧")

    let modtab=[]
    mods.forEach(mod =>{
      let moddat=mod.split("∨")
      modtab.push({start:moddat[0],end:moddat[1],step:moddat[2],var:moddat[3]})
      
    })

    waveform.modifiers=modtab;
    modtab.forEach(mod =>{
      let modd=createModifier(div,waveform,"multiply")
      modd.querySelector(".mfromtx").value=mod.start;
      modd.querySelector(".mtotx").value=mod.end;
      modd.querySelector(".msteptx").value=mod.step;
      modd.querySelector(".mvartx").value=mod.var;

      
    })
    } else {
      waveform.modifiers=[]
    }
   
    //waveformdata.push(waveform);
    
    container.appendChild(div);
    
    


  });
  }

  
  let vars=parts[1].split("∏")
  if (vars.length>0 && vars[0]) {
    vars.forEach((vari)=>{
    let div=addvariable();
    let varis=vari.split("∧")
    div.querySelector(".var-name-input").value=varis[0];
    div.querySelector(".var-value-input").value=varis[1];
    varcont.appendChild(div)
  })
  }
  
  timesttxt.value=parts[2]
  timeend.value=parts[3]
  blocksizetxt.value=parts[4]
  voicentxt.value=parts[5]

  stringtoprojectdata(stringd)
  console.log(waveformdata)
  console.log(variables)
}


function stringtoprojectdata(stringd) {
  waveformdata=[]
  let parts=stringd.split("Ω")
  let waves=parts[0].split("∇")
  waves.forEach(wave =>{
    let waved=wave.split("∏")
    let waveform={waveform:waved[0],frequency:waved[1],amplitude:waved[2],phase:waved[3],modifiers:[]}
   
    if (waved.length>4 && waved[4]) {
      let mods=waved[4].split("∧")

    let modtab=[]
     mods.forEach(mod =>{
      let moddat=mod.split("∨")
      modtab.push({start:moddat[0],end:moddat[1],step:moddat[2],var:moddat[3]})
    })
    waveform.modifiers=modtab;
    }
    
    waveformdata.push(waveform);

  });
  variables={}
  let vars=parts[1].split("∏")
  if (vars.length>0 && vars[0]) {
    vars.forEach((svar)=>{
    let d=svar.split("∧")
    let k=d[0]
    let v=d[1]
    variables[k]=v
  })
  }
  
  return [waveformdata,variables]
}
function projectdatatostring() {
  let s=""
  waveformdata.forEach(wavei=>{
    let s2=`${wavei.waveform}∏${wavei.frequency}∏${wavei.amplitude}∏${wavei.phase}∏`
    wavei.modifiers.forEach(mod => {
      s2+=`${mod.start}∨${mod.end}∨${mod.step}∨${mod.var}∧`
    })
    if (s2.charAt(s2.length-1)=="∧") {
      s2=s2.slice(0,-1);
    }
    s+=s2+"∇";
    
  })
  if (s.charAt(s.length-1)=="∇" || s.charAt(s.length-1)=="∏") {
    s=s.slice(0,-1)

  }
 
  s+="Ω";
  for (const k in variables) {
    if (variables.hasOwnProperty(k)) {
      const v=variables[k]
      let s2=`${k}∧${v}`
      s+=s2+"∏"

    }
    
  }
  if (s.charAt(s.length-1)=="∏") {
    s=s.slice(0,-1);
  }
  s+=`Ω${timesttxt.value}Ω${timeend.value}Ω${blocksizetxt.value}Ω${voicentxt.value}`;
  
  return s
}
function downloadtosynthfile() {
  let sdata=projectdatatostring()

  const blob=new Blob([sdata],{type: 'text/plain'})
  const ourl=URL.createObjectURL(blob);
  const a=document.createElement("a")
  a.href=ourl
  a.download="sound.lls1"
  document.body.appendChild(a);
  a.click()
  URL.revokeObjectURL(url)
  document.body.removeChild(a)

}



{
  const options=[["lls1","LLS1 data file"],["wav","WAV audio"],["sfz","SFZ soundfont"],["json","JSON data file"]];
  const optdesc={"lls1":"Export as synth project data for this site. Can be imported later and edited.","wav":"Render to wave file.","sfz":"Generate a soundfont for this synth to use in a DAW or somewhere else.","json":"Export synth data to JSON. Can be imported later for editing. Functionally similar to LLS, but higher reliability and much higher file size."}
  options.forEach(o => {
      const op=document.createElement("option");
      op.value=o[0]
      op.text=o[1]
      exportsel.appendChild(op)
  })
  exportsel.addEventListener("change",function() {
      const val=exportsel.value;
      exportdesc.innerText=optdesc[val];
      
  });
  exportbtn.onclick=()=>{
    switch(exportsel.value){
      case "lls1":
        downloadtosynthfile()
    }
  }
}


function g_loadinpresets() {
  fetch('/files')
  .then(res => res.json())
  .then(files => {
    console.log(files)
    files.forEach(file => {
      console.log(`File: ${file.name}`);
      console.log(`Content: ${file.content}`);
      presets[file.name]=file.content;
      
    });
    console.log("LOADED PRESETS")
  console.log(presets)
  
     const o1=document.createElement("option")
      o1.value="none"
      o1.text="--NONE--"
      currpresetdd.appendChild(o1);
  Object.keys(presets).forEach((k) =>{
    if (presets.hasOwnProperty(k)) {
      const o=document.createElement("option")
      o.value=k
      o.text=k
      currpresetdd.appendChild(o);
    }
  })

currpresetdd.addEventListener("change",function() {
  importfromstringdata(presets[currpresetdd.value])
})

  })
  .catch(err => console.error('Error fetching files:', err));

  
}
g_loadinpresets()




function remvdictfromarray(arr, match) {
  const index = arr.findIndex(obj =>
    Object.keys(match).every(
      key => obj[key] === match[key]
    )
  );
  if (index > -1) arr.splice(index, 1);
}



let mgcanvash;
let mgcanvasw;

function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;

  // Set canvas width/height to match scaled resolution
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  mgcanvash=canvas.height
  mgcanvasw=canvas.width

  // Scale drawing operations to match CSS pixels
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  return ctx;
}

const gctx = setupCanvas(modgraphc);

function datanormal(dat,width,height) {
  function a(p) {
    return {x:p.x/width,y:1-(p.y/height)}
  }

  return {mainpoints:dat.mainpoints.map(a),segments:dat.segments.map(s=>({p0:a(s.p0),p1:a(s.p1),c0:a(s.c0),c1:a(s.c1)})),min:dat.min,max:dat.max}
}
function datadenormal(dat,width,height) {
 
  function a(p) {
    return {x:p.x*width,y:(1-p.y)*height}
  }

  return {mainpoints:dat.mainpoints.map(a),segments:dat.segments.map(s=>({p0:a(s.p0),p1:a(s.p1),c0:a(s.c0),c1:a(s.c1)})),min:dat.min,max:dat.max}
}


let playing=false
let gtime=0
let ltime=0
let variables={}

let mselectedpt=null;
let mgdragtype=null
let currentmvtab={}
let currentvvalfield=null

function findnearbypt(x,y,l) {
  return l.find(p=>Math.hypot(p.x-x,p.y-y)<12);
}
function loadmodcanvas(key,dataw) {
  console.log(dataw)
  const pdat=JSON.parse(dataw || '{"mainpoints":[{"x":0,"y":0},{"x":1,"y":1}],"segments":[],"min":0,"max":10}')
  const dat=datadenormal(pdat,modgraphc.width / (window.devicePixelRatio || 1), modgraphc.height / (window.devicePixelRatio || 1))
  currentmodvar=key
  mselectedpt=null
  mgdragtype=null
  currentmvtab=dat;
  gcmin.value=dat.min;
  gcmax.value=dat.max;

  console.log(dat)
  updsegments()
  drawmodcanvas(dat)

}

function getmousepos(e) {
  const rect = modgraphc.getBoundingClientRect();
  const sc=window.devicePixelRatio||1
  return {
    x: e.clientX - rect.left*sc,
    y: e.clientY - rect.top*sc
  };
}



function mclamp(a,l,h) {
  return Math.min(Math.max(a,l),h)
}
modgraphc.addEventListener("mouseup",() =>{
  mselectedpt=null;
  mgdragtype=null;
})
modgraphc.addEventListener("mousedown",(e)=>{
  if (!currentmvtab) {
    return
  }
  const {x,y}=getmousepos(e)
  mselectedpt=findnearbypt(x,y,currentmvtab.mainpoints)
  mgdragtype="main"
  if (!mselectedpt) {
    for (let s of currentmvtab.segments) {
      mselectedpt=findnearbypt(x,y,[s.c0,s.c1])
      if (mselectedpt) {
        mgdragtype="ctrl"
        break
      }
    }
  }

  if (!mselectedpt) {
    currentmvtab.mainpoints.push({x,y})
    currentmvtab.mainpoints.sort((a,b)=>a.x-b.x)
    updsegments()
    drawmodcanvas(currentmvtab)

  }

})
modgraphc.addEventListener("contextmenu",(e)=>{
  e.preventDefault()
  if (!currentmvtab) {
    return
  }
  const {x,y}=getmousepos(e)
  mselectedpt=findnearbypt(x,y,currentmvtab.mainpoints)
  mgdragtype="main"
  
  if (mselectedpt) {
    const width=modgraphc.width / (window.devicePixelRatio || 1)
    if (![0,1*width].includes(mselectedpt.x)) {
      remvdictfromarray(currentmvtab.mainpoints,mselectedpt)
    currentmvtab.mainpoints.sort((a,b)=>a.x-b.x)
    updsegments()
    drawmodcanvas(currentmvtab)
    }
    

  }
})
modgraphc.addEventListener("mousemove", (e)=>{
  const {x,y}=getmousepos(e)
  const width=modgraphc.width / (window.devicePixelRatio || 1)
      
  if (mselectedpt) {
    if (![0,1*width].includes(mselectedpt.x)) {
      const width=modgraphc.width / (window.devicePixelRatio || 1)
      const height=modgraphc.height / (window.devicePixelRatio || 1)
      mselectedpt.x=mclamp(x,0.01*width,0.99*width);
    }
    
    mselectedpt.y=y;
    if (mgdragtype=="main") {
      currentmvtab.mainpoints.sort((a,b)=>a.x-b.x)
      updsegments()
    } else {
      for (let s of currentmvtab.segments) {
        if (s.c0==mselectedpt || s.c1==mselectedpt) {
          mselectedpt.x=mclamp(x,s.p0.x,s.p1.x)
        
        }
      }
      
    }
    drawmodcanvas(currentmvtab)
  }
  

})
function updsegments() {
  currentmvtab.segments=[]
  for (let i=0;i<currentmvtab.mainpoints.length-1;i++) {
    const p0=currentmvtab.mainpoints[i]
    const p1=currentmvtab.mainpoints[i+1]
    const d=(p1.x-p0.x)/2.5
    currentmvtab.segments.push({p0,p1,c0:{"x":mclamp(p0.x+d,p0.x,p1.x),"y":p0.y},c1:{"x":mclamp(p1.x-d,p0.x,p1.x),"y":p1.y}})
  }
}

function drawmodcanvas(datas) {
  gctx.clearRect(0, 0, modgraphc.width, modgraphc.height);
  const segments=datas.segments;
  const ncmt=datanormal(currentmvtab,modgraphc.width / (window.devicePixelRatio || 1), modgraphc.height / (window.devicePixelRatio || 1));
  const jss=JSON.stringify(ncmt)
  variables[currentmodvar]="g!"+jss
  currentvvalfield.value="g!"+jss

  // Draw curves
  for (let seg of segments) {
    gctx.beginPath();
    gctx.moveTo(seg.p0.x, seg.p0.y);
    gctx.bezierCurveTo(
      seg.c0.x, seg.c0.y,
      seg.c1.x, seg.c1.y,
      seg.p1.x, seg.p1.y);
    gctx.strokeStyle = 'white';
    gctx.lineWidth = 2;
    gctx.stroke();
  }

  // Draw control handles
  gctx.strokeStyle = 'gray';
  for (let seg of segments) {
    gctx.beginPath();
    gctx.moveTo(seg.p0.x, seg.p0.y);
    gctx.lineTo(seg.c0.x, seg.c0.y);
    gctx.moveTo(seg.p1.x, seg.p1.y);
    gctx.lineTo(seg.c1.x, seg.c1.y);
    gctx.stroke();
  }

  // Draw control points
  for (let seg of segments) {
    [seg.c0, seg.c1].forEach(cp => {
      gctx.beginPath();
      gctx.arc(cp.x, cp.y, 5, 0, Math.PI * 2);
      gctx.fillStyle = 'white';
      gctx.fill();
    });
  }

  // Draw main points
  for (let p of currentmvtab.mainpoints) {
   
    gctx.beginPath();
    gctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    const width=modgraphc.width / (window.devicePixelRatio || 1)
      
    if ([0,width].includes(p.x)) {
      gctx.fillStyle = 'yellow';
    } else {
      gctx.fillStyle = 'blue';
    }
    
    gctx.fill();
  }
}



gcmin.addEventListener("input",()=>{
  if (currentmvtab) {
    currentmvtab.min=Number(gcmin.value)
    const ncmt=datanormal(currentmvtab,modgraphc.width / (window.devicePixelRatio || 1), modgraphc.height / (window.devicePixelRatio || 1));
  const jss=JSON.stringify(ncmt)
  variables[currentmodvar]="g!"+jss
  currentvvalfield.value="g!"+jss
  }
})
gcmax.addEventListener("input",()=>{
  if (currentmvtab) {
    currentmvtab.max=Number(gcmax.value)
    const ncmt=datanormal(currentmvtab,modgraphc.width / (window.devicePixelRatio || 1), modgraphc.height / (window.devicePixelRatio || 1));
  const jss=JSON.stringify(ncmt)
  variables[currentmodvar]="g!"+jss
  currentvvalfield.value="g!"+jss
  }
})











function parsemath(exp, localvars, lvarstack = [], returnfloat) {
    if (typeof exp !== 'string') exp = String(exp);
    const matches = [...exp.matchAll(/\$([^#]+)#/g)];
    const qvars = matches.map(m => m[1]);

    qvars.forEach(qvar => {
        if (lvarstack.includes(qvar)) {
            console.warn(`Circular reference detected: ${lvarstack.join(" -> ")} -> ${qvar}`);
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

function cartesarrays(arrays) {
  return arrays.reduce((acc, curr) => {
    return acc.flatMap(a => curr.map(b => [...a, b]));
  }, [[]]);
}
function getrawwaves(t) {
    const newvars={...variables,...{"t":`${String(t)}`,"F":`${String(keyfrequency[0])}`}}

    // if (playing==false) {
    //     return {};
    // }
    newdata=[];
    //console.log(waveformdata)
    waveformdata.forEach((item)=>{
      
        
        let m=false
        if (item.modifiers.length>0) {
            modvars=[]
            modvariter=[]
            item.modifiers.forEach((mod)=>{
                const start=parsemath(mod.start,variables,[],true);
                const end=parsemath(mod.end,variables,[],true);
                const step=parsemath(mod.step,variables,[],true);
                mv=[]
                for (let i=start;i<end;i+=step) {
                    mv.push(i);
                }
                modvariter.push(mv);
                modvars.push(mod.var)
             });
            allpossvarvals=cartesarrays(modvariter)
            // console.log("all poss var vals "+allpossvarvals)
            // console.log("modvars "+modvars)
            // console.log("modvariter "+modvariter)
            allpossvarvals.forEach((varps)=>{
                varvalmap={}
                const wavetab={}
                for (let i=0;i<modvars.length;i++) {
                    varvalmap[modvars[i]]=String(varps[i])
                }
                finvars={...newvars,...varvalmap};
                //console.log(finvars)
                wavetab.waveform=item.waveform;
                wavetab.frequency=Number(parsemath(item.frequency,finvars,[]));
                wavetab.amplitude=Number(parsemath(item.amplitude,finvars,[]));
                wavetab.phase=Number(parsemath(item.phase,finvars,[]));
                newdata.push(wavetab)

            });
        } else {
          const wavetab={}
          wavetab.waveform=item.waveform;
          wavetab.frequency=Number(parsemath(item.frequency,newvars,[]));
          wavetab.amplitude=Number(parsemath(item.amplitude,newvars,[]));
          wavetab.phase=Number(parsemath(item.phase,newvars,[]));
          newdata.push(wavetab)
        }
      
    });
    //console.log(newdata)
    return newdata
}

setInterval(() => {
    gtime+=0.01;
},10);

    let audioCtx = null;
    let activeNodes = [];
    function createWaveElement() {

        const wavepoint={waveform:"sine",frequency: "440", amplitude: "0.1", pan:"0",phase:"0",modifiers: []}
        waveformdata.push(wavepoint)
      const div = document.createElement("div");
      div.className = "wave-rect";

      const freqInput = document.createElement("input");
      // freqInput.type = "number";
      freqInput.placeholder = "Frequency (Hz)";
      freqInput.className="freqinput waveinp"
      // freqInput.min = "1";
      // freqInput.step = "1";
      freqInput.value = "440";
      const paninput=document.createElement("input");
      paninput.placeholder="Panning (-1 - 1)"
      paninput.className="paninput waveinp"
      paninput.value="0"
    freqInput.addEventListener("input", function () {
        wavepoint.frequency=freqInput.value;
        if (selectedwrect===div) {
          propinput1.value=freqInput.value;
        }
    });
        
      const ampInput = document.createElement("input");
      // ampInput.type = "number";
      ampInput.placeholder = "Amplitude (0-1)";
      ampInput.className="ampinput waveinp"
      // ampInput.min = "0";
      // ampInput.max = "1";
      // ampInput.step = "0.01";
      ampInput.value = "0.1";
         ampInput.addEventListener("input", function () {
        wavepoint.amplitude=ampInput.value;
        if (selectedwrect===div) {
          propinput2.value=ampInput.value;
        }
    });
    paninput.addEventListener("input",()=>{
      wavepoint.pan=paninput.value;
    })
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.innerText = "X";
      const utilbtn = document.createElement("button");
      utilbtn.className = "util-btn";
      utilbtn.innerText = "E";
      const addmod=document.createElement("button");
      addmod.className="addmodbtn";
      addmod.innerText="+Modifier";
        const waveform=document.createElement("select");   
        waveform.className="wformselect"
        const options=[["sine","Sine"],["sawtooth","Sawtooth"],["square","Square"],["triangle","Triangle"],["whitenoise","White noise"]];
        options.forEach(o => {
            const op=document.createElement("option");
            op.value=o[0]
            op.text=o[1]
            waveform.appendChild(op)
        })
        waveform.addEventListener("change",function() {
            const val=this.value;
            wavepoint.waveform=val;
            
        });

      removeBtn.onclick = () => {
        container.removeChild(div);
        waveformdata.splice(waveformdata.indexOf(wavepoint),1);
      }
        div.appendChild(removeBtn);
        div.appendChild(utilbtn);
        div.appendChild(waveform);
      div.appendChild(freqInput);
      div.appendChild(ampInput);
      div.appendChild(paninput)
      div.appendChild(addmod)
      addmod.onclick=() => {
        createModifier(div,wavepoint,"multiply");
      }
      utilbtn.onclick=()=>{
        selectedwave=wavepoint;
        selectedwrect=div;
        for (let c of container.children) {
          c.classList.remove("selectedWE")
        }
        div.classList.add("selectedWE");

        propinput1.value=wavepoint.frequency;
        propinput2.value=wavepoint.amplitude;
      }
      
      return div;
    }

    function addvariable() {
          const div = document.createElement("div");
      div.className = "var-rect";
      let varph="a"
      const varpp="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
      while (varph in variables) {
        if (varph.slice(-1)=="z") {
            varph=varph.slice(0,-1)+"aa"
        } else {
            varph=varph.slice(0,-1)+varpp[varpp.indexOf(varph.slice(-1))+1]
        }
        
        
      }
      const remove = document.createElement("button");
      remove.className = "remove-btn";
      remove.innerText = "X";
        const vname=document.createElement("input")
        vname.type="text"
        vname.className="var-name-input"
        vname.value=varph

        const vvalue=document.createElement("input");
        vvalue.type="text"
        vvalue.className="var-value-input"
        vvalue.value="1"
        const editbtn = document.createElement("button");
      editbtn.className = "util-btn";
      editbtn.innerText = "E";
      editbtn.style.display="none"
        const vtype=document.createElement("select");
        const vo1=document.createElement("option");
        vo1.value="expression"
        vo1.text="Expression"
        const vo2=document.createElement("option");
        vo2.value="modulator"
        vo2.text="Graphed Mod"
        vtype.value="expression"
        div.dataset.info=""
        vtype.addEventListener("change",()=>{ 
          const inf=div.dataset.info;
            div.dataset.info=vvalue.value;
            vvalue.value=inf;
          if (vtype.value=="expression") {
            editbtn.style.display="none"
            
          } else {
            editbtn.style.display="inline-block"
            if (!inf || inf.slice(0,2)!="g!") {
              vvalue.value="g!"+vvalue.value;
            }
            
          }
        })
        

        variables[varph]="1"
        div.appendChild(remove);
        div.appendChild(editbtn);
        div.appendChild(vname);
        div.appendChild(vvalue);
        div.appendChild(vtype)
        vtype.appendChild(vo1);
        vtype.appendChild(vo2);
        vname.dataset.originalvalue=varph
        vname.addEventListener("input",function() {
            delete variables[vname.dataset.originalvalue];
            vname.dataset.originalvalue=vname.value;
            variables[vname.value]=vvalue.value;
        });
        let tempv=""
        vvalue.addEventListener("input",function() {
            const tv=tempv;
            variables[vname.value]=vvalue.value;
            //console.log(variables)
            const inf=vvalue.value;
            const b1=inf && inf.slice(0,2)=="g!"
            const b2=vtype.value=="modulator"
            if (b1!=b2) {
              vvalue.value=tv;
            }
            tempv=vvalue.value;
        });
        editbtn.addEventListener("mousedown",()=>{
          currentvvalfield=vvalue;
          currentmodvar=vname.value;
          loadmodcanvas(vname.value,vvalue.value.slice(2))
          for (let c of varcont.children) {
          c.classList.remove("selectedWE")
         }
         div.classList.add("selectedWE");
        })
        remove.onclick=function () {
            varcont.removeChild(div);
            delete variables[varph];
        }
        return div
    }


    function createModifier(element,wave,typeo) {

      const div = document.createElement("div");
      div.className = "wr-modifier";
      const mod={type: typeo,start: "0", end: "10", step: "1", var: "a"}
        wave.modifiers.push(mod)
      const fromtx = document.createElement("input");
      fromtx.type = "text";
      fromtx.placeholder = "From";
      fromtx.className="mfromtx"
      fromtx.value = "0";

      const totx = document.createElement("input");
      totx.type = "text";
      totx.placeholder = "To";
      totx.className="mtotx"
      
      totx.value = "10";
         const steptx = document.createElement("input");
      steptx.type = "text";
      steptx.placeholder = "Step";
      steptx.className="msteptx"
      const vartx=document.createElement("input");
      vartx.type="text";
      vartx.placeholder="Var";
      vartx.value="a"
      vartx.className="mvartx"
      steptx.value = "1";
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.innerText = "X";
      removeBtn.onclick = () => {
        element.removeChild(div);
        wave.modifiers.splice(wave.modifiers.indexOf(mod),1);

      }
        div.appendChild(removeBtn);
      div.appendChild(fromtx);
      div.appendChild(totx);
      div.appendChild(steptx);
      div.appendChild(vartx);

        fromtx.addEventListener("input",function() {
            mod.start=fromtx.value;
        });
        totx.addEventListener("input",function() {
            mod.end=totx.value;

        })
        steptx.addEventListener("input",function() {
            mod.step=steptx.value;
        })
        vartx.addEventListener("input",function() {
            mod.var=vartx.value;
            //console.log(waveformdata);
        })
        //console.log(waveformdata);





      element.appendChild(div);
      
      return div;
    }
    addBtn.onclick = () => {
      container.appendChild(createWaveElement());
    };
    addvarb.onclick=()=>{
        varcont.appendChild(addvariable())
    }

    
    let node;
    let srcnode;
    async function start() {
        
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        await audioCtx.audioWorklet.addModule("/static/audiorun.js");

        node = new AudioWorkletNode(audioCtx, "waveprocessor");
        node.connect(audioCtx.destination);

        // Send initial data
        const evaluated = getrawwaves(gtime);
        //console.log(getrawwaves(gtime))
        //console.log(playing)
        node.port.postMessage({ waves: evaluated ,playing:playing});

        // Start updating t every second
        setInterval(() => {
            gtime += 0.1;
            const evaluated = getrawwaves(gtime);
            node.port.postMessage({ waves: evaluated ,playing:playing});

////

           

        }, 100);
    }



let buffercache=null
let bufferstart=0
let bufferend=0
let pphases=[]
export async function start2(play=false,idx=0) {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const startTime = Number(timesttxt.value);
    const endTime = Number(timeend.value);
    console.log(waveformdata)

   let buffer=await generateAudioBuffer(audioContext, startTime, endTime,waveformdata,variables,Number(blocksizetxt.value),pphases)
    buffercache = buffer[0];

    bufferstart=startTime;
    bufferend=endTime;
    pphases=buffer[1]
  
    if (play==true) {
       sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = buffer[0];
    sourceNode.connect(audioContext.destination);
    sourceNode;
    voices[idx]=sourceNode;
    sourceNode.start()
    }
    console.log(voices)
    
}
startBtn.onclick=()=>{
  console.log(waveformdata);
  start2();
}





playBtn.onmousedown = playBtn.ontouchstart = () => {
//   if (audioCtx) {
// console.log(audioCtx);
//   //const currentTime = audioCtx.currentTime;
//   playing=true
//   }
if (buffercache) {
  sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = buffercache;
    sourceNode.connect(audioContext.destination);
    sourceNode;
    sourceNode.start()
}

    // if (srcnode) {
    //   srcnode.start();
    // }

};

playBtn.onmouseup = playBtn.onmouseleave = playBtn.ontouchend = () => {
  if (audioCtx) {
    //const stopTime = audioCtx.currentTime;

  playing=false
  }
  
  
};