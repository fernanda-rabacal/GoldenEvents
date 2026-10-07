import type { Metadata } from 'next';
import { ShoppingBag } from 'lucide-react';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { ComingSoon } from '@/components/admin/ComingSoon';
import { TICKET_SALES_PATH } from '@/components/layout/nav-links';
import { requireOrganizer } from '@/services/auth';

export const metadata: Metadata = {
  title: 'Ingressos e vendas',
};

export default async function TicketSalesPage() {
  await requireOrganizer(TICKET_SALES_PATH);

  return (
    <>
      <AdminPageHeading
        title='Ingressos e vendas'
        description='Acompanhe as vendas de ingressos dos seus eventos.'
      />
      <ComingSoon
        icon={ShoppingBag}
        description='Em breve você vai ver aqui cada venda, por evento e por forma de pagamento.'
      />
    </>
  );
}
