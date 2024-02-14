window.AudioContext = window.AudioContext || window.webkitAudioContext;
class classCordApp{
  
  constructor(){
    this.url = "https://dl.dropboxusercontent.com/s/hlhrfp2ffjkb0kj/pianosound.mp3"
    this.audioCtx = new AudioContext();
    this.gain = this.audioCtx.createGain();
    this.gain.gain.value = 2;
    this.gain.connect(this.audioCtx.destination);
    this.soundBuf = null;
    this.source = [];
    this.endTime = -1;
    this.nowPlay = [];
    this.note = [0];
    this.leng = 0.667;
    this.beats = 1;
    this.nowBeat = 1;
    this.degState = 0;
    this.keysState = 6;
    this.keys = 0;
    this.maxNotes = 4;
  }
  
  getSound(){
    var request = new XMLHttpRequest();
    request.open("GET", this.url, true);
    request.responseType = "arraybuffer";
    request.onload = function(){
      cordApp.audioCtx.decodeAudioData(request.response, function (buf) {
        cordApp.soundBuf = buf;
        //console.log("sound-decodeed");
        document.querySelectorAll(".enable").forEach(function(e){
          e.style.display = "none";
        });
      }, onerror);
    };
    request.send();
    //console.log("sound-loaded");
  }
  
  play(){
    var startTime, currentTime;
      currentTime = this.audioCtx.currentTime;
      if(this.endTime < currentTime){
        startTime = currentTime;
        this.endTime = startTime + this.leng;
        this.nowBeat = 1;
      }else{
        startTime = this.endTime;
        this.endTime += this.leng;
        this.nowBeat += 1;
      }
    for(var i in this.note){
      this.source[this.source.length] = this.audioCtx.createBufferSource();
      this.source.slice(-1)[0].buffer = this.soundBuf;
      //source.connect(this.audioCtx.destination);
      this.source.slice(-1)[0].connect(this.gain);
      this.source.slice(-1)[0].start(startTime, this.note[i]*2, this.leng);
      //source.stop(this.endTime);
      if(i==0){
        this.source.slice(-1)[0].onended = function(e){ 
          cordApp.nowPlay.shift();
          cordApp.nowPlaying();
        }
      }
    } 
    if(this.beats>1){
      this.source[this.source.length] = this.audioCtx.createBufferSource();
      this.source.slice(-1)[0].buffer = this.soundBuf;
      //source.connect(this.audioCtx.destination);
      this.source.slice(-1)[0].connect(this.gain);
      this.source.slice(-1)[0].start(startTime, (40-1+this.nowBeat)*2, this.leng);
    }
    if(this.nowBeat==this.beats){ this.nowBeat = 0 }
    //console.log("play()");
  }
  
  enable(beat,tmp,deg,key){
    document.querySelectorAll(".enable").forEach(function(e){
      e.innerHTML = "Loading...";
    });
    this.getSound();
    if(beat){ this.beatsf(beat); }
    if(tmp){ this.tempo(tmp); }
    if(deg){ this.degChange(deg); }
    if(key){ this.keyChange(key[0],key[1]); }
  }
  
  beatsf(number){
    var beatBtn = document.querySelector("#beats .selected");
    beatBtn.classList.remove("selected");
    var beatBtn = document.querySelectorAll("#beats input");
    beatBtn[number-1].classList.add("selected");
    this.beats = number;
  }
  
  tempo(bpm){
    this.leng = Math.round(1000 / (bpm / 60)) / 1000;
    document.querySelector("#bpm").innerHTML = bpm; 
    //console.log("tempo():"+this.leng+":"+bpm);
  }
  
  cordBtnClick(obj, maxN){
    //console.log("mousedown");
    if(this.soundBuf){
      if(!maxN && this.nowPlay.length>this.maxNotes){ return; }
      document.querySelectorAll(".cordBtn .selected").forEach(function(e){
        e.classList.remove("selected");
      });
      obj.classList.add("selected");
      this.note = this.cord(obj.id.split(",")[0]);
      var cordSym = obj.innerHTML;
      if(this.note){
        for(var i=0;i<this.beats;i++){
          this.nowPlay.push(cordSym);
          this.play();
        }
      }
      this.nowPlaying();
    }
  }
  
