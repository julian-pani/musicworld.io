// Inspired by: Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/ZjVyKXp9hec

// Keep track of our socket connection
var socket;

var myUser;

var otherPlayers = [];
var zoom = 1;
var nameChosen = 'someone';
var updateNameButton;
var playButton;
var stopButton;
var manuallyStopped = false;
var logPosButton;

let translate1;
let translate2;
let scaleValue;

const debugEnabled = 1;

const canvasW = window.innerWidth * 0.8;
const canvasH = window.innerHeight * 0.8;

function preload() {
  soundFormats('mp3', 'ogg');
  mySound = loadSound('assets/tequila.mp3');
}

function setup() {

  // username field and button
  var inputField = createInput('type who you are');
  inputField.input(function() { nameChosen = this.value() });
  updateNameButton = createButton('update name');
  updateNameButton.mousePressed(updateUsername);


  createCanvas(canvasW, canvasH);
  // Start a socket connection to the server
  // Some day we would run this server somewhere else
  socket = io.connect('http://' + window.location.hostname + ':3000');

  // SETUP ME:
  myUser = new User(nameChosen, random(width), random(height), random(8, 24), true);
  // Make a little object with myUser
  var data = {
    x: myUser.pos.x,
    y: myUser.pos.y,
    r: myUser.r,
    u: myUser.username
  };
  socket.emit('start', data);
  debug("client START:" + JSON.stringify(data));

  // HERE the client receives the updated world from the server
  socket.on('heartbeat',
    function(data) {
      let myId = socket.id;
      otherPlayers = data.filter(user => user.id != myId) // exclude myself
      .map(user =>
        new User(user.u, user.x, user.y, user.r, false)
      );
    }
  );


  // ## BUTTONS ## //

  // play and stop buttons
  playButton = createButton("Play [>]");
  playButton.mousePressed(playMusic);
  stopButton = createButton("Stop [O]");
  stopButton.mousePressed(stopMusic);
  mySound.setVolume(1);

  // log positions button:
  logPosButton = createButton("Log Positions");
  logPosButton.mousePressed(() => printPositions());

  // button callbacks
  function stopMusic() {
    console.log("stop playing audio");
    mySound.stop();
    manuallyStopped = true;
  }
  
  function playMusic() {
    console.log("playing audio");
    if (mySound.isLoaded() && !mySound.isPlaying()) {
      mySound.play();
    }
    manuallyStopped = false;
  }

  function updateUsername() {
    console.log("changed username to: " + nameChosen);
    myUser.username = nameChosen;
    var data = {
      newusername: myUser.username
    };
    socket.emit('updateUsername', data);
  };

}

function printPositions() {
  console.log("My pos is: " + myUser.pos); // mine
  otherPlayers.forEach( other => {
    console.log("Pos for : " + other.id + " is : " + other.pos);
  });
  console.log("Mouse is at: " + createVector(mouseX, mouseY));
  console.log(myUser);
}

function debug(s) {
  if(debugEnabled) {
    console.log("DEBUG : " + s);
  }
}

function draw() {
  background(0);

  fill(255);
  ellipse(mouseX, mouseY, 20, 20);

  // this makes the center of canvas the 0,0 point
  translate(width / 2, height / 2);

  // NOTE: the code below would allow zooming out the world as my own myUser becomes bigger:
  // var newzoom = 64 / myUser.r;
  // zoom = lerp(zoom, newzoom, 0.1);

  scale(64 / myUser.r);

  // this makes my myUser the center of the screen
  translate(-myUser.pos.x, -myUser.pos.y);


  drawBorders();
  // noStroke();  


  // ### Draw others ###
  for (let user of otherPlayers) {

    let x = user.pos.x;
    let y = user.pos.y;
    let r = user.pos.r;

    user.drawAuras();
    user.show();

    // change volumne of sound when aura of different player was crossed
    let radiuses = user.getAurasRadiuses();
    increaseSound(user.pos, radiuses[0], 0.05);
    increaseSound(user.pos, radiuses[1], 0.2);
    increaseSound(user.pos, radiuses[2], 0.5);
    increaseSound(user.pos, radiuses[3], 1);
    // create some fade even after last aura
    if(user.pos.dist(myUser.pos) > radiuses[3] && user.pos.dist(myUser.pos) < radiuses[3] + 20) {
      mySound.setVolume(0);
    } // add a better algo here at some point

  } // end draw others

  // ### SHOW ME: ###
  myUser.show();
  if (mouseIsPressed) {
    myUser.update();
  }

  stroke(255);

  var data = {
    x: myUser.pos.x,
    y: myUser.pos.y,
    r: myUser.r
  };
  socket.emit('update', data); // HERE the scetch sends the current player to the server
}

function increaseSound(otherUserV, auraRadius, newval) {
  if(mySound.isLoaded() && !mySound.isPlaying() && !manuallyStopped) {
    mySound.play();
  }
  var distance = otherUserV.dist(myUser.pos);
  if(distance  < auraRadius) {
    // console.log("Crossed aura");
    // console.log("dist" + otherUserV.dist(user.pos))
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

// function translateAndTrack(vector) {
//   translated.add(vector);
//   translate(vector.x, vector.y);
// }

function getMouse() {
  return createVector(mouseX + translated.x, mouseY + translated.y);
}
