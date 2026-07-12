import { useCallback, useState } from 'react';

import { resumeCheckoutPayment } from '../../../api/checkout.js';
import {
	clearPendingCheckoutPayment,
	makeCheckoutAttemptId,
	readPendingCheckoutPayment,
	writePendingCheckoutPayment,
} from '../../../utils/checkoutRecovery.js';

export function useCheckoutRecovery() {
	const [pendingPayment, setPendingPayment] = useState( () => readPendingCheckoutPayment() );

	const rememberPayment = useCallback( ( payload ) => {
		const recovery = writePendingCheckoutPayment( { ...payload, attemptId: payload?.attemptId || makeCheckoutAttemptId() } );
		setPendingPayment( recovery );
		return recovery;
	}, [] );

	const dismissPayment = useCallback( () => {
		clearPendingCheckoutPayment();
		setPendingPayment( null );
	}, [] );

	const resumePayment = useCallback( async () => {
		if ( !pendingPayment?.resumeToken ) throw new Error( 'No resumable payment session is available.' );
		const response = await resumeCheckoutPayment( pendingPayment.resumeToken );
		if ( !response?.payment_url ) throw new Error( 'Secure payment is no longer available for this checkout.' );
		window.location.assign( response.payment_url );
		return response;
	}, [pendingPayment] );

	return { pendingPayment, rememberPayment, dismissPayment, resumePayment };
}

export default useCheckoutRecovery;
