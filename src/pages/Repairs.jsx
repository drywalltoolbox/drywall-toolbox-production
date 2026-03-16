import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Repairs() {
  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Placeholder Content Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Repair Services</h2>
          <p className="text-gray-600 mb-6">
            Professional repair and maintenance services for all your drywall tools and equipment.
          </p>
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Preventative Maintenance</h3>
              <p className="text-gray-600 text-sm mb-3">
                Keep your tools in optimal condition with our preventative maintenance programs. Regular maintenance helps extend equipment life and ensure consistent performance.
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Seasonal equipment inspections</li>
                <li>Lubrication and fluid replacement</li>
                <li>Seal and gasket replacements</li>
              </ul>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Emergency Repairs</h3>
              <p className="text-gray-600 text-sm mb-3">
                When your tools stop working, we're here to help. Our experienced technicians can diagnose and repair issues quickly to minimize downtime on your projects.
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Same-day diagnostics</li>
                <li>Expedited repair turnaround</li>
                <li>24/7 emergency support available</li>
              </ul>
            </div>
            <div className="pb-6">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Warranty & Extended Coverage</h3>
              <p className="text-gray-600 text-sm mb-3">
                Protect your investment with our comprehensive warranty and extended coverage options. Peace of mind for all your professional equipment.
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Extended manufacturer warranties</li>
                <li>Accidental damage coverage</li>
                <li>Parts and labor protection</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cards Section at Bottom */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Repair Guides Card */}
          <Link to="/repairs" className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Repair Guides</h3>
            <p className="text-gray-600 mb-4">
              Access comprehensive repair guides for common issues with your drywall tools.
            </p>
          </Link>

          {/* Replacement Parts Card */}
          <Link to="/parts" className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Replacement Parts</h3>
            <p className="text-gray-600 mb-4">
              Find and order replacement parts for your equipment to keep it running smoothly.
            </p>
          </Link>

          {/* Support Card */}
          <Link to="/contact" className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Support</h3>
            <p className="text-gray-600 mb-4">
              Contact our support team for technical assistance and troubleshooting help.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
