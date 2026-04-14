# Dev Brief: Full Auth System — Drywall Toolbox

## Overview

This brief covers everything needed to implement a complete customer authentication system for Drywall Toolbox. The backend is WordPress with WooCommerce and a custom REST API plugin. The frontend is a React SPA. Some pieces already exist — this document covers what needs to be built, what needs to be extended, and the exact order to do it.

---

## What Already Exists — Do Not Overwrite

Before starting, make sure you are familiar with these files:

- **`dtb-auth.php`** — Custom WordPress REST plugin. Already has working login, logout, and validate endpoints using JWT cookies.
- **`src/auth/tokenStore.js`** — In-memory token store on the React side.
- **`src/auth/AuthContext.js`** — React context that currently wraps login and logout. Needs to be extended.
- **`src/api/auth.js`** — API helper file, currently a shim. Will be used once the hook is in place.
- **`api/customers.js`** — Already has `registerCustomer()` and `getCustomer()` helpers.

---

## Implementation Order

Complete these steps in sequence. Each step builds on the one before it.

---

### Step 1 — Refactor Cookie-Setting Logic in `dtb-auth.php`

The existing login endpoint almost certainly sets the JWT auth cookie inline. Extract that cookie-setting logic into a standalone internal PHP function that can be called by both the login and the new registration endpoint.

The cookie must be configured as HTTP-only, secure, same-site strict, scoped to the root path, and set to expire in 7 days. These settings must not change. Once the helper function exists, update the login endpoint to call it instead of using any inline cookie logic.

---

### Step 2 — Add a Registration Endpoint to `dtb-auth.php`

Add a new `POST` route at `/dtb/v1/auth/register`. This endpoint needs to do the following in order:

**Validation** — Check that the email is a valid email address, that the password meets a minimum length of 8 characters, and that no existing WordPress account uses that email. Return appropriate error responses for each failure case. For a duplicate email, return a 409. For validation failures, return a 422.

**WordPress user creation** — Create a new WP user using the email as both the username and email. Set the user's first name, last name, display name, and role. The role must be `customer`.

**WooCommerce customer creation** — Immediately after the WP user is created, create a matching WooCommerce customer record tied to the same user ID. Populate the WC customer with the same first name, last name, and email. This ensures the account is visible in both WP Admin → Users and WooCommerce → Customers. Guard this block so it only runs if WooCommerce is active.

**Auto-login** — After the account is created, generate a JWT for the new user and set the auth cookie using the helper from Step 1. The user should be logged in immediately after registering without needing a separate login step.

**Welcome email** — Trigger the standard WordPress new user notification email.

**Response** — Return a 201 with the user's ID, email, display name, and roles.

---

### Step 3 — Add Password Reset Endpoints to `dtb-auth.php`

Add two new routes.

**`POST /dtb/v1/auth/forgot-password`** — Accepts an email address. Looks up the corresponding WP user. If the user exists, generate a password reset key using WordPress's native reset key function and send an email via `wp_mail()`. The reset link in the email must point to the React frontend at `/reset-password` and include the key and login as query parameters — it must not point to `wp-login.php`. Regardless of whether the email matched a real account, always return HTTP 200 with the same generic message. This prevents user enumeration.

**`POST /dtb/v1/auth/reset-password`** — Accepts the reset key, the user login, and a new password. Validate the key using WordPress's native key-checking function. If the key is invalid or expired, return a 400. Enforce the minimum 8-character password rule. If everything checks out, reset the password using the native WordPress reset function and return a success message.

---

### Step 4 — Create `src/auth/useAuth.js`

This file does not exist yet and is the central missing piece on the React side. Create it as a custom hook that manages all authentication state and exposes all auth actions.

**Session validation on mount** — When the hook initializes, it should immediately make a request to the validate endpoint using the existing JWT cookie (credentials: include). If the server confirms a valid session, store the returned user object in state. If not, clear state silently — this is not an error condition, just means the user is not logged in. Set a loading flag that is true until this check completes.

**Expired session listener** — Listen for a custom browser event (`auth:expired`) that the API client can dispatch when it receives a 401. When that event fires, call logout automatically.

**`login(email, password)`** — POST to the login endpoint with credentials included. On success, store the user object in state and return it. On failure, store the error message in state and rethrow.

**`register(formData)`** — POST to the register endpoint with credentials included. Expects an object with `email`, `password`, `first_name`, and `last_name`. On success, store the user in state. On failure, store and rethrow the error.

**`logout()`** — DELETE to the logout endpoint, then clear the token store and set user state to null. This must run regardless of whether the server request succeeds.

**`forgotPassword(email)`** — POST to the forgot-password endpoint. Return the response JSON.

**`resetPassword(key, login, password)`** — POST to the reset-password endpoint with all three values. Throw on failure.

**Return values** — The hook should expose: `user`, `isAuthenticated` (boolean derived from whether user is non-null), `isLoading`, `error`, and all five action functions.

---

### Step 5 — Extend `src/auth/AuthContext.js`

