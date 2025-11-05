import type { CSSProperties } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { colors, typography, surfaces } from '../../../shared/design/tokens';
import type { CourseTree, CourseModule } from '../../../shared/types/academy.types';
import { Button, Card, CardContent, CardTitle, Input, Tabs } from '../common';

export type DripRule = {
  type: 'date' | 'days_after' | 'after_completion' | 'none';
  releaseDate?: string;
  daysAfter?: number;
  afterModuleId?: string;
};

export type DripModuleConfig = {
  id: string;
  title: string;
  dripRule: DripRule;
  releaseDate?: string;
  daysAfter?: number;
  afterModuleId?: string;
  enabled: boolean;
}

type DripConfig = {
  courseId: string;
  modules: DripModuleConfig[];
  defaultDripType: 'date' | 'days_after' | 'after_completion' | 'none';
  enablePreviewContent: boolean;
  unlockOnEnrollment: boolean;
  autoUnlockFirstModule: boolean;
};

type DripContentConfigProps = {
  course?: CourseTree;
  loading?: boolean;
  error?: string | null;
  onConfigUpdate?: (config: Partial<DripConfig>) => Promise<void>;
  onRetry?: () => void;
};

const dripTypeLabels: Record<DripRule['type'], string> = {
  date: 'Data Específica',
  days_after: 'Após X Dias',
  after_completion: 'Após Módulo Concluído',
  none: 'Imediato',
};

const defaultDripConfig: DripConfig = {
  courseId: '',
  modules: [],
  defaultDripType: 'days_after',
  enablePreviewContent: true,
  unlockOnEnrollment: true,
  autoUnlockFirstModule: true,
};

const ruleConfigs = {
  date: {
    label: 'Data Específica',
    description: 'Libera o módulo em uma data específica',
    icon: '📅',
    color: colors.accentSuccess,
    fields: [
      { name: 'releaseDate', label: 'Data de Liberação', type: 'datetime-local', placeholder: '2024-12-31T23:59' },
    ],
  },
  days_after: {
    label: 'Após X Dias',
    description: 'Libera o módulo X dias após o início do curso',
    icon: '⏳',
    color: colors.accentWarning,
    fields: [
      { name: 'daysAfter', label: 'Dias Após Início', type: 'number', min: 0, placeholder: '7' },
    ],
  },
  after_completion: {
    label: 'Após Módulo Concluído',
    description: 'Libera o módulo quando um módulo específico for concluído',
    icon: '🎯',
    color: colors.accentInfo,
    fields: [
      { name: 'afterModuleId', label: 'Módulo Dependência', type: 'select' },
    ],
  },
  none: {
    label: 'Imediato',
    description: 'Libera o módulo imediatamente (sem bloqueio)',
    icon: '🔓',
    color: colors.textTertiary,
    fields: [],
  },
};

