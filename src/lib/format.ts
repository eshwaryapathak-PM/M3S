// Display formatting — single source of truth so the same paise / mask / date
// rules apply everywhere. Per CLAUDE.md §3.3 + project memory feedback-currency.

/** ₹1,234 — M3S stores money as integer paise; this is the only place that converts. */
export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

const IST_DEFAULT = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Renders any UTC ISO string in IST. M3S stores UTC everywhere; this is the IST boundary. */
export function formatDateIST(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(iso);
  if (opts) {
    return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...opts }).format(date);
  }
  return IST_DEFAULT.format(date);
}

/**
 * Mask email: 'eshwarya@gmail.com' → 'eXXXXXXa@gXXXl.com'.
 * Preserves first + last char of local, first char of domain host, and TLD. (QA BK-06.)
 */
export function formatEmailMasked(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length < 2 || domain.length < 2) return email;
  const localMask =
    local[0] +
    'X'.repeat(Math.max(local.length - 2, 1)) +
    local[local.length - 1];
  const dotIdx = domain.lastIndexOf('.');
  if (dotIdx < 1) {
    return `${localMask}@${domain[0]}${'X'.repeat(Math.max(domain.length - 1, 1))}`;
  }
  const host = domain.slice(0, dotIdx);
  const tld = domain.slice(dotIdx);
  const hostMask = host[0] + 'X'.repeat(Math.max(host.length - 1, 1));
  return `${localMask}@${hostMask}${tld}`;
}

/**
 * Mask phone: '9876543210' → '9XXXXX3210'.
 * First digit + last 4 preserved; middle masked. Inputs < 6 digits returned unchanged. (QA BK-06.)
 *
 * Note: QA-doc example shows '9XXXXX43210' (11 chars from 10-digit input) — appears to be a typo.
 * This implementation preserves total length. Flag if QA-doc literal is required.
 */
export function formatPhoneMasked(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return phone;
  const masked = 'X'.repeat(digits.length - 5);
  return `${digits[0]}${masked}${digits.slice(-4)}`;
}
