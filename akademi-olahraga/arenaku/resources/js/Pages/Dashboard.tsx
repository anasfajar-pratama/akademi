import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Building2, CalendarDays, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, SectionTitle, StatCard, StatusBadge, buttonClass } from '@/Components/ui';
import { cn, formatRupiah, formatTime } from '@/lib/utils';

interface Kpi {
    label: string;
    value: number;
    type: 'number' | 'rupiah' | 'percent';
    hint?: string;
    delta?: number;
}

interface ActionItem {
    label: string;
    count: number;
    href: string;
    tone: string;
}

interface TodayRow {
    id: number;
    title: string;
    type: string;
    starts_at: string | null;
    location: string | null;
    session_id: number | null;
}

interface AcademyRow {
    id: number;
    name: string;
    sport: string | null;
    members_count: number;
    revenue: number;
    outstanding: number;
    status: string;
}

interface Props {
    scope: string;
    role_label?: string;
    kpis: Kpi[];
    actions: ActionItem[];
    today: TodayRow[];
    academies?: AcademyRow[];
}

function formatValue(kpi: Kpi): string {
    if (kpi.type === 'rupiah') {
        return formatRupiah(kpi.value);
    }

    if (kpi.type === 'percent') {
        return `${kpi.value}%`;
    }

    return String(kpi.value);
}

function Delta({ value }: { value?: number }) {
    if (value === undefined || value === 0) {
        return null;
    }

    const up = value > 0;

    return (
        <span className={cn('inline-flex items-center gap-0.5 text-xs font-bold', up ? 'text-emerald' : 'text-rose')}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {up ? '+' : ''}
            {value}%
        </span>
    );
}

export default function Dashboard({ scope, role_label, kpis, actions, today, academies = [] }: Props) {
    if (scope === 'none') {
        return (
            <AppLayout title="Dashboard">
                <Head title="Dashboard" />
                <Card className="text-sm text-slate">
                    Akun Anda belum terhubung ke akademi mana pun. Minta admin platform menambahkan Anda ke sebuah
                    akademi terlebih dahulu.
                </Card>
            </AppLayout>
        );
    }

    const activeActions = actions.filter((action) => action.count > 0);

    return (
        <AppLayout title={role_label ? `Dashboard · ${role_label}` : 'Dashboard Platform'}>
            <Head title="Dashboard" />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="relative">
                        <StatCard label={kpi.label} value={formatValue(kpi)} hint={kpi.hint} />
                        {kpi.delta !== undefined ? (
                            <span className="absolute right-4 top-3">
                                <Delta value={kpi.delta} />
                            </span>
                        ) : null}
                    </div>
                ))}
            </div>

            {activeActions.length > 0 ? (
                <div className="mt-6">
                    <SectionTitle>Perlu tindakan</SectionTitle>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {activeActions.map((action) => (
                            <Link key={action.label} href={action.href}>
                                <Card className="flex items-center justify-between gap-3 transition hover:border-ink">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span
                                            className={cn(
                                                'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                                                action.tone === 'rose' ? 'bg-rose-50 text-rose' : 'bg-amber-50 text-amber',
                                            )}
                                        >
                                            <AlertTriangle className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-ink">{action.label}</p>
                                            <p className="text-xs text-slate">{action.count} item</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-slate" />
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="mt-6">
                    <Card className="text-sm text-slate">Semua beres — tidak ada tindakan mendesak. 👍</Card>
                </div>
            )}

            {scope === 'platform' ? (
                <div className="mt-6">
                    <SectionTitle
                        action={
                            <Link href="/academies/create" className={buttonClass('secondary', 'px-3 py-2')}>
                                Buat akademi
                            </Link>
                        }
                    >
                        Konsolidasi akademi
                    </SectionTitle>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {academies.map((academy) => (
                            <Link key={academy.id} href={`/academies/${academy.id}`}>
                                <Card className="transition hover:border-ink">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate font-bold text-ink">{academy.name}</p>
                                        <StatusBadge status={academy.status} />
                                    </div>
                                    <p className="text-xs text-slate">
                                        {academy.sport ?? '-'} · {academy.members_count} member
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <Badge tone="emerald">Masuk {formatRupiah(academy.revenue)}</Badge>
                                        {academy.outstanding > 0 ? (
                                            <Badge tone="rose">Tunggakan {formatRupiah(academy.outstanding)}</Badge>
                                        ) : null}
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="mt-6">
                    <SectionTitle>{scope === 'coach' ? 'Agenda saya' : 'Jadwal hari ini'}</SectionTitle>
                    {today.length === 0 ? (
                        <Card className="text-sm text-slate">Tidak ada jadwal.</Card>
                    ) : (
                        <div className="space-y-2">
                            {today.map((item) => (
                                <Card key={item.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <CalendarDays className="h-5 w-5 shrink-0 text-sky" />
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-ink">{item.title}</p>
                                            <p className="truncate text-xs text-slate">{item.location ?? '-'}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="font-bold tabular-nums text-ink">{formatTime(item.starts_at)}</p>
                                        {item.session_id ? (
                                            <Link href={`/coach/sessions/${item.session_id}`} className="text-xs font-semibold text-ink underline">
                                                Absensi
                                            </Link>
                                        ) : (
                                            <StatusBadge status={item.type} />
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
