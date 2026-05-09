import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

export default function StripePaymentSection( {
  email,
  disabled = false,
  onBeforeSubmit,
  onPaymentSuccess,
  onPaymentError,
} ) {
  const stripe = useStripe();
  const elements = useElements();

  async function handleSubmit( event ) {
    event.preventDefault();

    if ( ! stripe || ! elements || disabled ) {
      return;
    }

    try {
      await onBeforeSubmit?.();

      const result = await stripe.confirmPayment( {
        elements,
        confirmParams: {
          receipt_email: email || undefined,
        },
        redirect: 'if_required',
      } );

      if ( result.error ) {
        throw new Error( result.error.message || 'Payment could not be completed.' );
      }

      await onPaymentSuccess?.( result.paymentIntent );
    } catch ( error ) {
      onPaymentError?.( error );
    }
  }

  return (
    <form onSubmit={ handleSubmit } className="space-y-5">
      <PaymentElement
        options={ {
          layout: {
            type: 'accordion',
            defaultCollapsed: false,
            radios: true,
            spacedAccordionItems: true,
          },
          paymentMethodOrder: [
            'card',
            'link',
            'affirm',
            'klarna',
            'afterpay_clearpay',
          ],
        } }
      />

      <button
        type="submit"
        disabled={ ! stripe || ! elements || disabled }
        className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Place secure order
      </button>
    </form>
  );
}
