import xml.etree.ElementTree as ET

# Parse the SVG
tree = ET.parse(r'd:\AMD\projects\drywall-toolbox\brand_logos\dura-stilts.svg')
root = tree.getroot()

# Extract only paths with yellow fills
yellow_fills = ['#FAE80D', '#FAE80E', '#FBE80D', '#FDE90E', '#F5E314', '#F5E214']
yellow_paths = []

for path in root.findall('.//{http://www.w3.org/2000/svg}path'):
    fill = path.get('fill', '')
    if fill.upper() in [f.upper() for f in yellow_fills]:
        yellow_paths.append(path)
        
print(f'Found {len(yellow_paths)} yellow paths')
for i, p in enumerate(yellow_paths[:3]):
    d = p.get('d', '')[:60]
    fill = p.get('fill')
    transform = p.get('transform', '')
    print(f'  Path {i}: fill={fill}, transform={transform[:40]}')
