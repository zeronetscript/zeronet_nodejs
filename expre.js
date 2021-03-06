"use strict";

var FeedParser = require('feedparser');
var request = require('request')
var coffeescript = require('coffee-script/register')
var feedparser = new FeedParser();


var BlogHelper = require("./bloghelper").BlogHelper;





var req = request("http://www.expreview.com/rss.php");



function collectFunc(blogController){

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
          date_published: blogController.toGMT8Sec(new Date(article.pubdate)),
          body:"---\n"+article.description,
          tag:article.categories
          });

    }
  });
}

new BlogHelper(
      {
        addr:"18Tww9kCQ2wzeSJNrQCXXqdurw6ggTZ2mV"
        /*
         *,
        host:"127.0.0.1",
        port:43110,
        proto:{
          ws:"ws",
          http:"http"
        }
        */
      },
      collectFunc);
