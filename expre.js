"use strict";

var FeedParser = require('feedparser');
var request = require('request')
var coffeescript = require('coffee-script/register')
var feedparser = new FeedParser();


var BlogHelper = require("./helper").BlogHelper;



function toUTC(date_object){

  return date_object.getTime()/1000 + 8*60*60;
}


var req = request("http://www.expreview.com/rss.php");


var blogs=[];

feedparser.on('readable',function(){

  var stream = this;
  var article;

  while(article=stream.read()){
    blogs.push({
      title:article.title,
      date_published: toUTC(new Date(article.pubdate)),
      body:"---\n"+article.description,
      tag:article.categories
    });
  }
});

function addBlog(data,blog){

  if (!data.tag){
    data.tag=[]
  }

  for(var i in blog.tag){
      data.tag.push({value:blog.tag[i],post_id:blog.post_id});
  }
  delete blog.tag;

  data.post.unshift(blog);
}

function endFunc(data){

  console.log("endfunc")
  for (var i in data.post){
    if (data.post[i].post_id==183) {
      data.post[i].date_published = new Date().getTime()/1000;
    }
  }
}

feedparser.on('end',function(){

  console.log("blogs prepared:"+blogs.length);
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
      blogs,addBlog,endFunc);
});


req.on('response',function(res){
	    if (res.statusCode!=200) {
		    console.log(thisOne.name+" error done");
		    return;
	    }
	    res.pipe(feedparser);
});

