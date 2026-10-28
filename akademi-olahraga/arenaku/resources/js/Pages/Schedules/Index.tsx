import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, MapPin, Pencil, Play, Search } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, EmptyState, SectionTitle, StatusBadge, buttonClass } from '@/Components/ui';
import { formatDateTime } from '@/lib/utils';

interface Row {
    id: number;
    title: string;
    type: string;
    status: string;
    starts_at: string | null;
    location: string | null;
    package: string | null;
    coach: string | null;
    open_session_id: number | null;
}

interface Paginated {
    data: Row[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
}

interface Filters {
    q?: string;
    type?: string;
    status?: string;
}

export default function SchedulesIndex({ schedules, filters }: { schedules: Paginated; filters: Filters }) {
    const [search, setSearch] = useState(filters.q ?? '');

    const applyFilter = (extra: Partial<Filters>) =>
        router.get('/schedules', { ...filters, q: search, ...extra }, { preserveState: true, replace: true });

    const startSession = (id: number) => router.post(`/schedules/${id}/start`);

    return (
        <AppLayout title="Jadwal">
            <Head title="Jadwal" />

            <SectionTitle
                action={
                    <Link href="/schedules/create" className={buttonClass('secondary', 'px-3 py-2')}>
                        <CalendarDays className="h-4 w-4" /> Buat
                    </Link>
                }
            >
                {schedules.total} jadwal
            </SectionTitle>

            <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                    <input
                        className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-base outline-none focus:border-ink"
                        placeholder="Cari judul jadwal"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter({})}
                    />
                </div>
                <button type="button" className={buttonClass('primary', 'px-4')} onClick={() => applyFilter({})}>
                    Cari
                </button>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto">
                {[
                    { value: '', label: 'Semua' },
                    { value: 'training', label: 'Latihan' },
                    { value: 'sparring', label: 'Sparring' },
                    { value: 'tournament', label: 'Turnamen' },
                    { value: 'event', label: 'Event' },
                ].map((type) => (
                    <button
                        key={type.value || 'all'}
                        type="button"
                        onClick={() => applyFilter({ type: type.value || undefined })}
                        className={
                            'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ' +
                            ((filters.type ?? '') === type.value ? 'bg-ink text-white' : 'border border-line bg-white text-slate')
                        }
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {schedules.data.length === 0 ? (
                <EmptyState title="Belum ada jadwal" description="Buat jadwal latihan, sparring, atau event." />
            ) : (
                <div className="space-y-2">
                    {schedules.data.map((schedule) => (
                        <Card key={schedule.id} className="py-3">
                            <div className="flex items-start gap-3">
                                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate font-semibold text-ink">{schedule.title}</p>
                                        <StatusBadge status={schedule.status} />
                                    </div>
                                    <p className="text-xs text-slate">{formatDateTime(schedule.starts_at)}</p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate">
                                        <MapPin className="h-3 w-3" /> {schedule.location ?? '-'}
                                        {schedule.coach ? ` · ${schedule.coach}` : ''}
                                        {schedule.package ? ` · ${schedule.package}` : ''}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <StatusBadge status={schedule.type} />
                                        {schedule.open_session_id ? (
                                            <Link
                                                href={`/coach/sessions/${schedule.open_session_id}`}
                                                className="text-xs font-semibold text-ink underline"
                                            >
                                                Buka absensi
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => startSession(schedule.id)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline"
                                            >
                                                <Play className="h-3 w-3" /> Mulai sesi
                                            </button>
                                        )}
                                        <Link
                                            href={`/schedules/${schedule.id}/edit`}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate underline"
                                        >
                                            <Pencil className="h-3 w-3" /> Edit
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {schedules.links.length > 3 ? (
                <div className="mt-4 flex flex-wrap justify-center gap-1">
                    {schedules.links.map((link, index) =>
                        link.url ? (
                            <Link
                                key={index}
                                href={link.url}
                                className={
                                    'rounded-lg px-3 py-1.5 text-sm ' +
                                    (link.active ? 'bg-ink text-white' : 'border border-line bg-white text-slate')
                                }
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span key={index} className="rounded-lg px-3 py-1.5 text-sm text-slate/50" dangerouslySetInnerHTML={{ __html: link.label }} />
                        ),
                    )}
                </div>
            ) : null}
        </AppLayout>
    );
}
