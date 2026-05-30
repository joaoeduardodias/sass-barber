'use client'

import { apiClient } from '@/lib/api/client'
import { authClient } from '@/lib/auth-client'
import type { PublicBarber, PublicBarbershop, Service } from '@barber/types'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@barber/ui'
import { CheckCircle, ChevronLeft, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

type Step = 'service' | 'barber-slot' | 'confirm' | 'success'

interface Selected {
  service?: Service
  barber?: PublicBarber
  date?: string
  slot?: string
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function nextDays(n: number): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 1; i <= n; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export function BookingFlow({
  barbershop,
  services,
  barbers,
}: {
  barbershop: PublicBarbershop
  services: Service[]
  barbers: PublicBarber[]
}) {
  const { data: session } = authClient.useSession()
  const [step, setStep] = useState<Step>('service')
  const [selected, setSelected] = useState<Selected>({})
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authError, setAuthError] = useState('')
  const [booking, startBooking] = useTransition()

  async function fetchSlots(barberId: string, date: string) {
    if (!selected.service) return
    setLoadingSlots(true)
    setSlots([])
    try {
      const data = await apiClient<string[]>(
        `/public/barbershops/${barbershop.slug}/slots?barberId=${barberId}&serviceId=${selected.service.id}&date=${date}`,
      )
      setSlots(data)
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  function selectBarber(barber: PublicBarber) {
    setSelected((s) => ({ ...s, barber, slot: undefined }))
    setSlots([])
    if (selected.date) fetchSlots(barber.id, selected.date)
  }

  function selectDate(date: string) {
    setSelected((s) => ({ ...s, date, slot: undefined }))
    setSlots([])
    if (selected.barber) fetchSlots(selected.barber.id, date)
  }

  async function handleAuth() {
    setAuthError('')
    if (authTab === 'login') {
      const { error } = await authClient.signIn.email({
        email: authEmail,
        password: authPassword,
      })
      if (error) {
        setAuthError(error.message ?? 'Credenciais inválidas')
        return
      }
    } else {
      const { error } = await authClient.signUp.email({
        name: authName,
        email: authEmail,
        password: authPassword,
      })
      if (error) {
        setAuthError(error.message ?? 'Erro no cadastro')
        return
      }
    }
    // Session will update via authClient.useSession(); submit booking
    submitBooking()
  }

  function submitBooking() {
    if (!selected.service || !selected.barber || !selected.date || !selected.slot) return
    const scheduledAt = `${selected.date}T${selected.slot}:00.000Z`
    startBooking(async () => {
      await apiClient('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          barbershopId: barbershop.id,
          serviceId: selected.service?.id,
          barberId: selected.barber?.id,
          scheduledAt,
        }),
      })
      setStep('success')
    })
  }

  // ── Step: success ──────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <div>
          <h2 className="text-xl font-semibold">Agendamento confirmado!</h2>
          <p className="mt-1 text-muted-foreground">
            {selected.service?.name} com {selected.barber?.user.name} em{' '}
            {selected.date && formatDate(selected.date)} às {selected.slot}
          </p>
        </div>
        <Button asChild className="bg-amber-600 hover:bg-amber-700">
          <Link href="/minha-conta">Ver meus agendamentos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      {/* Back link */}
      <Link
        href={`/b/${barbershop.slug}`}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {barbershop.name}
      </Link>

      {/* ── Step 1: Select service ── */}
      {step === 'service' && (
        <div>
          <h2 className="mb-6 text-lg font-semibold">Escolha um serviço</h2>
          <div className="flex flex-col gap-3">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelected({ service: s })
                  setStep('barber-slot')
                }}
                className="flex items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {s.duration} min
                  </p>
                </div>
                <span className="font-semibold text-amber-600">
                  R${Number(s.price).toFixed(2).replace('.', ',')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Select barber, date, slot ── */}
      {step === 'barber-slot' && (
        <div className="flex flex-col gap-8">
          <div>
            <button
              type="button"
              onClick={() => setStep('service')}
              className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <h2 className="mb-4 text-lg font-semibold">Escolha o barbeiro</h2>
            <div className="flex flex-wrap gap-3">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => selectBarber(b)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors hover:border-amber-400 ${
                    selected.barber?.id === b.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
                      : 'bg-card'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                    {b.user.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{b.user.name}</p>
                    {b.bio && <p className="text-xs text-muted-foreground">{b.bio}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Escolha a data</h2>
            <div className="flex flex-wrap gap-2">
              {nextDays(14).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => selectDate(d)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors hover:border-amber-400 ${
                    selected.date === d
                      ? 'border-amber-500 bg-amber-50 font-medium text-amber-700 dark:bg-amber-950'
                      : 'bg-card'
                  }`}
                >
                  {new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </button>
              ))}
            </div>
          </div>

          {(loadingSlots || slots.length > 0) && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">Escolha o horário</h2>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando disponibilidade...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelected((s) => ({ ...s, slot }))}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:border-amber-400 ${
                        selected.slot === slot
                          ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950'
                          : 'bg-card'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selected.barber && selected.date && selected.slot && (
            <Button
              onClick={() => setStep('confirm')}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Continuar
            </Button>
          )}
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 'confirm' && (
        <div>
          <button
            type="button"
            onClick={() => setStep('barber-slot')}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
          <h2 className="mb-6 text-lg font-semibold">Confirmar agendamento</h2>

          {/* Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço</span>
                <span className="font-medium">{selected.service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Barbeiro</span>
                <span className="font-medium">{selected.barber?.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium">{selected.date && formatDate(selected.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horário</span>
                <span className="font-medium">{selected.slot}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total</span>
                <span className="font-semibold text-amber-600">
                  R$
                  {Number(selected.service?.price ?? 0)
                    .toFixed(2)
                    .replace('.', ',')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Auth or confirm */}
          {session ? (
            <Button
              onClick={submitBooking}
              disabled={booking}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {booking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar agendamento'
              )}
            </Button>
          ) : (
            <div className="rounded-lg border p-5">
              <p className="mb-4 text-sm text-muted-foreground">
                Faça login ou crie uma conta para confirmar seu agendamento.
              </p>
              {/* Tab toggle */}
              <div className="mb-4 flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setAuthTab('login')}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    authTab === 'login' ? 'bg-background shadow' : 'text-muted-foreground'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('register')}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    authTab === 'register' ? 'bg-background shadow' : 'text-muted-foreground'
                  }`}
                >
                  Cadastrar
                </button>
              </div>

              <div className="space-y-3">
                {authTab === 'register' && (
                  <Input
                    placeholder="Seu nome"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                )}
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Senha"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
                {authError && <p className="text-xs text-destructive">{authError}</p>}
                <Button onClick={handleAuth} className="w-full bg-amber-600 hover:bg-amber-700">
                  {authTab === 'login' ? 'Entrar e confirmar' : 'Cadastrar e confirmar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
