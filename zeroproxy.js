"use strict";

var coffeescript = require('coffee-script/register')

var ChatHelper = require("./chathelper").ChatHelper;

var request = require('request');



var chatController;

function response(user_auth_address,content){

  chatController.data.response[user_auth_address]=content;
  chatController.save(false);
}

function userHandle(user_auth_address,callback){

  var inner_path= "data/users/"+user_auth_address+"/data.json";

  console.log("call fileGet:",inner_path);

  chatController.cmd("fileGet",{"inner_path":inner_path},function(user_data){
    var data=JSON.parse(user_data);

    console.log("get ",inner_path," complete" );
    
    if(!data.request){
      console.log("no request");
      //no request
      return;
    }

    console.log("user ",user_auth_address," request :",data.request);

    callback(data.request);

  });

}



function receiveUserCallback(inner_path){

  console.log("inner_path:",inner_path," changed");

  var user_auth_address = inner_path.match(/data\/users\/(.*)\/data.json/)[1];

  console.log("user_auth_address is ",user_auth_address);

  userHandle(user_auth_address,function(user_request){


    if (user_request==null ) {
      return;
    }
    request(data.request, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        response(user_auth_address,body);
      }else{
        response(user_auth_address,"error:"+error+",statusCode:"+statusCode);
      }
    });
  });
}


function collectFunc(chatController1){

  chatController=chatController1;
  chatController1.cmd("channelJoin",{"channel":"siteChanged"});

  chatController1.receiveUserCallback = receiveUserCallback;

  if(!chatController1.data.response){
    chatController1.data.response={};
  }
  
  all_user_response=chatController1.data.response;
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
