# Operations runbook

For whoever runs the shop day to day.

## Daily routine

1. **Dashboard** (`/admin`): check *To fulfil* and *New custom requests*.
2. **Orders → Confirmed**: these are paid and waiting. Set **Printing** when you start (customer
   gets an email).
3. When packed and handed to the courier: open the order → **Shipped**, enter courier, AWB and the
   tracking link → *Save* (customer gets an email with tracking).
4. When delivered: **Delivered**. The customer can now review the items.
5. **Requests**: reply to custom print requests (use *Reply by email*), record the quote and status.
6. **Low stock** card: reprint or update stock in *Products*.

## Order statuses

| Status | Meaning | Who sets it |
|---|---|---|
| Awaiting payment (`PENDING`) | Customer opened payment but didn't finish. Hidden by default ("Abandoned" filter). | system |
| Confirmed (`PAID`) | Payment verified. Stock already reduced. | system |
| Printing (`PROCESSING`) | In production | you |
| Shipped | With the courier | you |
| Delivered | Received | you |
| Cancelled | Cancelled before delivery — stock is returned automatically | you |
| Refunded | Money returned — stock returned if it hadn't shipped | you |

## Refunds

1. Razorpay dashboard → *Transactions → Payments* → find the payment (ID is on the admin order page)
   → **Refund** (full or partial).
2. In the admin, set the order to **Refunded** (or **Cancelled** if not yet shipped) and tick
   *Email the customer*.
3. Razorpay refunds reach the customer in 5–7 working days.

## Products

- **Add:** *Products → Add product*. Images: paste one URL per line (first is the cover). Allowed:
  paths under `/public` or `https` links on allowed hosts (Cloudinary etc. — see
  `src/config/images.ts`).
- **Hide:** *Archive* (keeps order history intact). Untick *Live on store* to hide without archiving.
- **Feature on homepage:** tick *Featured*.
- Changes appear on the storefront immediately.

## Coupons

*Coupons → New coupon.* Percentage coupons can have a *Max off ₹* cap; use *Uses* to limit total
redemptions and *Expires* for campaigns. Disable instead of deleting so past orders keep their code.

## Admin users

The seed script creates/promotes the admin. To add another admin, have them register, then in Prisma
Studio (or Neon SQL editor) set their `role` to `ADMIN`:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'person@example.com';
```

They must sign out and in again. Removing the role takes effect immediately.

## Incidents

| Symptom | Likely cause | What to do |
|---|---|---|
| Site down / 500 on every page | Missing env var after a change, DB unreachable | Vercel runtime logs → look for `Invalid production environment` or Prisma connection errors; check Neon status; promote the previous deployment. |
| Customer paid but order shows *Awaiting payment* | Browser closed before confirmation **and** webhook failing | Razorpay → Webhooks → delivery logs; fix the URL/secret; *Resend* the event. As a last resort, verify the payment in Razorpay and set the order to Confirmed manually (stock then needs a manual adjustment). |
| "Too many attempts" for a real customer | Shared IP (office/college Wi-Fi) hit a rate limit | Limits reset automatically (15–60 min). To clear now: delete matching rows from the `RateLimit` table. |
| Customers not receiving emails | Resend key missing/invalid, domain unverified, or spam folder | Resend dashboard → logs; check SPF/DKIM. |
| Product page broken after editing | Image URL from a host not allowed | Fix the URL in the admin (new saves are validated). |
| Stock shows a negative number | Two customers paid for the last unit at once | Contact the second buyer: offer a reprint date or a refund. |

## Backups

Neon keeps point-in-time history (7 days on the free plan, longer on paid). Before big changes,
create a branch. For an offline copy: `pg_dump "$DIRECT_URL" > backup.sql`.
