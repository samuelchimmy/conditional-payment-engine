const Jimp = require('jimp');

(async function() {
  try {
    const image = await Jimp.read('C:/Users/USER/Downloads/conditional-p2p/webapp/public/logo.png');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      var alpha = this.bitmap.data[idx + 3];
      if (alpha > 0) {
        var r = this.bitmap.data[idx + 0];
        var g = this.bitmap.data[idx + 1];
        var b = this.bitmap.data[idx + 2];
        var brightness = (r + g + b) / 3;
        if (brightness < 128) {
          this.bitmap.data[idx + 0] = 0;
          this.bitmap.data[idx + 1] = 0;
          this.bitmap.data[idx + 2] = 0;
        } else {
          this.bitmap.data[idx + 0] = 255;
          this.bitmap.data[idx + 1] = 140; // Dark Orange 
          this.bitmap.data[idx + 2] = 0;
        }
      }
    });
    // Resize for favicon
    image.resize(256, 256);
    await image.writeAsync('C:/Users/USER/Downloads/conditional-p2p/webapp/src/app/icon.png');
    console.log('Favicon created successfully');
  } catch(e) {
    console.error('Error:', e);
  }
})();
