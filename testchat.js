"use strict";


var coffeescript = require('coffee-script/register')

var ChatHelper = require("./chathelper").ChatHelper;


function collectFunc(chatController){

  chatController.addMessage({
    body:"random",
    date_added: (new Date()).getTime()
  });

  chatController.save();

}

new ChatHelper(
      {
        addr:"16mQo7Q449ZHkqjjqJeP7dXM3xnEuczxsr",
        host:"127.0.0.1",
        port:43110,
        proto:{
          ws:"ws",
          http:"http"
        }
      },
      ["zeroid.bit","web","telegrambot","1My4AHpEjVQB1Jvetpiuha7o2QtQgWHL5L"]
      ,true,
      collectFunc,"save");
