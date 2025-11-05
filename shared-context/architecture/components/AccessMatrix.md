# AccessMatrix (admin)

Props:
- `members: Pick<User, 'id' | 'email' | 'profile' | 'role'>[]`
- `features: FeatureAccessKey[]`
- `values: Record<string, Partial<Record<FeatureAccessKey, boolean>>>`
- `onToggle: (userId: string, feature: FeatureAccessKey, next: boolean) => void`

States:
- Checkbox toggles por célula
- Badges de role (Member/Mentor/Admin/SuperAdmin)

Dependencies:
- `src/shared/types/auth.types#User`
- `src/shared/types/common.types#FeatureAccessKey, UserRole`
- Common: `Card`, `Badge`

Visual cues:
- Tabela responsiva com headers uppercase `Rajdhani`
- Ativo em neon; inativo em cinza
