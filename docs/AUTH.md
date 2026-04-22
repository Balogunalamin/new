# Authentication

## Client & Artisan (phone + OTP)

1. User enters phone number.
2. Backend generates a 6-digit OTP, stores a hashed copy with a 5-minute
   expiry, and sends the SMS via Termii.
3. User enters OTP in the app.
4. Backend verifies the OTP and expiry; if valid, creates or finds the user.
5. Backend returns a JWT **access token** (short-lived, e.g. 15 min) and a
   **refresh token** (long-lived, e.g. 30 days).
6. App stores tokens securely (`expo-secure-store` on mobile, `httpOnly`
   cookie on web).
7. Subsequent requests include the access token in the `Authorization`
   header.
8. When the access token expires, the app uses the refresh token to get a
   new pair.

## Admin (email + password + optional 2FA)

Admin login is deliberately different. No phone OTP.

1. Admin enters email and password on `/admin/login`.
2. Backend checks the bcrypt hash, confirms `role = 'admin'`.
3. If 2FA is enabled, prompt for a TOTP code (Google Authenticator).
4. On success, issue an admin-scoped JWT with a shorter expiry (e.g. 4
   hours).
5. All `/admin` API endpoints require both a valid JWT **and**
   `role = 'admin'`.

## Token storage rules

| Platform | Storage | Notes |
|----------|---------|-------|
| React Native | `expo-secure-store` | Uses iOS Keychain and Android Keystore |
| Next.js (web) | `httpOnly` secure cookie | Prevents XSS from reading the token |
| Admin panel | `httpOnly` secure cookie + `SameSite=strict` | Extra protection |
