export function isAllowedTransport(transport) {
  return transport === 'mock'
}

export function executeTransportAttempt(attempt) {
  if (!isAllowedTransport(attempt.transport)) {
    return {
      ok: false,
      status: 'failed',
      providerStatus: null,
      providerMessageId: null,
      providerErrorCode: 'invalid_transport',
      providerErrorMessage: 'transport must be "mock" in Phase 11',
      notes: `${attempt.notes} Mock transport rejected: invalid transport.`,
      dryRun: attempt.dryRun,
      attemptedAt: null,
      failedAt: Date.now(),
    }
  }

  const now = Date.now()
  return {
    ok: true,
    status: 'dry-run',
    providerStatus: 'dry-run',
    providerMessageId: null,
    providerErrorCode: null,
    providerErrorMessage: null,
    notes: attempt.notes,
    dryRun: true,
    attemptedAt: now,
    failedAt: null,
  }
}