export const DripContentConfig = ({
  course,
  loading = false,
  error,
  onConfigUpdate,
  onRetry,
}: DripContentConfigProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<DripConfig>(defaultDripConfig);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Mock query - in production this would fetch the current config
  const configQuery = useQuery({
    queryKey: ['academy', 'drip-config', course?.id],
    queryFn: async () => {
      if (!course?.id) return defaultDripConfig;

      // In production, fetch from API
      // try {
      //   const response = await adminApiClient.get(`/admin/courses/${course.id}/drip-config`);
      //   return response.data;
      // } catch {
      //   return defaultDripConfig;
      // }

      // For now, return default config with current modules
      return {
        courseId: course.id,
        modules: course.modules.map(module => ({
          id: module.id,
          title: module.title,
          dripRule: module.dripReleaseAt
            ? { type: 'date', releaseDate: module.dripReleaseAt }
            : module.dripDaysAfter
            ? { type: 'days_after', daysAfter: module.dripDaysAfter }
            : module.dripAfterModuleId
            ? { type: 'after_completion', afterModuleId: module.dripAfterModuleId }
            : { type: 'none' },
          enabled: true,
        })),
        defaultDripType: 'days_after',
        enablePreviewContent: true,
        unlockOnEnrollment: true,
        autoUnlockFirstModule: true,
      };
    },
    enabled: !!course?.id,
    staleTime: 300000, // 5 minutes
  });

  // Sync with query data
  useEffect(() => {
    if (configQuery.data) {
      setConfig(configQuery.data);
    }
  }, [configQuery.data]);

  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<DripConfig>) => {
      if (!course?.id || !onConfigUpdate) return;

      const newConfig = { ...config, ...updates };
      return onConfigUpdate(newConfig);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['academy', 'drip-config', course?.id],
      });
    },
  });

  const handleConfigChange = useCallback((field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleModuleConfigChange = useCallback((moduleId: string, updates: Partial<DripModuleConfig>) => {
    setConfig(prev => ({
      ...prev,
      modules: prev.modules.map(module =>
        module.id === moduleId ? { ...module, ...updates } : module
      ),
    }));
  }, []);

  const handleSetModuleDripRule = useCallback((moduleId: string, rule: DripRule) => {
    const updates: Partial<DripModuleConfig> = {
      dripRule: rule,
      enabled: rule.type !== 'none',
      releaseDate: rule.type === 'date' ? rule.releaseDate : undefined,
      daysAfter: rule.type === 'days_after' ? rule.daysAfter : undefined,
      afterModuleId: rule.type === 'after_completion' ? rule.afterModuleId : undefined,
    };

    handleModuleConfigChange(moduleId, updates);
  }, [handleModuleConfigChange]);

  const handleSaveConfig = useCallback(async () => {
    await updateConfigMutation.mutateAsync();
  }, [updateConfigMutation]);

  const handleResetToDefault = useCallback(() => {
    const defaultModules = course?.modules.map(module => ({
      id: module.id,
      title: module.title,
      dripRule: { type: config.defaultDripType },
      enabled: true,
    })) || [];

    setConfig({
      courseId: course?.id || '',
      modules: defaultModules,
      defaultDripType: 'days_after',
      enablePreviewContent: true,
      unlockOnEnrollment: true,
      autoUnlockFirstModule: true,
    });
  }, [course, config.defaultDripType]);

  const applyToAllModules = useCallback((rule: DripRule) => {
    const updates = config.modules.map(module => ({
      ...module,
      dripRule: rule,
      enabled: rule.type !== 'none',
      releaseDate: rule.type === 'date' ? rule.releaseDate : undefined,
      daysAfter: rule.type === 'days_after' ? rule.daysAfter : undefined,
      afterModuleId: rule.type === 'after_completion' ? rule.afterModuleId : undefined,
    }));

    handleConfigChange('modules', updates);
  }, [config.modules, handleConfigChange]);

  const getModuleDripPreview = useCallback((module: DripModuleConfig) => {
    if (module.dripRule.type === 'none') {
      return 'Disponível imediatamente';
    }

    if (module.dripRule.type === 'date' && module.dripRule.releaseDate) {
      return `Disponível em ${new Date(module.dripRule.releaseDate).toLocaleDateString('pt-BR')}`;
    }

    if (module.dripRule.type === 'days_after' && module.dripRule.daysAfter) {
      return `Disponível após ${module.dripRule.daysAfter} dias do início`;
    }

    if (module.dripRule.type === 'after_completion' && module.dripRule.afterModuleId) {
      const dependency = config.modules.find(m => m.id === module.dripRule.afterModuleId);
      const dependencyName = dependency?.title || 'módulo anterior';
      return `Disponível após concluir "${dependencyName}"`;
    }

    return 'Configurar bloqueio';
  }, [config.modules]);

  const validateDripConfig = useCallback(() => {
    // Basic validation
    if (!config.modules.length) return false;

    // Check if there are any enabled drip rules
    const hasDripRules = config.modules.some(m => m.enabled && m.dripRule.type !== 'none');
    return hasDripRules || config.unlockOnEnrollment || config.autoUnlockFirstModule;
  }, [config.modules, config.unlockOnEnrollment, config.autoUnlockFirstModule]);

  const DripRuleSelector = ({ value, onChange }: { value: DripRule['type']; onChange: (rule: DripRule) => void }) => {
    const ruleConfig = ruleConfigs[value];
    return (
      <Card
        variant={value === selectedModule?.dripRule?.type ? 'solid' : 'outlined'}
        className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
        onClick={() => onChange(value)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{ruleConfig.icon}</div>
            <div>
              <h4 className="font-medium" style={{ color: colors.primary }}>
                {ruleConfig.label}
              </h4>
              <p className="text-sm" style={{ color: colors.textTertiary }}>
                {ruleConfig.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const DripRuleForm = ({ rule, onChange }: { rule: DripRule; onChange: (rule: DripRule) => void }) => {
    const ruleConfig = ruleConfigs[rule.type];
    const field = ruleConfig.fields[0];

    return (
      <Card variant="outlined" className="space-y-4">
        <CardContent>
          <h4 className="font-medium" style={{ color: ruleConfig.color }}>
            {ruleConfig.label}
          </h4>
          <p className="text-sm" style={{ color: colors.textTertiary }}>
            {ruleConfig.description}
          </p>

          {field && (
            <div className="space-y-3">
              {field.name === 'releaseDate' && (
                <Input
                  label="Data de Liberação"
                  type="datetime-local"
                  value={rule.releaseDate || ''}
                  onChange={(e) => onChange({
                    ...rule,
                    releaseDate: e.target.value,
                  })}
                />
              )}
              {field.name === 'daysAfter' && (
                <Input
                  label="Dias Após Início"
                  type="number"
                  value={rule.daysAfter || 0}
                  onChange={(e) => onChange({
                    ...rule,
                    daysAfter: parseInt(e.target.value) || 0,
                  })}
                  min="0"
                  max="365"
                />
              )}
              {field.name === 'afterModuleId' && course && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    Módulo Dependência
                  </label>
                  <select
                    className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--select-focus)]"
                    style={{
                      '--select-border': colors.borderPrimary,
                      '--select-bg': colors.bgSecondary,
                      '--select-focus': colors.borderAccent,
                    } as CSSProperties}
                    value={rule.afterModuleId || ''}
                    onChange={(e) => onChange({
                      ...rule,
                      afterModuleId: e.target.value || undefined,
                    })}
                  >
                    <option value="">Selecione um módulo...</option>
                    {course.modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ModuleConfigCard = ({ module, index }: { module: DripModuleConfig; index: number }) => (
    <Card
      variant={selectedModule === module.id ? 'solid' : 'outlined'}
      className="transition-all duration-200"
      style={{ backgroundColor: selectedModule === module.id ? 'rgba(0, 255, 0, 0.08)' : 'transparent' }}
    >
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium" style={{ color: colors.primary }}>
            {index + 1}. {module.title}
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={module.enabled}
              onChange={(e) => {
                handleModuleConfigChange(module.id, { enabled: e.target.checked });
              }}
              className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
              style={{
                '--checkbox-border': colors.borderPrimary,
                '--checkbox-bg': colors.bgSecondary,
                '--checkbox-checked': colors.accentSuccess,
                '--checkbox-focus': colors.borderAccent,
              } as CSSProperties}
            />
            <span className="text-sm" style={{ color: colors.textPrimary }}>
              {module.enabled ? 'Ativado' : 'Desativado'}
            </span>
          </label>
        </div>

        {module.enabled && (
          <div className="space-y-3">
            <DripRuleSelector
              value={module.dripRule}
              onChange={(rule) => handleSetModuleDripRule(module.id, rule)}
            />

            <DripRuleForm
              rule={module.dripRule}
              onChange={(rule) => handleSetModuleDripRule(module.id, rule)}
            />
          </div>
        )}

        <div className="text-xs text-[var(--preview-color)]" style={{ '--preview-color': colors.textTertiary }}>
          <span className="font-medium">Status:</span> {getModuleDripPreview(module)}
        </div>
      </CardContent>
    </Card>
  );

  const tabs = [
    { id: 'individual', label: 'Individual' },
    { id: 'bulk', label: 'Em Massa' },
    { id: 'global', label: 'Global' },
  ];

  if (!course) {
    return (
      <Card variant="outlined">
        <CardContent className="text-center">
          <div className="text-4xl mb-4">💧</div>
          <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
            Selecione um curso para configurar
          </h3>
          <p className="text-sm text-[var(--description-color)]" style={{ '--description-color': colors.textTertiary }}>
            Primeiro, escolha um curso na lista de cursos para acessar as configurações de drip content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="drip-content-config">
      <header className="space-y-1">
        <h1
          className="text-2xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Configuração de Drip Content
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Defina quando cada módulo será liberado para os alunos.
        </p>
      </header>

      {error && (
        <Card variant="outlined">
          <CardContent className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-sm text-[var(--error-color)]" style={{ '--error-color': colors.accentError }}>
              {error}
            </p>
            {onRetry && (
              <Button variant="primary" onClick={onRetry}>
                Tentar Novamente
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onActiveTabChange={setActiveTab}>
        <div className="space-y-6">
          {activeTab === 'individual' && (
            <div>
              <Card variant="outlined">
                <CardTitle>Configuração por Módulo</CardTitle>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {config.modules.length} módulo{config.modules.length !== 1 ? 's' : ''} configurados
                    </span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetToDefault}
                        disabled={loading}
                      >
                        Redefinir
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveConfig}
                        loading={updateConfigMutation.isPending}
                        disabled={!validateDripConfig()}
                      >
                        Salvar Configuração
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                    {config.modules.map((module, index) => (
                      <ModuleConfigCard key={module.id} module={module} index={index} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Course-Level Settings */}
              <Card variant="outlined">
                <CardTitle>Configurações Gerais</CardTitle>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                        Padrão de Bloqueio
                      </label>
                      <select
                        className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--select-focus)]"
                        style={{
                          '--select-border': colors.borderPrimary,
                          '--select-bg': colors.bgSecondary,
                          '--select-focus': colors.borderAccent,
                        } as CSSProperties}
                        value={config.defaultDripType}
                        onChange={(e) => handleConfigChange('defaultDripType', e.target.value as DripRule['type'])}
                      >
                        {Object.entries(dripTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enablePreviewContent}
                        onChange={(e) => handleConfigChange('enablePreviewContent', e.target.checked)}
                        className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
                        style={{
                          '--checkbox-border': colors.borderPrimary,
                          '--checkbox-bg': categories.bgSecondary,
                          '--checkbox-checked': colors.accentSuccess,
                          '--checkbox-focus': colors.borderAccent,
                        } as CSSProperties}
                      />
                      <span className="text-sm" style={{ color: colors.textPrimary }}>
                        Permitir preview de conteúdo bloqueado
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.unlockOnEnrollment}
                        onChange={(e) => handleConfigChange('unlockOnEnrollment, e.target.checked)}
                        className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
                        style={{
                          '--checkbox-border': colors.borderPrimary,
                          '--checkbox-bg': colors.bgSecondary,
                          '--checkbox-checkbox-checked': colors.accentSuccess,
                          '--checkbox-focus': colors.borderAccent,
                        } as CSSProperties}
                      />
                      <span className="text-sm" style={{ color: colors.textPrimary }}>
                        Desbloquear primeiro módulo automaticamente
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoUnlockFirstModule}
                        onChange={(e) => handleConfigChange('autoUnlockFirstModule', e.target.checked)}
                        className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
                        style={{
                          '--checkbox-border': colors.borderPrimary,
                          '--checkbox-bg': colors.bgSecondary,
                          '--checkbox-checkbox-checked': colors.accentSuccess,
                          '--checkbox-focus': colors.borderAccent,
                        } as CSSProperties}
                      />
                      <span className="text-sm" style={{ color: colors.textPrimary }}>
                        Auto-desbloquear primeiro módulo
                      </span>
                    </label>
                  </div>

                  {/* Statistics */}
                  <div className="rounded-lg border border-[var(--stats-border)] bg-[var(--stats-bg)] p-4">
                    <div className="grid gap-4 md:grid-cols-3 text-center">
                      <div>
                        <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.accentSuccess, '--stats-border': colors.borderPrimary, '--stats-bg': surfaces.bgSecondary } as CSSProperties}>
                          {config.modules.filter(m => m.enabled).length}
                        </div>
                        <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
                          Módulos com drip
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.accentWarning, '--stats-border': colors.borderPrimary, '--stats-bg': surfaces.bgSecondary } as CSSProperties}>
                          {config.modules.filter(m => m.enabled && m.dripRule.type === 'days_after').length}
                        </div>
                        <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
                          Bloqueio por dias
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.textTertiary, '--stats-border': colors.borderPrimary, '--stats-bg': surfaces.bgSecondary } as CSSProperties}>
                          {config.modules.filter(m => m.enabled && m.dripRule.type === 'after_completion').length}
                        </div>
                        <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
                          Bloqueio por conclusão
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div>
              <Card variant="outlined">
                <CardTitle>Configuração em Massa</CardTitle>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="text-medium" style={{ color: colors.primary }}>
                      Aplicar regra a todos os módulos:
                    </h4>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Esta ação sobrescreverá a configuração individual de cada módulo.
                    </p>

                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(ruleConfigs).map(([type, config]) => (
                        <DripRuleSelector
                          key={type}
                          value={type}
                          onChange={(rule) => applyToAllModules(rule)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={handleResetToDefault}
                      disabled={loading}
                    >
                      Redefinir
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveConfig}
                      loading={updateConfigMutation.isPending}
                      disabled={!validateDripConfig()}
                    >
                      Aplicar a Todos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'global' && (
            <div>
              <Card variant="outlined">
                <CardTitle>Configurações Globais</CardTitle>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="text-medium" style={{ color: colors.primary }}>
                      Configurações Padrão para Novos Cursos
                    </h4>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Estas configurações serão aplicadas automaticamente a novos cursos criados.
                    </p>

                    <div className="space-y-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                          Padrão de Bloqueio
                        </label>
                        <select
                          className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--select-focus)]"
                          style={{
                            '--select-border': colors.borderPrimary,
                            '--select-bg': colors.bgSecondary,
                            '--select-focus': colors.borderAccent,
                          } as CSSProperties}
                          value={config.defaultDripType}
                          onChange={(e) => handleConfigChange('defaultDripType', e.target.value as DripRule['type'])}
                        >
                          {Object.entries(dripTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enablePreviewContent}
                          onChange={(e) => handleConfigChange('enablePreviewContent', e.target.checked)}
                          className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
                          style={{
                            '--checkbox-border': colors.borderPrimary,
                            '--checkbox-bg': colors.bgSecondary,
                            '--checkbox-checkbox-checked': colors.accentSuccess,
                            '--checkbox-focus': colors.borderAccent,
                          } as CSSProperties}
                        />
                        <span className="text-sm" style={{ color: colors.textPrimary }}>
                          Permitir preview de conteúdo bloqueado por padrão
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.unlockOnEnrollment}
                          onChange={(e) => handleConfigChange('unlockOnEnrollment', e.target.checked)}
                          className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
                          style={{
                            '--checkbox-border': colors.borderPrimary,
                            '--checkbox-bg': colors.bgSecondary,
                            '--checkbox-checkbox-checked': colors.accentSuccess,
                            '--checkbox-focus': colors.borderAccent,
                          } as CSSProperties}
                        />
                        <span className="text-sm" style={{ color: colors.textPrimary }}>
                          Desbloquear primeiro módulo por padrão
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.autoUnlockFirstModule}
                          onChange={(e) => handleConfigChange('autoUnlockFirstModule', e.target.checked)}
                          className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
                          style={{
                            '--checkbox-border': colors.borderPrimary,
                            '--checkbox-bg': colors.bgSecondary,
                            '--checkbox-checkbox-checked': colors.accentSuccess,
                            '--checkbox-focus': colors.borderAccent,
                          } as CSSProperties}
                        />
                        <span className="text-sm" style={{ color: colors.textPrimary }}>
                          Auto-desbloquear primeiro módulo por padrão
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={handleResetToDefault}
                      disabled={loading}
                    >
                      Redefinir Padrões
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveConfig}
                      loading={updateConfigMutation.isPending}
                    >
                      Salvar como Padrão
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

DripContentConfig.displayName = 'DripContentConfig';