// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/ZjVyKXp9hec

// Keep track of our socket connection
var socket;

var blob;

var blobs = [];
var zoom = 1;
var username = 'someone';
var updateNameButton;
var playButton;
var stopButton;
var logPosButton;

function preload() {
  soundFormats('mp3', 'ogg');
  mySound = loadSound('assets/surfin.mp3');
}

function setup() {

  // username field and button
  var inputField = createInput('type who you are');
  inputField.input(function() { username = this.value() })
  updateNameButton = createButton('update name');
  updateNameButton.mousePressed(function() { 
    console.log("changed username to: " + username);
    blob.username = username; 
  })


  createCanvas(1200, 800);
  // Start a socket connection to the server
  // Some day we would run this server somewhere else
  socket = io.connect('http://localhost:3000');

  blob = new Blob(username, random(width), random(height), random(8, 24));
  // Make a little object with  and y
  var data = {
    x: blob.pos.x,
    y: blob.pos.y,
    r: blob.r
  };
  socket.emit('start', data);

  socket.on('heartbeat',
    function(data) {
      //console.log(data);
      blobs = data;
    }
  );


  // play and stop buttons
  playButton = createButton("Play [>]");
  playButton.mousePressed(function() { 
    console.log("playing audio");
    // if(mySound != null && mySound.isLoaded()) { 
      // mySound = loadSound('assets/hope.mp3');
    mySound.play();
    // }
  })
    
  stopButton = createButton("Stop [O]");
  stopButton.mousePressed(function() { 
    console.log("stop playing audio");
    mySound.stop();
  })
  mySound.setVolume(1);

  logPosButton = createButton("Log Positions");
  logPosButton.mousePressed(function() {
    console.log("My pos is: " + blob.pos);
    for (var i = blobs.length - 1; i >= 0; i--) {
      var otherBlobPos = createVector(blobs[i].x, blobs[i].y);
      console.log("Pos for : " + blob.id + " is : " + otherBlobPos);
    }
  });
}




function draw() {
  noStroke()
  background(0);
  // console.log(blob.pos.x, blob.pos.y);

  translate(width / 2, height / 2);
  var newzoom = 64 / blob.r;
  zoom = lerp(zoom, newzoom, 0.1);
  scale(zoom);
  translate(-blob.pos.x, -blob.pos.y);

  // draw others
  for (var i = blobs.length - 1; i >= 0; i--) {
    var id = blobs[i].id;
    if (id !== socket.id) { // draw only others, not yourself

      // create auras

      var auraRadius1 = blobs[i].r * 2 + 10
      var auraRadius2 = blobs[i].r * 2 + 25
      var auraRadius3 = blobs[i].r * 2 + 58
      var auraRadius4 = blobs[i].r * 2 + 135
      fill(0, 0, 255, 80);
      ellipse(blobs[i].x, blobs[i].y, auraRadius1, auraRadius1);

      fill(0, 0, 255, 50);
      ellipse(blobs[i].x, blobs[i].y, auraRadius2, auraRadius2);

      fill(0, 0, 255, 30);
      ellipse(blobs[i].x, blobs[i].y, auraRadius3, auraRadius3);

      fill(0, 0, 255, 20);
      ellipse(blobs[i].x, blobs[i].y, auraRadius4, auraRadius4);


      // main blob
      fill(0, 0, 255);
      ellipse(blobs[i].x, blobs[i].y, blobs[i].r * 2, blobs[i].r * 2);
      fill(255);
      textAlign(CENTER);
      textSize(4);
      text(blobs[i].id, blobs[i].x, blobs[i].y + blobs[i].r);

      // change volumne of sound when aura of differentplayer was crossed
      var crossedX = blob.pos.x - blobs[i].x < auraRadius4;
      var crossedY = blob.pos.y - blobs[i].y < auraRadius4;
      if(crossedX && crossedY) {
        console.log("Crossed aura");
      }
    }

  }

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
  socket.emit('update', data);

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
