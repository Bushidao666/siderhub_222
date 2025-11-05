import type { CSSProperties, ChangeEvent } from 'react';
import { useState, useCallback } from 'react';
import { colors, surfaces, typography } from '../../../../shared/design/tokens';
import type { FilePreview } from '../../../components/common/FileUpload';
import { Button, Card, CardContent, CardTitle, FileUpload, Input } from '../../../components/common';

export type ResourceCategory = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type Resource = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
};

type ResourceManagementProps = {
  resources: Resource[];
  categories: ResourceCategory[];
  loading?: boolean;
  error?: string | null;
  onResourceCreate?: (resource: Partial<Resource>) => void;
  onResourceEdit?: (resource: Resource) => void;
  onResourceDelete?: (resourceId: string) => void;
  onCategoryCreate?: (category: Partial<ResourceCategory>) => void;
  onRetry?: () => void;
};

const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('document') || fileType.includes('word')) return '📝';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📑';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  return '📎';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const AdminCybervaultResources = ({
  resources,
  categories,
  loading = false,
  error,
  onResourceCreate,
  onResourceEdit,
  onResourceDelete,
  onCategoryCreate,
  onRetry,
}: ResourceManagementProps) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: [] as string[],
    isPublic: true,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [tagInput, setTagInput] = useState('');

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleFileChange = useCallback((files: File[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0]);
      // Auto-fill title if empty
      if (!resourceForm.title) {
        setResourceForm(prev => ({
          ...prev,
          title: files[0].name.replace(/\.[^/.]+$/, ''), // Remove extension
        }));
      }
    } else {
      setUploadedFile(null);
    }
  }, [resourceForm.title]);

  const handlePreviewsChange = useCallback((previews: FilePreview[]) => {
    setFilePreviews(previews);
  }, []);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !resourceForm.tags.includes(trimmedTag)) {
      setResourceForm(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      setTagInput('');
    }
  }, [tagInput, resourceForm.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setResourceForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  }, []);

  const handleTagKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const handleSubmitResource = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile || !resourceForm.title || !resourceForm.category) {
      return;
    }

    const newResource: Partial<Resource> = {
      title: resourceForm.title,
      description: resourceForm.description,
      category: resourceForm.category,
      fileName: uploadedFile.name,
      fileSize: uploadedFile.size,
      fileType: uploadedFile.type,
      tags: resourceForm.tags,
      isPublic: resourceForm.isPublic,
      // fileUrl will be set by backend after upload
    };

    onResourceCreate?.(newResource);

    // Reset form
    setResourceForm({
      title: '',
      description: '',
      category: '',
      tags: [],
      isPublic: true,
    });
    setUploadedFile(null);
    setFilePreviews([]);
    setShowUploadForm(false);
  }, [uploadedFile, resourceForm, onResourceCreate]);

  const handleSubmitCategory = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryForm.name) {
      return;
    }

    onCategoryCreate?.(categoryForm);

    // Reset form
    setCategoryForm({
      name: '',
      description: '',
      color: '#3B82F6',
    });
    setShowCategoryForm(false);
  }, [categoryForm, onCategoryCreate]);

  const handleSelectResource = useCallback((resourceId: string, selected: boolean) => {
    setSelectedResources(prev =>
      selected
        ? [...prev, resourceId]
        : prev.filter(id => id !== resourceId)
    );
  }, []);

  const handleDeleteResource = useCallback((resource: Resource) => {
    if (window.confirm(`Tem certeza que deseja excluir "${resource.title}"?`)) {
      onResourceDelete?.(resource.id);
    }
  }, [onResourceDelete]);

  if (loading) {
    return (
      <div className="space-y-4" data-testid="cybervault-resources-loading">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-3xl border border-[var(--skeleton-border)] bg-[var(--skeleton-bg)]"
            style={{
              '--skeleton-border': colors.borderPrimary,
              '--skeleton-bg': surfaces.bgSecondary,
            } as CSSProperties}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col gap-3 rounded-3xl border border-[var(--error-border)] bg-[var(--error-bg)] p-6 text-sm"
        data-testid="cybervault-resources-error"
        style={{ '--error-border': colors.accentError, '--error-bg': surfaces.errorTint } as CSSProperties}
      >
        <span style={{ color: colors.accentError }}>{error}</span>
        {onRetry ? (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-cybervault-resources">
      <header className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl uppercase tracking-[0.18em]"
            style={{ fontFamily: typography.fontHeading, color: colors.primary }}
          >
            Gestão de Recursos
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Faça upload e gerencie todos os recursos disponíveis no Cybervault.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setShowCategoryForm(true)}
          >
            + Nova Categoria
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowUploadForm(true)}
          >
            + Upload de Recurso
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.primary, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {resources.length}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Total de Recursos
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.accentSuccess, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {resources.reduce((acc, r) => acc + r.downloadCount, 0)}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Downloads Totais
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.textSecondary, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {categories.length}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Categorias
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.accentWarning, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {Math.round(resources.reduce((acc, r) => acc + r.fileSize, 0) / 1024 / 1024)}MB
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Armazenamento
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card variant="outlined">
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Buscar recursos"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Título, descrição ou tags..."
            />
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                Categoria
              </label>
              <select
                className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--select-focus)]"
                style={{
                  '--select-border': colors.borderPrimary,
                  '--select-bg': colors.bgSecondary,
                  '--select-focus': colors.borderAccent,
                } as CSSProperties}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <Card variant="outlined" data-testid="cybervault-resources-empty">
          <CardContent className="text-center">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
              {searchTerm || categoryFilter !== 'all' ? 'Nenhum recurso encontrado' : 'Nenhum recurso uploaded ainda'}
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {searchTerm || categoryFilter !== 'all'
                ? 'Tente ajustar os filtros ou termos de busca.'
                : 'Comece fazendo upload dos primeiros recursos para a equipe.'}
            </p>
            {!searchTerm && categoryFilter === 'all' && (
              <Button variant="primary" onClick={() => setShowUploadForm(true)}>
                Fazer Primeiro Upload
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <Card
              key={resource.id}
              variant="outlined"
              className="group transition-transform duration-200 hover:-translate-y-0.5"
              data-testid={`cybervault-resource-${resource.id}`}
            >
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-2xl">
                    {getFileIcon(resource.fileType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate" style={{ color: colors.primary }}>
                      {resource.title}
                    </h3>
                    <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                      {resource.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="rounded px-2 py-1 text-xs"
                    style={{
                      background: categories.find(c => c.id === resource.category)?.color + '20' || surfaces.bgTertiary,
                      color: categories.find(c => c.id === resource.category)?.color || colors.textTertiary,
                    }}
                  >
                    {categories.find(c => c.id === resource.category)?.name || 'Sem categoria'}
                  </div>
                  <span className="text-xs" style={{ color: colors.textTertiary }}>
                    {formatFileSize(resource.fileSize)}
                  </span>
                </div>

                {resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-[var(--tag-bg)] px-2 py-1 text-xs"
                        style={{ '--tag-bg': surfaces.bgTertiary, color: colors.textTertiary }}
                      >
                        {tag}
                      </span>
                    ))}
                    {resource.tags.length > 3 && (
                      <span
                        className="rounded-full bg-[var(--tag-bg)] px-2 py-1 text-xs"
                        style={{ '--tag-bg': surfaces.bgTertiary, color: colors.textTertiary }}
                      >
                        +{resource.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs" style={{ color: colors.textTertiary }}>
                  <span>{resource.downloadCount} downloads</span>
                  <span>{new Date(resource.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResourceEdit?.(resource)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteResource(resource)}
                    className="text-[var(--delete-color)] hover:bg-[var(--delete-bg)]"
                    style={{ '--delete-color': colors.accentError, '--delete-bg': surfaces.errorTint } as CSSProperties}
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Resource Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card variant="outlined" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardTitle>Upload de Recurso</CardTitle>
            <CardContent>
              <form onSubmit={handleSubmitResource} className="space-y-4">
                <FileUpload
                  label="Arquivo"
                  description="Selecione o arquivo para upload. Tamanho máximo: 100MB"
                  accept="*/*"
                  multiple={false}
                  maxSizeBytes={100 * 1024 * 1024}
                  value={uploadedFile ? [uploadedFile] : []}
                  onFilesChange={handleFileChange}
                  onPreviewsChange={handlePreviewsChange}
                  showPreview={true}
                />

                <Input
                  label="Título"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome do recurso"
                  required
                />

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Descrição
                  </label>
                  <textarea
                    className="min-h-[80px] w-full rounded-lg border border-[var(--textarea-border)] bg-[var(--textarea-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--textarea-focus)]"
                    style={{
                      '--textarea-border': colors.borderPrimary,
                      '--textarea-bg': colors.bgSecondary,
                      '--textarea-focus': colors.borderAccent,
                    } as CSSProperties}
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada do recurso..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Categoria *
                  </label>
                  <select
                    className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--select-focus)]"
                    style={{
                      '--select-border': colors.borderPrimary,
                      '--select-bg': colors.bgSecondary,
                      '--select-focus': colors.borderAccent,
                    } as CSSProperties}
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      placeholder="Adicione tags..."
                      containerClassName="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                    >
                      Adicionar
                    </Button>
                  </div>
                  {resourceForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {resourceForm.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 rounded-full bg-[var(--tag-bg)] px-3 py-1 text-xs"
                          style={{ '--tag-bg': surfaces.bgTertiary, color: colors.textPrimary }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
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

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resourceForm.isPublic}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
                    style={{
                      '--checkbox-border': colors.borderPrimary,
                      '--checkbox-bg': colors.bgSecondary,
                      '--checkbox-checked': colors.accentSuccess,
                      '--checkbox-focus': colors.borderAccent,
                    } as CSSProperties}
                  />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>
                    Público (visível para todos os membros)
                  </span>
                </label>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowUploadForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!uploadedFile || !resourceForm.title || !resourceForm.category}
                  >
                    Fazer Upload
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card variant="outlined" className="max-w-md w-full">
            <CardTitle>Nova Categoria</CardTitle>
            <CardContent>
              <form onSubmit={handleSubmitCategory} className="space-y-4">
                <Input
                  label="Nome"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Documentos, Templates, Ferramentas"
                  required
                />

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Descrição
                  </label>
                  <textarea
                    className="min-h-[80px] w-full rounded-lg border border-[var(--textarea-border)] bg-[var(--textarea-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--textarea-focus)]"
                    style={{
                      '--textarea-border': colors.borderPrimary,
                      '--textarea-bg': colors.bgSecondary,
                      '--textarea-focus': colors.borderAccent,
                    } as CSSProperties}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da categoria..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Cor
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      className="h-10 w-20 rounded border border-[var(--color-border)]"
                      style={{ '--color-border': colors.borderPrimary } as CSSProperties}
                    />
                    <Input
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3B82F6"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCategoryForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!categoryForm.name}
                  >
                    Criar Categoria
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

AdminCybervaultResources.displayName = 'AdminCybervaultResources';