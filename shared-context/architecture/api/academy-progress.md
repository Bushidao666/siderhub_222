Title: Academy - Course Progress

1. GET /api/academy/courses/:courseId/progress  
   Auth: Bearer required  
   Path params:  
     - courseId: UUID  
   Success 200: ApiResponse<CourseProgress>  
   Notes:  
   - Retorna progresso atual do usuário autenticado (ou snapshot vazio quando inexistente).  
   - Usa `AcademyService.getCourseProgress`, garantindo 404 se o curso não existir.

2. PATCH /api/academy/courses/:courseId/progress  
   Auth: Bearer required  
   Path params:  
     - courseId: UUID  
   Body:  
     - completedLessonIds: UUID[] (opcional, default [])  
     - lastLessonId?: UUID | null  
     - percentage?: number (0..100, ignorado pelo backend ‑ recalculado)  
   Success 200: ApiResponse<CourseProgress>  
   Errors: 400 VALIDATION_ERROR  
   Notes:  
   - Normaliza lições concluídas com base no courseTree e políticas de drip.  
   - Persiste via `AcademyService.saveCourseProgress`, retornando snapshot atualizado.

3. POST /api/academy/progress  
   Auth: Bearer required  
   Body:  
     - courseId: UUID  
     - lessonId: UUID  
   Success 200: ApiResponse<CourseProgress>  
   Errors: 400 VALIDATION_ERROR  
   Notes:  
   - Atalho legado para marcar uma aula como concluída (`AcademyService.updateProgress`).  
   - Mantido para compatibilidade até migração completa para o PATCH das lições.
