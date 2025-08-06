// 
import {parsemath,globalvars} from "./audiorun.js"
import {variables} from "./scripts/client1.js"
function mclamp(a,l,h) {
  return Math.min(Math.max(a,l),h)
}

function timeparams(params,t) {
    
    const cparams=structuredClone(params)
    for (let k in cparams) {
       
        cparams[k]=parsemath(String(cparams[k]).replace("e!",""),{...variables,...{"t":`${String(t)}`},...globalvars},[],true)
        
        
    }
    
    return cparams
}
const module={
    "effectparams":{
        "gain":{
            "label":"Decibel Gain",
            "params":[{"name":"Gain (dB)","placeholder":"-100 - 20","id":"gain"}]
        },
        "hardclip":{
            "label":"Hard Clipping",
            "params":[{"name":"Pre-Gain (Factor)","id":"pregain"},{"name":"Threshold (0-1)","id":"threshold"},{"name":"Post-Gain (Factor)","id":"postgain"}]
        },
        "absgain":{
            "label":"Absolute Gain",
            "params":[{"name":"Gain (Factor)","id":"gain"}]
        },
        "downsample":{
            "label":"Downsample",
            "params":[{"name":"Rate Reduction",id:"rate"},{name:"Bit Depth",id:"bitdepth"},{name:"Dry/Wet",id:"dryratio"}]
        },
        "nlwarp":{
            "label":"Nonlinear Warp",
            params:[{name:"Addend",id:"add"}]
        },
        "speed":{
            "label":"Speed Multiply",
            params:[{name:"Factor",id:"factor"}]
        },
        "smtpitch":{
            "label":"Speed by Semitone",
            params:[{name:"Offset (smt)",id:"offset"}]
        },
    },

    effects:{
        "gain":function(samples,params,starttime,samplerate,blocksize) {
            let params2=structuredClone(params)
            for (let i=0;i<2;i++) {
                for (let s=0;s<samples[i].length;s++) {
                    
                    if (s%blocksize==0) {
                        params2=timeparams(params,starttime+s/samplerate)
                        
                    }
                    
                    samples[i][s]*=10**(params2.gain/20)
                }
            }
            return samples;
    },
    "hardclip":function(samples,params,starttime,samplerate,blocksize) {
        for (let i=0;i<2;i++) {
                for (let s=0;s<samples[i].length;s++) {
                    if (s%blocksize==0) {
                        params=timeparams(params,starttime+i/samplerate)
                    }
                    const o=samples[i][s]
                    samples[i][s]=mclamp(o*params.pregain,0,params.threshold)*params.postgain
                }
            }
        return samples;
    },
    "absgain":function(samples,params,starttime,samplerate,blocksize) {
        for (let i=0;i<2;i++) {
                for (let s=0;s<samples[i].length;s++) {
                    if (s%blocksize==0) {
                        params=timeparams(params,starttime+i/samplerate)
                    }
                    
                    samples[i][s]*=params.gain;
                }
            }
        return samples;
    },
    "downsample":function(samples,params,starttime,samplerate,blocksize) {
        const lvls=2**params.bitdepth
        let sampleval=0
        for (let i=0;i<2;i++) {
                for (let s=0;s<samples[i].length;s++) {
                    if (s%blocksize==0) {
                        params=timeparams(params,starttime+i/samplerate)
                    }
                    const osa=samples[i][s]
                    if (s%params.rate==0) {
                        sampleval=osa
                    }
                    const quant=Math.round(sampleval*(lvls/2))/(lvls/2);
                    samples[i][s]=(osa*(params.dryratio))+(quant*(1-params.dryratio));
                    
                }
            }
        return samples;
    },
    "nlwarp":function(samples,params,starttime,samplerate,blocksize) {
        const lvls=2**params.bitdepth
        let sampleval=0
        for (let i=0;i<2;i++) {
                for (let s=0;s<samples[i].length;s++) {
                    if (s%blocksize==0) {
                        params=timeparams(params,starttime+i/samplerate)
                    }
                    if (samples[i][s]>0) {
                        samples[i][s]+=params.add
                    } else if (samples[i][s]<0) {
                        samples[i][s]-=params.add
                    }
                    
                    
                }
            }
        return samples;
    },
    
    "speed":function(samples,params,starttime,samplerate,blocksize) {
        
        let sampleval=0
        let psamples;
        if (Math.abs(params.factor)>=1){
            psamples=samples;
        }else {
            psamples=structuredClone(samples)
        }
            
        for (let i=0;i<2;i++) {
                for (let s=0;s<samples[i].length;s++) {
                    if (s%blocksize==0) {
                        params=timeparams(params,starttime+i/samplerate)
                    }
                    let idx=0
                    if (params.factor>0) {
                        idx=Math.floor(s * params.factor) // for speed
                    } else {
                        idx=Math.floor(samples[i].length-Math.abs(s*params.factor)-1)
                    }
                    
                    

                    if (idx<psamples[i].length) {
                        if (s>=psamples[i].length) {
                            samples[i].push(psamples[i][idx])
                        } else {
                            samples[i][s]=psamples[i][idx]
                        }

                        
                    } else {
                        samples[i][s]=0
                    }
                    
                    
                    
                }
            }
        return samples;
    },
    "smtpitch":function(samples,params,starttime,samplerate,blocksize) {
        
        let sampleval=0
        let psamples;
        if (params.factor<0){
            psamples=samples;
        }else {
            psamples=structuredClone(samples)
        }
        for (let i=0;i<2;i++) {
                for (let s=0;s<samples[i].length;s++) {
                    if (s%blocksize==0) {
                        params=timeparams(params,starttime+i/samplerate)
                    }
                    let idx = Math.max(0, Math.floor(s * (2 ** (params.offset / 12)))) // for smtpitch

                    if (idx<psamples[i].length) {
                         if (s>=psamples[i].length) {
                            samples[i].push(psamples[i][idx])
                        } else {
                            samples[i][s]=psamples[i][idx]
                        }

                    } else {
                        samples[i][s]=0
                    }
                    
                    
                    
                }
            }
        return samples;
    },
    }
    
}
for (let k in module.effectparams) {
    module.effectparams[k].params.unshift({"name":"ID","placeholder":"Unique identifier","id":"id"})
}
export {module}


















//function mclamp(a,l,h) {
//   return Math.min(Math.max(a,l),h)
// }
// function module(type,samples,params) {
//     switch(type) {
//         case "gain":
//             for (let i=0;i<2;i++) {
//                 for (let s=0;s<samples[i].length;s++) {
//                     samples[i][s]*=10**(params.gain/20)
//                 }
//             }
//             return samples;
            
//         case "hardclip":
//             for (let i=0;i<2;i++) {
//                 for (let s=0;s<samples[i].length;s++) {
//                     const o=samples[i][s]
//                     samples[i][s]=mclamp(o+params.pregain,0,params.threshold)+params.postgain
//                 }
//             }
//     }
// }

// export {module}
