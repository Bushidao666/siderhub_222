import { initJobs, shutdownJobs } from 'src/backend/jobs';
import { createQueues } from 'src/backend/jobs/queues';
import { startCampaignDispatchWorker } from 'src/backend/jobs/workers/CampaignDispatchWorker';
import { startMetricsSyncWorker } from 'src/backend/jobs/workers/MetricsSyncWorker';
import { startCleanupWorker } from 'src/backend/jobs/workers/CleanupWorker';

jest.mock('src/backend/jobs/queues', () => ({
  createQueues: jest.fn(),
}));

jest.mock('src/backend/jobs/workers/CampaignDispatchWorker', () => ({
  startCampaignDispatchWorker: jest.fn(),
}));

jest.mock('src/backend/jobs/workers/MetricsSyncWorker', () => ({
  startMetricsSyncWorker: jest.fn(),
}));

jest.mock('src/backend/jobs/workers/CleanupWorker', () => ({
  startCleanupWorker: jest.fn(),
}));

const createQueuesMock = createQueues as jest.MockedFunction<typeof createQueues>;
const startCampaignDispatchWorkerMock = startCampaignDispatchWorker as jest.MockedFunction<
  typeof startCampaignDispatchWorker
>;
const startMetricsSyncWorkerMock = startMetricsSyncWorker as jest.MockedFunction<typeof startMetricsSyncWorker>;
const startCleanupWorkerMock = startCleanupWorker as jest.MockedFunction<typeof startCleanupWorker>;

describe('jobs runtime', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.BULLMQ_ENABLED;
    delete process.env.REDIS_URL;
    delete process.env.BULLMQ_REDIS_URL;
    createQueuesMock.mockReset();
    startCampaignDispatchWorkerMock.mockReset();
    startMetricsSyncWorkerMock.mockReset();
    startCleanupWorkerMock.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('skips initialization when BULLMQ_ENABLED=false', () => {
    process.env.BULLMQ_ENABLED = 'false';

    const runtime = initJobs();

    expect(runtime).toBeNull();
    expect(createQueuesMock).not.toHaveBeenCalled();
  });

  it('returns null when queues cannot be created (missing redis config)', () => {
    createQueuesMock.mockReturnValue(null);

    const runtime = initJobs();

    expect(runtime).toBeNull();
    expect(createQueuesMock).toHaveBeenCalled();
    expect(startCampaignDispatchWorkerMock).not.toHaveBeenCalled();
  });

  it('initializes queues/workers and schedules recurring jobs', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379/0';

    const campaignQueue = {
      name: 'campaign-dispatch',
      add: jest.fn(() => Promise.resolve()),
      close: jest.fn(() => Promise.resolve()),
    } as any;
    const metricsQueue = {
      name: 'metrics-sync',
      add: jest.fn(() => Promise.resolve()),
      close: jest.fn(() => Promise.resolve()),
    } as any;
    const cleanupQueue = {
      name: 'cleanup',
      add: jest.fn(() => Promise.resolve()),
      close: jest.fn(() => Promise.resolve()),
    } as any;

    createQueuesMock.mockReturnValue({
      campaign: campaignQueue,
      metrics: metricsQueue,
      cleanup: cleanupQueue,
      events: {
        campaign: { close: jest.fn(() => Promise.resolve()) } as any,
        metrics: { close: jest.fn(() => Promise.resolve()) } as any,
        cleanup: { close: jest.fn(() => Promise.resolve()) } as any,
      },
    });

    const workerMocks = [
      { close: jest.fn(() => Promise.resolve()) },
      { close: jest.fn(() => Promise.resolve()) },
      { close: jest.fn(() => Promise.resolve()) },
    ] as any[];
    startCampaignDispatchWorkerMock.mockReturnValue(workerMocks[0]);
    startMetricsSyncWorkerMock.mockReturnValue(workerMocks[1]);
    startCleanupWorkerMock.mockReturnValue(workerMocks[2]);

    const runtime = initJobs();

    expect(runtime).not.toBeNull();
    expect(startCampaignDispatchWorkerMock).toHaveBeenCalled();
    expect(startMetricsSyncWorkerMock).toHaveBeenCalled();
    expect(startCleanupWorkerMock).toHaveBeenCalled();
    expect(metricsQueue.add).toHaveBeenCalledWith(
      'metrics:sync',
      expect.objectContaining({ scope: 'academy' }),
      expect.objectContaining({ repeat: { every: 60_000 } }),
    );
    expect(cleanupQueue.add).toHaveBeenCalledWith(
      'cleanup:jobs',
      expect.objectContaining({ target: 'jobs' }),
      expect.objectContaining({ repeat: { every: 300_000 } }),
    );

    await shutdownJobs(runtime);

    for (const worker of workerMocks) {
      expect(worker.close).toHaveBeenCalled();
    }
    expect(campaignQueue.close).toHaveBeenCalled();
    expect(metricsQueue.close).toHaveBeenCalled();
    expect(cleanupQueue.close).toHaveBeenCalled();
  });
});