  sequence(eleNo, data){
    if(this.soundBuf){
      var sequ = document.querySelectorAll(".sequence button");
      if(sequ.length===0){
        var sequ = document.querySelectorAll(".sequence input");
      }
      if(sequ[eleNo].classList.contains("selected")){
        this.stop();
        return 0;
      }
      if(document.querySelector(".sequence .selected")){
        return 0;
      }
      sequ[eleNo].classList.add("selected");
      if(data.indexOf(":")<0){
        var datas = data.split("/");
      }else{
        var datas = data.split(":");
      }
      var cordBtn = document.querySelectorAll(".cordBtnTd");
      for(var datax of datas){
        for(var i in cordBtn){
          if(cordBtn[i].id==datax){
            this.cordBtnClick(cordBtn[i], 1);
            break;
          }
        }
      }
      var cordBtn = document.querySelector(".cordBtn .selected");
      if(cordBtn){ cordBtn.classList.remove("selected"); }
    }
  }
  
  nowPlaying(){
    var nowPlay = document.querySelector("#nowPlaying");
    if(this.nowPlay.length==0){
      nowPlay.innerHTML = "";
      this.source = [];
      document.querySelectorAll(".cordBtn .selected").forEach(function(e){
        e.classList.remove("selected");
      });
      document.querySelectorAll(".sequence .selected").forEach(function(e){
        e.classList.remove("selected");
      });
    }else{
      this.nowPlay[0] = "<font color='red'><b>" + this.nowPlay[0] + "</b></font>";
      nowPlay.innerHTML = this.nowPlay;
    }
  }

  stop(){
    for(var x of this.source){ x.stop(); }
    this.endTime = this.audioCtx.currentTime;
  }
  
  cord(sym){
    var noteMap = {
      "F1":0,"F#1":1,"Gb1":1,
      "G1":2,"G#1":3,"Ab1":3,
      "A1":4,"A#1":5,"Bb1":5,
      "B1":6,"B#1":7,"Cb2":6,
      "C2":7,"C#2":8,"Db2":8,
      "D2":9,"D#2":10,"Eb2":10,
      "E2":11,"E#2":12,"Fb2":11,
      "F2":12,"F#2":13,"Gb2":13,
      "G2":14,"G#2":15,"Ab2":15,
      "A2":16,"A#2":17,"Bb2":17,
      "B2":18,"B#2":19,"Cb3":18,
      "C3":19,"C#3":20,"Db3":20,
      "D3":21,"D#3":22,"Eb3":22,
      "E3":23,"E#3":24,"Fb3":23,
      "F3":24,"F#3":25,"Gb3":25,
      "G3":26,"G#3":27,"Ab3":27,
      "A3":28,"A#3":29,"Bb3":29,
      "B3":30,"B#3":31,"Cb4":30,
      "C4":31,"C#4":32,"Db4":32,
      "D4":33,"D#4":34,"Eb4":34,
      "E4":35,"E#4":36,"Fb4":35,
      "F4":36,"F#4":37,"Gb4":37,
      "G4":38,
    };

    var cordManufacture = {
      "":[0,12,12+4,12+7,""],"7":[0,"",12+4,12+7,12+10],"M7":[0,"",12+4,12+7,12+11],
      "+5":[0,12,12+4,12+8,""],"M7+5":[0,"",12+4,12+8,12+11],
      "+":[0,12,12+4,12+8,""],"M7+":[0,"",12+4,12+8,12+11],
      "m":[0,12,12+3,12+7,""],"m7":[0,"",12+3,12+7,12+10],"mM7":[0,"",12+3,12+7,12+11],
      "m-5":[0,12,12+3,12+6,""],"m7-5":[0,"",12+3,12+6,12+10],"∅":[0,"",12+3,12+6,12+10],
      "dim7":[0,"",12+3,12+6,12+9],"°":[0,"",12+3,12+6,12+9],
      "sus4":[0,12,12+5,12+7,""],"7sus4":[0,"",12+5,12+7,12+10],"M7sus4":[0,"",12+5,12+7,12+11],
    }
    
    var noteShift = {"Cb":6,"C":7,"C#":8,"Db":8,"D":9,"D#":10,
                     "Eb":10,"E":11,"E#":12,"Fb":11,"F":12,"F#":13,
                     "Gb":13,"G":14,"G#":15,"Ab":15,"A":16,"A#":17,
                     "Bb":17,"B":18,"B#":19,}
    
    if(sym.slice(0,1)=="!"){
      var returnCode = sym.slice(1).split("-");
      for(var i in returnCode){
        returnCode[i] = noteMap[returnCode[i]] + this.keys;
      }
    }else{
      sym = sym.split("/");
      if(sym[0].indexOf("#")>-1 || sym[0].indexOf("b")>-1){
        var symSpl = [sym[0].slice(0,2), sym[0].slice(2)];
      }else{
        var symSpl = [sym[0].slice(0,1), sym[0].slice(1)];
      }
      var returnCode = cordManufacture[symSpl[1]];
      if(sym[1]){
        if(sym[1]<4){
          if(sym[0].indexOf("7")<0){
            returnCode[0] = "";
          }else{
            returnCode[0] += 12;
          }
          returnCode[Number(sym[1])+1] -=12;
          returnCode.sort((a,b)=>{return a-b});
        }else{
          returnCode[0] = noteShift[sym[1]] - 7;
        }
      }
      returnCode = returnCode.filter(function(s){return s !== "";});
      for(var i in returnCode){
        returnCode[i] += noteShift[symSpl[0]] + this.keys;
      }
      if(returnCode[0]<4){ returnCode[0]+=12; }
      if(returnCode[0]>15){ returnCode[0]-=12; }
      for(var i=1;i<returnCode.length;i++){
        if(returnCode[i]<17){ returnCode[i]+=12; }
        if(returnCode[i]>28){ returnCode[i]-=12; }
      }
    }
    return returnCode;
  }
  
