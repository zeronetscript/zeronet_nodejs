
"use strict";

var coffeescript = require('coffee-script/register')
var ChatHelper = require("./chathelper").ChatHelper;
var jsonfile = require('jsonfile')
var path = require('path')

var configPath= path.join(__dirname,"config.json")

var config = jsonfile.readFileSync(configPath,{"throws":false});

if(!config || ! config.token){

  console.log("please put config.json in ",configPath,", contents like {token:'your telegram bot api token'}");

  return;
}

var telegram = require('telegram-bot-api');
var api = new telegram({
	token: config.token,
	updates: {
		enabled: true,
		get_interval: 1000
	},
  http_proxy:config.http_proxy
});







api.getMe()
.then(function(data)
{
    console.log(data);
})
.catch(function(err)
{
	console.log(err);
});




function telegram_2_zeronet(message,chatController){
  var from ="";
  if(message.chat && message.chat.title){
    from=message.chat.title+":";
  }
  if(message.from){
    from = from+ message.from.first_name;
    if(message.from.last_name){
      from=from+" "+message.from.last_name;
    }
    from = from+":";
  }

  chatController.addMessage(
      {
        body:from+message.text,
        date_added:message.date*1000
      });
}

function publishZeronet(chatController){
  if(chatController.changed){
    console.log("publish");
    chatController.recycle();
    chatController.save(false);
  }
}

function collectFunc(chatController){

  setInterval(function(){
    publishZeronet(chatController);
  },1000);

  console.log("setting up message callback");

  api.on('message', function(message)
      {
        var chat_id = message.chat.id;

        // It'd be good to check received message type here
        // And react accordingly
        // We consider that only text messages can be received here
        if(!message.text){
          console.log("not supported type");
          return;
        }

        telegram_2_zeronet(message,chatController);

      });
}

new ChatHelper(
      {
        addr:"1iMFEmmY4xyWTGi3Doot98nxeB2sqeEtX",
        host:"127.0.0.1",
        port:43110,
        proto:{
          ws:"ws",
          http:"http"
        }
      },
      ["zeroid.bit","web","telegrambot","1My4AHpEjVQB1Jvetpiuha7o2QtQgWHL5L"]
      ,true,
      collectFunc);


