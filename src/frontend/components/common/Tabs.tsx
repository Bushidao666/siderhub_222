import type { CSSProperties, HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { useId, useMemo, useState } from 'react';
import { colors, glows, typography } from '../../../shared/design/tokens';
import { cn } from '../../../shared/utils/cn';

type TabItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
};

type TabsVariant = 'line' | 'contained';

type TabsProps = {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (tabId: string) => void;
  variant?: TabsVariant;
  renderContent?: (tab: TabItem) => ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const Tabs = ({
  tabs,
  value,
  defaultValue,
  onChange,
  variant = 'line',
  renderContent,
  className,
  ...rest
}: TabsProps) => {
  if (!tabs.length) {
    return null;
  }
  const baseId = useId();
  const firstEnabled = useMemo(() => tabs.find((tab) => !tab.disabled)?.id ?? '', [tabs]);
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? firstEnabled);
  const activeId = value ?? internalValue;
  const enabledTabIds = useMemo(() => tabs.filter((tab) => !tab.disabled).map((tab) => tab.id), [tabs]);

  const handleSelect = (id: string, disabled?: boolean) => {
    if (disabled) return;

    if (!value) {
      setInternalValue(id);
    }
    onChange?.(id);
  };

  const focusTab = (id: string) => {
    if (typeof document === 'undefined') return;
    const element = document.getElementById(`${baseId}-tab-${id}`);
    element?.focus();
  };

  const moveFocus = (currentId: string, offset: number) => {
    if (!enabledTabIds.length) return;
    const currentIndex = enabledTabIds.indexOf(currentId);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + offset + enabledTabIds.length) % enabledTabIds.length;
    const nextId = enabledTabIds[nextIndex];
    handleSelect(nextId);
    focusTab(nextId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentId: string) => {
    if (!enabledTabIds.length) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(currentId, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(currentId, -1);
        break;
      case 'Home':
        event.preventDefault();
        handleSelect(enabledTabIds[0]);
        focusTab(enabledTabIds[0]);
        break;
      case 'End':
        event.preventDefault();
        handleSelect(enabledTabIds[enabledTabIds.length - 1]);
        focusTab(enabledTabIds[enabledTabIds.length - 1]);
        break;
      default:
        break;
    }
  };

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className={cn('flex flex-col gap-6', className)} {...rest}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          'flex flex-wrap gap-3 rounded-2xl border border-[var(--tabs-border)] bg-[var(--tabs-bg)] p-2',
          variant === 'contained' ? 'bg-[var(--tabs-bg-active)]' : '',
        )}
        style={{
          '--tabs-border': colors.borderPrimary,
          '--tabs-bg': colors.bgPrimary,
          '--tabs-bg-active': colors.bgSecondary,
        } as CSSProperties}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          const tabId = `${baseId}-tab-${tab.id}`;
          const panelId = `${baseId}-panel-${tab.id}`;
          return (
            <button
              key={tab.id}
              id={tabId}
              role="tab"
              type="button"
              tabIndex={tab.disabled ? -1 : isActive ? 0 : -1}
              aria-controls={isActive ? panelId : undefined}
              aria-selected={isActive}
              aria-disabled={tab.disabled}
              onClick={() => handleSelect(tab.id, tab.disabled)}
              onKeyDown={(event) => handleKeyDown(event, tab.id)}
              className={cn(
                'group relative inline-flex min-w-[8rem] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm uppercase transition-all duration-150',
                'tracking-[0.18em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tabs-outline)]',
                tab.disabled ? 'cursor-not-allowed opacity-40' : 'hover:-translate-y-0.5',
                variant === 'contained'
                  ? isActive
                    ? 'bg-[var(--tabs-active-bg)] text-[var(--tabs-active-color)] shadow-[var(--tabs-active-shadow)]'
                    : 'text-[var(--tabs-muted-color)]'
                  : isActive
                    ? 'text-[var(--tabs-active-color)]'
                    : 'text-[var(--tabs-muted-color)]',
              )}
              style={{
                '--tabs-active-bg': colors.bgSecondary,
                '--tabs-active-color': colors.primary,
                '--tabs-muted-color': colors.textSecondary,
                '--tabs-outline': colors.primary,
                '--tabs-active-shadow': glows.sm,
                fontFamily: typography.fontHeading,
              } as CSSProperties}
            >
              {tab.icon ? <span aria-hidden>{tab.icon}</span> : null}
              <span>{tab.label}</span>
              {tab.badge ? <span aria-hidden>{tab.badge}</span> : null}
              {variant === 'line' ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-x-4 bottom-0 h-[2px] transition-opacity duration-150',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                  style={{ background: colors.primary }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
      {renderContent ? (
        <div
          id={`${baseId}-panel-${activeTab.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeTab.id}`}
          className="rounded-2xl border border-[var(--tabs-panel-border)] bg-[var(--tabs-panel-bg)] p-6"
          style={{
            '--tabs-panel-border': colors.borderPrimary,
            '--tabs-panel-bg': colors.bgSecondary,
          } as CSSProperties}
        >
          {renderContent(activeTab)}
        </div>
      ) : null}
    </div>
  );
};
