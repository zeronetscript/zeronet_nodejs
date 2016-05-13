ZeroWebsocket= (require "./common.coffee").ZeroWebsocket
Parse = (require "./common.coffee").Parse

btoa = require "btoa"


class BlogController extends ZeroWebsocket

  constructor:(url,collectFunc,lastAction="publish")->
    super url
    @changed=false
    @collectFunc=collectFunc
    @lastAction=lastAction

  alreadyHave:(title)=>
    for b in @data.post
      if b.title==title
        return true
    return false


  addPost:(post)->
    post.post_id=@data.next_post_id

    if !@data.tag
      @data.tag=[]

    for t in post.tag
      @data.tag.push({
        value:t,
        post_id:post.post_id
      })

    delete post.tag

    @log "add:",post.title

    @data.post.unshift(post)
    @data.next_post_id++
    @changed = true

  save:()=>
    @data.modified = (new Date).getTime()/1000

    json_raw = unescape(
      # Encode to json, encode utf8
      encodeURIComponent(JSON.stringify(@data, undefined, '\t')))
      # Convert to to base64 and send
      #
    @cmd "fileWrite", ["data/data.json",btoa(json_raw)], (res)=>
      if res != "ok"
        @log "write failed"
        @finish()
        return

      @log "write ok"

      if @lastAction is "save"
        @log "save stage only"
        @finish()
        return

      @cmd "siteSign", ["stored", "content.json"], (res) =>
        @log "Sign result", res
        if @lastAction is "sign"
          @log "sign stage only"
          @finish()
          return

        @cmd "sitePublish", ["stored"], (res) =>
         @log "Publish result:", res
         @finish()

  onOpenWebsocket: (e)->

    @log "web socket opened"

    self=@

    @log "call fileGet"
    @cmd "fileGet", ["data/data.json"], (res)=>

      @log "file getted"
      @data=JSON.parse(res)
      @collectFunc @


          
  finish:()=>
    @log "finish, close websocket"
    @ws.close()

  onCloseWebsocket: (e, reconnect=10000) =>
      @log "closed"


exports.BlogHelper =
class BlogHelper
  constructor:(option,collectFunc,lastAction)->
    new Parse option,(url)->
      return new BlogController url,collectFunc,lastAction

