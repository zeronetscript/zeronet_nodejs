ZeroWebsocket= (require "./common.coffee").ZeroWebsocket
Parse = (require "./common.coffee").Parse

WaitGroup=require 'waitgroup'

btoa = require "btoa"


class BlogController extends ZeroWebsocket

  constructor:(url,collectFunc,lastAction="publish")->
    super url
    @changed=false
    @collectFunc=collectFunc
    @lastAction=lastAction
    @wg = new WaitGroup

  alreadyHave:(title)=>
    for b in @data.post
      if b.title==title
        return true
    return false


  toRemoveIfNoRef:(post_id)=>

    parse_res= (res)=>
      if res[0].counter+res[1].counter is 0
        @removeList.push(post_id)

    queryRef = "SELECT  COUNT(*) AS counter 
      FROM comment WHERE post_id=#{post_id}  
      UNION ALL
      SELECT COUNT(*) AS counter 
      FROM post_vote WHERE post_id=#{post_id}"

    @wg.add()
    @cmd "dbQuery", [queryRef],(res)=>
      if res.error
        @log res.error
      else
        parse_res(res)
      @wg.done()

    return

  recycle:(callback,maxTime=10*24*60*60)=>

    @log "recycle"
    minTime = (new Date()).getTime()/1000 - maxTime
    @data.post.sort((lhs,rhs)->
      return Math.sign(lhs.date_published - rhs.date_published)
    )

    @removeList = []
    

    for p in @data.post
      if p.date_published < minTime && p.body!=""
        @toRemoveIfNoRef(p.post_id)


    @wg.wait(()=>

      @data.tag=@data.tag.filter((t)=>
        idx=@removeList.indexOf(t.post_id)
        if  idx==-1
          return true

        @log "recycle tag \"#{t.value}\" of post_id:#{t.post_id}"
        return false
      )

      @data.post.filter((p)=>
        idx=@removeList.indexOf(p.post_id)
        if  idx==-1
          return false

        p.body=""
        @log "recycle ",p.title

        
        @removeList.splice idx,1
        return false
      )

      callback()
    )




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
    @data.modified = Math.max((new Date).getTime()/1000,@data.modified+1)

    json_raw = unescape(
      # Encode to json, encode utf8
      encodeURIComponent(JSON.stringify(@data, undefined, '\t')))
      # Convert to to base64 and send
      #
    @cmd "fileWrite", ["data/data.json",btoa(json_raw)], (res)=>
      if res != "ok"
        @log "write failed",res
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

