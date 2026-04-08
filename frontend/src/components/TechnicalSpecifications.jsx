/**
 * TechnicalSpecifications.jsx — Product technical specifications table renderer
 * 
 * Provides consistent rendering of product technical specs across all brands.
 * Matches Asgard's professional HTML table formatting with:
 * - Alternating row colors for readability
 * - Proper typography hierarchy
 * - Responsive scrolling on mobile
 * - Support for both plain text and HTML values
 * - Consistent padding and borders
 * 
 * Usage:
 * <TechnicalSpecifications specs={[
 *   { label: 'Brand', value: 'Asgard' },
 *   { label: 'SKU', value: 'AT01-AD' },
 * ]} />
 */

export default function TechnicalSpecifications({ specs = [], title = 'Technical Specifications' }) {
  if (!specs || specs.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 sm:mt-10 mb-6 sm:mb-8">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5 tracking-tight">
        {title}
      </h3>
      
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-xs">
        <table className="w-full border-collapse">
          <tbody>
            {specs.map((spec, index) => (
              <tr
                key={index}
                className={`
                  border-b border-gray-200 transition-colors
                  ${index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}
                `}
              >
                {/* Label Column */}
                <td className="px-4 sm:px-5 py-3 sm:py-4 font-semibold text-gray-900 w-2/5 sm:w-1/3 text-sm sm:text-base">
                  {spec.label}
                </td>
                
                {/* Value Column */}
                <td className="px-4 sm:px-5 py-3 sm:py-4 text-gray-700 text-sm sm:text-base">
                  {typeof spec.value === 'string' && spec.value.includes('<') ? (
                    <div 
                      className="prose prose-sm max-w-none inline-block"
                      dangerouslySetInnerHTML={{ __html: spec.value }} 
                    />
                  ) : (
                    spec.value
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
