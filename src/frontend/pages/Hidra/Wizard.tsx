import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { colors, glows, surfaces, typography } from '../../../shared/design/tokens';
import type { ContactSegment, MessageTemplate } from '../../../shared/types/hidra.types';
import type { CreateCampaignPayload } from '../../../shared/types';
import { mapApiError } from '../../../shared/utils/errorHandler';
import { Button, Card, CardContent, CardTitle, Input } from '../../components/common';
import { MediaUpload } from '../../components/hidra/wizard';
import { ScheduleReview, SegmentSelector, TemplateEditor } from '../../components/hidra/wizard';
import { useHidraSegments } from '../../hooks/useHidraSegments';
import { useHidraTemplates } from '../../hooks/useHidraTemplates';
import { queryKeys } from '../../lib/queryClient';
import { handleHidraError, hidraService } from '../../services/hidraService';

const steps = [
  { id: 'basic', label: 'Informações Básicas' },
  { id: 'segment', label: 'Segmentação' },
  { id: 'template', label: 'Template & Mídia' },
  { id: 'schedule', label: 'Agendamento Avançado' },
  { id: 'review', label: 'Revisão & Confirmação' },
] as const;

type Step = (typeof steps)[number];

const initialCampaignForm = {
  name: '',
  description: '',
  externalId: '',
};

const initialScheduleForm = {
  scheduledAt: '',
  maxMessagesPerMinute: 60,
  timeWindows: {
    enabled: false,
    startTime: '09:00',
    endTime: '18:00',
  },
  daysOfWeek: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  },
};

type CampaignFormState = typeof initialCampaignForm;
type ScheduleFormState = typeof initialScheduleForm;

