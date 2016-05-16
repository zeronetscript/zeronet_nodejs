"use strict";

var coffeescript = require('coffee-script/register')
var ChatHelper = require("./chathelper").ChatHelper;


function collectFunc(chatController){

  chatController.data={};
  chatController.changed =true;
  chatController.save(true);
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



var users
