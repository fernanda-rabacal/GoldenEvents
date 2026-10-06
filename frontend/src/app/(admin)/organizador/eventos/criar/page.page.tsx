import type { Metadata } from 'next';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { EventForm } from '@/components/admin/EventForm';
import { CREATE_EVENT_PATH } from '@/components/layout/nav-links';
import { requireUser } from '@/services/auth';
import { getEventCategories } from '@/services/events';

export const metadata: Metadata = {
  title: 'Criar evento',
};

export default async function CreateEventPage() {
  await requireUser(CREATE_EVENT_PATH);
  const categories = await getEventCategories();

  return (
    <>
      <AdminPageHeading
        title='Criar evento'
        description='Preencha as informações que vão aparecer na página do evento.'
      />
      <EventForm categories={categories} />
    </>
  );
}
