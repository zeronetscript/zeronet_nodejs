"use strict";

var FeedParser = require('feedparser');
var request = require('request')
var coffeescript = require('coffee-script/register')
var feedparser = new FeedParser();
var BlogHelper = require("./bloghelper").BlogHelper;

var $ = require('jquery')(require("jsdom").jsdom().defaultView);

function toUTC(date_object){

  return date_object.getTime()/1000 + 8*60*60;
}



  

function extractBody(description){
  var dom=$("<div>"+description+"</div>");

  $("img",dom).remove();
  $("iframe",dom).remove();
  $("embed",dom).remove();

  return dom.html()
}


function collectFunc(blogController){

  console.log("collect func");



  var req = request("http://chinadigitaltimes.net/chinese/category/level-2-article/feed/");

  req.on('response',function(res){
    if (res.statusCode!=200) {
      console.log(" error done:",res.statusCode);
      blogController.finish();
      return;
    }
    res.pipe(feedparser);
  });


  feedparser.on('end',function(){

    if(!blogController.changed){
      console.log("unchanged");
      blogController.finish();
      return;
    }

    blogController.recycle(function(){
      blogController.save();
    })


  });

  feedparser.on('readable',function(){

    var stream = this;
    var article;

    while(article=stream.read()){

      if (blogController.alreadyHave(article.title)){
        console.log("skip:",article.title);
        continue;
      }

      blogController.addPost({
          title:article.title,
          date_published: toUTC(new Date(article.pubdate)),
          body:"---\n"+extractBody(article.description),
          tag:article.categories.filter(function(cat){
            return cat.match(/Level.*Article/)==null
          })
          });

    }
  });
}

new BlogHelper(
      {
        addr:"147QaQk6nh6QwM5LJe6eNrTwxQgS1yVT6a",
        host:"127.0.0.1",
        port:43110,
        proto:{
          ws:"ws",
          http:"http"
        }
      },
      collectFunc);
