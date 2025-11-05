import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';

import { colors, typography } from '../../../shared/design/tokens';
import type {
  Resource,
  ResourceCategory,
  ResourceDownloadReceipt,
  ResourceFilterParams,
  ResourceTag,
} from '../../../shared/types/cybervault.types';
import { Button } from '../../components/common';
import { DownloadModal } from '../../components/cybervault/DownloadModal';
import { FilterBar } from '../../components/cybervault/FilterBar';
import { ResourceCard } from '../../components/cybervault/ResourceCard';
import { useResourceDownload } from '../../hooks/useResourceDownload';
import { useResourceLibrary } from '../../hooks/useResourceLibrary';

export const CybervaultLibrary = () => {
  const [filters, setFilters] = useState<ResourceFilterParams>({});
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastToastMessage, setLastToastMessage] = useState<string | null>(null);

  const libraryQuery = useResourceLibrary({ filters });
  const resources = libraryQuery.data?.items ?? [];

  const downloadMutation = useResourceDownload({
    onSuccess: (receipt: ResourceDownloadReceipt, resourceId: string) => {
      const formattedTimestamp = (() => {
        try {
          const date = new Date(receipt.lastDownloadedAt);
          if (Number.isNaN(date.getTime())) {
            return null;
          }
          return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'UTC',
          }).format(date);
        } catch (error) {
          console.error('Falha ao formatar timestamp de download', error);
          return null;
        }
      })();

      setLastToastMessage(
        formattedTimestamp
          ? `Download registrado em ${formattedTimestamp}.`
          : 'Download registrado com sucesso.',
      );
      setSelectedResource((current) =>
        current && current.id === resourceId
          ? { ...current, downloadCount: receipt.totalDownloads }
          : current
      );
    },
    onError: (message) => {
      setLastToastMessage(message);
    },
  });

  const handleDownload = async (resourceId: string) => {
    const receipt = await downloadMutation.triggerDownloadAsync(resourceId);
    void libraryQuery.refetch();
    return receipt;
  };

  const handleOpenModal = (resource: Resource) => {
    setSelectedResource(resource);
    setModalOpen(true);
  };

  const modalConfirm = async (resourceId: string) => {
    const receipt = await downloadMutation.triggerDownloadAsync(resourceId);
    void libraryQuery.refetch();
    return receipt.totalDownloads;
  };

  const loading = libraryQuery.isLoading || libraryQuery.isFetching;

  const uniqueCategories = useMemo<ResourceCategory[]>(() => {
    const categoryMap = new Map<string, ResourceCategory>();

    resources.forEach((resource) => {
      const maybeWithCategory = resource as Resource & { category?: ResourceCategory };
      if (maybeWithCategory.category) {
        categoryMap.set(maybeWithCategory.category.id, maybeWithCategory.category);
      }
    });

    return Array.from(categoryMap.values());
  }, [resources]);

  const uniqueTags = useMemo<ResourceTag[]>(() => {
    const tagMap = new Map<string, ResourceTag>();

    resources.forEach((resource) => {
      resource.tags.forEach((tag) => {
        tagMap.set(tag.id, tag);
      });
    });

    return Array.from(tagMap.values());
  }, [resources]);

  return (
    <section className="space-y-6" data-testid="cybervault-library">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1
            className="text-3xl uppercase tracking-[0.18em]"
            style={{ fontFamily: typography.fontHeading, color: colors.primary }}
          >
            Cybervault
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Coleção neon de assets, playbooks e scripts. Use os filtros para acelerar o que precisa.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setFilters({})}>
          Limpar filtros
        </Button>
      </header>

      <FilterBar
        query={filters.query ?? ''}
        onQueryChange={(query) => setFilters((prev) => ({ ...prev, query }))}
        categories={uniqueCategories}
        tags={uniqueTags}
        selectedCategoryId={filters.categoryIds?.[0] ?? null}
        onChangeCategory={(id) =>
          setFilters((prev) => ({ ...prev, categoryIds: id ? [id] : undefined }))
        }
        selectedType={filters.types?.[0] ?? 'all'}
        onChangeType={(type) =>
          setFilters((prev) => ({ ...prev, types: type === 'all' ? undefined : [type] }))
        }
        selectedVisibility={filters.visibility ?? 'all'}
        onChangeVisibility={(visibility) =>
          setFilters((prev) => ({ ...prev, visibility: visibility === 'all' ? undefined : visibility }))
        }
        onClear={() => setFilters({})}
      />

      {lastToastMessage ? (
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          {lastToastMessage}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-64 animate-pulse rounded-3xl border border-[var(--skel-border)] bg-[var(--skel-bg)]"
              style={{ '--skel-border': colors.borderPrimary, '--skel-bg': colors.bgSecondary } as CSSProperties}
            />
          ))}
        </div>
      ) : null}

      {!loading && !resources.length ? (
        <div
          className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 text-sm"
          style={{ '--border-color': colors.borderPrimary, '--bg-elevated': colors.bgSecondary } as CSSProperties}
        >
          Nenhum recurso encontrado com os filtros atuais. Tente ajustar a busca ou remover filtros.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onOpen={() => handleOpenModal(resource)}
            onDownload={handleDownload}
          />
        ))}
      </div>

      <DownloadModal
        resource={selectedResource}
        open={modalOpen}
        onConfirm={modalConfirm}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
};

export default CybervaultLibrary;
