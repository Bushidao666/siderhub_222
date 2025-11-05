# ModuleAccordion (academy)

Props:
- `modules: CourseModule[]`
- `activeModuleId?: string`
- `completedLessonIds?: string[]`
- `onSelectLesson?: (moduleId: string, lessonId: string) => void`
- `loading?: boolean`

States:
- Loading skeleton (módulos)
- Acordeões expand/collapse
- Lições com ícone por tipo + status concluído
- Empty state card quando `modules` vazio

Accessibility:
- Botão do cabeçalho com `aria-expanded`/`aria-controls`
- Painel listado como `role="region"` + `aria-labelledby`

Dependencies:
- `src/shared/types/academy.types#CourseModule`
- `src/shared/types/common.types#LessonType`
- Common: `Card`, `Badge`, `Button`

Visual cues:
- Headers uppercase `Rajdhani`; contadores e duração em cinza
- Cards e linhas com bordas sutis
