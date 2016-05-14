w3cwebsocket = (require "websocket").w3cwebsocket

exports.ZeroWebsocket = 
class ZeroWebsocket
  constructor: (url) ->
    @url = url
    @next_message_id = 1
    @waiting_cb = {}


  connect: ->
    @ws = new w3cwebsocket(@url,null,null,null,null,{
      maxReceivedFrameSize: 50*1024*1024
    })
    @ws.onmessage = @onMessage
    @ws.onopen = @onOpenWebsocket
    @ws.onerror = @onErrorWebsocket
    @ws.onclose = @onCloseWebsocket


  onMessage: (e) =>
    message = JSON.parse(e.data)
    cmd = message.cmd
    if cmd == "response"
      if @waiting_cb[message.to]?
        @waiting_cb[message.to](message.result)
      else
        @log "Websocket callback not found:", message
    else if cmd == "ping"
      @response message.id, "pong"
    else
      @route cmd, message

  route: (cmd, message) =>
    @log "Unknown command", message


  response: (to, result) ->
    @send {"cmd": "response", "to": to, "result": result}


  cmd: (cmd, params={}, cb=null) ->
    @send {"cmd": cmd, "params": params}, cb


  send: (message, cb=null) ->
    if not message.id?
      message.id = @next_message_id
      @next_message_id += 1
    @ws.send(JSON.stringify(message))
    if cb
      @waiting_cb[message.id] = cb


  log: (args...) =>
    console.log "[ZeroWebsocket]", args...


  onOpenWebsocket: (e) =>
    @log "Open"
    console.log "open"
    if @onOpen? then @onOpen(e)


  onErrorWebsocket: (e) =>
    @log "Error", e
    if @onError? then @onError(e)


  onCloseWebsocket: (e, reconnect=10000) =>
    @log "Closed", e
    if e and e.code == 1000 and e.wasClean == false
      @log "Server error, please reload the page", e.wasClean
    else # Connection error
      setTimeout (=>
        @log "Reconnecting..."
        @connect()
      ), reconnect
    if @onClose? then @onClose(e)



http = require 'http'
https = require 'https'



exports.Parse=
class Parse
  constructor: (option,createFunc) ->

    self=@
    @createFunc = createFunc

    if !option.host
      option.host = "127.0.0.1"

    if !option.port
      option.port= 43110

    if !option.proto
      option.proto={http:"http",ws:"ws"}
    if !option.proto.ws
      option.proto.ws="ws"
    if !option.proto.http
      option.proto.ws="http"

    @option = option

    if option.proto.http is "http"
      mod=http
    else
      mod=https

    console.log "geting: 
      #{@option.proto.http}://#{@option.host}:#{@option.port}/#{@option.addr}"
    mod.get {
      hostname:option.host
      port:option.port
      path:'/'+option.addr
      }, (res)->
        if res.error
          console.log "error",res.error
          return

        body=[]
        res.on 'data', (chunk)->
          body.push chunk
      
        res.on 'end', ()->
          self.parse(body)

  parse: (bodies)=>
    str=Buffer.concat(bodies).toString()

    @wrapper_nonce = (str.match /wrapper_nonce.*"(.*)"/)[1]
    @wrapper_key = (str.match /wrapper_key.*"(.*)"/)[1]
    console.log "wrapper_nonce:",@wrapper_nonce
    console.log "wrapper_key:",@wrapper_key


    url = @option.proto.ws+"://"+@option.host+":"+@option.port+"/Websocket?wrapper_key="+@wrapper_key

    @zws = @createFunc url

    console.log "connect to ",url
    @zws.connect()





