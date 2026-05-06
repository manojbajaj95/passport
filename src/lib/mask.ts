export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@')
  if (atIndex <= 0) return email
  return `${email[0]}***${email.slice(atIndex)}`
}
