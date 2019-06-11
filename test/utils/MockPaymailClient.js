class MockPaymailClient {
  constructor () {
    this._validSignature = null
  }

  // Real api
  isValidSignature (
    {
      senderHandle,
      dt,
      amount,
      purpose
    },
    signature
  ) {
    return this._validSignature && signature === this._validSignature
  }

  // Mock methods
  setValidSignature (signature) {
    this._validSignature = signature
  }
}

export { MockPaymailClient }
