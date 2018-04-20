// function withRoundedCornersFromUrl(url, imgX, imgY, color) {
//   let userImg = createImg("https://profile-images.scdn.co/images/userprofile/default/97bb13d9b68ba424a443378f78c987f2b06a9e3b", 
//   () => {
//       userImg.hide() // workaround, see https://github.com/processing/p5.js/issues/561
//       var c = roundCorners(userImg, imgX, imgY, color);
//       image(c, imgX, imgY);
//     });
// }

function roundCorners(userImg, color) {
  // extract info from image:
  let w = userImg.elt.width;
  let h = userImg.elt.height;
  
  finalCanvas = createGraphics(w, h);

  finalCanvas.image(userImg, 0, 0, w, h); // draw the image

  // create rectangle on top of image
  rectangle = createGraphics(w, h);
  rectangle.noStroke();
  rectangle.fill(color);
  
  rectangle.rect(0, 0, w, h);
  // The image of the shape, ready for punching
  withPunch = rectangle.get();
  
  // The punch
  punch = createGraphics(w, h);
  punch.noStroke();
  punch.fill(255);
  // punch.rect(25,25,50,50);
  punch.ellipse(w / 2, h / 2, w, w);
  // Punch it!
  withPunch.punchOut(punch);
  
  // Tada!
  // image(rectangle, imgX, imgY); // DEBUG: print rectangle
  // image(punch, imgX, imgY); // DEBUG: print punched shape
  
  finalCanvas.image(withPunch, 0, 0); // draw image
  return finalCanvas;
}

// Extend p5.Image, adding the converse of "mask", naming it "punchOut":
p5.Image.prototype.punchOut = function (p5Image) {

  if (p5Image === undefined) {
    p5Image = this;
  }
  var currBlend = this.drawingContext.globalCompositeOperation;

  var scaleFactor = 1;
  if (p5Image instanceof p5.Graphics) {
    scaleFactor = p5Image._pInst._pixelDensity;
  }

  var copyArgs = [
    p5Image,
    0,
    0,
    scaleFactor * p5Image.width,
    scaleFactor * p5Image.height,
    0,
    0,
    this.width,
    this.height
  ];

  this.drawingContext.globalCompositeOperation = "destination-out";
  this.copy.apply(this, copyArgs);
  this.drawingContext.globalCompositeOperation = currBlend;
};

