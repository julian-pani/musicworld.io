// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/ZjVyKXp9hec

class User {

  constructor(username, x, y, r, isme=false) {
    this.username = username;
    this.pos = createVector(x, y);
    this.r = r;
    this.vel = createVector(0, 0);
    this.isme = isme;

    this.mecolor = color(255, 255, 255);
    this.othersColor = color(random(255), random(255), random(255));
  
  }

  getAurasRadiuses() {
    let auraRadius1 = this.r * 2 + 10
    let auraRadius2 = this.r * 2 + 25
    let auraRadius3 = this.r * 2 + 58
    let auraRadius4 = this.r * 2 + 135
    let radiuses = [auraRadius1, auraRadius2, auraRadius3, auraRadius4];
    return radiuses;
  }

  update() {
    var newvel = createVector(mouseX - width / 2, mouseY - height / 2);  
    // var newvel = createVector(mouseX - this.pos.x, mouseY - this.pos.y);
      if(this.isme) {
        // move me
        newvel.div(50);
        //newvel.setMag(3);
        newvel.limit(3);
        this.vel.lerp(newvel, 1);
        this.pos.add(this.vel);
    }
    this.constrain();
    // this.r +=0.1;
  }

  constrain() {
    this.pos.x = constrain(this.pos.x, (-width / 4) + this.r, (width / 4) - this.r);
    this.pos.y = constrain(this.pos.y, (-height / 4) + this.r, (height / 4) - this.r);
  }

  show() {
    if(this.isme) {
      this.drawUser(color([255, 255, 255]), 0, 0);
    } else {
      this.drawUser(color([0, 0, 255]), 255, this.r);
      // // main user
      // fill(0, 0, 255);
      // ellipse(this.pos.x, this.pos.y, this.r * 2, this.r * 2);
      // fill(255);
      // textAlign(CENTER, CENTER);
      // textSize(8);
      // text(this.username, this.pos.x, this.pos.y + r);
    }
    this.constrain();
  }

  drawUser(userColor, textColor, textYmodifier) {
    noStroke();
    fill(userColor);
    ellipse(this.pos.x, this.pos.y, this.r * 2, this.r * 2);
    fill(textColor);
    textAlign(CENTER, CENTER);
    textSize(8);
    text(this.username, this.pos.x, this.pos.y + textYmodifier);
  }

  drawAuras() {
    noStroke();    
    let radiuses = this.getAurasRadiuses();
    let x = this.pos.x;
    let y = this.pos.y;

    fill(0, 0, 255, 80);
    ellipse(x, y, radiuses[0], radiuses[0]);

    fill(0, 0, 255, 50);
    ellipse(x, y, radiuses[1], radiuses[1]);

    fill(0, 0, 255, 30);
    ellipse(x, y, radiuses[2], radiuses[2]);

    fill(0, 0, 255, 20);
    ellipse(x, y, radiuses[3], radiuses[3]);
  }

}
