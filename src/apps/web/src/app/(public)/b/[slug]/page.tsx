import { getPublicBarbershop, listPublicBarbers, listPublicServices } from '@/lib/public/queries'
import { Button } from '@barber/ui'
import { Clock, MapPin, Phone, Scissors } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function BarbershopPage({
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

  return (
    <main>
      {/* Hero */}
      <section className="border-b bg-muted/30 px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-600">
            <Scissors className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{barbershop.name}</h1>
          {barbershop.description && (
            <p className="mt-3 text-muted-foreground">{barbershop.description}</p>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {barbershop.address}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {barbershop.phone}
            </span>
          </div>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700">
              <Link href={`/b/${slug}/agendar`}>Agendar agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="mb-8 text-lg font-semibold">Nossos serviços</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.id} className="rounded-lg border bg-card p-4">
              <p className="font-medium">{s.name}</p>
              {s.description && (
                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {s.duration} min
                </span>
                <span className="font-semibold text-amber-600">
                  R${Number(s.price).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Barbers */}
      {barbers.length > 0 && (
        <section className="border-t bg-muted/30 px-6 py-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-lg font-semibold">Nossa equipe</h2>
            <div className="flex flex-wrap gap-4">
              {barbers.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                    {b.user.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{b.user.name}</p>
                    {b.bio && <p className="text-xs text-muted-foreground">{b.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <p className="mb-4 text-muted-foreground">Pronto para marcar seu horário?</p>
        <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700">
          <Link href={`/b/${slug}/agendar`}>Agendar agora</Link>
        </Button>
      </section>
    </main>
  )
}
