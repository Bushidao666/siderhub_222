import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DownloadModal } from 'src/frontend/components/cybervault/DownloadModal';
import type { Resource } from '@shared/types';
import { ResourceType, Visibility } from '@shared/types';

const createResource = (overrides: Partial<Resource> = {}): Resource => ({
  id: overrides.id ?? 'resource-1',
  slug: overrides.slug ?? 'neon-template',
  title: overrides.title ?? 'Template Neon',
  description: overrides.description ?? 'Kit completo para campanhas Hidra.',
  type: overrides.type ?? ResourceType.Template,
  categoryId: overrides.categoryId ?? 'cat-1',
  tags:
    overrides.tags ??
    [
      {
        id: 'tag-1',
        name: 'hidra',
      },
    ],
  thumbnailUrl: overrides.thumbnailUrl ?? null,
  visibility: overrides.visibility ?? Visibility.Members,
  featured: overrides.featured ?? false,
  downloadCount: overrides.downloadCount ?? 12,
  viewCount: overrides.viewCount ?? 120,
  createdBy: overrides.createdBy ?? 'user-1',
  createdAt: overrides.createdAt ?? new Date().toISOString(),
  updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  assets:
    overrides.assets ??
    [
      {
        id: 'asset-1',
        resourceId: overrides.id ?? 'resource-1',
        fileUrl: 'https://cdn.example.com/template.pdf',
        fileName: 'template.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      },
    ],
});

describe('DownloadModal', () => {
  it('confirms download and shows updated counter', async () => {
    const onConfirm = vi.fn().mockResolvedValue(25);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <DownloadModal resource={createResource()} open onConfirm={onConfirm} onClose={onClose} />,
    );

    await user.click(screen.getByRole('button', { name: /confirmar download/i }));

    expect(onConfirm).toHaveBeenCalledWith('resource-1');
    await waitFor(() => expect(screen.getByTestId('download-success')).toBeInTheDocument());
    expect(screen.getByTestId('download-count')).toHaveTextContent(/25/);
  });

  it('reports error when confirmation fails', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('network'));
    const user = userEvent.setup();

    render(
      <DownloadModal resource={createResource()} open onConfirm={onConfirm} onClose={() => {}} />,
    );

    await user.click(screen.getByRole('button', { name: /confirmar download/i }));

    await waitFor(() => expect(screen.getByTestId('download-error')).toBeInTheDocument());
  });
});