The existing context currently exposes only login and logout. Update it to consume `useAuth()` and pass through all returned values — including `register`, `forgotPassword`, `resetPassword`, `isLoading`, and `error`. Any component using `useAuthContext()` should have access to the full hook API.

---

### Step 6 — Create `src/components/ProtectedRoute.jsx`

A wrapper component that guards routes requiring authentication. It should read `isAuthenticated` and `isLoading` from the auth context. While loading, render a spinner or loading state. If not authenticated after loading completes, redirect to `/login` using React Router's `Navigate`, and preserve the originally requested path in router location state so the user can be returned there after logging in. If authenticated, render children normally.

---

### Step 7 — Create `src/pages/Login.jsx`

A standard login form with email and password fields. On submit, call `login()` from the auth context. On success, redirect to the path stored in router location state (the page the user was trying to reach) if present, otherwise redirect to `/account`. Display any error returned from the context. Include links to both the register page and the forgot password page.

---

### Step 8 — Create `src/pages/Register.jsx`

A registration form with fields for first name, last name, email, password, and confirm password. Before submitting, validate client-side that the two password fields match and that the password is at least 8 characters. On submit, call `register()` from context with the form data. On success, redirect to `/account`. Display any server-side error. Include a link to the login page for users who already have an account.

---

### Step 9 — Create `src/pages/ForgotPassword.jsx`

A single-field form accepting an email address. On submit, call `forgotPassword()` from context. After the request completes — regardless of outcome — display a confirmation message telling the user to check their email if the address is registered. Do not vary the message based on whether the email matched a real account. Include a link back to the login page.

---

### Step 10 — Create `src/pages/ResetPassword.jsx`

This page is reached by clicking the link in the password reset email. It must read the `key` and `login` values from the URL query string using React Router's `useSearchParams`. Show a form with password and confirm password fields. Validate that both fields match before submitting. On submit, call `resetPassword()` from context passing the key, login, and new password. On success, show a confirmation message with a link to `/login`. On failure (invalid or expired link), display an error message.

---

### Step 11 — Create `src/pages/Account.jsx`

The main post-login dashboard. This page assumes the user is authenticated — access control is handled by `ProtectedRoute`, not internally.

Display a welcome header using `user.display_name` from context.

Include a **Log Out** button that calls `logout()` and redirects to the homepage.

Organize the page into four tabs:

**Profile tab** — Show the user's current display name and email. Include a change password form that, when submitted, should post to the appropriate endpoint. (If a dedicated update-profile endpoint doesn't yet exist in `dtb-rest-api.php`, note it as a dependency and leave a clear placeholder.)

**Orders tab** — Fetch the user's orders from `GET /dtb/v1/orders` filtered by the current user's customer ID. Display them in a table showing order number, date, status, and total. Handle the loading and empty states.

**Addresses tab** — Fetch the customer record from `GET /dtb/v1/customers/{user.id}`. Display the billing and shipping addresses from the WooCommerce customer data.

**Repair Requests tab** — The backend endpoint for repair requests is not yet built. Render a placeholder message for now.

---

### Step 12 — Register All Routes in `src/App.jsx`

Add lazy-loaded imports for all five new page components. Register routes for `/login`, `/register`, `/forgot-password`, `/reset-password`, and `/account`. The `/account` route must be wrapped in `ProtectedRoute`.

---

### Step 13 — Verify Environment Variables

Confirm that `REACT_APP_JWT_AUTH_ENDPOINT` is set to `/dtb/v1/auth` in both the development and production `.env` files. The `useAuth` hook depends on this variable being correct. If it points to anything else currently, update it.

---

## Constraints

- Do not modify `tokenStore.js`, `api/customers.js`, or `dtb-rest-api.php` unless directly required by one of the steps above.
- Server-side validation in PHP is required even where React also validates client-side. Never rely on frontend validation alone.
- The forgot-password endpoint must never reveal whether an email address is registered. The response must be identical in both cases.
- The WooCommerce customer creation block must be guarded against WooCommerce being inactive to prevent fatal errors.
- The JWT auth cookie is HTTP-only and cannot be read from JavaScript. All session state must live in React state and be restored via the validate endpoint on page load.
- Auth redirects must use React Router's location state pattern to return users to their intended destination after login.

---

## Acceptance Criteria

The implementation is complete when all of the following work end-to-end:

1. A new user registers, is automatically logged in, and lands on the account dashboard
2. The new account appears in WP Admin → Users with the `customer` role
3. The new account appears in WooCommerce → Customers
4. An existing user logs in and lands on the account dashboard
5. A logged-in user can view their profile, orders, and addresses in the account tabs
6. A user requesting a password reset receives an email with a working link
7. Following the reset link allows setting a new password and then logging in with it
8. Refreshing any page while logged in restores the session automatically
9. Visiting `/account` while logged out redirects to `/login` and returns to `/account` after authenticating
10. Visiting `/account` while the session check is still in progress shows a loading state rather than a flash redirect