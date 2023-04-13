const disp = document.getElementById("disp");

var language = (window.navigator.languages && window.navigator.languages[0]) ||
            window.navigator.language ||
            window.navigator.userLanguage ||
            window.navigator.browserLanguage;
//console.log(language);

const speech = new SpeechSynthesisUtterance();
speech.lang = language;

var startFlg = false;
const playIcon = document.getElementById("playIcon");
function start(){
  if(params.apiKey == ""){
    alert("ApiKeyが未設定のため開始できません");
    return false;
  }
  if(!startFlg){
    startFlg = true;
    let theme = document.getElementById("theme");
    if(theme.value){
      resGPT(theme.value);
    }else{
      reqGpt();
    }
    playIcon.src = "img/pause.png";
    document.getElementById("themeDiv").style.display = "none";
    if(sendArray[1].length == 0){
      gtag('event', 'discusssionStart', {'event_category': 'discusssionStart'});
    }
  }else{
    startFlg = false;
    playIcon.src = "img/play.png";
    speakOn(0);
  }
}

var gptNo = 0;
var usagetoken = 0;
function resGPT(_interimTranscript, token=null){
  speakOn(1, _interimTranscript);
  if(gptNo == 0){
    var content = '<div class="yourMessage px-3 mb-2">';
    content += '<div class="yourName" style="text-align:end;">' + params.dispName_0 + '</div>';
    content += '<div class="yourMessage_t">';
  }else{
    var content = '<div class="celebrityMessage px-3 mb-2">';
    content += '<div class="celebrityName">' + params.dispName_1 + '</div>';
    content += '<div class="celebrityMessage_t">';
  }
  content += _interimTranscript.replace(/\n/g, "<br>");
  content += '</div>';
  content += '</div>';
  disp.innerHTML += content;
  if(token){
    usagetoken += token.total_tokens;
    let dollar = 0.002 * usagetoken / 1000;
    let ut = '<div style="text-align:end;"><a href="https://platform.openai.com/account/usage" target="_blank">Usage token</a>';
    ut += ': '+usagetoken+' ($'+dollar.toFixed(6)+')</div>';
    document.getElementById("usageToken").innerHTML = ut;
    console.log('Usage token: '+usagetoken+' ($'+dollar.toFixed(6)+')');
  }
  document.getElementById("waitIcon").style.display = "none";
  document.getElementById("content_inner").scrollIntoView(false);
}


var speakIcon = document.getElementById("speakIcon");
function speakOn(force, _text=null){
  if(force == 1){
    if(speechSynthesis.speaking){
      speechSynthesis.cancel();
    }
    if(gptNo == 0){
      speech.rate = parseInt(params.speechRate);
      speech.pitch = parseInt(params.speechPitch);
    }else{
      speech.rate = parseInt(params.speechRate_1);
      speech.pitch = parseInt(params.speechPitch_1);
    }
    speech.text = _text;  
    speechSynthesis.speak(speech);    
  }else if(force == 0){
    speechSynthesis.cancel();
    speakIcon.src = "img/speaker.png";
    startFlg = false;
    playIcon.src = "img/play.png";
  }
}
speech.addEventListener("start", (event) => { speakIcon.src = "img/speaker_gr.gif"; });
speech.addEventListener("end", (event) => { 
  speakIcon.src = "img/speaker.png";
  if(startFlg){
    reqGpt();
  }
});

var sendArray = [[],[]];
var resArray = [[],[]];
var firstArray = [[],[]];
function reqGpt(){
  if(sendArray[gptNo].length == params.endCount){
    startFlg = false;
    playIcon.src = "img/play.png";
    return false;
  }
  document.getElementById("waitIcon").style.display = "";
  let _interimTranscript = resArray[gptNo][resArray[gptNo].length-1];
  if(!_interimTranscript){
    _interimTranscript = document.getElementById("theme").value;
    firstArray[gptNo][0] = _interimTranscript;
    document.getElementById("theme").value = "";
  }
  gptNo = (gptNo == 0) ? 1 : 0;
  var end = "";
  if(sendArray[gptNo].length == params.endCount - 1){
    end = "。この回で対話を終了します。";
  }
  var messages = [];
  if(gptNo == 0 && params.character_0){
    messages.push({'role': 'system', 'content': params.character_0 + end});
  }
  if(gptNo == 1 && params.character_1){
    messages.push({'role': 'system', 'content': params.character_1 + end});
  }
  if(firstArray[gptNo][0]){
    messages.push({'role': 'assistant', 'content': firstArray[gptNo][0] });
  }
  var i = sendArray[gptNo].length - parseInt(params.history);
  if(i < 0){ i = 0; }
  for(i; i<sendArray[gptNo].length; i++){
      messages.push({'role': 'user', 'content': sendArray[gptNo][i] });
      messages.push({'role': 'assistant', 'content': resArray[gptNo][i] });
  }
  messages.push({'role': 'user', 'content': _interimTranscript });
  console.log(messages);
  if(gptNo == 0){
    var temp = parseInt(params.temperature_0);
  }else{
    var temp = parseInt(params.temperature_1);
  }
  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + params.apiKey,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      //model: "gpt-4",
      messages: messages,
      max_tokens: parseInt(params.maxToken),
      temperature: temp,
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    //console.log(data.choices[0].message.content);
    //console.log(data.usage.total_tokens);
    if(data.error){
      alert("=error=\n"+data.error.message);
    }else{
      let res = data.choices[0].message.content;
      resGPT(res, data.usage);
      sendArray[gptNo].push(_interimTranscript);
      resArray[gptNo].push(res);
    }
  })
  .catch(error => {
    console.error(error);
  });
}

