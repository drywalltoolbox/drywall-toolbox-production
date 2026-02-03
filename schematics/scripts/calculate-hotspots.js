// Utility to convert hotspot coordinates from JSON to proper CSS percentages
// The normalized_coords are based on a scale factor (pixel_coords / reference_size)
// where reference_size is 300x150

const hotspotsData = {
  "image": {
    "width": 300,
    "height": 150,
    "source": "15TT_SCH-1.png"
  },
  "hotspots": [
    {"id": "01", "pixel_coords": {"x": 1130, "y": 330}, "normalized_coords": {"x": "3.7667", "y": "2.2000"}, "part_info": {"part_number": "164348", "description": "Handle Assembly", "quantity": 1}},
    {"id": "02", "pixel_coords": {"x": 700, "y": 505}, "normalized_coords": {"x": "2.3333", "y": "3.3667"}, "part_info": {"part_number": "150003F", "description": "Coupling", "quantity": 1}},
    {"id": "03", "pixel_coords": {"x": 550, "y": 555}, "normalized_coords": {"x": "1.8333", "y": "3.7000"}, "part_info": {"part_number": "059143", "description": "Cotter Pin, 1/16 x 1/2", "quantity": 1}},
    {"id": "04", "pixel_coords": {"x": 810, "y": 1075}, "normalized_coords": {"x": "2.7000", "y": "7.1667"}, "part_info": {"part_number": "156001F", "description": "Corner Roller Head", "quantity": 1}},
    {"id": "05", "pixel_coords": {"x": 710, "y": 1135}, "normalized_coords": {"x": "2.3667", "y": "7.5667"}, "part_info": {"part_number": "150004F", "description": "Swivel Coupling Pin", "quantity": 1}},
    {"id": "06", "pixel_coords": {"x": 430, "y": 1070}, "normalized_coords": {"x": "1.4333", "y": "7.1333"}, "part_info": {"part_number": "150008", "description": "Thrust Washer", "quantity": 4}},
    {"id": "07", "pixel_coords": {"x": 150, "y": 1100}, "normalized_coords": {"x": "0.5000", "y": "7.3333"}, "part_info": {"part_number": "809006", "description": "Brass Washer", "quantity": 4}},
    {"id": "08", "pixel_coords": {"x": 120, "y": 995}, "normalized_coords": {"x": "0.4000", "y": "6.6333"}, "part_info": {"part_number": "159006", "description": "Roller Axle, 1/4-20 x 1 1/4 Hex.", "quantity": 4}},
    {"id": "09", "pixel_coords": {"x": 195, "y": 950}, "normalized_coords": {"x": "0.6500", "y": "6.3333"}, "part_info": {"part_number": "150011F", "description": "Roller Bushing", "quantity": 4}},
    {"id": "10", "pixel_coords": {"x": 250, "y": 920}, "normalized_coords": {"x": "0.8333", "y": "6.1333"}, "part_info": {"part_number": "150005", "description": "Roller", "quantity": 4}},
    {"id": "11", "pixel_coords": {"x": 380, "y": 755}, "normalized_coords": {"x": "1.2667", "y": "5.0333"}, "part_info": {"part_number": "159010", "description": "Screw, 8-32 x 3/8 Fil. Hd. Nylock", "quantity": 1}},
    {"id": "12", "pixel_coords": {"x": 435, "y": 820}, "normalized_coords": {"x": "1.4500", "y": "5.4667"}, "part_info": {"part_number": "154007", "description": "Swivel Assy.", "quantity": 1}},
    {"id": "13", "pixel_coords": {"x": 520, "y": 420}, "normalized_coords": {"x": "1.7333", "y": "2.8000"}, "part_info": {"part_number": "150009", "description": "Swivel Axle", "quantity": 1}},
    {"id": "14", "pixel_coords": {"x": 1130, "y": 195}, "normalized_coords": {"x": "3.7667", "y": "1.3000"}, "part_info": {"part_number": "151042", "description": "Handle Grip, Black", "quantity": 1}}
  ]
};

// Calculate the actual image dimensions from the normalized coordinates
// normalized = pixel / reference, so pixel = normalized * reference
// We need to find max pixel dimensions to determine actual image size

let maxX = 0, maxY = 0;
hotspotsData.hotspots.forEach(h => {
  maxX = Math.max(maxX, h.pixel_coords.x);
  maxY = Math.max(maxY, h.pixel_coords.y);
});

console.log('Max pixel coordinates:', { x: maxX, y: maxY });
console.log('Likely image dimensions: ~1200 x 1200 (or larger)');
console.log('\n');

// Now calculate proper percentages based on pixel coordinates
// Assuming image is approximately 1200 wide based on max x=1130
const assumedImageWidth = 1200;
const assumedImageHeight = 1200;

console.log('Calculated positions (assuming 1200x1200 image):');
console.log('='.repeat(80));

hotspotsData.hotspots.forEach(h => {
  const leftPercent = (h.pixel_coords.x / assumedImageWidth * 100).toFixed(2);
  const topPercent = (h.pixel_coords.y / assumedImageHeight * 100).toFixed(2);
  
  console.log(`ID ${h.id}: ${h.part_info.part_number} - ${h.part_info.description}`);
  console.log(`  Pixel: (${h.pixel_coords.x}, ${h.pixel_coords.y})`);
  console.log(`  Position: { top: '${topPercent}%', left: '${leftPercent}%' }`);
  console.log('');
});
