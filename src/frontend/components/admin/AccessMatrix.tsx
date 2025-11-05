import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { colors, typography } from '../../../shared/design/tokens';
import { FeatureAccessKey, UserRole } from '../../../shared/types/common.types';
import type { User } from '../../../shared/types/auth.types';
import { Badge, Card, CardContent, CardTitle } from '../common';

type AccessMatrixProps = {
  members: Pick<User, 'id' | 'email' | 'profile' | 'role'>[];
  features: FeatureAccessKey[];
  values: Record<string, Partial<Record<FeatureAccessKey, boolean>>>; // userId -> feature -> enabled
  onToggle: (userId: string, feature: FeatureAccessKey, next: boolean) => void;
};

export const AccessMatrix = ({ members, features, values, onToggle }: AccessMatrixProps) => {
  const columns = useMemo(() => features, [features]);

  return (
    <Card variant="outlined">
      <CardTitle className="text-xl" style={{ color: colors.primary }}>
        Acessos por Membro
      </CardTitle>
      <CardContent className="mt-4 overflow-x-auto p-0">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="text-left uppercase tracking-[0.16em]" style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}>
              <th className="px-4 py-3">Membro</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-[var(--row-border)]" style={{ '--row-border': colors.borderPrimary } as CSSProperties}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full border border-[var(--av-border)]" style={{ '--av-border': colors.borderPrimary } as CSSProperties} />
                    <div className="flex flex-col">
                      <span style={{ color: colors.textPrimary }}>{m.profile.displayName || m.email}</span>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>{m.email}</span>
                    </div>
                    <Badge variant={m.role === UserRole.Admin || m.role === UserRole.SuperAdmin ? 'outline' : 'default'}>
                      {m.role}
                    </Badge>
                  </div>
                </td>
                {columns.map((col) => {
                  const enabled = Boolean(values[m.id]?.[col]);
                  return (
                    <td key={col} className="px-4 py-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-2"
                          style={{ borderColor: colors.borderPrimary }}
                          checked={enabled}
                          onChange={(e) => onToggle(m.id, col, e.target.checked)}
                        />
                        {enabled ? (
                          <span className="text-[var(--ok)]" style={{ '--ok': colors.primary } as CSSProperties}>Ativo</span>
                        ) : (
                          <span>Inativo</span>
                        )}
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

