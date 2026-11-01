import { SelectionCampaign } from '../types/selection';

export const selectionCampaigns: SelectionCampaign[] = [
  {
    id: 'campaign-1',
    name: 'Selection Campaign 2025',
    sector: 'Cyuve',
    openDate: '2025-02-01',
    closeDate: '2025-02-15',
    status: 'Open',
    candidates: [],
  },
  {
    id: 'campaign-2',
    name: 'Selection Campaign 2024',
    sector: 'Musanze',
    openDate: '2024-02-01',
    closeDate: '2024-02-18',
    status: 'Closed',
    candidates: [],
  },
];

export function listSelectionCampaigns() {
  return selectionCampaigns;
}

export function createSelectionCampaign(campaign: SelectionCampaign) {
  selectionCampaigns.push(campaign);
  return campaign;
}
