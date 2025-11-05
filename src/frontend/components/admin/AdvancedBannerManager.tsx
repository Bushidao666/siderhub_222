import type { CSSProperties } from 'react';
import { useState, useCallback, useRef } from 'react';
import { colors, typography, surfaces, glows } from '../../../shared/design/tokens';
import type { HeroBanner, BannerCta } from '../../../shared/types/admin.types';
import { Badge, Button, Card, CardContent, CardTitle, FileUpload, Input } from '../common';

type BannerPosition = 'hero' | 'sidebar' | 'footer';
type BannerSize = 'small' | 'medium' | 'large';

export interface ExtendedHeroBanner extends HeroBanner {
  position?: BannerPosition;
  size?: BannerSize;
  autoRotate?: boolean;
  rotationInterval?: number; // seconds
}

export interface CarouselConfig {
  enabled: boolean;
  autoRotate: boolean;
  rotationInterval: number; // seconds
  showIndicators: boolean;
  showArrows: boolean;
  animation: 'slide' | 'fade' | 'scale';
}

type AdvancedBannerManagerProps = {
  banners: ExtendedHeroBanner[];
  carouselConfig: CarouselConfig;
  loading?: boolean;
  error?: string | null;
  onBannerCreate?: (banner: Partial<ExtendedHeroBanner>) => Promise<void>;
  onBannerUpdate?: (id: string, banner: Partial<ExtendedHeroBanner>) => Promise<void>;
  onBannerDelete?: (id: string) => Promise<void>;
  onBannerReorder?: (bannerIds: string[]) => Promise<void>;
  onCarouselConfigUpdate?: (config: CarouselConfig) => Promise<void>;
  onRetry?: () => void;
};

const statusColors: Record<HeroBanner['status'], { bg: string; text: string }> = {
  active: { bg: surfaces.successTint, text: colors.accentSuccess },
  inactive: { bg: surfaces.bgTertiary, text: colors.textTertiary },
  scheduled: { bg: surfaces.warningTint, text: colors.accentWarning },
};

const positionLabels: Record<BannerPosition, string> = {
  hero: 'Principal (Hero)',
  sidebar: 'Barra Lateral',
  footer: 'Rodapé',
};

const sizeLabels: Record<BannerSize, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
};

const initialBannerForm: Partial<ExtendedHeroBanner> = {
  title: '',
  description: '',
  imageUrl: '',
  primaryCta: { label: '', href: '', external: false },
  secondaryCta: null,
  status: 'inactive',
  position: 'hero',
  size: 'medium',
  startsAt: null,
  endsAt: null,
};

