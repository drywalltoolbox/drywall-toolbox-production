import { CalculatorHub } from '../components/calculators'
import SEOHead from '../components/shared/SEOHead'

export default function Calculators() {
  return (
    <>
      <SEOHead
        title="Drywall Calculators — Sheets, Tape, Corner Bead & Screws"
        description="Free professional drywall calculators. Instantly estimate sheets, joint tape, corner bead sections, and screw boxes for any room. Trade-accurate, mobile-first."
        canonical="https://drywalltoolbox.com/calculators"
      />
      <div className="page-wrapper">
        <CalculatorHub />
      </div>
    </>
  )
}
