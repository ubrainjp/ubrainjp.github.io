const disp = document.getElementById("disp");

var language = (window.navigator.languages && window.navigator.languages[0]) ||
            window.navigator.language ||
            window.navigator.userLanguage ||
            window.navigator.browserLanguage;
//console.log(language);

const SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = language;
recognition.interimResults = true;
//recognition.continuous = true;

const speech = new SpeechSynthesisUtterance();
speech.lang = language;

recognition.onresult = (event) => {
  const resultDiv = document.querySelector('#result-div');
  let interimTranscript = '';
  for (let i = event.resultIndex; i < event.results.length; i++) {
    let transcript = event.results[i][0].transcript;
    //console.log(i,event.results[i].isFinal,transcript);
    interimTranscript += transcript;
    if (event.results[i].isFinal) {
      recOn(0);
      var content = '<div class="yourMessage px-3 mb-2">';
      content += '<div class="yourName" style="text-align:end;">You</div>';
      content += '<div class="yourMessage_t">';
      content += interimTranscript;
      content += '</div></div>';
      disp.innerHTML += content;
      document.getElementById("waitIcon").style.display = "";
      document.getElementById("content_inner").scrollIntoView(false);
      if(params.testMode){
        setTimeout(resGPT, 1000, interimTranscript);
      }else{
        reqGpt(interimTranscript);
      }
      
      interimTranscript = '';
    }
    resultDiv.innerHTML = interimTranscript;
  }
}
recognition.onend = (event) => { recOn(0); };
recognition.onerror = (event) => { 
  console.error(event);
  if(event.error == "not-allowed"){
    alert("マイクの使用が許可されていません");
  }
};

function resGPT(_interimTranscript, token=null){
  speakOn(1, _interimTranscript);
  var content = '<div class="celebrityMessage px-3 mb-2">';
  content += '<div class="celebrityName">ChatGPT</div>';
  content += '<div class="celebrityMessage_t">';
  content += _interimTranscript.replace(/\n/g, "<br>");
  content += '</div>';
  if(token){
    let dollar = 0.002 * token.total_tokens / 1000;
    content += '<div style="text-align:end;"><a href="https://platform.openai.com/account/usage" target="_blank">Token</a>';
    content += ': Send '+token.prompt_tokens+',Receive '+token.completion_tokens+',';
    content += 'Total '+token.total_tokens+' ($'+dollar.toFixed(6)+')</div>';
  }
  content += '</div>';
  disp.innerHTML += content;
  document.getElementById("waitIcon").style.display = "none";
  document.getElementById("content_inner").scrollIntoView(false);
}

var micState = false;
function recOn(force){
  let micIcon = document.getElementById("micIcon");
  if((!micState && force == 3) || force == 1){
    if(speechSynthesis.speaking){
      speakOn(0);
    }
    if(micState){
      recognition.abort();
    }
    recognition.start();
    micState = true;
    micIcon.src = "img/mic_gr.gif";
  }else if((micState && force == 3) || force == 0){
    recognition.stop();
    micState = false;
    micIcon.src = "img/mic_gray.png";
  }
}

var speakIcon = document.getElementById("speakIcon");
function speakOn(force, _text=null){
  if(force == 1){
    if(speechSynthesis.speaking){
      speechSynthesis.cancel();
    }
    speech.rate = parseInt(params.speechRate);
    speech.pitch = parseInt(params.speechPitch);
    speech.text = _text;  
    speechSynthesis.speak(speech);    
  }else if(force == 0){
    speechSynthesis.cancel();
    speakIcon.src = "img/speaker.png";
  }
}
speech.addEventListener("start", (event) => { speakIcon.src = "img/speaker_gr.gif"; });
speech.addEventListener("end", (event) => { speakIcon.src = "img/speaker.png"; recOn(1); });

var sendArray = [];
var resArray = [];
function reqGpt(_interimTranscript){
  var messages = [];
  if(params.character){
    messages.push({'role': 'system', 'content': params.character});
  }
  var i = sendArray.length - parseInt(params.history);
  if(i < 0){ i = 0; }
  for(i; i<sendArray.length; i++){
      messages.push({'role': 'user', 'content': sendArray[i] });
      messages.push({'role': 'assistant', 'content': resArray[i] });
  }
  messages.push({'role': 'user', 'content': _interimTranscript });
  console.log(messages);
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
      temperature: parseInt(params.temperature),
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    //console.log(data.choices[0].message.content);
    //console.log(data.usage.total_tokens);
    if(data.error){
      resGPT(data.error.message);
    }else{
      let res = data.choices[0].message.content;
      resGPT(res, data.usage);
      sendArray.push(_interimTranscript);
      resArray.push(res);
    }
  })
  .catch(error => {
    console.error(error);
  });
}

function restart(){
  disp.innerHTML = "";
  sendArray = [];
  resArray = [];
}

var paramsDef = {speechRate:1, speechPitch:1, modeSel:"testModeBtn", testMode:true, 
  character:"", temperature:1, maxToken:250, history:3};//apiKey:"", 
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
  params[_this.id] = _this.value;
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
    if(paramsKey != "modeSel" && paramsKey != "testMode" ){
      var dom = document.getElementById(paramsKey);
      if(dom.options){
        let options = dom.options;
        for (let option of options) {
          if(option.value == params[paramsKey]) option.selected = true;
        }
      }else{
        dom.value = params[paramsKey];
      }
    }
  }
  localStorage.ubrainjp_GPT = JSON.stringify(params);
  //console.log(params);
}
onParams();

function modeSel(_this){
  if(_this.id == "chatModeBtn" && params.apiKey == ""){
    alert("ApiKeyが未設定のため開始できません");
    return false;
  }
  document.querySelectorAll(".naviItem").forEach(element => {
    element.classList.remove("btn-primary");
    element.classList.add("btn-light");
  });
  _this.classList.remove("btn-light");
  _this.classList.add("btn-primary");
  if(_this.id == "chatModeBtn"){
    document.getElementById("content").style.display = "";
    document.getElementById("setting").style.display = "none";
    params.testMode = false;
    recOn(1);
  }else if(_this.id == "testModeBtn"){
    document.getElementById("content").style.display = "";
    document.getElementById("setting").style.display = "none";
    params.testMode = true;
    recOn(1);
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

window.addEventListener('load', function(){
  $('.share-btn').ShareLink({
    title: 'Voicechat GPT',
    text: '音声Chatアプリ',
    url: 'https://ubrainjp.github.io/voicechat',
    class_prefix: 's_'
  });
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/ubrainjp.github.io/voicechat/serviceWorker.js',
       { scope: '/ubrainjp.github.io/voicechat/' })
  .then(function(reg) {
    console.log('serviceWorker:' + reg.scope);
  }).catch(function(error) {
    console.log('serviceWorker:' + error);
  });
}

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-782SJ4MN56');