export const AdvancedBannerManager = ({
  banners,
  carouselConfig,
  loading = false,
  error,
  onBannerCreate,
  onBannerUpdate,
  onBannerDelete,
  onBannerReorder,
  onCarouselConfigUpdate,
  onRetry,
}: AdvancedBannerManagerProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<ExtendedHeroBanner | null>(null);
  const [showCarouselConfig, setShowCarouselConfig] = useState(false);
  const [selectedBanners, setSelectedBanners] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [bannerForm, setBannerForm] = useState<Partial<ExtendedHeroBanner>>(initialBannerForm);
  const [localCarouselConfig, setLocalCarouselConfig] = useState<CarouselConfig>(carouselConfig);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<any[]>([]);

  const handleImageUpload = useCallback((files: File[]) => {
    if (files.length > 0) {
      setUploadedImage(files[0]);
    }
  }, []);

  const handlePreviewsChange = useCallback((previews: any[]) => {
    setImagePreviews(previews);
  }, []);

  const handleBannerFormChange = useCallback((field: string, value: any) => {
    setBannerForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCtaChange = useCallback((ctaType: 'primaryCta' | 'secondaryCta', field: string, value: any) => {
    setBannerForm(prev => ({
      ...prev,
      [ctaType]: {
        ...(prev[ctaType] || { label: '', href: '', external: false }),
        [field]: value,
      },
    }));
  }, []);

  const handleCreateBanner = useCallback(async () => {
    if (!onBannerCreate) return;

    try {
      // Handle image upload if present
      let imageUrl = bannerForm.imageUrl;
      if (uploadedImage && !bannerForm.imageUrl) {
        // This would integrate with the upload service
        imageUrl = `https://storage.example.com/banners/${uploadedImage.name}`;
      }

      const bannerData = {
        ...bannerForm,
        imageUrl,
        order: banners.length, // Add to end
      };

      await onBannerCreate(bannerData);
      setBannerForm(initialBannerForm);
      setUploadedImage(null);
      setImagePreviews([]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create banner:', error);
    }
  }, [bannerForm, uploadedImage, banners.length, onBannerCreate]);

  const handleUpdateBanner = useCallback(async () => {
    if (!onBannerUpdate || !editingBanner) return;

    try {
      let imageUrl = bannerForm.imageUrl || editingBanner.imageUrl;
      if (uploadedImage) {
        imageUrl = `https://storage.example.com/banners/${uploadedImage.name}`;
      }

      await onBannerUpdate(editingBanner.id, {
        ...bannerForm,
        imageUrl,
      });

      setBannerForm(initialBannerForm);
      setUploadedImage(null);
      setImagePreviews([]);
      setEditingBanner(null);
    } catch (error) {
      console.error('Failed to update banner:', error);
    }
  }, [bannerForm, uploadedImage, editingBanner, onBannerUpdate]);

  const handleDeleteBanner = useCallback(async (banner: ExtendedHeroBanner) => {
    if (!onBannerDelete) return;

    if (window.confirm(`Tem certeza que deseja excluir o banner "${banner.title}"?`)) {
      await onBannerDelete(banner.id);
    }
  }, [onBannerDelete]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedItem(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedItem === null || !onBannerReorder) return;

    const reorderedBanners = [...banners];
    const [draggedBanner] = reorderedBanners.splice(draggedItem, 1);
    reorderedBanners.splice(dropIndex, 0, draggedBanner);

    const bannerIds = reorderedBanners.map(b => b.id);
    await onBannerReorder(bannerIds);
    setDraggedItem(null);
  }, [draggedItem, banners, onBannerReorder]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedBanners.length === 0 || !onBannerDelete) return;

    if (window.confirm(`Tem certeza que deseja excluir ${selectedBanners.length} banner(es)?`)) {
      await Promise.all(selectedBanners.map(id => onBannerDelete(id)));
      setSelectedBanners([]);
    }
  }, [selectedBanners, onBannerDelete]);

  const handleUpdateCarouselConfig = useCallback(async () => {
    if (!onCarouselConfigUpdate) return;

    await onCarouselConfigUpdate(localCarouselConfig);
    setShowCarouselConfig(false);
  }, [localCarouselConfig, onCarouselConfigUpdate]);

  const startEditBanner = useCallback((banner: ExtendedHeroBanner) => {
    setEditingBanner(banner);
    setBannerForm(banner);
    setShowCreateForm(true);
  }, []);

  const BannerCard = ({ banner, index }: { banner: ExtendedHeroBanner; index: number }) => (
    <div
      key={banner.id}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, index)}
      className="group relative cursor-move transition-all duration-200 hover:-translate-y-0.5"
    >
      <Card
        variant="outlined"
        glowing={banner.status === 'active'}
        className="h-full"
      >
        <CardContent className="space-y-3">
          {/* Banner Preview */}
          {banner.imageUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Banner Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium line-clamp-2" style={{ color: colors.primary }}>
                {banner.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className="rounded-full px-2 py-1 text-xs"
                  style={{
                    background: statusColors[banner.status].bg,
                    color: statusColors[banner.status].text,
                  }}
                >
                  {banner.status}
                </div>
                {banner.position && (
                  <Badge variant="ghost" size="sm">
                    {positionLabels[banner.position]}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
              {banner.description}
            </p>

            <div className="flex items-center gap-3 text-xs" style={{ color: colors.textTertiary }}>
              <span>Ordem: {banner.order}</span>
              {banner.size && <span>Tamanho: {sizeLabels[banner.size]}</span>}
              <span>Criado: {new Date(banner.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>

            {/* CTAs Info */}
            <div className="flex gap-2">
              <span className="rounded bg-[var(--primary-bg)] px-2 py-1 text-xs"
                style={{ '--primary-bg': colors.primary + '20', color: colors.primary }}>
                Principal: {banner.primaryCta.label}
              </span>
              {banner.secondaryCta && (
                <span className="rounded bg-[var(--secondary-bg)] px-2 py-1 text-xs"
                  style={{ '--secondary-bg': colors.accentWarning + '20', color: colors.accentWarning }}>
                  Secundário: {banner.secondaryCta.label}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <input
              type="checkbox"
              checked={selectedBanners.includes(banner.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedBanners(prev => [...prev, banner.id]);
                } else {
                  setSelectedBanners(prev => prev.filter(id => id !== banner.id));
                }
              }}
              className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)]"
              style={{
                '--checkbox-border': colors.borderPrimary,
                '--checkbox-bg': colors.bgSecondary,
                '--checkbox-checked': colors.accentSuccess,
              } as CSSProperties}
            />

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditBanner(banner)}
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteBanner(banner)}
                className="text-[var(--delete-color)]"
                style={{ '--delete-color': colors.accentError } as CSSProperties}
              >
                Excluir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="banners-loading">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-64 rounded-3xl border border-[var(--skeleton-border)] bg-[var(--skeleton-bg)]"
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
        data-testid="banners-error"
        style={{ '--error-border': colors.accentError, '--error-bg': surfaces.errorTint } as CSSProperties}
      >
        <span style={{ color: colors.accentError }}>{error}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="advanced-banner-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl uppercase tracking-[0.18em]"
            style={{ fontFamily: typography.fontHeading, color: colors.primary }}
          >
            Gestão Avançada de Banners
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Configure múltiplos banners, carousel e ordenação para o Hub.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setShowCarouselConfig(true)}
          >
            Configurar Carousel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditingBanner(null);
              setBannerForm(initialBannerForm);
              setShowCreateForm(true);
            }}
          >
            + Novo Banner
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]"
               style={{ '--stat-value': colors.primary, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {banners.length}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Total de Banners
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]"
               style={{ '--stat-value': colors.accentSuccess, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {banners.filter(b => b.status === 'active').length}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Ativos
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]"
               style={{ '--stat-value': colors.accentWarning, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {banners.filter(b => b.status === 'scheduled').length}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Agendados
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]"
               style={{ '--stat-value': colors.textTertiary, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {carouselConfig.enabled ? 'Ativado' : 'Desativado'}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Carousel
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBanners.length > 0 && (
        <Card variant="outlined">
          <CardContent className="flex items-center justify-between">
            <span className="text-sm" style={{ color: colors.textPrimary }}>
              {selectedBanners.length} banner{selectedBanners.length > 1 ? 's' : ''} selecionado{selectedBanners.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBanners([])}
              >
                Limpar seleção
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                className="text-[var(--delete-color)]"
                style={{ '--delete-color': colors.accentError } as CSSProperties}
              >
                Excluir selecionados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banners Grid */}
      {banners.length === 0 ? (
        <Card variant="outlined" data-testid="banners-empty">
          <CardContent className="text-center">
            <div className="text-4xl mb-4">🖼️</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
              Nenhum banner criado ainda
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              Comece criando seu primeiro banner para personalizar o Hub.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setEditingBanner(null);
                setBannerForm(initialBannerForm);
                setShowCreateForm(true);
              }}
            >
              Criar Primeiro Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <p className="text-sm mb-4" style={{ color: colors.textTertiary }}>
            💡 Arraste e solte os banners para reordenar
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner, index) => (
              <BannerCard key={banner.id} banner={banner} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Banner Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card variant="outlined" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardTitle>{editingBanner ? 'Editar Banner' : 'Novo Banner'}</CardTitle>
            <CardContent className="space-y-4">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Título *"
                  value={bannerForm.title || ''}
                  onChange={(e) => handleBannerFormChange('title', e.target.value)}
                  placeholder="Título chamativo para o banner"
                  required
                />
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Posição
                  </label>
                  <select
                    className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm"
                    style={{
                      '--select-border': colors.borderPrimary,
                      '--select-bg': colors.bgSecondary,
                    } as CSSProperties}
                    value={bannerForm.position || 'hero'}
                    onChange={(e) => handleBannerFormChange('position', e.target.value)}
                  >
                    <option value="hero">Principal (Hero)</option>
                    <option value="sidebar">Barra Lateral</option>
                    <option value="footer">Rodapé</option>
                  </select>
                </div>
              </div>

              <Input
                label="Descrição *"
                value={bannerForm.description || ''}
                onChange={(e) => handleBannerFormChange('description', e.target.value)}
                placeholder="Descrição detalhada do banner"
                required
              />

              {/* Image Upload */}
              <FileUpload
                label="Imagem do Banner"
                description="Formatos recomendados: JPG, PNG. Tamanho ideal: 1200x400px"
                accept="image/*"
                value={uploadedImage ? [uploadedImage] : []}
                onFilesChange={handleImageUpload}
                onPreviewsChange={handlePreviewsChange}
                showPreview={true}
              />

              {(bannerForm.imageUrl || uploadedImage) && (
                <div className="aspect-video w-full overflow-hidden rounded-lg">
                  <img
                    src={uploadedImage ? URL.createObjectURL(uploadedImage) : bannerForm.imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* CTAs */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    CTA Principal
                  </h4>
                  <Input
                    label="Rótulo"
                    value={bannerForm.primaryCta?.label || ''}
                    onChange={(e) => handleCtaChange('primaryCta', 'label', e.target.value)}
                    placeholder="Saiba Mais"
                  />
                  <Input
                    label="URL"
                    value={bannerForm.primaryCta?.href || ''}
                    onChange={(e) => handleCtaChange('primaryCta', 'href', e.target.value)}
                    placeholder="https://exemplo.com"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={bannerForm.primaryCta?.external || false}
                      onChange={(e) => handleCtaChange('primaryCta', 'external', e.target.checked)}
                    />
                    Abrir em nova aba
                  </label>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    CTA Secundário (opcional)
                  </h4>
                  <Input
                    label="Rótulo"
                    value={bannerForm.secondaryCta?.label || ''}
                    onChange={(e) => handleCtaChange('secondaryCta', 'label', e.target.value)}
                    placeholder="Ver Detalhes"
                  />
                  <Input
                    label="URL"
                    value={bannerForm.secondaryCta?.href || ''}
                    onChange={(e) => handleCtaChange('secondaryCta', 'href', e.target.value)}
                    placeholder="https://exemplo.com/detalhes"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={bannerForm.secondaryCta?.external || false}
                      onChange={(e) => handleCtaChange('secondaryCta', 'external', e.target.checked)}
                    />
                    Abrir em nova aba
                  </label>
                </div>
              </div>

              {/* Status and Scheduling */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Status
                  </label>
                  <select
                    className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm"
                    style={{
                      '--select-border': colors.borderPrimary,
                      '--select-bg': colors.bgSecondary,
                    } as CSSProperties}
                    value={bannerForm.status || 'inactive'}
                    onChange={(e) => handleBannerFormChange('status', e.target.value)}
                  >
                    <option value="inactive">Inativo</option>
                    <option value="active">Ativo</option>
                    <option value="scheduled">Agendado</option>
                  </select>
                </div>
                <Input
                  label="Início"
                  type="datetime-local"
                  value={bannerForm.startsAt || ''}
                  onChange={(e) => handleBannerFormChange('startsAt', e.target.value)}
                />
                <Input
                  label="Fim"
                  type="datetime-local"
                  value={bannerForm.endsAt || ''}
                  onChange={(e) => handleBannerFormChange('endsAt', e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingBanner(null);
                    setBannerForm(initialBannerForm);
                    setUploadedImage(null);
                    setImagePreviews([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={editingBanner ? handleUpdateBanner : handleCreateBanner}
                  disabled={!bannerForm.title?.trim() || !bannerForm.description?.trim()}
                >
                  {editingBanner ? 'Atualizar Banner' : 'Criar Banner'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Carousel Config Modal */}
      {showCarouselConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card variant="outlined" className="max-w-md w-full">
            <CardTitle>Configurar Carousel</CardTitle>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localCarouselConfig.enabled}
                  onChange={(e) => setLocalCarouselConfig({
                    ...localCarouselConfig,
                    enabled: e.target.checked,
                  })}
                />
                <span className="text-sm">Ativar carousel</span>
              </label>

              {localCarouselConfig.enabled && (
                <>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localCarouselConfig.autoRotate}
                      onChange={(e) => setLocalCarouselConfig({
                        ...localCarouselConfig,
                        autoRotate: e.target.checked,
                      })}
                    />
                    <span className="text-sm">Rotação automática</span>
                  </label>

                  {localCarouselConfig.autoRotate && (
                    <Input
                      label="Intervalo de rotação (segundos)"
                      type="number"
                      value={localCarouselConfig.rotationInterval}
                      onChange={(e) => setLocalCarouselConfig({
                        ...localCarouselConfig,
                        rotationInterval: parseInt(e.target.value) || 5,
                      })}
                      min="3"
                      max="60"
                    />
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                      Animação
                    </label>
                    <select
                      className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm"
                      style={{
                        '--select-border': colors.borderPrimary,
                        '--select-bg': colors.bgSecondary,
                      } as CSSProperties}
                      value={localCarouselConfig.animation}
                      onChange={(e) => setLocalCarouselConfig({
                        ...localCarouselConfig,
                        animation: e.target.value as CarouselConfig['animation'],
                      })}
                    >
                      <option value="slide">Slide</option>
                      <option value="fade">Fade</option>
                      <option value="scale">Scale</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localCarouselConfig.showIndicators}
                      onChange={(e) => setLocalCarouselConfig({
                        ...localCarouselConfig,
                        showIndicators: e.target.checked,
                      })}
                    />
                    <span className="text-sm">Mostrar indicadores</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localCarouselConfig.showArrows}
                      onChange={(e) => setLocalCarouselConfig({
                        ...localCarouselConfig,
                        showArrows: e.target.checked,
                      })}
                    />
                    <span className="text-sm">Mostrar setas de navegação</span>
                  </label>
                </>
              )}

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCarouselConfig(false);
                    setLocalCarouselConfig(carouselConfig);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdateCarouselConfig}
                >
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

AdvancedBannerManager.displayName = 'AdvancedBannerManager';