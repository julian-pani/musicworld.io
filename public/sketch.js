// Inspired by: Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/ZjVyKXp9hec

// Keep track of our socket connection
var socket;

var spotifyUserData;
var spotifyRecentlyPlayedData;
var recentlyPlayedTracks = [];

var myUser;

var userImg;

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

const debugEnabled = 1;

const canvasW = window.innerWidth * 0.9;
const canvasH = window.innerHeight * 0.9;

const initialRadius = 20;

function getHashParams() {
  var hashParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
  while ( e = r.exec(q)) {
     hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

function preload() {
  soundFormats('mp3', 'ogg');
  mySound = loadSound('assets/tequila.mp3');
}

function setup() {

  // ### GET SPOTIFY DATA ###

  let access_token = getHashParams()['access_token']; // this was sent in the redirect as a hash param
  console.log(access_token);

  fetch('https://api.spotify.com/v1/me', { 
    method: 'GET', 
    headers: {'Authorization': 'Bearer ' + access_token}
  })
  .then(res => res.json())
  .then(data => {
    console.log('Got user data:')
    console.log(data)
    spotifyUserData = data;
    // set username
    nameChosen = data.display_name != undefined ? data.display_name : data.id;
    updateUsername();
    // take image
    let imgUrl = data.images.find((x, i) => true) // get first image
    userImg = createImg("https://profile-images.scdn.co/images/userprofile/default/97bb13d9b68ba424a443378f78c987f2b06a9e3b");
    userImg.hide();
  });

  fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', { 
    method: 'GET', 
    headers: {'Authorization': 'Bearer ' + access_token}
  })
  .then(res => res.json())
  .then(data => {
    console.log('Got recently played:')
    console.log(data)
    spotifyRecentlyPlayedData = data;

    spotifyRecentlyPlayedData.items
    .map((item, index) => {
      let track = new RecentlyPlayedTrack(item, index);
      recentlyPlayedTracks.push(track);
    });
  });


  // username field and button
  var inputField = createInput('type who you are');
  inputField.parent('username-div')
  inputField.input(function() { nameChosen = this.value() });
  updateNameButton = createButton('update name');
  updateNameButton.mousePressed(updateUsername);
  updateNameButton.parent('username-div');

  var cnv = createCanvas(canvasW, canvasH);
  cnv.parent('canvas');
  // Start a socket connection to the server
  // Some day we would run this server somewhere else
  socket = io.connect('http://' + window.location.hostname + ':3000');

  // SETUP ME:
  myUser = new User(nameChosen, random(width), random(height), initialRadius, true);
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
  playButton.parent('buttons');
  stopButton = createButton("Stop [O]");
  stopButton.mousePressed(stopMusic);
  stopButton.parent('buttons');
  mySound.setVolume(1);

  // log positions button:
  logPosButton = createButton("Log Positions");
  logPosButton.mousePressed(() => printPositions());
  logPosButton.parent('buttons');

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

  stroke(255, 255, 255, 255 * 0.2)
  fill(79, 76, 76, 255 * 0.8);
  ellipse(mouseX, mouseY, 20, 20);

  // this makes the center of canvas the 0,0 point
  translate(width / 2, height / 2);

  // NOTE: the code below would allow zooming out the world as my own myUser becomes bigger:
  // var newzoom = 64 / myUser.r;
  // zoom = lerp(zoom, newzoom, 0.1);

  scale(25 / myUser.r);

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

  // ## SPOTIFY Recently Played:
  if(recentlyPlayedTracks.length > 0) {
    fill(255, 255, 255, 255);
    textAlign(CENTER, CENTER);
    textSize(myUser.r * 2);
    text("Recently played for: " + myUser.username, 0 , (-height / 2) * 0.9);

    recentlyPlayedTracks
    .map(track => {
      track.show();
      track.update();
    })
  }
  

  stroke(255);

  var data = {
    x: myUser.pos.x,
    y: myUser.pos.y,
    r: myUser.r
  };
  socket.emit('update', data); // HERE the scetch sends the current player to the server
}

class RecentlyPlayedTrack {
  constructor(item, index) {
    this.trackName = item.track.name;
    this.trackArtists = item.track.artists.map(x => x.name);
    this.spotifyLink = item.track.href;
    this.playedAt = item.played_at;

    this.r = myUser.r * 1.6;
    this.initialR = this.r;
    this.x = -width / 2 * 0.5; // center of screen
    this.y = -height / 2 + this.r * 4 + this.r*1.5 * index; // starting from border

    this.borderColor = color(0, 102, 153, 255*0.7);
    this.textColor = color(255, 255, 255, 255 * 0.9);
    this.initialTextColor = this.textColor;

    this.borderX = this.x - this.r * 5;
    this.borderY = this.y;
    this.borderW = this.r * 10;
    this.borderH = this.r;
  }

  show() {
    // border
    fill(this.borderColor);
    rect(this.borderX, this.borderY, this.borderW, this.borderH)

    // track title
    fill(this.textColor);
    textAlign(CENTER, CENTER);
    textSize(this.r * 0.4);
    let trackNameY = this.y + this.r * 0.3;
    text(this.trackName, this.x, trackNameY);

    // artists
    textSize(this.r * 0.2);
    text("Artists: " + this.trackArtists.join(", "), this.x, trackNameY + this.r * 0.4);
  }

  intersects(myUser) {
    const xLeft = myUser.pos.x - myUser.r < this.borderX + this.borderW;
    const xRight = myUser.pos.x + myUser.r > this.borderX
    const xIntersects = xLeft && xRight

    const ytop = myUser.pos.y - myUser.r < this.borderY + this.borderH;
    const yBottom = myUser.pos.y + myUser.r > this.borderY
    const yIntersects = ytop && yBottom

    return xIntersects && yIntersects;
  }

  update() {

    if(this.intersects(myUser)) { // selected
      this.textColor = color(20, 20, 20, 255 * 0.9);
      // this.r +=0.05
      // this.r = constrain(this.r, this.initialR, this.initialR * 2);
    } else { // reset
      // this.r = this.initialR;
      this.textColor = this.initialTextColor;
    }
  }

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
  line(-width / 2, -height / 2, width / 2, -height / 2);
  line(-width / 2, height / 2, width / 2, height / 2);
  line(-width / 2, -height / 2, -width / 2, height / 2);
  line(width / 2, -height / 2, width / 2, height / 2);
}

function getMouse() {
  return createVector(mouseX + translated.x, mouseY + translated.y);
}