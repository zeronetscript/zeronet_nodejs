'use strict';

(function(){

var net = require('net'),
    iconv = require('iconv-lite'),
    TextDecoder = require('text-encoding').TextDecoder;

  // string to uint array
function unicodeStringToTypedArray(s) {
    var escstr = encodeURIComponent(s);
    var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    });
    var ua = new Uint8Array(binstr.length);
    Array.prototype.forEach.call(binstr, function (ch, i) {
        ua[i] = ch.charCodeAt(0);
    });
    return ua;
}

// uint array to string
function typedArrayToUnicodeString(ua) {
    var binstr = Array.prototype.map.call(ua, function (ch) {
        return String.fromCharCode(ch);
    }).join('');
    var escstr = binstr.replace(/(.)/g, function (m, p) {
        var code = p.charCodeAt(p).toString(16).toUpperCase();
        if (code.length < 2) {
            code = '0' + code;
        }
        return '%' + code;
    });
    return decodeURIComponent(escstr);
}

function WebTelnetCore(controller, port, host) {
  if(this && (this instanceof WebTelnetCore)) {
    this.reset();
    this.bind(controller,port,host);
  } else {
    return new WebTelnetCore(controller,port,host);
  }
}

WebTelnetCore.prototype = {
  reset: function() {
    this.logTraffic = false;

    this.isRunning = false;
    this.timer = 0;
    this.lastTick = 0;

    this.sockets = {};  // sid -> socket
    this.socketsCount = 0;
    
    this.port = 23;
    this.host = '127.0.0.1';
    this.decoder = new TextDecoder('utf-8');
    return this;
  },

  showTraffic: function(y) {
    this.logTraffic = y;
    return this;
  },

  setCharset: function(cs) {
    this.charset = cs;
    this.decoder = new TextDecoder(cs);
    return this;
  },

  bind: function(controller, port, host) {
    if(this.isRunning) throw new Error('WebTelnetCore is already running.');

    var proxy = this;
    proxy.port = port;
    proxy.host = host;

    controller.on('connection', function(connObj){

      console.log("connection triggered");
      proxy.onConnected(connObj);
    });

    proxy.lastTick = Date.now();
    proxy.isRunning = true;

    // init tick() timer
    proxy.tick();
    proxy.timer = setInterval(function(){
      proxy.tick();
    }, 1000);
    
    return this;
  },

  shutdown: function() {
    if(!this.isRunning) return;

    // clear tick() timer
    if(this.timer) clearInterval(this.timer);

    this.reset();

    return this;
  },

  tick: function() {
    var server = this;
    server.lastTick = Date.now();
  },

  onDisconnected: function(connObj) {
    var proxy = this;
    var peerSock = connObj.peerSock;
    if(peerSock) {
      connObj.peerSock = null;
      peerSock.peerSock = null;
      peerSock.end();
    }
    delete proxy.sockets[ connObj.id ];
    proxy.socketsCount --;
  },

  connectTelnet: function(connObj) {
    var proxy = this;

    console.log("try to connect ",proxy.host,proxy.port);
    var telnet = net.connect( proxy.port, proxy.host, function() {
      if(proxy.logTraffic) console.log('telnet connected');
      connObj.emit('status', 'Telnet connected.\n');
    });

    telnet.peerSock = connObj;
    connObj.peerSock = telnet;

    telnet.on('data', function(buf) {

      //console.log('telnet: ', buf.toString());
      var peerSock = telnet.peerSock;
      if(peerSock) {
        var value=proxy.decoder.decode(buf);
        peerSock.write(value);
/*
        if(proxy.charset && (proxy.charset !== 'utf8')) {
          buf = iconv.decode(buf, proxy.charset);
          buf = unicodeStringToTypedArray(buf);
        }
        var arrBuf = new ArrayBuffer(buf.length);
        var view = new Uint8Array(arrBuf);
        for(var i=0; i<buf.length; ++i) {
          view[i] = buf[i];
        }
        peerSock.emit('stream', arrBuf);
*/
      }
    });
    telnet.on('error', function(){
      console.log("error happend");
    });
    telnet.on('close', function(){
      if(proxy.logTraffic) console.log('telnet disconnected');
      connObj.emit('close');
    });
    telnet.on('end', function(){
      console.log("telnet end");
      var peerSock = telnet.peerSock;
      if(peerSock) {
        peerSock.emit("close");
        peerSock.peerSock = null;
        telnet.peerSock = null;
      }
    });
  },

  onConnected: function(connObj) {
    var proxy = this;

    if(proxy.logTraffic) console.log('proxy client connected',connObj.id);
    connObj.on('stream', function(message) {
      if(proxy.charset && (proxy.charset !== 'utf8')) {
        message = iconv.encode(message, proxy.charset);
      }
      //console.log('websocket: ', message);
      //
      //
      var peerSock = connObj.peerSock;
      if(peerSock) {
        console.log("websocket to telnet sock, write:",message);
        peerSock.write(message);
      } else {
        console.log("connect telnet,stream[",message,"]");
        proxy.connectTelnet(connObj);
      }
    });

    connObj.on('disconnect', function(){
      if(proxy.logTraffic) console.log('proxy client disconnected, socket id: ' + connObj.id);
      proxy.onDisconnected(connObj);
    });

    proxy.sockets[connObj.id] = connObj;
    proxy.socketsCount ++;
  },
};

exports = module.exports = WebTelnetCore;

})();
