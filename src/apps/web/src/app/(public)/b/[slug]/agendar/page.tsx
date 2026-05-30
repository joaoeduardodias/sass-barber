import { getPublicBarbershop, listPublicBarbers, listPublicServices } from '@/lib/public/queries'
import { notFound } from 'next/navigation'
import { BookingFlow } from './booking-flow'

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [barbershop, services, barbers] = await Promise.all([
    getPublicBarbershop(slug).catch(() => null),
    listPublicServices(slug).catch(() => []),
    listPublicBarbers(slug).catch(() => []),
  ])

  if (!barbershop) notFound()

  return <BookingFlow barbershop={barbershop} services={services} barbers={barbers} />
}
