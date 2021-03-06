// Inspired by: Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/ZjVyKXp9hec

// Based off of Shawn Van Every's Live Web
// http://itp.nyu.edu/~sve204/liveweb_fall2013/week3.html

var blobs = [];

function BlobOnServer(id, x, y, r, u) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.r = r;
  this.u = u;
}


var spotifyAuth = require('./spotify-auth');
var cookieParser = require('cookie-parser');

// Using express: http://expressjs.com/
var express = require('express');
// Create the app
var app = express();

// Set up the server
// process.env.PORT is related to deploying on heroku
var server = app.listen(process.env.PORT || 3000, listen);

// This call back just tells us that the server has started
function listen() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://' + host + ':' + port);
}

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());


// ## Spotify login routes ##
app.get('/login', function(req, res) {
  spotifyAuth.login(req, res);
});
app.get('/callback', function(req, res) {
  spotifyAuth.authCallback(req, res);
});
app.get('/refresh_token', function(req, res) {
  spotifyAuth.refreshToken(req, res);
});

app.get('/test', (req, res) => res.send('Hello World!'))
app.get('/play', (req, res) => res.sendFile(__dirname + '/public/play.html'))

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io')(server);

setInterval(heartbeat, 33);

function heartbeat() {
  io.sockets.emit('heartbeat', blobs);
}

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // We are given a websocket object in our function
  function(socket) {

    console.log("We have a new client: " + socket.id);


    socket.on('start',
      function(data) {
        console.log("starting client: " + socket.id + " " + data.x + " " + data.y + " " + data.r + " " + data.u);
        var blob = new BlobOnServer(socket.id, data.x, data.y, data.r, data.u);
        blobs.push(blob);
      }
    );

    socket.on('update', // HERE the server gets the update from each client with their state.
      function(data) {
        //console.log(socket.id + " " + data.x + " " + data.y + " " + data.r);
        var blob;
        for (var i = 0; i < blobs.length; i++) {
          if (socket.id == blobs[i].id) {
            blob = blobs[i];
          }
        }
        
        // sometimes this fails on "blob is undefined". Looks like we get the 'update' before the 'start', 
        // maybe from a user who was previously logged in.
        if(blob == null) {
          // we should probably call start() funtion here to initialize the client again.
        } else {
          blob.x = data.x;
          blob.y = data.y;
          blob.r = data.r;
        }
      }
    );

    socket.on('disconnect', function() {
      
      // delete from array:
      for (var i = 0; i < blobs.length; i++) {
          if (socket.id == blobs[i].id) {
            blobs.splice(i, 1);
          }
        }
        
      console.log("Client has disconnected");
    });

    socket.on('updateUsername', function(data) {
        for (var i = 0; i < blobs.length; i++) {
          if (socket.id == blobs[i].id) {
            blobs[i].u = data.newusername;
          }
        }
    });
  }
);