function restart(){
  disp.innerHTML = "";
  gptNo = 0;
  usagetoken = 0;
  document.getElementById("usageToken").innerHTML = "";
  sendArray = [[],[]];
  resArray = [[],[]];
  firstArray = [[],[]];
  document.getElementById("themeDiv").style.display = "";
  startFlg = false;
  playIcon.src = "img/play.png";
}

var paramsDef = {doui:false, speechRate:1, speechPitch:1, speechRate_1:1, speechPitch_1:1, modeSel:"settingBtn",
  character_0:"", temperature_0:1, character_1:"", temperature_1:1, maxToken:250, history:3, endCount:5,
  dispName_0:"ChatGPT_A", dispName_1:"ChatGPT_B"};//apiKey:"", 
var params = {};
let paramsDefKeys = Object.keys(paramsDef);
for(paramsDefKey of paramsDefKeys){
  params[paramsDefKey] = paramsDef[paramsDefKey];
}
if(localStorage.ubrainjp_GPT){
  let paramsLs = JSON.parse(localStorage.ubrainjp_GPT);
  let paramsLsKeys = Object.keys(paramsLs);
  for(paramsLsKey of paramsLsKeys){
    params[paramsLsKey] = paramsLs[paramsLsKey];
  }
}
//console.log(!localStorage.ubrainjp_GPT);
function setParams(_this){
  if(_this.type == "checkbox"){
    params[_this.id] = _this.checked;
  }else{
    params[_this.id] = _this.value;
  }
  onParams();
}
function onParams(dafault=false){
  if(dafault){
    let paramsDefKeys = Object.keys(paramsDef);
    for(paramsDefKey of paramsDefKeys){
      params[paramsDefKey] = paramsDef[paramsDefKey];
    }
  }
  let paramsKeys = Object.keys(params);
  for(paramsKey of paramsKeys){
    if(paramsKey != "modeSel"){
      var dom = document.getElementById(paramsKey);
      if(dom.type == "checkbox"){
        dom.checked = params[paramsKey];
      }else if(dom.options){
        let options = dom.options;
        for (let option of options) {
          if(option.value == params[paramsKey]) option.selected = true;
        }
      }else if(params[paramsKey] != ""){
        dom.value = params[paramsKey];
      }
    }
  }
  localStorage.ubrainjp_GPT = JSON.stringify(params);
  //console.log(params);
}
onParams();

function modeSel(_this){
  document.querySelectorAll(".naviItem").forEach(element => {
    element.classList.remove("btn-primary");
    element.classList.add("btn-light");
  });
  _this.classList.remove("btn-light");
  _this.classList.add("btn-primary");
  if(_this.id == "discussionBtn"){
    document.getElementById("content").style.display = "";
    document.getElementById("setting").style.display = "none";
  }else if(_this.id == "settingBtn"){
    document.getElementById("content").style.display = "none";
    document.getElementById("setting").style.display = "";
  }
  params.modeSel = _this.id;
  localStorage.ubrainjp_GPT = JSON.stringify(params);
}
modeSel(document.getElementById(params.modeSel));

function apiKeyClear(){
  document.getElementById("apiKey").value = "";
  params.apiKey = "";
  localStorage.ubrainjp_GPT = JSON.stringify(params);
}

function douiCheck(){
  if(!params.doui){
    document.getElementById("doui").focus();
    alert("利用規約に同意してください");
  }
}

window.addEventListener('load', function(){
  $('.share-btn').ShareLink({
    title: 'Discussion GPT',
    text: 'ChatGPT同士でディスカッションするアプリ',
    url: 'https://ubrainjp.github.io/discussiongpt',
    class_prefix: 's_'
  });
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/discussiongpt/serviceWorker.js',
       { scope: '/discussiongpt/' })
  .then(function(reg) {
    console.log('serviceWorker:' + reg.scope);
  }).catch(function(error) {
    console.log('serviceWorker:' + error);
  });
}

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-X4LWD58EYT');


