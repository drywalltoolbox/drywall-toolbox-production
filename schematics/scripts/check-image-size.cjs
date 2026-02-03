const fs = require('fs');

// Read file header to get PNG dimensions
const buffer = fs.readFileSync('public/15TT_SCH-1.png');

// PNG signature and IHDR chunk parsing
if (buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  console.log('Image dimensions:', width, 'x', height);
  console.log('Type: PNG');
} else {
  console.log('Not a PNG file or corrupted');
}