  degChange(degFlg){
    var deg = document.querySelector("#degreeChange .selected");
    deg.classList.remove("selected");
    var deg = document.querySelectorAll("#degreeChange td");
    deg[degFlg].classList.add("selected");
    this.degState = degFlg;
    if(degFlg>0){
      var arrayDeg = [
        ["Cb","bⅠ","bbⅢ"],["C#","#Ⅰ","Ⅲ"],["C","Ⅰ","bⅢ"],
        ["Db","bⅡ","bⅣ"],["D#","#Ⅱ","#Ⅳ"],["D","Ⅱ","Ⅳ"],
        ["Eb","bⅢ","bⅤ"],["E#","#Ⅲ","#Ⅴ"],["E","Ⅲ","Ⅴ"],
        ["Fb","bⅣ","bbⅥ"],["F#","#Ⅳ","Ⅵ"],["F","Ⅳ","bⅥ"],
        ["Gb","bⅤ","bbⅦ"],["G#","#Ⅴ","Ⅶ"],["G","Ⅴ","bⅦ"],
        ["Ab","bⅥ","bⅠ"],["A#","#Ⅵ","#Ⅰ"],["A","Ⅵ","Ⅰ"],
        ["Bb","bⅦ","bⅡ"],["B#","#Ⅶ","#Ⅱ"],["B","Ⅶ","Ⅱ"],
      ];
      var cordBtn = document.querySelectorAll(".cordBtn td");
      for(var x of cordBtn){
        if(x.id){
          var sDeg = x.getAttribute('sDeg');
          if(sDeg){
            if(degFlg==1){
              x.innerHTML = sDeg.split(",")[0];
            }else if(degFlg==2){
              x.innerHTML = sDeg.split(",").slice(-1)[0];
            }
          }else{
            var html = x.id.split(",").slice(-1)[0];
            for(var y of arrayDeg){
              html = html.replace(y[0],y[degFlg]);
            }
            x.innerHTML = html;
          }
        }
      }
    }else{
      this.keyChange(this.keysState, this.keys)
    }
  }

  keyChange(eleNo, keyShift){
    var cordBtn = document.querySelector(".cordBtn .selected");
    if(cordBtn){ cordBtn.classList.remove("selected"); }
    var keys = document.querySelector("#keys .selected");
    keys.classList.remove("selected");
    var keys = document.querySelectorAll("#keys td");
    keys[eleNo].classList.add("selected");
    this.keysState = eleNo;
    this.keys = keyShift;
    //console.log("keyChange():"+keyShift);
    if(this.degState==0){
      var keyArray = [
        ["C","D","E","F","G","A","B","F#","G#"],
        ["G","A","B","C","D","E","F#","C#","D#"],
        ["D","E","F#","G","A","B","C#","G#","A#"],
        ["A","B","C#","D","E","F#","G#","D#","E#"],
        ["E","F#","G#","A","B","C#","D#","A#","B#"],   
        ["B","C#","D#","E","F#","G#","A#","E#","F##"],
        ["Gb","Ab","Bb","Cb","Db","Eb","F","C","D"],
        ["Db","Eb","F","Gb","Ab","Bb","C","G","A"],
        ["Ab","Bb","C","Db","Eb","F","G","D","E"],
        ["Eb","F","G","Ab","Bb","C","D","A","B"],
        ["Bb","C","D","Eb","F","G","A","E","F#"],
        ["F","G","A","Bb","C","D","E","B","C#"],
        ["C","D","E","F","G","A","B","F#","G#"],
        ["G","A","B","C","D","E","F#","C#","D#"],
        ["D","E","F#","G","A","B","C#","G#","A#"],
        ["A","B","C#","D","E","F#","G#","D#","E#"],
        ["E","F#","G#","A","B","C#","D#","A#","B#"],   
        ["B","C#","D#","E","F#","G#","A#","E#","F##"],
        ["F#","G#","A#","B","C#","D#","E#","B#","C##"],
        ["Db","Eb","F","Gb","Ab","Bb","C","G","A"],
        ["Ab","Bb","C","Db","Eb","F","G","D","E"],
        ["Eb","F","G","Ab","Bb","C","D","A","B"],
        ["Bb","C","D","Eb","F","G","A","E","F#"],
        ["F","G","A","Bb","C","D","E","B","C#"],
        ["C","D","E","F","G","A","B","F#","G#"],
      ];
      var cordBtn = document.querySelectorAll(".cordBtn td");
      for(var x of cordBtn){
        if(x.id){
          var oKey = Number(x.getAttribute('oKey'));
          if(!oKey){ oKey = 0; }
          x.innerHTML = x.id.split(",").slice(-1)[0];
          for(var j=0;j<9;j++){
            x.innerHTML = x.innerHTML.replace(keyArray[12+oKey][j],["%"+j]);
          }
          for(var j=0;j<9;j++){
            x.innerHTML = x.innerHTML.replace(["%"+j],keyArray[eleNo+6+oKey][j])
              .replace("#b","").replace("b#","");
          }
        }
      }
    }
  }

