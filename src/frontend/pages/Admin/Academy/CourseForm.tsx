import type { CSSProperties, ChangeEvent } from 'react';
import { useState, useCallback } from 'react';
import { colors, surfaces, typography } from '../../../../shared/design/tokens';
import type { CourseMeta, CourseTree, CourseModule, Lesson } from '../../../../shared/types/academy.types';
import { Button, Card, CardContent, CardTitle, FileUpload, Input } from '../../../components/common';

type CourseFormProps = {
  course?: Partial<CourseMeta> | null;
  onSave?: (course: Partial<CourseMeta>) => void;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

const courseLevels = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
];

const initialCourseState: Partial<CourseMeta> = {
  title: '',
  subtitle: '',
  description: '',
  level: 'beginner',
  status: 'draft',
  visibility: 'public',
  estimatedDurationMinutes: 0,
  tags: [],
  isFeatured: false,
};

export const AdminAcademyCourseForm = ({
  course = null,
  onSave,
  onCancel,
  loading = false,
  disabled = false,
}: CourseFormProps) => {
  const [formData, setFormData] = useState<Partial<CourseMeta>>({
    ...initialCourseState,
    ...course,
  });
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreviews, setCoverPreviews] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.level) {
      newErrors.level = 'Nível é obrigatório';
    }

    if (formData.estimatedDurationMinutes && formData.estimatedDurationMinutes < 0) {
      newErrors.estimatedDurationMinutes = 'Duração deve ser positiva';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleCoverImageChange = useCallback((files: File[]) => {
    if (files.length > 0) {
      setCoverImageFile(files[0]);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = {
          file: files[0],
          preview: e.target?.result as string,
          name: files[0].name,
          size: files[0].size,
          type: files[0].type,
        };
        setCoverPreviews([preview]);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setCoverImageFile(null);
      setCoverPreviews([]);
    }
  }, []);

  const handlePreviewsChange = useCallback((previews: any[]) => {
    setCoverPreviews(previews);
  }, []);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags?.includes(trimmedTag)) {
      handleInputChange('tags', [...(formData.tags || []), trimmedTag]);
      setTagInput('');
    }
  }, [tagInput, formData.tags, handleInputChange]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  }, [formData.tags, handleInputChange]);

  const handleTagKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submissionData = {
      ...formData,
      coverImage: coverImageFile ? URL.createObjectURL(coverImageFile) : formData.coverImage,
    };

    onSave?.(submissionData);
  }, [formData, coverImageFile, onSave]);

  return (
    <div className="space-y-6" data-testid="academy-course-form">
      <header className="space-y-1">
        <h2
          className="text-xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          {course?.id ? 'Editar Curso' : 'Novo Curso'}
        </h2>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          {course?.id ? 'Atualize as informações do curso' : 'Preencha as informações para criar um novo curso'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card variant="outlined">
              <CardTitle>Informações Básicas</CardTitle>
              <CardContent className="space-y-4">
                <Input
                  label="Título do Curso"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Introdução ao Marketing Digital"
                  required
                  error={errors.title}
                  disabled={disabled}
                />

                <Input
                  label="Subtítulo (opcional)"
                  value={formData.subtitle || ''}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="Um subtítulo atrativo para o curso"
                  disabled={disabled}
                />

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Descrição do Curso *
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-lg border border-[var(--textarea-border)] bg-[var(--textarea-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--textarea-focus)]"
                    style={{
                      '--textarea-border': colors.borderPrimary,
                      '--textarea-bg': colors.bgSecondary,
                      '--textarea-focus': colors.borderAccent,
                    } as CSSProperties}
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva o conteúdo, objetivos e público-alvo do curso..."
                    required
                    disabled={disabled}
                  />
                  {errors.description && (
                    <span className="text-xs" style={{ color: colors.accentError }}>
                      {errors.description}
                    </span>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                      Nível *
                    </label>
                    <select
                      className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--select-focus)]"
                      style={{
                        '--select-border': colors.borderPrimary,
                        '--select-bg': colors.bgSecondary,
                        '--select-focus': colors.borderAccent,
                      } as CSSProperties}
                      value={formData.level || ''}
                      onChange={(e) => handleInputChange('level', e.target.value)}
                      required
                      disabled={disabled}
                    >
                      <option value="">Selecione um nível</option>
                      {courseLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    {errors.level && (
                      <span className="text-xs" style={{ color: colors.accentError }}>
                        {errors.level}
                      </span>
                    )}
                  </div>

                  <Input
                    label="Duração Estimada (minutos)"
                    type="number"
                    value={formData.estimatedDurationMinutes || ''}
                    onChange={(e) => handleInputChange('estimatedDurationMinutes', parseInt(e.target.value) || 0)}
                    placeholder="Ex: 480"
                    min="0"
                    error={errors.estimatedDurationMinutes}
                    disabled={disabled}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                      Status
                    </label>
                    <select
                      className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--select-focus)]"
                      style={{
                        '--select-border': colors.borderPrimary,
                        '--select-bg': colors.bgSecondary,
                        '--select-focus': colors.borderAccent,
                      } as CSSProperties}
                      value={formData.status || 'draft'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={disabled}
                    >
                      <option value="draft">Rascunho</option>
                      <option value="published">Publicado</option>
                      <option value="archived">Arquivado</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                      Visibilidade
                    </label>
                    <select
                      className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--select-focus)]"
                      style={{
                        '--select-border': colors.borderPrimary,
                        '--select-bg': colors.bgSecondary,
                        '--select-focus': colors.borderAccent,
                      } as CSSProperties}
                      value={formData.visibility || 'public'}
                      onChange={(e) => handleInputChange('visibility', e.target.value)}
                      disabled={disabled}
                    >
                      <option value="public">Público</option>
                      <option value="private">Privado</option>
                      <option value="members">Apenas Membros</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      placeholder="Adicione tags como 'marketing', 'iniciante', etc."
                      containerClassName="flex-1"
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim() || disabled}
                    >
                      Adicionar
                    </Button>
                  </div>
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 rounded-full bg-[var(--tag-bg)] px-3 py-1 text-xs"
                          style={{ '--tag-bg': surfaces.bgTertiary, color: colors.textPrimary }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            disabled={disabled}
                            className="text-[var(--remove-color)] hover:text-[var(--remove-hover)]"
                            style={{ '--remove-color': colors.textTertiary, '--remove-hover': colors.accentError } as CSSProperties}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Featured Toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured || false}
                    onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
                    style={{
                      '--checkbox-border': colors.borderPrimary,
                      '--checkbox-bg': colors.bgSecondary,
                      '--checkbox-checked': colors.accentSuccess,
                      '--checkbox-focus': colors.borderAccent,
                    } as CSSProperties}
                  />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>
                    Destacar na página inicial
                  </span>
                </label>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cover Image */}
            <Card variant="outlined">
              <CardTitle>Imagem de Capa</CardTitle>
              <CardContent>
                <FileUpload
                  label="Imagem do curso"
                  description="Formatos recomendados: JPG, PNG. Tamanho ideal: 1200x630px"
                  accept="image/*"
                  multiple={false}
                  maxSizeBytes={5 * 1024 * 1024} // 5MB
                  value={coverImageFile ? [coverImageFile] : []}
                  onFilesChange={handleCoverImageChange}
                  onPreviewsChange={handlePreviewsChange}
                  disabled={disabled}
                  showPreview={true}
                />
                {course?.coverImage && !coverImageFile && (
                  <div className="mt-3">
                    <img
                      src={course.coverImage}
                      alt="Capa atual"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={disabled || loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={disabled}
          >
            {course?.id ? 'Atualizar Curso' : 'Criar Curso'}
          </Button>
        </div>
      </form>
    </div>
  );
};

AdminAcademyCourseForm.displayName = 'AdminAcademyCourseForm';