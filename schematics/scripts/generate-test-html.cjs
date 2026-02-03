const fs = require('fs');

// Read the hotspot data
const data = JSON.parse(fs.readFileSync('schematics/15TT_SCH-1_hotspots.json', 'utf8'));

const imageWidth = 3400;
const imageHeight = 2200;

// Generate HTML for testing
const html = `<!DOCTYPE html>
<html>
<head>
    <title>Hotspot Position Test</title>
    <style>
        body {
            margin: 20px;
            font-family: Arial, sans-serif;
            background: #f0f0f0;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 20px;
        }
        .schematic-wrapper {
            position: relative;
            display: inline-block;
            width: 100%;
            border: 2px solid #333;
        }
        .schematic-wrapper img {
            width: 100%;
            height: auto;
            display: block;
        }
        .hotspot {
            position: absolute;
            width: 24px;
            height: 24px;
            background: #2563eb;
            border: 2px solid white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            cursor: pointer;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .hotspot-label {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            color: #1e40af;
            white-space: nowrap;
            border: 1px solid #2563eb;
        }
        .hotspot:hover {
            background: #1d4ed8;
            width: 28px;
            height: 28px;
        }
        .info {
            margin-bottom: 20px;
            padding: 15px;
            background: #e0f2fe;
            border-left: 4px solid #0284c7;
        }
        table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f3f4f6;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>15" Corner Roller Assembly - Hotspot Position Test</h1>
        
        <div class="info">
            <strong>Image Dimensions:</strong> ${imageWidth}px × ${imageHeight}px<br>
            <strong>Total Hotspots:</strong> ${data.hotspots.length}<br>
            <strong>Instructions:</strong> Each blue dot should appear directly on its corresponding numbered callout in the diagram.
        </div>

        <div class="schematic-wrapper">
            <img src="15TT_SCH-1.png" alt="Corner Roller Assembly">
            ${data.hotspots.map(h => {
                const left = ((h.pixel_coords.x / imageWidth) * 100).toFixed(2);
                const top = ((h.pixel_coords.y / imageHeight) * 100).toFixed(2);
                return `
            <div class="hotspot" style="left: ${left}%; top: ${top}%;" title="${h.part_info.description}">
                <div class="hotspot-label">#${h.id}</div>
            </div>`;
            }).join('')}
        </div>

        <h2>Hotspot Coordinates</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Part Number</th>
                    <th>Description</th>
                    <th>Pixel (X, Y)</th>
                    <th>Percent (L, T)</th>
                </tr>
            </thead>
            <tbody>
                ${data.hotspots.map(h => {
                    const left = ((h.pixel_coords.x / imageWidth) * 100).toFixed(2);
                    const top = ((h.pixel_coords.y / imageHeight) * 100).toFixed(2);
                    return `
                <tr>
                    <td>${h.id}</td>
                    <td>${h.part_info.part_number}</td>
                    <td>${h.part_info.description}</td>
                    <td>(${h.pixel_coords.x}, ${h.pixel_coords.y})</td>
                    <td>(${left}%, ${top}%)</td>
                </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;

fs.writeFileSync('hotspot-test.html', html);
console.log('✓ Test file created: hotspot-test.html');
console.log('');
console.log('Next steps:');
console.log('1. Copy public/15TT_SCH-1.png to the project root');
console.log('2. Open hotspot-test.html in your browser');
console.log('3. Verify if hotspots align with numbered callouts');
console.log('');
console.log('If they align in the HTML but not in React:');
console.log('  → CSS or React rendering issue');
console.log('If they don\'t align in HTML either:');
console.log('  → Coordinate calculation is wrong');
