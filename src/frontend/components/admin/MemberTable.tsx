import type { CSSProperties } from 'react';

import { colors, typography } from '../../../shared/design/tokens';
import type { MemberAccessMap, User } from '../../../shared/types/auth.types';
import { FeatureAccessKey, UserRole } from '../../../shared/types/common.types';
import { Badge, Button, Card, CardContent, CardTitle } from '../common';

type MemberTableProps = {
  members: Array<User & { accessMap?: MemberAccessMap[] }>;
  loading?: boolean;
  emptyMessage?: string;
  onPromote?: (id: string) => void;
  onDemote?: (id: string) => void;
  onRemove?: (id: string) => void;
  page?: number;
  totalPages?: number;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
};

const roleLabel: Record<UserRole, string> = {
  member: 'Member',
  mentor: 'Mentor',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const featureLabel: Record<FeatureAccessKey, string> = {
  [FeatureAccessKey.Hidra]: 'Hidra',
  [FeatureAccessKey.Cybervault]: 'Cybervault',
  [FeatureAccessKey.Academy]: 'Academia',
  [FeatureAccessKey.Admin]: 'Admin Console',
  [FeatureAccessKey.Community]: 'Community',
};

const renderAccessMap = (accessMap?: MemberAccessMap[]) => {
  if (!accessMap || accessMap.length === 0) {
    return (
      <span className="text-xs uppercase tracking-[0.14em]" style={{ color: colors.textTertiary }}>
        Sem overrides
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="admin-member-access-map">
      {accessMap.map((entry) => (
        <Badge
          key={`${entry.feature}-${entry.enabled ? 'on' : 'off'}`}
          variant={entry.enabled ? 'outline' : 'default'}
          className="shadow-sm"
          style={
            {
              '--badge-bg': entry.enabled ? 'rgba(0, 255, 0, 0.12)' : colors.bgTertiary,
              '--badge-border': entry.enabled ? colors.borderAccent : colors.borderPrimary,
              '--badge-color': entry.enabled ? colors.primary : colors.textSecondary,
            } as CSSProperties
          }
          data-enabled={entry.enabled}
        >
          {featureLabel[entry.feature] ?? entry.feature}
        </Badge>
      ))}
    </div>
  );
};

export const MemberTable = ({
  members,
  loading,
  emptyMessage,
  onPromote,
  onDemote,
  onRemove,
  page = 1,
  totalPages = 1,
  onPreviousPage,
  onNextPage,
}: MemberTableProps) => {
  if (loading) {
    return (
      <Card variant="outlined" className="animate-pulse" data-testid="admin-members-loading">
        <CardContent className="space-y-3">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-12 rounded bg-[var(--skel)]"
              style={{ '--skel': colors.bgPrimary } as CSSProperties}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card variant="outlined" data-testid="admin-members-empty">
        <CardContent className="py-10 text-center text-sm" style={{ color: colors.textSecondary }}>
          {emptyMessage ?? 'Nenhum membro encontrado.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardTitle className="text-xl" style={{ color: colors.primary }}>
        Membros
      </CardTitle>
      <CardContent className="mt-4 overflow-x-auto p-0">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr
              className="text-left uppercase tracking-[0.16em]"
              style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}
            >
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Acesso</th>
              <th className="px-4 py-3">Último login</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.id}
                className="border-t border-[var(--row-border)]"
                data-testid="admin-member-row"
                style={{ '--row-border': colors.borderPrimary } as CSSProperties}
              >
                <td className="px-4 py-3" style={{ color: colors.textPrimary }}>
                  {m.profile.displayName || m.email}
                </td>
                <td className="px-4 py-3" style={{ color: colors.textSecondary }}>
                  {m.email}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={m.role === UserRole.Admin || m.role === UserRole.SuperAdmin ? 'outline' : 'default'}
                    data-testid={`admin-member-role-${m.role}`}
                  >
                    {roleLabel[m.role]}
                  </Badge>
                </td>
                <td className="px-4 py-3">{renderAccessMap(m.accessMap)}</td>
                <td className="px-4 py-3" style={{ color: colors.textSecondary }}>
                  {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString('pt-BR') : 'Nunca acessou'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {m.role === UserRole.Member ? (
                      <Button variant="primary" size="sm" onClick={() => onPromote?.(m.id)}>
                        Promover a mentor
                      </Button>
                    ) : null}
                    {m.role === UserRole.Mentor ? (
                      <>
                        <Button variant="primary" size="sm" onClick={() => onPromote?.(m.id)}>
                          Promover a admin
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDemote?.(m.id)}>
                          Rebaixar a member
                        </Button>
                      </>
                    ) : null}
                    {m.role === UserRole.Admin ? (
                      <Button variant="ghost" size="sm" onClick={() => onDemote?.(m.id)}>
                        Rebaixar a mentor
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={() => onRemove?.(m.id)}>
                      Remover
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          className="flex items-center justify-between border-t border-[var(--row-border)] px-4 py-3 text-xs"
          style={{ '--row-border': colors.borderPrimary } as CSSProperties}
        >
          <span style={{ color: colors.textSecondary }}>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreviousPage}
              data-testid="admin-members-prev"
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextPage}
              data-testid="admin-members-next"
              disabled={page >= totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
