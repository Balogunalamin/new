# Payments & Escrow

Escrow is the single most important trust feature in a marketplace. The
platform holds the money until the client confirms the job is done, then
releases it to the artisan minus commission.

## v1 flow (manual escrow)

1. Client and artisan agree on a price in chat.
2. Client clicks **Pay** on the booking; the app opens Paystack checkout.
3. Paystack collects funds into the platform's Paystack account.
4. Paystack webhook hits the backend; the `payments` row is marked `held`
   and the booking becomes `in_progress`.
5. Artisan performs the job.
6. Client clicks **Mark Complete** in the app.
7. Artisan also confirms completion.
8. Platform runs a scheduled job (or an admin approves) to release funds.
9. Paystack transfer sends `(amount − commission)` to the artisan's bank
   account.
10. `payments.status` becomes `released`; the client is prompted to leave a
    review.

## Dispute handling

If either side flags the booking as disputed, funds stay held. An admin
reviews the chat history and any uploaded evidence, then decides:

- **Release** to the artisan (client's complaint invalid).
- **Refund** to the client (artisan at fault or no-show).
- **Split** (partial work delivered).

## Fee structure (suggested)

| Item | Amount | Paid by |
|------|--------|---------|
| Platform commission | 10–15 % of job price | Artisan (deducted at release) |
| Paystack transaction fee | 1.5 % + ₦100 (capped) | Absorbed by platform |
| Paystack transfer fee | ₦10–₦50 per transfer | Absorbed by platform |
