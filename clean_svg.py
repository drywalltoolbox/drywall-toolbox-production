import xml.etree.ElementTree as ET

# Register namespace to preserve it in output
ET.register_namespace('', 'http://www.w3.org/2000/svg')

# Parse original SVG
tree = ET.parse(r'd:\AMD\projects\drywall-toolbox\brand_logos\dura-stilts.svg')
root = tree.getroot()

# Create new SVG with only yellow paths
yellow_fills = ['#FAE80D', '#FAE80E', '#FBE80D', '#FDE90E', '#F5E314', '#F5E214']
new_svg = ET.Element('svg')
new_svg.set('version', '1.1')
new_svg.set('xmlns', 'http://www.w3.org/2000/svg')
new_svg.set('width', root.get('width', '8700'))
new_svg.set('height', root.get('height', '1763'))

# Copy all yellow paths to new SVG
count = 0
for path in root.findall('.//{http://www.w3.org/2000/svg}path'):
    fill = path.get('fill', '')
    if fill.upper() in [f.upper() for f in yellow_fills]:
        new_path = ET.Element('path')
        new_path.set('d', path.get('d', ''))
        new_path.set('fill', fill)
        if path.get('transform'):
            new_path.set('transform', path.get('transform'))
        new_svg.append(new_path)
        count += 1

# Write cleaned SVG
ET.indent(new_svg, space='  ')
tree_out = ET.ElementTree(new_svg)
tree_out.write(r'd:\AMD\projects\drywall-toolbox\brand_logos\dura-stilts-clean.svg', encoding='UTF-8', xml_declaration=True)

print(f'Created dura-stilts-clean.svg with {count} yellow paths')
