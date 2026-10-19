'use server';

import type {
  OrganizerAudienceMember,
  OrganizerOrder,
} from '@golden-events/shared';
import type { DataActionResult } from './authenticated-api';
import {
  getOrganizerAudience,
  getOrganizerOrders,
  type OrganizerAudienceFilters,
} from './orders';

// O máximo que a API aceita por página
const PAGE_SIZE = 100;
// Freia a exportação de um público muito grande: 5 mil pessoas
const MAX_EXPORT_PAGES = 50;

const LOAD_ERROR_MESSAGE =
  'Não foi possível carregar os dados. Tente novamente.';

export async function fetchAudienceMemberOrders(
  buyerId: number,
): Promise<DataActionResult<OrganizerOrder[]>> {
  try {
    const orders = await getOrganizerOrders({
      buyerId,
      status: 'paid',
      page: 1,
      take: PAGE_SIZE,
    });

    return { success: true, message: '', data: orders.content };
  } catch {
    return { success: false, message: LOAD_ERROR_MESSAGE };
  }
}

export async function fetchAudienceForExport(
  filters: Omit<OrganizerAudienceFilters, 'page' | 'take'>,
): Promise<DataActionResult<OrganizerAudienceMember[]>> {
  const members: OrganizerAudienceMember[] = [];

  try {
    for (let page = 1; page <= MAX_EXPORT_PAGES; page++) {
      const result = await getOrganizerAudience({
        ...filters,
        page,
        take: PAGE_SIZE,
      });

      members.push(...result.content);

      if (!result.hasNextPage) {
        break;
      }
    }

    return { success: true, message: '', data: members };
  } catch {
    return { success: false, message: LOAD_ERROR_MESSAGE };
  }
}
