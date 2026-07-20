( function () {
	'use strict';

	const mobileViewport = window.matchMedia( '(max-width: 767px)' );
	const checkoutRootSelector = '.wc-block-checkout';
	const inactiveStepClass = 'is-dtb-checkout-step-inactive';
	const sheetOwnedClass = 'is-dtb-payment-sheet-owned';
	const sheetClosedClass = 'is-dtb-payment-sheet-closed';
	const sharedAddressAttribute = 'data-dtb-shared-address-section';
	const contactDetailAttribute = 'data-dtb-contact-detail-field';
	const shippingAddressAttribute = 'data-dtb-shipping-address-field';
	const accountContactTemplateId = 'dtb-checkout-account-contact-template';
	const accountContactClass = 'dtb-checkout-account-contact';
	const stepBodyClasses = [ 'dtb-checkout-step-contact', 'dtb-checkout-step-shipping', 'dtb-checkout-step-payment' ];
	const sheetCloseDuration = 240;
	const checkoutFilters = window.wc?.blocksCheckout;

	if ( checkoutFilters?.registerCheckoutFilters ) {
		checkoutFilters.registerCheckoutFilters( 'dtb-native-mobile-checkout', {
			placeOrderButtonLabel: ( defaultValue ) => mobileViewport.matches ? 'Pay now' : defaultValue,
		} );
	}

	const steps = [
		{
			id: 'contact',
			label: 'Contact',
			selectors: [
				'.wp-block-woocommerce-checkout-express-payment-block',
				'.wc-block-components-express-payment',
				'.wp-block-woocommerce-checkout-contact-information-block',
				'.wc-block-checkout__contact-fields',
				'.wp-block-woocommerce-checkout-create-account-block',
			],
		},
		{
			id: 'shipping',
			label: 'Shipping',
			selectors: [
				'.wp-block-woocommerce-checkout-shipping-address-block',
				'.wc-block-checkout__shipping-fields',
				'.wp-block-woocommerce-checkout-billing-address-block',
				'.wc-block-checkout__billing-fields',
				'.wp-block-woocommerce-checkout-shipping-method-block',
				'.wp-block-woocommerce-checkout-shipping-methods-block',
				'.wc-block-checkout__shipping-option',
				'.wc-block-checkout__shipping-method',
				'.wp-block-woocommerce-checkout-pickup-options-block',
			],
		},
		{
			id: 'payment',
			label: 'Payment',
			selectors: [
				'.wp-block-woocommerce-checkout-payment-block',
				'.wc-block-checkout__payment-method',
				'.wp-block-woocommerce-checkout-order-note-block',
				'.wc-block-checkout__order-notes',
				'.wp-block-woocommerce-checkout-actions-block',
				'.wc-block-checkout__actions',
				'.wp-block-woocommerce-checkout-terms-block',
				'.wc-block-checkout__terms',
			],
		},
	];

	const paymentSheetSelectors = [
		'.wp-block-woocommerce-checkout-payment-block',
		'.wc-block-checkout__payment-method',
		'.wp-block-woocommerce-checkout-order-note-block',
		'.wc-block-checkout__order-notes',
		'.wp-block-woocommerce-checkout-actions-block',
		'.wc-block-checkout__actions',
	];

	const refinedSectionDefinitions = {
		contact: {
			marker: 'contact',
			selectors: [
				'.wp-block-woocommerce-checkout-contact-information-block',
				'.wc-block-checkout__contact-fields',
				'[data-block-name="woocommerce/checkout-contact-information-block"]',
			],
			fallbackSelectors: [ 'input[type="email"]' ],
		},
		shippingAddress: {
			marker: 'shipping-address',
			selectors: [
				'.wp-block-woocommerce-checkout-shipping-address-block',
				'.wc-block-checkout__shipping-fields',
				'[data-block-name="woocommerce/checkout-shipping-address-block"]',
			],
			fallbackSelectors: [ '#shipping', '[id="shipping"]' ],
		},
		billingAddress: {
			marker: 'billing-address',
			selectors: [
				'.wp-block-woocommerce-checkout-billing-address-block',
				'.wc-block-checkout__billing-fields',
				'[data-block-name="woocommerce/checkout-billing-address-block"]',
			],
			fallbackSelectors: [ '#billing', '[id="billing"]' ],
		},
		shippingMethod: {
			marker: 'shipping-method',
			selectors: [
				'.wp-block-woocommerce-checkout-shipping-method-block',
				'.wp-block-woocommerce-checkout-shipping-methods-block',
				'.wc-block-checkout__shipping-option',
				'.wc-block-checkout__shipping-method',
				'.wp-block-woocommerce-checkout-pickup-options-block',
				'[data-block-name="woocommerce/checkout-shipping-method-block"]',
			],
			fallbackSelectors: [],
		},
	};

	let activeStep = 0;
	let highestVisitedStep = 0;
	let progress = null;
	let actions = null;
	let paymentSheetBackdrop = null;
	let paymentSheetHeader = null;
	let paymentSheetCloseButton = null;
	let paymentSheetOpen = false;
	let paymentSheetClosing = false;
	let paymentSheetCloseTimer = 0;
	let paymentSheetReturnFocus = null;
	let previousBodyOverflow = '';
	let initialObserver = null;
	let checkoutPresentationObserver = null;
	let presentationReconcileQueued = false;
	let initializationTimer = 0;
	const accountContactState = {};

	function uniqueElements( elements ) {
		return Array.from( new Set( elements.filter( Boolean ) ) );
	}

	function topLevelElements( elements ) {
		return elements.filter( ( candidate ) => ! elements.some( ( parent ) => parent !== candidate && parent.contains( candidate ) ) );
	}

	function checkoutRoot() {
		return document.querySelector( checkoutRootSelector );
	}

	function checkoutMain() {
		return checkoutRoot()?.querySelector( '.wc-block-components-main, .wc-block-checkout__main' ) || null;
	}

	function isGuestCheckout() {
		return ! document.body.classList.contains( 'logged-in' );
	}

	function isShippingAddressSection( node ) {
		return node instanceof Element && (
			node.matches( refinedSectionDefinitions.shippingAddress.selectors.join( ',' ) )
			|| Boolean( node.querySelector( refinedSectionDefinitions.shippingAddress.selectors.join( ',' ) ) )
		);
	}

	function addressControlKind( control ) {
		if ( ! ( control instanceof HTMLInputElement ) ) {
			return '';
		}

		const descriptor = [ control.id, control.name, control.autocomplete ]
			.filter( Boolean )
			.join( ' ' )
			.toLowerCase();
		if ( /(?:first[_-]?name|given-name)/.test( descriptor ) ) {
			return 'first-name';
		}
		if ( /(?:last[_-]?name|family-name)/.test( descriptor ) ) {
			return 'last-name';
		}
		if ( control.type === 'tel' || /(?:phone|\btel\b)/.test( descriptor ) ) {
			return 'phone';
		}
		return '';
	}

	function addressFieldWrapper( control, section ) {
		const wrapper = control.closest( [
			'.wc-block-components-text-input',
			'.wc-block-components-combobox',
			'.wc-block-components-address-form__field',
			'.components-base-control',
		].join( ',' ) );
		return wrapper && section.contains( wrapper ) ? wrapper : control.parentElement;
	}

	function clearSharedAddressPresentation() {
		document.querySelectorAll( `[${ sharedAddressAttribute }]` ).forEach( ( section ) => {
			section.classList.remove( inactiveStepClass );
			section.removeAttribute( 'aria-hidden' );
			section.removeAttribute( sharedAddressAttribute );
		} );
		document.querySelectorAll( `[${ contactDetailAttribute }], [${ shippingAddressAttribute }]` ).forEach( ( field ) => {
			field.removeAttribute( contactDetailAttribute );
			field.removeAttribute( shippingAddressAttribute );
		} );
	}

	function clearProgressiveCheckoutPresentation() {
		document.body.classList.remove( 'dtb-checkout-enhanced', 'dtb-mobile-checkout-enhanced', ...stepBodyClasses );
		progress?.remove();
		progress = null;
		actions?.remove();
		actions = null;

		document.querySelectorAll( '[data-dtb-checkout-step], [data-dtb-mobile-refinement-step]' ).forEach( ( node ) => {
			node.classList.remove( inactiveStepClass );
			node.removeAttribute( 'aria-hidden' );
			delete node.dataset.dtbCheckoutStep;
			delete node.dataset.dtbMobileRefinementStep;
		} );
		expressCheckoutElements().forEach( ( node ) => {
			node.classList.remove( inactiveStepClass );
			node.removeAttribute( 'aria-hidden' );
		} );
		paymentSheetElements().forEach( ( node ) => {
			node.classList.remove( sheetOwnedClass, sheetClosedClass );
			node.removeAttribute( 'aria-hidden' );
			delete node.dataset.dtbPaymentSheetOwned;
		} );
		document.querySelectorAll( `.${ accountContactClass }` ).forEach( ( node ) => node.remove() );
		document.querySelectorAll( '.has-dtb-account-contact' ).forEach( ( node ) => node.classList.remove( 'has-dtb-account-contact' ) );
		clearSharedAddressPresentation();
	}

	function reconcileGuestContactDetails() {
		if ( ! isGuestCheckout() ) {
			clearSharedAddressPresentation();
			return;
		}

		const activeStepId = steps[ activeStep ]?.id || 'contact';
		refinedSectionRoots( refinedSectionDefinitions.shippingAddress ).forEach( ( section ) => {
			section.setAttribute( sharedAddressAttribute, '1' );
			const hidden = activeStepId === 'payment';
			section.classList.toggle( inactiveStepClass, hidden );
			section.setAttribute( 'aria-hidden', hidden ? 'true' : 'false' );

			section.querySelectorAll( 'input:not([type="hidden"]), select' ).forEach( ( control ) => {
				const wrapper = addressFieldWrapper( control, section );
				if ( ! ( wrapper instanceof Element ) ) {
					return;
				}

				const kind = addressControlKind( control );
				wrapper.removeAttribute( contactDetailAttribute );
				wrapper.removeAttribute( shippingAddressAttribute );
				if ( kind ) {
					wrapper.setAttribute( contactDetailAttribute, kind );
				} else {
					wrapper.setAttribute( shippingAddressAttribute, '1' );
				}
			} );
		} );
	}

	function contactValueControl( kind ) {
		const root = checkoutRoot();
		if ( ! root ) {
			return null;
		}

		if ( kind === 'email' ) {
			const contactSection = topLevelElements( refinedSectionRoots( refinedSectionDefinitions.contact ) )[ 0 ] || root;
			return contactSection.querySelector( 'input[type="email"], input[autocomplete="email"]' );
		}

		return Array.from( root.querySelectorAll( 'input:not([type="hidden"])' ) ).find( ( control ) =>
			addressControlKind( control ) === kind
		) || null;
	}

	function setContactSummaryValue( summary, selector, value ) {
		const target = summary.querySelector( selector );
		if ( target && typeof value === 'string' && target.textContent !== value ) {
			target.textContent = value;
		}
	}

	function reconcileLoggedInContactSummary() {
		const existingSummaries = Array.from( document.querySelectorAll( `.${ accountContactClass }` ) );
		if ( isGuestCheckout() || mobileViewport.matches ) {
			existingSummaries.forEach( ( summary ) => summary.remove() );
			document.querySelectorAll( '.has-dtb-account-contact' ).forEach( ( section ) => {
				section.classList.remove( 'has-dtb-account-contact' );
			} );
			return;
		}

		const template = document.getElementById( accountContactTemplateId );
		const contactSection = topLevelElements( refinedSectionRoots( refinedSectionDefinitions.contact ) )[ 0 ];
		if ( ! ( template instanceof HTMLTemplateElement ) || ! contactSection ) {
			return;
		}

		let summary = contactSection.querySelector( `.${ accountContactClass }` );
		if ( ! summary ) {
			existingSummaries.forEach( ( candidate ) => candidate.remove() );
			summary = template.content.firstElementChild?.cloneNode( true ) || null;
			const container = contactSection.querySelector( '.wc-block-components-checkout-step__container' ) || contactSection;
			if ( ! summary || ! container ) {
				return;
			}
			container.prepend( summary );
		}

		contactSection.classList.add( 'has-dtb-account-contact' );
		const firstNameControl = contactValueControl( 'first-name' );
		const lastNameControl = contactValueControl( 'last-name' );
		const emailControl = contactValueControl( 'email' );
		const phoneControl = contactValueControl( 'phone' );
		if ( firstNameControl || lastNameControl ) {
			accountContactState.name = `${ firstNameControl?.value.trim() || '' } ${ lastNameControl?.value.trim() || '' }`.trim();
		} else if ( typeof accountContactState.name !== 'string' ) {
			accountContactState.name = summary.querySelector( '[data-dtb-account-contact-name]' )?.textContent.trim() || '';
		}
		if ( emailControl ) {
			accountContactState.email = emailControl.value.trim();
		} else if ( typeof accountContactState.email !== 'string' ) {
			accountContactState.email = summary.querySelector( '[data-dtb-account-contact-email]' )?.textContent.trim() || '';
		}
		if ( phoneControl ) {
			accountContactState.phone = phoneControl.value.trim();
		} else if ( typeof accountContactState.phone !== 'string' ) {
			accountContactState.phone = summary.querySelector( '[data-dtb-account-contact-phone]' )?.textContent.trim() || '';
		}

		setContactSummaryValue( summary, '[data-dtb-account-contact-name]', accountContactState.name );
		setContactSummaryValue( summary, '[data-dtb-account-contact-email]', accountContactState.email );
		setContactSummaryValue( summary, '[data-dtb-account-contact-phone]', accountContactState.phone );

		const phoneWrapper = summary.querySelector( '[data-dtb-account-contact-phone-wrap]' );
		if ( phoneWrapper ) {
			phoneWrapper.hidden = accountContactState.phone === '';
		}
	}

	function safeSectionRoot( node ) {
		if ( ! ( node instanceof Element ) ) {
			return null;
		}

		return node.closest( [
			'.wp-block-woocommerce-checkout-contact-information-block',
			'.wp-block-woocommerce-checkout-shipping-address-block',
			'.wp-block-woocommerce-checkout-billing-address-block',
			'.wp-block-woocommerce-checkout-shipping-method-block',
			'.wp-block-woocommerce-checkout-shipping-methods-block',
			'.wc-block-checkout__contact-fields',
			'.wc-block-checkout__shipping-fields',
			'.wc-block-checkout__billing-fields',
			'.wc-block-checkout__shipping-option',
			'.wc-block-checkout__shipping-method',
			'.wc-block-components-checkout-step',
		].join( ',' ) );
	}

	function refinedSectionRoots( definition ) {
		const root = checkoutRoot();
		if ( ! root ) {
			return [];
		}

		const direct = definition.selectors.flatMap( ( selector ) => Array.from( root.querySelectorAll( selector ) ) );
		const fallback = definition.fallbackSelectors.flatMap( ( selector ) =>
			Array.from( root.querySelectorAll( selector ) ).map( safeSectionRoot )
		);

		return uniqueElements( [ ...direct, ...fallback ] ).filter( ( node ) =>
			node instanceof Element && ! node.closest( '[data-dtb-payment-sheet-owned]' )
		);
	}

	function setRefinedSectionState( node, marker, visible ) {
		node.dataset.dtbMobileRefinementStep = marker;
		node.classList.toggle( inactiveStepClass, ! visible );
		node.setAttribute( 'aria-hidden', visible ? 'false' : 'true' );
	}

	function reconcileRefinedSections() {
		const activeStepId = steps[ activeStep ]?.id || 'contact';
		refinedSectionRoots( refinedSectionDefinitions.contact ).forEach( ( node ) => {
			setRefinedSectionState( node, refinedSectionDefinitions.contact.marker, activeStepId === 'contact' );
		} );

		const shippingVisible = activeStepId === 'shipping';
		const shippingDefinitions = isGuestCheckout()
			? [ 'billingAddress', 'shippingMethod' ]
			: [ 'shippingAddress', 'billingAddress', 'shippingMethod' ];
		shippingDefinitions.forEach( ( definitionKey ) => {
			const definition = refinedSectionDefinitions[ definitionKey ];
			refinedSectionRoots( definition ).forEach( ( node ) => {
				setRefinedSectionState( node, definition.marker, shippingVisible );
			} );
		} );
		reconcileGuestContactDetails();
	}

	function stepElements( stepIndex ) {
		const root = checkoutRoot();
		if ( ! root || ! steps[ stepIndex ] ) {
			return [];
		}

		const candidates = uniqueElements(
			steps[ stepIndex ].selectors.flatMap( ( selector ) => Array.from( root.querySelectorAll( selector ) ) )
		).filter( ( node ) => ! node.closest( '.is-dtb-order-summary-duplicate' ) );

		return topLevelElements( candidates );
	}

	function stepElementMap() {
		const map = new Map();
		const mobilePaymentElements = mobileViewport.matches ? new Set( paymentSheetElements() ) : null;
		steps.forEach( ( step, index ) => {
			stepElements( index ).forEach( ( node ) => {
				if ( step.id === 'payment' && mobilePaymentElements?.has( node ) ) {
					return;
				}
				if ( isGuestCheckout() && step.id === 'shipping' && isShippingAddressSection( node ) ) {
					return;
				}
				if ( ! map.has( node ) ) {
					map.set( node, index );
				}
			} );
		} );
		return map;
	}

	function reconcileStepElementState() {
		if ( ! document.body.classList.contains( 'dtb-checkout-enhanced' ) ) {
			return;
		}

		document.querySelectorAll( '[data-dtb-checkout-step]' ).forEach( ( node ) => {
			node.classList.remove( inactiveStepClass );
			node.removeAttribute( 'aria-hidden' );
			delete node.dataset.dtbCheckoutStep;
		} );
		stepElementMap().forEach( ( owningStep, node ) => {
			const inactive = owningStep !== activeStep;
			node.dataset.dtbCheckoutStep = steps[ owningStep ].id;
			node.classList.toggle( inactiveStepClass, inactive );
			node.setAttribute( 'aria-hidden', inactive ? 'true' : 'false' );
		} );
	}

	function paymentSheetElements() {
		const root = checkoutRoot();
		if ( ! root ) {
			return [];
		}

		return topLevelElements( uniqueElements(
			paymentSheetSelectors.flatMap( ( selector ) => Array.from( root.querySelectorAll( selector ) ) )
		) );
	}

	function orderSummaryCandidates() {
		const blockSummaries = Array.from( document.querySelectorAll( '.wp-block-woocommerce-checkout-order-summary-block' ) );
		const standaloneSummaries = Array.from( document.querySelectorAll( '.wc-block-components-order-summary' ) )
			.filter( ( node ) => ! node.closest( '.wp-block-woocommerce-checkout-order-summary-block' ) );
		return topLevelElements( uniqueElements( [ ...blockSummaries, ...standaloneSummaries ] ) );
	}

	function markDuplicateOrderSummaries() {
		const candidates = orderSummaryCandidates();
		candidates.forEach( ( node ) => node.classList.remove( 'is-dtb-order-summary-duplicate' ) );
		if ( candidates.length < 2 ) {
			return;
		}

		const canonical = candidates.find( ( node ) => node.closest( '.wc-block-components-sidebar, .wc-block-checkout__sidebar' ) ) || candidates[ 0 ];
		candidates.forEach( ( node ) => {
			if ( node !== canonical ) {
				node.classList.add( 'is-dtb-order-summary-duplicate' );
			}
		} );
	}

	function expressCheckoutElements() {
		const root = checkoutRoot();
		if ( ! root ) {
			return [];
		}

		return topLevelElements( uniqueElements( [
			...root.querySelectorAll( '.wp-block-woocommerce-checkout-express-payment-block' ),
			...root.querySelectorAll( '.wc-block-components-express-payment' ),
		] ) );
	}

	function reconcileExpressCheckoutVisibility() {
		const visible = activeStep === 0 || ( mobileViewport.matches && paymentSheetOpen );
		expressCheckoutElements().forEach( ( node ) => {
			node.classList.toggle( inactiveStepClass, ! visible );
			node.setAttribute( 'aria-hidden', visible ? 'false' : 'true' );
		} );
	}

	function gatewayOptions( radioControl ) {
		const directOptions = Array.from( radioControl.children ).filter( ( node ) =>
			node.matches( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' )
		);
		if ( directOptions.length > 0 ) {
			return directOptions;
		}

		return uniqueElements(
			Array.from( radioControl.querySelectorAll( 'input[type="radio"]' ) )
				.map( ( input ) => input.closest( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' ) )
		).filter( ( node ) => node && node.closest( '.wc-block-components-radio-control' ) === radioControl );
	}

	function markSingleGatewayPresentation() {
		const root = checkoutRoot();
		if ( ! root ) {
			return;
		}

		root.querySelectorAll( '.wc-block-components-payment-methods.is-dtb-single-gateway-set' ).forEach( ( methods ) => {
			methods.classList.remove( 'is-dtb-single-gateway-set' );
		} );

		root.querySelectorAll( '.wc-block-checkout__payment-method .wc-block-components-radio-control' ).forEach( ( radioControl ) => {
			const isSingleGateway = gatewayOptions( radioControl ).length === 1;
			radioControl.classList.toggle( 'is-dtb-single-gateway', isSingleGateway );
			if ( isSingleGateway ) {
				radioControl.closest( '.wc-block-components-payment-methods' )?.classList.add( 'is-dtb-single-gateway-set' );
			}
		} );
	}

	function reconcileCheckoutPresentation() {
		presentationReconcileQueued = false;
		markDuplicateOrderSummaries();
		if ( ! mobileViewport.matches ) {
			clearProgressiveCheckoutPresentation();
			return;
		}
		markSingleGatewayPresentation();
		reconcileStepElementState();
		reconcileRefinedSections();
		markPaymentSheetElements();
		reconcileExpressCheckoutVisibility();
		reconcileLoggedInContactSummary();
	}

	function queueCheckoutPresentationReconcile() {
		if ( presentationReconcileQueued ) {
			return;
		}
		presentationReconcileQueued = true;
		window.requestAnimationFrame( reconcileCheckoutPresentation );
	}

	function observeCheckoutPresentation() {
		if ( checkoutPresentationObserver ) {
			return;
		}

		checkoutPresentationObserver = new MutationObserver( queueCheckoutPresentationReconcile );
		checkoutPresentationObserver.observe( document.body, { childList: true, subtree: true } );
	}

	function markPaymentSheetElements() {
		paymentSheetElements().forEach( ( node ) => {
			if ( ! mobileViewport.matches ) {
				node.classList.remove( sheetOwnedClass, sheetClosedClass );
				delete node.dataset.dtbPaymentSheetOwned;
				return;
			}
			node.classList.add( sheetOwnedClass );
			node.dataset.dtbPaymentSheetOwned = '1';
			node.classList.toggle( sheetClosedClass, ! paymentSheetOpen );
			node.setAttribute( 'aria-hidden', paymentSheetOpen ? 'false' : 'true' );
		} );
	}

	function createProgress() {
		const nav = document.createElement( 'nav' );
		nav.className = 'dtb-mobile-checkout-progress';
		nav.setAttribute( 'aria-label', 'Checkout progress' );

		const list = document.createElement( 'ol' );
		list.className = 'dtb-mobile-checkout-progress__track';
		steps.forEach( ( step, index ) => {
			const item = document.createElement( 'li' );
			item.className = 'dtb-mobile-checkout-progress__item';

			const button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'dtb-mobile-checkout-progress__button';
			button.dataset.step = String( index );
			button.setAttribute( 'aria-label', `Go to ${ step.label }` );
			button.addEventListener( 'click', () => {
				if ( index <= highestVisitedStep && ! paymentSheetOpen ) {
					showStep( index, true );
				}
			} );

			const number = document.createElement( 'span' );
			number.className = 'dtb-mobile-checkout-progress__number';
			number.textContent = String( index + 1 );

			const label = document.createElement( 'span' );
			label.textContent = step.label;

			button.append( number, label );
			item.append( button );
			list.append( item );
		} );

		nav.append( list );
		return nav;
	}

	function createActions() {
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'dtb-mobile-checkout-actions';

		const back = document.createElement( 'button' );
		back.type = 'button';
		back.className = 'dtb-mobile-checkout-actions__back';
		back.textContent = 'Back';
		back.addEventListener( 'click', () => {
			if ( ! paymentSheetOpen ) {
				showStep( Math.max( 0, activeStep - 1 ), true );
			}
		} );

		const next = document.createElement( 'button' );
		next.type = 'button';
		next.className = 'dtb-mobile-checkout-actions__next';
		next.addEventListener( 'click', () => {
			if ( activeStep < steps.length - 1 ) {
				if ( activeStep === 0 && ! validateGuestContactDetails() ) {
					return;
				}
				const nextStep = activeStep + 1;
				highestVisitedStep = Math.max( highestVisitedStep, nextStep );
				showStep( nextStep, true );
				return;
			}
			if ( mobileViewport.matches ) {
				openPaymentSheet( next );
			}
		} );

		wrapper.append( back, next );
		return wrapper;
	}

	function contactControl( kind ) {
		return document.querySelector( `[${ contactDetailAttribute }="${ kind }"] input` );
	}

	function validateGuestContactDetails() {
		if ( ! isGuestCheckout() ) {
			return true;
		}

		const contactSection = refinedSectionRoots( refinedSectionDefinitions.contact )[ 0 ] || checkoutRoot();
		const fields = [
			{ control: contactControl( 'first-name' ), message: 'Enter your first name.' },
			{ control: contactControl( 'last-name' ), message: 'Enter your last name.' },
			{
				control: contactSection?.querySelector( 'input[type="email"], input[autocomplete="email"]' ),
				message: 'Enter a valid email address.',
			},
		];

		for ( const field of fields ) {
			const control = field.control;
			if ( ! ( control instanceof HTMLInputElement ) ) {
				continue;
			}

			control.required = true;
			control.setCustomValidity( '' );
			if ( control.value.trim() === '' ) {
				control.setCustomValidity( field.message );
			}
			if ( ! control.checkValidity() ) {
				control.reportValidity();
				control.focus( { preventScroll: true } );
				control.scrollIntoView( { behavior: 'smooth', block: 'center' } );
				return false;
			}
		}

		return true;
	}

	function ensurePaymentSheetChrome() {
		if ( paymentSheetBackdrop && paymentSheetHeader ) {
			return;
		}

		paymentSheetBackdrop = document.createElement( 'button' );
		paymentSheetBackdrop.type = 'button';
		paymentSheetBackdrop.className = 'dtb-payment-sheet-backdrop';
		paymentSheetBackdrop.setAttribute( 'aria-label', 'Close payment sheet' );
		paymentSheetBackdrop.addEventListener( 'click', () => closePaymentSheet() );

		paymentSheetHeader = document.createElement( 'div' );
		paymentSheetHeader.className = 'dtb-payment-sheet-header';
		paymentSheetHeader.setAttribute( 'aria-hidden', 'true' );

		const handle = document.createElement( 'span' );
		handle.className = 'dtb-payment-sheet-handle';
		handle.setAttribute( 'aria-hidden', 'true' );

		const title = document.createElement( 'h2' );
		title.className = 'dtb-payment-sheet-title';
		title.textContent = 'Complete payment';

		paymentSheetCloseButton = document.createElement( 'button' );
		paymentSheetCloseButton.type = 'button';
		paymentSheetCloseButton.className = 'dtb-payment-sheet-close';
		paymentSheetCloseButton.setAttribute( 'aria-label', 'Close payment sheet' );
		paymentSheetCloseButton.innerHTML = '<span aria-hidden="true">×</span>';
		paymentSheetCloseButton.addEventListener( 'click', () => closePaymentSheet() );

		paymentSheetHeader.append( handle, title, paymentSheetCloseButton );
		document.body.append( paymentSheetBackdrop, paymentSheetHeader );
	}

	function sheetBackgroundElements() {
		return uniqueElements( [
			document.querySelector( '.dtb-checkout-header' ),
			document.querySelector( '.dtb-checkout-intro' ),
			progress,
			document.querySelector( '.wc-block-components-sidebar, .wc-block-checkout__sidebar' ),
			actions,
		] );
	}

	function setSheetBackgroundInert( inert ) {
		sheetBackgroundElements().forEach( ( node ) => {
			if ( inert ) {
				if ( ! node.hasAttribute( 'inert' ) ) {
					node.dataset.dtbPaymentSheetInert = '1';
					node.setAttribute( 'inert', '' );
				}
			} else if ( node.dataset.dtbPaymentSheetInert === '1' ) {
				node.removeAttribute( 'inert' );
				delete node.dataset.dtbPaymentSheetInert;
			}
		} );
	}

	function finishClosingPaymentSheet( restoreFocus ) {
		window.clearTimeout( paymentSheetCloseTimer );
		paymentSheetCloseTimer = 0;
		paymentSheetOpen = false;
		paymentSheetClosing = false;
		document.body.classList.remove( 'dtb-payment-sheet-open', 'dtb-payment-sheet-closing' );
		markPaymentSheetElements();
		reconcileExpressCheckoutVisibility();
		setSheetBackgroundInert( false );
		document.body.style.overflow = previousBodyOverflow;

		const main = checkoutMain();
		if ( main ) {
			main.removeAttribute( 'role' );
			main.removeAttribute( 'aria-modal' );
			main.removeAttribute( 'aria-label' );
		}

		paymentSheetHeader?.setAttribute( 'aria-hidden', 'true' );
		if ( restoreFocus && paymentSheetReturnFocus instanceof HTMLElement ) {
			paymentSheetReturnFocus.focus( { preventScroll: true } );
		}
		paymentSheetReturnFocus = null;
	}

	function closePaymentSheet( options = {} ) {
		const { immediate = false, restoreFocus = true } = options;
		if ( ! paymentSheetOpen && ! paymentSheetClosing ) {
			return;
		}

		if ( immediate ) {
			finishClosingPaymentSheet( restoreFocus );
			return;
		}

		paymentSheetClosing = true;
		document.body.classList.add( 'dtb-payment-sheet-closing' );
		paymentSheetCloseTimer = window.setTimeout( () => finishClosingPaymentSheet( restoreFocus ), sheetCloseDuration );
	}

	function openPaymentSheet( trigger ) {
		if ( ! mobileViewport.matches || activeStep !== steps.length - 1 || paymentSheetOpen ) {
			return;
		}

		const main = checkoutMain();
		if ( ! main || paymentSheetElements().length === 0 ) {
			return;
		}

		ensurePaymentSheetChrome();
		paymentSheetReturnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
		previousBodyOverflow = document.body.style.overflow;
		paymentSheetOpen = true;
		paymentSheetClosing = false;
		window.clearTimeout( paymentSheetCloseTimer );
		document.body.classList.remove( 'dtb-payment-sheet-closing' );
		document.body.classList.add( 'dtb-payment-sheet-open' );
		document.body.style.overflow = 'hidden';
		markPaymentSheetElements();
		reconcileExpressCheckoutVisibility();
		setSheetBackgroundInert( true );

		main.setAttribute( 'role', 'dialog' );
		main.setAttribute( 'aria-modal', 'true' );
		main.setAttribute( 'aria-label', 'Complete payment' );
		paymentSheetHeader?.setAttribute( 'aria-hidden', 'false' );

		window.requestAnimationFrame( () => {
			paymentSheetCloseButton?.focus( { preventScroll: true } );
		} );
	}

	function updateControls() {
		progress?.querySelectorAll( '[data-step]' ).forEach( ( button ) => {
			const index = Number( button.dataset.step );
			const isCurrent = index === activeStep;
			const isComplete = index < activeStep;
			const item = button.closest( '.dtb-mobile-checkout-progress__item' );
			const number = button.querySelector( '.dtb-mobile-checkout-progress__number' );

			button.classList.toggle( 'is-current', isCurrent );
			button.classList.toggle( 'is-complete', isComplete );
			item?.classList.toggle( 'is-current', isCurrent );
			item?.classList.toggle( 'is-complete', isComplete );
			if ( number ) {
				number.textContent = isComplete ? '✓' : String( index + 1 );
			}
			button.disabled = index > highestVisitedStep || paymentSheetOpen;
			if ( isCurrent ) {
				button.setAttribute( 'aria-current', 'step' );
			} else {
				button.removeAttribute( 'aria-current' );
			}
		} );

		if ( actions ) {
			const back = actions.querySelector( '.dtb-mobile-checkout-actions__back' );
			const next = actions.querySelector( '.dtb-mobile-checkout-actions__next' );
			back.hidden = activeStep === 0;
			next.hidden = ! mobileViewport.matches && activeStep === steps.length - 1;
			next.textContent = activeStep === 0
				? 'Continue to shipping'
				: activeStep === 1
					? 'Review order'
					: 'Continue to payment';
			next.setAttribute( 'aria-expanded', paymentSheetOpen ? 'true' : 'false' );
		}
	}

	function showStep( requestedStep, shouldScroll = false ) {
		if ( paymentSheetOpen || paymentSheetClosing ) {
			closePaymentSheet( { immediate: true, restoreFocus: false } );
		}

		activeStep = Math.max( 0, Math.min( requestedStep, steps.length - 1 ) );
		reconcileStepElementState();
		reconcileExpressCheckoutVisibility();

		markPaymentSheetElements();
		document.body.classList.remove( ...stepBodyClasses );
		document.body.classList.add( `dtb-checkout-step-${ steps[ activeStep ].id }` );
		reconcileRefinedSections();
		markDuplicateOrderSummaries();
		updateControls();

		if ( shouldScroll && progress ) {
			progress.scrollIntoView( {
				behavior: window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ? 'auto' : 'smooth',
				block: 'start',
			} );
		}
	}

	function handleCheckoutFocus( event ) {
		if ( ! ( event.target instanceof Element ) ) {
			return;
		}

		const sheetOwned = event.target.closest( '[data-dtb-payment-sheet-owned]' );
		if ( sheetOwned ) {
			if ( activeStep !== steps.length - 1 ) {
				highestVisitedStep = steps.length - 1;
				showStep( steps.length - 1, false );
			}
			if ( ! paymentSheetOpen ) {
				openPaymentSheet( actions?.querySelector( '.dtb-mobile-checkout-actions__next' ) );
			}
			return;
		}

		const section = event.target.closest( '[data-dtb-checkout-step]' );
		if ( ! section?.classList.contains( inactiveStepClass ) ) {
			return;
		}

		const stepIndex = steps.findIndex( ( step ) => step.id === section.dataset.dtbCheckoutStep );
		if ( stepIndex >= 0 ) {
			closePaymentSheet( { immediate: true, restoreFocus: false } );
			highestVisitedStep = Math.max( highestVisitedStep, stepIndex );
			showStep( stepIndex, true );
		}
	}

	function handleGlobalKeydown( event ) {
		if ( event.key === 'Escape' && paymentSheetOpen ) {
			event.preventDefault();
			closePaymentSheet();
		}
	}

	function placeActions( root ) {
		if ( ! actions ) {
			return;
		}
		root.insertAdjacentElement( 'afterend', actions );
	}

	function mountCheckoutEnhancement() {
		if ( ! mobileViewport.matches ) {
			clearProgressiveCheckoutPresentation();
			return true;
		}

		const root = checkoutRoot();
		const paymentBlock = root?.querySelector( '.wp-block-woocommerce-checkout-payment-block, .wc-block-checkout__payment-method' );
		const orderActions = root?.querySelector( '.wp-block-woocommerce-checkout-actions-block, .wc-block-checkout__actions' );
		const sidebar = root?.querySelector( '.wc-block-components-sidebar, .wc-block-checkout__sidebar' );
		if ( ! root || ! paymentBlock || ! orderActions || ! sidebar ) {
			return false;
		}

		reconcileCheckoutPresentation();
		ensurePaymentSheetChrome();
		markPaymentSheetElements();
		if ( ! progress ) {
			progress = createProgress();
			root.parentNode?.insertBefore( progress, root );
		}
		if ( ! actions ) {
			actions = createActions();
		}
		placeActions( root );
		if ( root.dataset.dtbStepperFocusBound !== '1' ) {
			root.dataset.dtbStepperFocusBound = '1';
			root.addEventListener( 'focusin', handleCheckoutFocus );
		}

		document.body.classList.add( 'dtb-checkout-enhanced' );
		document.body.classList.add( 'dtb-mobile-checkout-enhanced' );
		showStep( activeStep, false );
		return true;
	}

	function handleViewportChange() {
		closePaymentSheet( { immediate: true, restoreFocus: false } );
		mountCheckoutEnhancement();
		queueCheckoutPresentationReconcile();
	}

	function initialize() {
		mobileViewport.addEventListener( 'change', handleViewportChange );
		document.addEventListener( 'keydown', handleGlobalKeydown );
		document.addEventListener( 'input', queueCheckoutPresentationReconcile );
		document.addEventListener( 'change', queueCheckoutPresentationReconcile );
		observeCheckoutPresentation();
		reconcileCheckoutPresentation();
		if ( mountCheckoutEnhancement() ) {
			window.setTimeout( queueCheckoutPresentationReconcile, 500 );
			window.setTimeout( queueCheckoutPresentationReconcile, 1500 );
			return;
		}

		initialObserver = new MutationObserver( () => {
			if ( mountCheckoutEnhancement() ) {
				initialObserver?.disconnect();
				initialObserver = null;
				window.clearTimeout( initializationTimer );
				window.setTimeout( queueCheckoutPresentationReconcile, 500 );
				window.setTimeout( queueCheckoutPresentationReconcile, 1500 );
			}
		} );
		initialObserver.observe( document.body, { childList: true, subtree: true } );

		initializationTimer = window.setTimeout( () => {
			initialObserver?.disconnect();
			initialObserver = null;
			queueCheckoutPresentationReconcile();
			mountCheckoutEnhancement();
		}, 5000 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
