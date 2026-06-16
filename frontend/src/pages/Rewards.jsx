import { Navigate } from 'react-router-dom';
import SEOHead from '../components/shared/SEOHead';

export default function Rewards() {
  return (
    <>
      <SEOHead noindex title="Rewards Unavailable" />
      <Navigate to="/dashboard" replace />
    </>
  );
}
