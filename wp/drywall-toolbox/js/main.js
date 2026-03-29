/**
 * Drywall Toolbox Theme - Main JavaScript
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const emailForm = document.getElementById('emailForm');
        const emailInput = document.getElementById('emailInput');
        const messageEl = document.getElementById('message');

        if (!emailForm) {
            return;
        }

        // Form submission handler
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const nonce = document.querySelector('input[name="nonce"]').value;

            // Basic validation
            if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                showMessage('Please enter a valid email address.', 'error');
                return;
            }

            try {
                const response = await fetch(drywallToolbox.ajaxurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'drywall_toolbox_email_signup',
                        nonce: nonce,
                        email: email,
                    }).toString(),
                });

                const data = await response.json();

                if (data.success) {
                    showMessage(data.data.message, 'success');
                    emailInput.value = '';
                } else {
                    showMessage(data.data.message || 'Something went wrong. Please try again.', 'error');
                }
            } catch (error) {
                showMessage('Something went wrong. Please try again.', 'error');
                console.error('Signup error:', error);
            }
        });

        function showMessage(text, type = 'success') {
            if (!messageEl) {
                return;
            }

            messageEl.textContent = text;
            messageEl.className = `message show ${type}`;
            
            setTimeout(() => {
                messageEl.classList.remove('show');
            }, 5000);
        }

        // Handle focus on form input
        emailInput.addEventListener('focus', () => {
            if (messageEl) {
                messageEl.classList.remove('show');
            }
        });
    });
})();
