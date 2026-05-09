import StripeCheckoutProvider from './StripeCheckoutProvider.jsx';
import StripeExpressCheckout from './StripeExpressCheckout.jsx';
import StripePaymentSection from './StripePaymentSection.jsx';

export default function StripePaymentBlock( {
  clientSecret,
  email,
  disabled = false,
  onCreateSession,
  onPaymentSuccess,
  onPaymentError,
} ) {
  return (
    <div className="space-y-5">
      <StripeCheckoutProvider clientSecret={ clientSecret }>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Express checkout
            </p>

            <StripeExpressCheckout
              email={ email }
              disabled={ disabled }
              onBeforeConfirm={ onCreateSession }
              onPaymentSuccess={ onPaymentSuccess }
              onPaymentError={ onPaymentError }
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Or pay another way
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <StripePaymentSection
            email={ email }
            disabled={ disabled }
            onBeforeSubmit={ onCreateSession }
            onPaymentSuccess={ onPaymentSuccess }
            onPaymentError={ onPaymentError }
          />
        </div>
      </StripeCheckoutProvider>
    </div>
  );
}
