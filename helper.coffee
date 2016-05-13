ZeroWebsocket= (require "./common.coffee").ZeroWebsocket
Parse = (require "./common.coffee").Parse

btoa = require "btoa"


class BlogController extends ZeroWebsocket

  constructor:(url,blogs,addFunc,endFunc,testFunc)->
    super url
    @blogs=blogs
    @addFunc=addFunc

      
    @endFunc=endFunc


    if !testFunc
      @log "default test func to notExist"
      @testFunc=@notExist

  notExist:(data,blog)=>
    for b in data.post
      if b.title==blog.title
        return false
    return true

  onOpenWebsocket: (e)->
    self=@

    @cmd "fileGet", ["data/data.json"], (res)=>

      data=JSON.parse(res)

      changed = false
      for blog in @blogs
        if !@testFunc data, blog
          @log "skip:", blog.title
          continue

        @log "add:" ,blog.title
        changed=true
        blog.post_id=data.next_post_id
        @addFunc data ,blog
        data.next_post_id++

      if not changed
        @log "not changed"
        self.ws.close()
        return

      data.modified = (new Date).getTime()/1000

      if @endFunc
        @endFunc data

      json_raw = unescape(
        # Encode to json, encode utf8
        encodeURIComponent(JSON.stringify(data, undefined, '\t')))
        # Convert to to base64 and send
        #
      @cmd "fileWrite", ["data/data.json",btoa(json_raw)], (res)=>
        if res != "ok"
          @log "write failed"
          self.ws.close()
          return

        @log "write ok"
        @cmd "siteSign", ["stored", "content.json"], (res) =>
          @log "Sign result", res
          self.ws.close()

        #@cmd "sitePublish", ["stored"], (res) =>
        # @log "Publish result:", res
        #  

  onCloseWebsocket: (e, reconnect=10000) =>
      @log "closed"


exports.BlogHelper =
class BlogHelper
  constructor:(option,blogs,addFunc,testFunc)->
    new Parse option,(url)->
      return new BlogController url,blogs,addFunc,testFunc

