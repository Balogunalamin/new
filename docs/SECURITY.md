# Security Considerations

- Always serve over HTTPS — no exceptions.
- Hash passwords with `bcrypt` (cost factor 10 or higher).
- Rate-limit auth endpoints (OTP requests, login attempts) to prevent
  abuse.
- Validate all inputs server-side; never trust the client.
- Use parameterized queries or an ORM (Prisma, TypeORM) to prevent SQL
  injection.
- Sanitize and scan uploaded images; cap file sizes.
- Store KYC documents in a private S3 bucket with signed URLs for access.
- Verify Paystack webhook signatures on every incoming webhook.
- Role-based access control enforced server-side — client checks are just
  UX.
- Regular database backups (daily) and a tested restore procedure
  (quarterly).
- Log authentication events and admin actions for an audit trail.
- Comply with Nigeria's **NDPR** (Nigeria Data Protection Regulation) for
  personal data.
