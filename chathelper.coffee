ZeroWebsocket= (require "./common.coffee").ZeroWebsocket
Parse = (require "./common.coffee").Parse

btoa = require "btoa"


class ChatController extends ZeroWebsocket

  constructor:(url,userInfo,needOldFile,collectFunc,lastAction="publish")->
    super url
    @userInfo = userInfo
    @collectFunc=collectFunc
    @lastAction=lastAction
    @needOldFile = needOldFile

  recycle:(maxTime=30*24*60*60*1000)=>

    @log "recycle"
    minTime = (new Date()).getTime() - maxTime
    @data.message.sort((lhs,rhs)->
      return Math.sign(lhs.date_published - rhs.date_published)
    )

    
    @data.message=@data.message.filter((e)=>
      if e.date_added<=minTime
        @log "recycle:",e
        @changed=true
      return e.date_added>minTime
    )


  addMessage:(message)->

    @log "add:",message
    @data.message.push(message)
    @changed = true

  save:(exit=true)=>

    finishIfExit=()=>
      if exit
        @finish()

    if !@changed
      @log "not changed"
      finishIfExit()
      return
      # body...

    json_raw = unescape(
      # Encode to json, encode utf8
      encodeURIComponent(JSON.stringify(@data, undefined, '\t')))
      # Convert to to base64 and send
      #
    @log "write to ",@inner_path
    @cmd "fileWrite", [@inner_path,btoa(json_raw)], (res)=>

      if res != "ok"
        @log "write failed"
        finishIfExit()
        return

      @log "write ok"
      @changed = false

      if @lastAction is "save"
        @log "save stage only"
        finishIfExit()
        return

          
      @cmd "sitePublish", {"inner_path": @inner_path}, (res) =>
       @log "Publish result:", res
       finishIfExit()


  getAndCollect:()=>


    path = "data/users/#{@site_info.auth_address}/"

    @cmd "fileRules",path+"content.json",(rules)=>
      @log "file rules getted"
      @rules = rules

      @inner_path = path+"data.json" 
 
      @log "inner_path is :",@inner_path

      if !@needOldFile
        @data = { "message": [] }
        @log "no need old file"
        @collectFunc @
        return
          
      @log "need old file,getting..."
      @cmd "fileGet", {"inner_path": @inner_path, "required": false}, (data) =>
        @log "file getted"
        if data  # Parse if already exits
          @data = JSON.parse(data)
        else  # Not exits yet, use default data
          @data = { "message": [] }
 
        @log "call collect func"
        @collectFunc @

  route: (cmd, message) ->
    if cmd is "setSiteInfo"
      @log "getting setSiteInfo"
      if message.params.cert_user_id
        @log "get cert_user_id:",message.params.cert_user_id
        @site_info = message.params
        @getAndCollect()
        return

      if !@userInfo
        @log "user info not provided,exit"
        @finish()
        return

      @cmd "certAdd",@userInfo,(res)=>
         @log "certAdd result:",res
        if res.error
          @log "error:",res.error
          @finish()
          return
        @getAndCollect()
    else if cmd is "notification"
      if message.params[0] is "ask"

        @log "ask",message.params[1]
        @cmd "certSet",["zeroid.bit"]
      else
        @log message
    else
      @log "wtf:",cmd,"__",message



  onOpenWebsocket: (e)->
    @log "web socket opened"
    @cmd "siteInfo",{},(site_info)=>
      if site_info.cert_user_id
        @site_info=site_info
        @log "cert_user_id:",site_info.cert_user_id
        @getAndCollect()
        return
      @log "certSelect"
      @cmd "certSelect",[["zeroid.bit"]]
    
          
  finish:()=>
    @log "finish, close websocket"
    @ws.close()

  onCloseWebsocket: (e, reconnect=10000) =>
      @log "closed"


exports.ChatHelper =
class ChatHelper
  constructor:(option,userInfo,needOldFile,collectFunc,lastAction)->
    new Parse option,(url)->
      return new ChatController url,userInfo,needOldFile,collectFunc,lastAction

