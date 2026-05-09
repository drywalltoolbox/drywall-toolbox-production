import { ExpressCheckoutElement, useElements, useStripe } from '@stripe/react-stripe-js';

export default function StripeExpressCheckout( {
  email,
  disabled = false,
  onBeforeConfirm,
  onPaymentSuccess,
  onPaymentError,
} ) {
  const stripe = useStripe();
  const elements = useElements();

  async function handleConfirm() {
    if ( ! stripe || ! elements || disabled ) {
      return;
    }

    try {
      await onBeforeConfirm?.();

      const result = await stripe.confirmPayment( {
        elements,
        confirmParams: {
          receipt_email: email || undefined,
        },
        redirect: 'if_required',
      } );

      if ( result.error ) {
        throw new Error( result.error.message || 'Express checkout could not be completed.' );
      }

      await onPaymentSuccess?.( result.paymentIntent );
    } catch ( error ) {
      onPaymentError?.( error );
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <ExpressCheckoutElement
        options={ {
          buttonType: {
            applePay: 'buy',
            googlePay: 'buy',
          },
          buttonTheme: {
            applePay: 'black',
            googlePay: 'black',
          },
          layout: {
            maxColumns: 2,
            maxRows: 1,
            overflow: 'auto',
          },
        } }
        onConfirm={ handleConfirm }
      />
    </div>
  );
}
