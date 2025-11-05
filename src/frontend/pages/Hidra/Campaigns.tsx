import { useNavigate } from 'react-router-dom';

import { colors, typography } from '../../../shared/design/tokens';
import { Button } from '../../components/common';
import { CampaignTable } from '../../components/hidra/CampaignTable';
import { useCampaignStats } from '../../hooks/useCampaignStats';
import { handleHidraError } from '../../services/hidraService';

export const HidraCampaigns = () => {
  const navigate = useNavigate();
  const { campaigns, isLoading, isFetching, error } = useCampaignStats();
  const errorMessage = error ? handleHidraError(error) : null;
  const loading = isLoading || isFetching;

  return (
    <section className="space-y-6" data-testid="hidra-campaigns">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1
            className="text-2xl uppercase tracking-[0.18em]"
            style={{ fontFamily: typography.fontHeading, color: colors.primary }}
          >
            Campanhas Evolution
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Gerencie drafts, execuções e acompanhe status das automações.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/hidra/campaigns/create')}>
          Nova campanha
        </Button>
      </header>

      <CampaignTable items={campaigns} loading={loading} />

      {errorMessage ? (
        <p className="text-sm" style={{ color: colors.accentError }}>
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
};

export default HidraCampaigns;
