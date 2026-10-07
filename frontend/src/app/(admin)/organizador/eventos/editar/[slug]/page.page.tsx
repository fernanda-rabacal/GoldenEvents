import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import dayjs from 'dayjs';
import { AdminPageHeading } from '@/components/admin/AdminPageHeading';
import { EventForm } from '@/components/admin/EventForm';
import {
  MY_EVENTS_PATH,
  buildEditEventHref,
} from '@/components/layout/nav-links';
import { requireOrganizer } from '@/services/auth';
import { getEventBySlug, getEventCategories } from '@/services/events';

export const metadata: Metadata = {
  title: 'Editar evento',
};

type EditEventPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { slug } = await params;
  const user = await requireOrganizer(buildEditEventHref(slug));
  const [event, categories] = await Promise.all([
    getEventBySlug(slug, { cache: 'no-store' }),
    getEventCategories(),
  ]);

  // Evento de outra pessoa responde como inexistente
  if (!event || event.user_id !== user.id) {
    notFound();
  }

  if (dayjs(event.start_date).isBefore(dayjs())) {
    redirect(MY_EVENTS_PATH);
  }

  return (
    <>
      <AdminPageHeading title='Editar evento' description={event.name} />
      <EventForm categories={categories} event={event} />
    </>
  );
}