export const HidraWizard = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedSegment, setSelectedSegment] = useState<ContactSegment | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [messagePreview, setMessagePreview] = useState('');
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>(initialCampaignForm);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(initialScheduleForm);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const segmentsQuery = useHidraSegments();
  const templatesQuery = useHidraTemplates();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedTemplate) {
      setMessagePreview(selectedTemplate.body);
    } else {
      setMessagePreview('');
    }
  }, [selectedTemplate?.id]);

  const segmentsError = segmentsQuery.error ? mapApiError(segmentsQuery.error) : null;
  const templatesError = templatesQuery.error ? mapApiError(templatesQuery.error) : null;

  const isFinalStep = currentStep === steps.length - 1;

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: // Basic info
        return Boolean(campaignForm.name.trim());
      case 1: // Segment
        return Boolean(selectedSegment);
      case 2: // Template & Media
        return Boolean(selectedTemplate);
      case 3: // Advanced schedule
        return true; // Schedule is optional
      default:
        return true;
    }
  }, [currentStep, campaignForm.name, selectedSegment, selectedTemplate]);

  const handleSelectSegment = (segment: ContactSegment) => {
    setSelectedSegment(segment);
    setSuccessMessage(null);
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setSuccessMessage(null);
  };

  const handleCampaignFormChange = <K extends keyof CampaignFormState>(field: K, value: CampaignFormState[K]) => {
    setCampaignForm((previous) => ({ ...previous, [field]: value }));
    setSuccessMessage(null);
  };

  const handleScheduleFormChange = <K extends keyof ScheduleFormState>(field: K, value: ScheduleFormState[K]) => {
    setScheduleForm((previous) => ({ ...previous, [field]: value }));
    setSuccessMessage(null);
  };

  const handleMediaSelect = (media: any) => {
    setSelectedMedia(media);
  };

  const goNext = () => {
    if (!isFinalStep && canProceed) {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    }
  };

  const goPrevious = () => {
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const createCampaignMutation = useMutation({
    mutationFn: (payload: CreateCampaignPayload) => hidraService.createCampaign(payload),
    onSuccess: (campaign) => {
      setSuccessMessage(`Campanha ${campaign.name} criada com sucesso.`);
      setSubmissionError(null);
      setCampaignForm(initialCampaignForm);
      setScheduleForm(initialScheduleForm);
      setSelectedSegment(null);
      setSelectedTemplate(null);
      setSelectedMedia(null);
      setMessagePreview('');
      setCurrentStep(0);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.hidra.dashboard() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hidra.campaignStats() }),
      ]);
    },
    onError: (error) => {
      setSubmissionError(handleHidraError(error));
    },
  });

  const handleSubmit = async () => {
    if (!selectedSegment || !selectedTemplate) {
      return;
    }

    setSubmissionError(null);

    const payload: CreateCampaignPayload = {
      name: form.name,
      description: form.description || undefined,
      segmentId: selectedSegment.id,
      templateId: selectedTemplate.id,
      maxMessagesPerMinute: Math.max(1, form.maxMessagesPerMinute || 60),
      scheduledAt: form.scheduledAt || null,
      externalId: form.externalId || undefined,
    };

    try {
      await createCampaignMutation.mutateAsync(payload);
    } catch {
      // handled in onError
    }
  };

  const renderStepContent = (step: Step) => {
    if (step.id === 'segment') {
      return (
        <SegmentSelector
          segments={segmentsQuery.data ?? []}
          selectedSegmentId={selectedSegment?.id ?? null}
          onSelect={handleSelectSegment}
          loading={segmentsQuery.isLoading || segmentsQuery.isFetching}
          error={segmentsError}
          onRetry={() => {
            void segmentsQuery.refetch();
          }}
        />
      );
    }

    if (step.id === 'template') {
      return (
        <TemplateEditor
          templates={templatesQuery.data ?? []}
          selectedTemplateId={selectedTemplate?.id ?? null}
          previewBody={messagePreview}
          onSelectTemplate={handleSelectTemplate}
          onPreviewChange={setMessagePreview}
          loading={templatesQuery.isLoading || templatesQuery.isFetching}
          error={templatesError}
          onRetry={() => {
            void templatesQuery.refetch();
          }}
        />
      );
    }

    return (
      <ScheduleReview
        form={form}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        submitting={createCampaignMutation.isPending}
        canSubmit={Boolean(form.name && selectedSegment && selectedTemplate)}
        segment={selectedSegment}
        template={selectedTemplate}
        previewBody={messagePreview}
        submissionError={submissionError}
      />
    );
  };

  const currentStepDefinition = steps[currentStep];

  return (
    <section className="space-y-6" data-testid="hidra-wizard">
      <header className="space-y-1">
        <h1
          className="text-2xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Wizard de campanhas
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Estruture campanhas em etapas neon: escolha o segmento, ajuste o template e finalize o agendamento com segurança.
        </p>
      </header>

      {successMessage ? (
        <div
          className="rounded-3xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm"
          data-testid="hidra-wizard-success"
          style={{ '--success-border': colors.borderAccent, '--success-bg': surfaces.successTint } as CSSProperties}
        >
          {successMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4" data-testid="hidra-wizard-stepper">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          return (
            <div
              key={step.id}
              className="flex items-center gap-3 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em]"
              style={{
                borderColor: isActive ? colors.borderAccent : colors.borderPrimary,
                boxShadow: isActive ? glows.sm : 'none',
                color: isActive || isCompleted ? colors.primary : colors.textSecondary,
                background: isActive ? 'rgba(0, 255, 0, 0.08)' : colors.bgSecondary,
              }}
              data-step={step.id}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full border"
                style={{
                  borderColor: isActive || isCompleted ? colors.borderAccent : colors.borderPrimary,
                  color: isActive || isCompleted ? colors.primary : colors.textSecondary,
                }}
              >
                {index + 1}
              </span>
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-6" data-testid="hidra-wizard-content">
        {renderStepContent(currentStepDefinition)}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrevious}
            disabled={currentStep === 0 || createCampaignMutation.isPending}
            data-testid="hidra-wizard-back"
          >
            Voltar
          </Button>
          {!isFinalStep ? (
            <Button
              variant="primary"
              size="sm"
              onClick={goNext}
              disabled={!canProceed}
              data-testid="hidra-wizard-next"
            >
              Próximo
            </Button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </section>
  );
};

export default HidraWizard;
