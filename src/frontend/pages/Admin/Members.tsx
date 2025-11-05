import type { CSSProperties, ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { colors, surfaces, typography } from '../../../shared/design/tokens';
import { UserRole } from '../../../shared/types/common.types';
import { mapApiError } from '../../../shared/utils/errorHandler';
import { MemberTable } from '../../components/admin/MemberTable';
import { Button, Input } from '../../components/common';
import { useAdminMembers } from '../../hooks/useAdminMembers';

const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delayMs]);

  return debounced;
};

const roleFilterOptions: Array<{ label: string; value: 'all' | UserRole }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Members', value: UserRole.Member },
  { label: 'Mentors', value: UserRole.Mentor },
  { label: 'Admins', value: UserRole.Admin },
  { label: 'Super Admins', value: UserRole.SuperAdmin },
];

const pageSizeOptions = [10, 20, 50];

export const AdminMembers = () => {
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 250);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, pageSize]);

  const filters = useMemo(
    () => ({
      page,
      pageSize,
      role: roleFilter === 'all' ? undefined : roleFilter,
      search: debouncedSearch.length > 0 ? debouncedSearch : undefined,
    }),
    [page, pageSize, roleFilter, debouncedSearch],
  );

  const { data, isLoading, isFetching, error, refetch } = useAdminMembers(filters);

  const members = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const loading = isLoading || isFetching;
  const errorMessage = error ? mapApiError(error) : null;

  const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as 'all' | UserRole;
    setRoleFilter(value);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSize = Number(event.target.value) || 20;
    setPageSize(nextSize);
  };

  const handlePrevPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const handleNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  return (
    <section className="space-y-6" data-testid="admin-members">
      <header className="space-y-1">
        <h1
          className="text-2xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Gestão de membros
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Visualize e ajuste permissões rapidamente. Use os filtros para localizar membros e validar acessos neon.
        </p>
      </header>

      <div className="flex flex-wrap gap-3" data-testid="admin-members-filters">
        <Input
          label="Buscar"
          placeholder="Nome ou email"
          value={searchTerm}
          onChange={handleSearchChange}
          data-testid="admin-members-search"
        />
        <label className="flex flex-col gap-2 text-sm" style={{ fontFamily: typography.fontPrimary }}>
          <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
            Role
          </span>
          <select
            className="min-w-[160px] rounded-2xl border border-[var(--select-border)] bg-[var(--select-bg)] px-4 py-2"
            data-testid="admin-members-role-filter"
            style={{ '--select-border': colors.borderPrimary, '--select-bg': colors.bgSecondary } as CSSProperties}
            value={roleFilter}
            onChange={handleRoleChange}
          >
            {roleFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm" style={{ fontFamily: typography.fontPrimary }}>
          <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
            Por página
          </span>
          <select
            className="rounded-2xl border border-[var(--select-border)] bg-[var(--select-bg)] px-4 py-2"
            data-testid="admin-members-page-size"
            style={{ '--select-border': colors.borderPrimary, '--select-bg': colors.bgSecondary } as CSSProperties}
            value={pageSize}
            onChange={handlePageSizeChange}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex items-end gap-2 text-xs" style={{ color: colors.textSecondary }}>
          <span data-testid="admin-members-summary">
            Mostrando {loading ? '...' : members.length} de {loading ? '...' : totalItems} membros
          </span>
          <Button
            variant="ghost"
            size="sm"
            data-testid="admin-members-refresh"
            onClick={() => {
              void refetch();
            }}
            disabled={loading}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div
          className="rounded-2xl border border-[var(--error-border)] bg-[var(--error-bg)] p-3 text-sm"
          data-testid="admin-members-error"
          style={{ '--error-border': colors.accentError, '--error-bg': surfaces.errorTint } as CSSProperties}
          >
          {errorMessage}
        </div>
      ) : null}

      <MemberTable
        members={members}
        loading={loading}
        emptyMessage={
          debouncedSearch || roleFilter !== 'all'
            ? 'Nenhum membro encontrado com os filtros aplicados.'
            : 'Nenhum membro registrado ainda.'
        }
        onPromote={() => {
          // TODO: implementar promoção via AdminService
        }}
        onDemote={() => {
          // TODO: implementar rebaixamento via AdminService
        }}
        onRemove={() => {
          // TODO: integrar remoção via AdminService
        }}
        page={page}
        totalPages={totalPages}
        onNextPage={handleNextPage}
        onPreviousPage={handlePrevPage}
      />
    </section>
  );
};

export default AdminMembers;
