"use strict";

var coffeescript = require('coffee-script/register')

var ChatHelper = require("./chathelper").ChatHelper;






function receiveUserCallback(inner_path){

  console.log("inner_path:",inner_path," changed");
  
}


function collectFunc(chatController1){

  chatController1.receiveUserCallback = receiveUserCallback;

  chatController1.cmd("channelJoin",{"channel":"siteChanged"});

}

new ChatHelper(
      {
        addr:"157iuNRDp8x6ySz6fAamvxpv8zxE7RPsrS",
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
