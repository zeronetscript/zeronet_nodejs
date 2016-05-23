"use strict";

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var coffeescript = require('coffee-script/register')

var ChatHelper = require("./chathelper").ChatHelper;

var webtelnetcore = require("./webtelnet-core.js");




var pusher;

var all_user_response;


var user_auth_address_map_telnet={};


var chatController;

function selectUserResponse(user_auth_address){

  var my_response=all_user_response[user_auth_address];
  if (my_response) {
    return my_response;
  }

  all_user_response[user_auth_address]=[];
  return all_user_response[user_auth_address];
}

var ZeroConnection=function(user_auth_address){
  EventEmitter.call(this);
  this.id=user_auth_address;
    
  this.response=selectUserResponse(user_auth_address);

  this.write=function(msg){

    console.log(msg);
    
    var user_response= selectUserResponse(user_auth_address);
    appendResponse(user_response,msg);

    chatController.changed=true;
    chatController.save(false);

    console.log(chatController.data);
  }

  this.on("close",function(){

    var user_response= selectUserResponse(user_auth_address);
    appendResponse(user_response,"connection closed");
    chatController.changed=true;
    chatController.save(false);
    this.peerSock=null;
    delete user_auth_address_map_telnet[user_auth_address];
  });

};

util.inherits(ZeroConnection,EventEmitter);

var TelnetController=function(){

  EventEmitter.call(this);

};

util.inherits(TelnetController,EventEmitter);

var telnetController=new TelnetController();

var telnetcore = webtelnetcore(telnetController,4000,"127.0.0.1");
telnetcore.logTraffic= true;



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

    //checking user's request
    //get user's last response

    var user_response=selectUserResponse(user_auth_address);

    callback(user_data.request,user_response);

  });

}


function appendResponse(user_response,body){

  if (body==undefined || body==null || body=="") {
    return;
  }

  user_response.push(body);

  if(user_response.length>20){
    user_response.splice(0,user_response.length-20);
  }
  user_response.splice(0,user_response.length-20);
}


function receiveUserCallback(inner_path){

  console.log("inner_path:",inner_path," changed");

  var user_auth_address = inner_path.match(/data\/users\/(.*)\/data.json/)[1];

  console.log("user_auth_address is ",user_auth_address);

  userHandle(user_auth_address,function(user_request,user_response){

    var zeroConnection = user_auth_address_map_telnet[user_auth_address];
    if (!zeroConnection) {
      console.log("create new telnet connection");
      zeroConnection=new ZeroConnection(user_auth_address);

      appendResponse(user_response,user_request);

      user_auth_address_map_telnet[user_auth_address]=zeroConnection;

      telnetController.emit("connection",zeroConnection);
      zeroConnection.emit("stream","\n");
      return;
    }

    console.log("already connected telnet");

    if (user_request==null ) {
      return;
    }
      
    appendResponse(user_response,user_request);
    zeroConnection.emit("stream",user_request+"\n");
  });

}


function collectFunc(chatController1){

  chatController=chatController1;
  chatController1.cmd("channelJoin",{"channel":"siteChanged"});

  chatController1.receiveUserCallback = receiveUserCallback;

  if(!chatController1.data.response){
    chatController1.data.response={};
  }

  if (!chatController1.data.response){
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
