class PaymailError extends Error {
  constructor (message, status, code, cause) {
    super(message)
    this.status = status
    this.code = code
    this.cause = cause
  }
}

export { PaymailError }
