// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/ZjVyKXp9hec

function Blob(username, x, y, r, isme) {
  this.username = username;
  this.pos = createVector(x, y);
  this.r = r;
  this.vel = createVector(0, 0);
  this.isme = isme;

  var mecolor = color(255, 255, 255);
  var othersColor = color(random(255), random(255), random(255));

  this.update = function() {
    var newvel = createVector(mouseX - width / 2, mouseY - height / 2);
      if(isme) {
        // move me
        newvel.div(50);
        //newvel.setMag(3);
        newvel.limit(3);
        this.vel.lerp(newvel, 0.2);
        this.pos.add(this.vel);
    }
  }

  this.constrain = function() {
    this.pos.x = constrain(blob.pos.x, (-width / 4) + this.r, (width / 4) - this.r);
    this.pos.y = constrain(blob.pos.y, (-height / 4) + this.r, (height / 4) - this.r);
  }

  this.show = function() {
    fill(255);
    ellipse(this.pos.x, this.pos.y, this.r * 2, this.r * 2);
    fill(0);
    text(this.username, this.pos.x, this.pos.y);
    textAlign(CENTER, CENTER);
  }
}
