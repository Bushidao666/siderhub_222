# CourseCard (academy)

Props:
- `course: CourseMeta`
- `progress?: CourseProgress`
- `locked?: boolean`
- `onSelect?: (courseId: string) => void`
- `className?: string`

States:
- Locked vs disponível (badge + CTA)
- Progresso 0–100%

Dependencies:
- `src/shared/types/academy.types#CourseMeta, CourseProgress`
- `src/shared/types/common.types#CourseStatus`
- Common: `Card`, `Badge`, `Button`, `ProgressBar`

Visual cues:
- Heading neon; tags em chips com borda sutil
- CTA primário/secondary conforme lock

Testing:
- Root: `data-testid="component-course-card"`
- CTA: `data-testid="component-course-card-action"`
