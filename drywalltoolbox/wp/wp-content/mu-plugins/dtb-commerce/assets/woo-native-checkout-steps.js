( function () {
	'use strict';

	const mobileViewport = window.matchMedia( '(max-width: 767px)' );
	const rootSelector = '.wc-block-checkout';
	const mainSelector = '.wc-block-components-main';
	const hiddenClass = 'is-dtb-mobile-step-hidden';
	const activeBodyClass = 'dtb-mobile-checkout-active';
	const nativeBootClass = 'dtb-native-checkout-booting';
	const nativeReadyClass = 'dtb-native-checkout-ready';

	const steps = [
		{
			label: 'Information',
			shortLabel: 'Info',
			selectors: [
				'.wp-block-woocommerce-checkout-express-payment-block',
				'.wc-block-components-express-payment',
				'.wp-block-woocommerce-checkout-contact-information-block',
				'.wp-block-woocommerce-checkout-shipping-address-block',
				'.wp-block-woocommerce-checkout-billing-address-block',
				'.wp-block-woocommerce-checkout-create-account-block',
			],
		},
		{
			label: 'Delivery',
			shortLabel: 'Delivery',
			selectors: [
				'.wp-block-woocommerce-checkout-shipping-method-block',
				'.wp-block-woocommerce-checkout-shipping-methods-block',
				'.wp-block-woocommerce-checkout-pickup-options-block',
			],
		},
		{
			label: 'Payment',
			shortLabel: 'Payment',
			selectors: [
				'.wp-block-woocommerce-checkout-payment-block',
				'.wp-block-woocommerce-checkout-order-note-block',
				'.wp-block-woocommerce-checkout-terms-block',
				'.wp-block-woocommerce-checkout-actions-block',
			],
		},
	];

	let checkoutRoot = null;
	let checkoutMain = null;
	let stepNavigation = null;
	let stepActions = null;
	let activeStep = 0;
	let refreshTimer = 0;
	let checkoutRevealed = false;

	function revealCheckout() {
		if ( checkoutRevealed ) {
			return;
		}

		checkoutRevealed = true;
		window.requestAnimationFrame( () => {
			window.requestAnimationFrame( () => {
				document.documentElement.classList.add( nativeReadyClass );
				window.setTimeout( () => {
					document.documentElement.classList.remove( nativeBootClass, nativeReadyClass );
					document.querySelector( '.dtb-native-checkout-loader' )?.setAttribute( 'aria-hidden', 'true' );
				}, 280 );
			} );
		} );
	}

	function updateGatewayPresentation() {
		const paymentBlock = checkoutMain?.querySelector( '.wp-block-woocommerce-checkout-payment-block' );
		const gatewayControl = paymentBlock?.querySelector( '.wc-block-components-radio-control' );
		if ( ! gatewayControl ) {
			return;
		}

		const directOptions = gatewayControl.querySelectorAll( ':scope > .wc-block-components-radio-control__option' );
		const accordionOptions = gatewayControl.querySelectorAll( ':scope > .wc-block-components-radio-control-accordion-option' );
		const gatewayOptionCount = accordionOptions.length || directOptions.length;
		gatewayControl.classList.toggle( 'is-dtb-single-gateway', gatewayOptionCount === 1 );
	}

	function stepNodes( step ) {
		if ( ! checkoutMain ) {
			return [];
		}

		return Array.from(
			checkoutMain.querySelectorAll( step.selectors.join( ',' ) )
		);
	}

	function availableStepIndexes() {
		return steps
			.map( ( step, index ) => ( stepNodes( step ).length ? index : -1 ) )
			.filter( ( index ) => index >= 0 );
	}

	function nextAvailableStep( fromIndex, direction ) {
		const available = availableStepIndexes();
		const currentPosition = available.indexOf( fromIndex );
		if ( currentPosition < 0 ) {
			return available[ 0 ] ?? 0;
		}

		const nextPosition = currentPosition + direction;
		return available[ nextPosition ] ?? fromIndex;
	}

	function createStepNavigation() {
		const navigation = document.createElement( 'nav' );
		navigation.className = 'dtb-mobile-checkout-nav';
		navigation.setAttribute( 'aria-label', 'Checkout progress' );

		const list = document.createElement( 'ol' );
		steps.forEach( ( step, index ) => {
			const item = document.createElement( 'li' );
			const button = document.createElement( 'button' );
			const number = document.createElement( 'span' );
			const label = document.createElement( 'span' );

			button.type = 'button';
			button.className = 'dtb-mobile-checkout-nav__button';
			button.dataset.step = String( index );
			button.setAttribute( 'aria-label', `Go to ${ step.label }` );
			number.className = 'dtb-mobile-checkout-nav__number';
			number.textContent = String( index + 1 );
			label.className = 'dtb-mobile-checkout-nav__label';
			label.textContent = step.shortLabel;

			button.append( number, label );
			button.addEventListener( 'click', () => {
				const requestedStep = Number( button.dataset.step );
				if ( requestedStep <= activeStep ) {
					showStep( requestedStep, true );
				}
			} );
			item.append( button );
			list.append( item );
		} );

		navigation.append( list );
		return navigation;
	}

	function createStepActions() {
		const actions = document.createElement( 'div' );
		actions.className = 'dtb-mobile-checkout-actions';

		const backButton = document.createElement( 'button' );
		backButton.type = 'button';
		backButton.className = 'dtb-mobile-checkout-actions__back';
		backButton.textContent = 'Back';
		backButton.addEventListener( 'click', () => {
			showStep( nextAvailableStep( activeStep, -1 ), true );
		} );

		const continueButton = document.createElement( 'button' );
		continueButton.type = 'button';
		continueButton.className = 'dtb-mobile-checkout-actions__continue';
		continueButton.addEventListener( 'click', () => {
			if ( validateActiveStep() ) {
				showStep( nextAvailableStep( activeStep, 1 ), true );
			}
		} );

		const status = document.createElement( 'span' );
		status.className = 'dtb-mobile-checkout-actions__status';
		status.setAttribute( 'aria-live', 'polite' );

		actions.append( backButton, continueButton, status );
		return actions;
	}

	function validateActiveStep() {
		const nodes = stepNodes( steps[ activeStep ] );
		const fields = nodes.flatMap( ( node ) =>
			Array.from( node.querySelectorAll( 'input, select, textarea' ) )
		);
		const invalidField = fields.find( ( field ) => {
			if (
				field.disabled ||
				field.type === 'hidden' ||
				field.closest( '[hidden], .' + hiddenClass )
			) {
				return false;
			}

			return typeof field.checkValidity === 'function' && ! field.checkValidity();
		} );

		if ( ! invalidField ) {
			return true;
		}

		if ( typeof invalidField.reportValidity === 'function' ) {
			invalidField.reportValidity();
		}
		invalidField.focus( { preventScroll: true } );
		invalidField.scrollIntoView( { behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' } );
		return false;
	}

	function reducedMotion() {
		return window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
	}

	function updateNavigation() {
		if ( ! stepNavigation || ! stepActions ) {
			return;
		}

		const available = availableStepIndexes();
		stepNavigation.querySelectorAll( '[data-step]' ).forEach( ( button ) => {
			const index = Number( button.dataset.step );
			const isAvailable = available.includes( index );
			const isCurrent = index === activeStep;
			const isComplete = isAvailable && index < activeStep;

			button.closest( 'li' ).hidden = ! isAvailable;
			button.disabled = index > activeStep;
			button.classList.toggle( 'is-current', isCurrent );
			button.classList.toggle( 'is-complete', isComplete );
			button.toggleAttribute( 'aria-current', isCurrent );
		} );

		const previousStep = nextAvailableStep( activeStep, -1 );
		const nextStep = nextAvailableStep( activeStep, 1 );
		const backButton = stepActions.querySelector( '.dtb-mobile-checkout-actions__back' );
		const continueButton = stepActions.querySelector( '.dtb-mobile-checkout-actions__continue' );
		const status = stepActions.querySelector( '.dtb-mobile-checkout-actions__status' );

		backButton.hidden = previousStep === activeStep;
		continueButton.hidden = nextStep === activeStep;
		continueButton.textContent = nextStep === 1 ? 'Continue to delivery' : 'Continue to payment';
		status.textContent = `Step ${ available.indexOf( activeStep ) + 1 } of ${ available.length }: ${ steps[ activeStep ].label }`;
	}

	function showStep( requestedStep, shouldScroll ) {
		const available = availableStepIndexes();
		activeStep = available.includes( requestedStep ) ? requestedStep : ( available[ 0 ] ?? 0 );

		steps.forEach( ( step, index ) => {
			stepNodes( step ).forEach( ( node ) => {
				const isActive = index === activeStep;
				node.dataset.dtbMobileStep = String( index );
				node.classList.toggle( hiddenClass, ! isActive );
				node.toggleAttribute( 'inert', ! isActive );
				node.setAttribute( 'aria-hidden', isActive ? 'false' : 'true' );
			} );
		} );

		updateNavigation();
		window.requestAnimationFrame( () => window.dispatchEvent( new Event( 'resize' ) ) );

		if ( shouldScroll && stepNavigation ) {
			stepNavigation.scrollIntoView( {
				behavior: reducedMotion() ? 'auto' : 'smooth',
				block: 'start',
			} );
		}
	}

	function mountEnhancement() {
		checkoutRoot = document.querySelector( rootSelector );
		checkoutMain = checkoutRoot?.querySelector( mainSelector ) ?? null;
		if ( checkoutRoot && checkoutMain ) {
			updateGatewayPresentation();
		}
		if ( ! checkoutRoot || ! checkoutMain ) {
			teardownEnhancement();
			return false;
		}
		if ( ! mobileViewport.matches ) {
			teardownEnhancement();
			revealCheckout();
			return true;
		}

		const paymentBlock = checkoutMain.querySelector( '.wp-block-woocommerce-checkout-payment-block' );
		const orderActions = checkoutMain.querySelector( '.wp-block-woocommerce-checkout-actions-block' );
		if ( ! paymentBlock || ! orderActions ) {
			return false;
		}

		if ( ! stepNavigation || ! stepNavigation.isConnected ) {
			stepNavigation?.remove();
			stepNavigation = createStepNavigation();
			checkoutMain.prepend( stepNavigation );
		}

		if ( ! stepActions || ! stepActions.isConnected ) {
			stepActions?.remove();
			stepActions = createStepActions();
			orderActions.before( stepActions );
		}

		document.body.classList.add( activeBodyClass );
		showStep( activeStep, false );
		revealCheckout();
		return true;
	}

	function teardownEnhancement() {
		document.body.classList.remove( activeBodyClass );
		document.querySelectorAll( '.' + hiddenClass ).forEach( ( node ) => {
			node.classList.remove( hiddenClass );
			node.removeAttribute( 'inert' );
			node.removeAttribute( 'aria-hidden' );
			delete node.dataset.dtbMobileStep;
		} );
		stepNavigation?.remove();
		stepActions?.remove();
		stepNavigation = null;
		stepActions = null;
	}

	function scheduleRefresh() {
		window.clearTimeout( refreshTimer );
		refreshTimer = window.setTimeout( mountEnhancement, 120 );
	}

	function initialize() {
		const observer = new MutationObserver( scheduleRefresh );
		observer.observe( document.body, { childList: true, subtree: true } );
		mobileViewport.addEventListener( 'change', scheduleRefresh );
		window.setTimeout( revealCheckout, 6000 );
		scheduleRefresh();
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
