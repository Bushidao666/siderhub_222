# AcademyHighlights (hub)

Props:
- `items: { course: CourseMeta; progress?: CourseProgress; recommendation?: CourseRecommendation; locked?: boolean; nextLessonTitle?: string }[]`
- `loading?: boolean`
- `onSelectCourse?: (courseId: string) => void`

States:
- Loading skeleton grid
- Empty state (card informativo)
- Locked badge e ação alternativa

Dependencies:
- `src/shared/types/academy.types#CourseMeta, CourseProgress, CourseRecommendation`
- Common: `Card`, `Badge`, `Button`, `ProgressBar`
- Tokens: `src/shared/design/tokens.ts`

Visual cues:
- Capa com overlay escuro; badges no topo
- Títulos neon; progresso com glow
