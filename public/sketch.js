// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/ZjVyKXp9hec

// Keep track of our socket connection
var socket;

var blob;

var otherPlayers = [];
var zoom = 1;
var nameChosen = 'someone';
var updateNameButton;
var playButton;
var stopButton;
var manuallyStopped = false;
var logPosButton;

const debugEnabled = 1;

function preload() {
  soundFormats('mp3', 'ogg');
  mySound = loadSound('assets/tequila.mp3');
}

function setup() {

  // username field and button
  var inputField = createInput('type who you are');
  inputField.input(function() { nameChosen = this.value() });
  updateNameButton = createButton('update name');
  updateNameButton.mousePressed(function() {
    console.log("changed username to: " + nameChosen);
    blob.username = nameChosen;

    var data = {
      newusername: blob.username
    };
    socket.emit('updateUsername', data); 
  });


  createCanvas(window.innerWidth * 0.8, window.innerHeight * 0.8);
  // Start a socket connection to the server
  // Some day we would run this server somewhere else
  socket = io.connect('http://' + window.location.hostname + ':3000');

  // SETUP ME:
  blob = new Blob(nameChosen, random(width), random(height), random(8, 24), true);
  // Make a little object with blob
  var data = {
    x: blob.pos.x,
    y: blob.pos.y,
    r: blob.r,
    u: blob.username
  };
  socket.emit('start', data);
  debug("client START:" + JSON.stringify(data));


  // HERE the client receives the updated world from the server
  socket.on('heartbeat',
    function(data) {
      //console.log(data);
      // blobs = data;
      otherPlayers = data;
      // debug("others:" + JSON.stringify(otherPlayers);
    }
  );

  // play and stop buttons
  playButton = createButton("Play [>]");
  playButton.mousePressed(function() { 
    console.log("playing audio");
    // if(mySound != null && mySound.isLoaded()) { 
      // mySound = loadSound('assets/hope.mp3');
    if(mySound.isLoaded() && !mySound.isPlaying()) {
      mySound.play();
    }
    manuallyStopped = false;
    // }
  })
    
  stopButton = createButton("Stop [O]");
  stopButton.mousePressed(function() { 
    console.log("stop playing audio");
    mySound.stop();
    manuallyStopped = true;
  })
  mySound.setVolume(1);


  // log positions:
  logPosButton = createButton("Log Positions");
  logPosButton.mousePressed(function() {
      printPositions(otherPlayers, blob);
    }
  );
}

function printPositions(otherPlayers, me) {
    console.log("My pos is: " + me.pos); // mine

    for (var i = otherPlayers.length - 1; i >= 0; i--) {  // others
      var otherBlobPos = createVector(otherPlayers[i].x, otherPlayers[i].y);
      console.log("Pos for : " + otherPlayers[i].id + " is : " + otherBlobPos);
    }
  }

// function printPos(player) {
//       console.log("Pos for : " + player.id + " is : " + createVector(player.x, player.y));
// };

// function toOthers(others, doThis) {
//   for (var i = others.length - 1; i >= 0; i--) {
//     doThis(others[i]);
//   }
// }

function debug(s) {
  if(debugEnabled) {
    console.log("DEBUG : " + s);
  }
}


function draw() {
  noStroke();
  background(0);
  // console.log(blob.pos.x, blob.pos.y);

  translate(width / 2, height / 2);
  var newzoom = 64 / blob.r;
  zoom = lerp(zoom, newzoom, 0.1);
  scale(zoom);
  translate(-blob.pos.x, -blob.pos.y);

  // ### Draw others ###
  for (var i = otherPlayers.length - 1; i >= 0; i--) {

    // change "blos" to players
    var player = otherPlayers[i];

    var myId = socket.id;

    if (player.id !== myId) { // draw only others, not yourself
      // // print username
      // fill(0);
      // text(player.u, player.x, player.y);
      // textAlign(CENTER, CENTER);


      // ## Create auras

      var auraRadius1 = player.r * 2 + 10
      var auraRadius2 = player.r * 2 + 25
      var auraRadius3 = player.r * 2 + 58
      var auraRadius4 = player.r * 2 + 135
      var radiuses = [auraRadius1, auraRadius2, auraRadius3, auraRadius4];

      fill(0, 0, 255, 80);
      ellipse(player.x, player.y, auraRadius1, auraRadius1);

      fill(0, 0, 255, 50);
      ellipse(player.x, player.y, auraRadius2, auraRadius2);

      fill(0, 0, 255, 30);
      ellipse(player.x, player.y, auraRadius3, auraRadius3);

      fill(0, 0, 255, 20);
      ellipse(player.x, player.y, auraRadius4, auraRadius4);


      // main blob
      fill(0, 0, 255);
      ellipse(player.x, player.y, player.r * 2, player.r * 2);
      fill(255);
      textAlign(CENTER);
      textSize(4);
      text(player.u, player.x, player.y + player.r);

      // change volumne of sound when aura of different player was crossed
      var otherBlobV = createVector(player.x, player.y);
      incraseSound(otherBlobV, auraRadius4, 0.05);
      incraseSound(otherBlobV, auraRadius3, 0.2);
      incraseSound(otherBlobV, auraRadius2, 0.5);
      incraseSound(otherBlobV, auraRadius1, 1);
      // create some fade even after last aura
      if(otherBlobV.dist(blob.pos) > auraRadius4 && otherBlobV.dist(blob.pos) < auraRadius4 + 20) {
        mySound.setVolume(0);
      } // add a better algo here at some point

    }
  }

  // ## SHOW ME: ##
  blob.show();
  if (mouseIsPressed) {
    blob.update();
  }
  blob.constrain();
  drawBorders();

  var data = {
    x: blob.pos.x,
    y: blob.pos.y,
    r: blob.r
  };
  socket.emit('update', data); // HERE the scetch sends the current player to the server
}

function incraseSound(otherBlobV, auraRadius, newval) {
  if(mySound.isLoaded() && !mySound.isPlaying() && !manuallyStopped) {
    mySound.play();
  }
  var distance = otherBlobV.dist(blob.pos);
  if(distance  < auraRadius) {
    // console.log("Crossed aura");
    // console.log("dist" + otherBlobV.dist(blob.pos))
    mySound.setVolume(newval);
  }
}

function drawBorders() {
  // draw rectangle borders
  fill(255) 
  stroke(126);
  line(-width / 4, -height / 4, width / 4, -height / 4);
  line(-width / 4, height / 4, width / 4, height / 4);
  line(-width / 4, -height / 4, -width / 4, height / 4);
  line(width / 4, -height / 4, width / 4, height / 4);
}
