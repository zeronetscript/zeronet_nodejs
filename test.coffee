ZeroWebsocket= (require "./common.coffee").ZeroWebsocket
Parse = (require "./common.coffee").Parse


class Controller extends ZeroWebsocket

  onOpenWebsocket: (e)->
    self=@
    @cmd "sitePublish", ["stored"], (res) =>
      @log "Publish result:", res
      self.ws.close()

  onCloseWebsocket: (e, reconnect=10000) =>
      @log "closed"



parse = new Parse {addr:"198owRUJpj6VHNp3U3foCeXTSjjgYJf2WT"},(url)->
  return new Controller url
