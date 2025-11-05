import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { PaginatedResponse } from '@shared/types/common.types';
import { ResourceType, Visibility } from '@shared/types/common.types';
import type { Resource, ResourceCategory, ResourceDownloadReceipt } from '@shared/types/cybervault.types';
import type { ApiResponse } from '@shared/types/api.types';
import { CybervaultLibrary } from 'src/frontend/pages/Cybervault/ResourceLibrary';
import { renderWithProviders, resetAuthStore, setAuthenticatedUser } from '../test-utils';
import { server, http, HttpResponse } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const category: ResourceCategory = {
  id: 'cat-1',
  name: 'Playbooks',
  description: 'Coleção de playbooks',
  icon: 'sparkles',
  order: 1,
  createdAt: '2025-11-01T12:00:00Z',
};

const RESOURCE_PAGE: PaginatedResponse<Resource & { category?: ResourceCategory }> = {
  items: [
    {
      id: 'resource-1',
      slug: 'playbook-neon',
      title: 'Playbook Neon',
      description: 'Checklist para campanhas neon',
      type: ResourceType.Playbook,
      categoryId: category.id,
      category,
      tags: [
        { id: 'tag-1', name: 'automation' },
        { id: 'tag-2', name: 'hidra' },
      ],
      thumbnailUrl: null,
      visibility: Visibility.Members,
      featured: true,
      downloadCount: 42,
      viewCount: 180,
      createdBy: 'author-1',
      createdAt: '2025-10-20T12:00:00Z',
      updatedAt: '2025-10-22T12:00:00Z',
      assets: [],
    },
  ],
  page: 1,
  pageSize: 12,
  totalItems: 1,
  totalPages: 1,
};

const DOWNLOAD_RECEIPT: ResourceDownloadReceipt = {
  ok: true,
  totalDownloads: 43,
  lastDownloadedAt: '2025-11-02T12:00:00Z',
};

describe('CybervaultLibrary page', () => {
  beforeEach(() => {
    resetAuthStore();
    setAuthenticatedUser();
  });

  it('renders resources and registers download feedback', async () => {
    let currentDownloadCount = RESOURCE_PAGE.items[0].downloadCount;
    server.use(
      http.get('/api/cybervault/resources', () =>
        HttpResponse.json(
          successResponse({
            ...RESOURCE_PAGE,
            items: RESOURCE_PAGE.items.map((item) => ({ ...item, downloadCount: currentDownloadCount })),
          }),
        ),
      ),
      http.post('/api/cybervault/resources/:id/download', () => {
        currentDownloadCount = DOWNLOAD_RECEIPT.totalDownloads;
        return HttpResponse.json(successResponse(DOWNLOAD_RECEIPT));
      }),
    );

    renderWithProviders(<CybervaultLibrary />);

    expect(await screen.findByText('Playbook Neon')).toBeInTheDocument();
    expect(
      screen.getByText('Coleção neon de assets, playbooks e scripts. Use os filtros para acelerar o que precisa.'),
    )
      .toBeInTheDocument();
    const card = screen.getByTestId('component-resource-card');
    expect(within(card).getByText((content) => content.toLowerCase().includes('#automation'))).toBeInTheDocument();

    const downloadsCounter = screen.getByTestId('cybervault-resource-downloads-playbook-neon');
    expect(downloadsCounter).toHaveTextContent(/42 downloads/);

    fireEvent.click(screen.getByTestId('cybervault-download-playbook'));

    expect(
      await screen.findByText((content) => content.startsWith('Download registrado em ')),
    ).toBeInTheDocument();
    await waitFor(() => expect(downloadsCounter).toHaveTextContent(/43 downloads/));
  });
});
