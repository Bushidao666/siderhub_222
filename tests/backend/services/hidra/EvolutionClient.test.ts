import { EvolutionClient } from 'src/backend/services/hidra/EvolutionClient';

describe('EvolutionClient', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    if (originalFetch) {
      (global as any).fetch = originalFetch;
    } else {
      delete (global as any).fetch;
    }
  });

  it('requires HTTPS baseUrl', () => {
    expect(
      () =>
        new EvolutionClient({
          baseUrl: 'http://evolution.test',
          apiKey: 'key',
        }),
    ).toThrowErrorMatchingInlineSnapshot('"Evolution baseUrl must use HTTPS"');
  });

  it('retries transient failures and returns payload on success', async () => {
    jest.useFakeTimers();
    const retryableResponse = {
      ok: false,
      status: 502,
      headers: { get: () => 'application/json' },
      text: jest.fn().mockResolvedValue('bad gateway'),
    };
    const successPayload = { id: 'remote-123', status: 'scheduled' };
    const successResponse = {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: jest.fn().mockResolvedValue(successPayload),
      text: jest.fn(),
    };

    fetchMock.mockResolvedValueOnce(retryableResponse as any).mockResolvedValueOnce(successResponse as any);

    const client = new EvolutionClient({
      baseUrl: 'https://evolution.test',
      apiKey: 'key',
      maxAttempts: 2,
      timeoutMs: 50,
    });

    const promise = client.createCampaign({
      name: 'Launch',
      segmentId: 'segment-1',
      templateId: 'template-1',
    });

    await Promise.resolve();
    await Promise.resolve();
    await jest.runOnlyPendingTimersAsync();

    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(successResponse.json).toHaveBeenCalledTimes(1);
    expect(result).toEqual(successPayload);
  });

  it('throws non-retryable errors without additional attempts', async () => {
    const errorResponse = {
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      text: jest.fn().mockResolvedValue('invalid payload'),
    };
    fetchMock.mockResolvedValue(errorResponse as any);

    const client = new EvolutionClient({
      baseUrl: 'https://evolution.test',
      apiKey: 'key',
      maxAttempts: 3,
      timeoutMs: 50,
    });

    await expect(
      client.createCampaign({
        name: 'Launch',
        segmentId: 'segment-1',
        templateId: 'template-1',
      }),
    ).rejects.toMatchObject({ code: 'HIDRA_EVOLUTION_REQUEST_FAILED' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns false on failed connectivity test', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const client = new EvolutionClient({
      baseUrl: 'https://evolution.test',
      apiKey: 'key',
      maxAttempts: 1,
      timeoutMs: 10,
    });

    await expect(client.testConnection()).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