  major2minor(obj){
    if(!obj){ obj = document.querySelector("#major2minor .selected"); }
    document.querySelectorAll("#major2minor .selected").forEach(function(e){
      e.classList.remove("selected");
    });
    obj.classList.add("selected");
    var cordBtnTr = document.querySelectorAll(".cordBtn tr");
    for(var x of cordBtnTr){
      for(var i=0;i<x.children.length;i++){
        x.children[i].classList.remove("dispNone");
        if((obj.id=="_0"&&(i==1||i==2)) || (obj.id=="_1"&&(i==8||i==9))){
          x.children[i].classList.add("dispNone");
        }
      }
    }
    document.querySelectorAll(".m-show th, .m-show td, .M-show th, .M-show td").forEach(function(e){
      e.classList.remove("bgGray");
    });
    if(obj.id=="_0"){
      document.querySelectorAll(".m-show th, .m-show td").forEach(function(e){
        e.classList.add("bgGray");
      });
    }else if(obj.id=="_1"){
      document.querySelectorAll(".M-show th, .M-show td").forEach(function(e){
        e.classList.add("bgGray");
      });
    }
    //this._save.classList.remove("disable");
    //this._load.classList.remove("disable");
  }

  triad2dia(obj){
    if(!obj){ obj = document.querySelector("#triad2dia .selected"); }
    document.querySelectorAll("#triad2dia .selected").forEach(function(e){
      e.classList.remove("selected");
    });
    obj.classList.add("selected");
    if(obj.id=="_triad"){
      document.querySelectorAll(".Triad").forEach(function(x){
        x.classList.remove("dispNone");});
      document.querySelectorAll(".Diatonic").forEach(function(x){
        x.classList.add("dispNone");});
    }else if(obj.id=="_dia"){
      document.querySelectorAll(".Triad").forEach(function(x){
        x.classList.add("dispNone");});
      document.querySelectorAll(".Diatonic").forEach(function(x){
        x.classList.remove("dispNone");});
    }else{
      document.querySelectorAll(".Triad").forEach(function(x){
        x.classList.remove("dispNone");});
      document.querySelectorAll(".Diatonic").forEach(function(x){
        x.classList.remove("dispNone");});
    }
  }
}//class classCordApp end//
var cordApp = new classCordApp();

function cordAppInitShow(){
  if(typeof ontouchstart !== "undefined"){
    var myClick = "ontouchstart";
  }else if(typeof onmousedown !== "undefined"){
    var myClick = "onmousedown";
  }else{
    var myClick = "onclick";
  }
  var cordBtn = document.querySelectorAll(".cordAppContent .cordBtn td");
  for(var i in cordBtn){
    if(cordBtn[i].id){
      cordBtn[i].classList.add("cordBtnTd");
      cordBtn[i].setAttribute(myClick,"cordApp.cordBtnClick(this);");
      cordBtn[i].innerHTML = cordBtn[i].id.split(",").slice(-1)[0];
    }
  }
}
function cordAppInitLoad(){
  var range = document.querySelector(".cordAppContent #tempo");
  range.setAttribute("min", 60);

  var enable = document.querySelector(".enable");
  var enab = enable.getAttribute('onclick');
  enab = enab.slice(enab.indexOf("(")+1,enab.indexOf(")"));
  enab = JSON.parse("[" + enab + "]");
  //enable.style.display = "block";
  cordApp.enable(enab[0],enab[1],enab[2],enab[3]);
  cordApp.major2minor();
  cordApp.triad2dia();
}

if(document.querySelector(".cordAppContent")){
  cordAppInitShow();
  cordAppInitLoad();
}

