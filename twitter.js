"use strict";

var coffeescript = require('coffee-script/register')
var ChatHelper = require("./chathelper").ChatHelper;
var fs = require("fs")
var request = require('request')
var jsdom = require('jsdom');
var path = require('path');


var jqueryPath=path.join(__dirname,"jquery.js");

if (fs.accessSync(jqueryPath)) {

  console.log(jqueryPath+" not exits,exit");
  return;
}

var jquery = fs.readFileSync(jqueryPath,"utf-8");



var users=[
{
  name:"破娃酱",
  link:"breakwa11"
},
{
  name:"贝带劲",
  link:"beidaijin"
},
{
  name:"刘晓原律师",
  link:"liu_xiaoyuan"
},
{
  name:"刘亦菲",
  link:"LiuYiFeiOff"
},
{
  name:"Shadowrocket",
  link:"ShadowrocketApp"
},
{
  name:"Victoria Raymond",
  link:"projectv2ray"
},
{
  name:"王思想",
  link:"wangxy1"
}
];


function extract(user,$,chatController){

  var allTweets= $("li.js-stream-item div.content");

  for (var i=0; i<allTweets.length;++i){
    var timeNode = $("span[data-time]",allTweets[i]);
    var timeMs=timeNode.data("time-ms");
    var contentNode = $("p.js-tweet-text,tweet-text",allTweets[i]);
    var content = contentNode.text();

    if (timeMs!="" && content !="") {

      chatController.addMessage({
          body:user.name+":"+content,
          date_added:timeMs
      });
    }

  }
}


function jsdomWrapper(user,chatController,callback){

  var url ="https://twitter.com/"+user.link;
  console.log("accessing ",url);
  jsdom.env({
    url:url,
    src:[jquery],
    done:function(err,window){
      if (err) {
        console.log(err);
        if(window){
         window.close();
        }
        callback();
        return;
      }

      console.log(url," getted, extract it");
      extract(user,window.$,chatController);
      window.close();
      callback();
    }
  });
}


function recursiveAsLoop(i,chatController,finishCallback){

  if (i>=users.length) {
    finishCallback();
    return;
  }

  jsdomWrapper(users[i],chatController,function(){
    recursiveAsLoop(i+1,chatController,finishCallback);
  });
}


function collectFunc(chatController){

  recursiveAsLoop(0,chatController,function(){
    //not store history data,no need to recycle 
    chatController.save();
  })
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
      ,false,
      collectFunc);



var users
