import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight, Search, Settings2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, EmptyState, SectionTitle, StatusBadge, buttonClass } from '@/Components/ui';
import { formatDate } from '@/lib/utils';

interface RegistrationRow {
    id: number;
    full_name: string;
    gender: string;
    age: number | null;
    photo_url: string | null;
    guardian_name: string;
    guardian_phone: string | null;
    status: string;
    branch: string | null;
    package: string | null;
    submitted_at: string | null;
}

interface Paginated {
    data: RegistrationRow[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
}

interface Filters {
    q?: string;
    status?: string;
}

export default function RegistrationsIndex({
    registrations,
    filters,
    counts,
}: {
    registrations: Paginated;
    filters: Filters;
    counts: { pending: number; approved: number };
}) {
    const [search, setSearch] = useState(filters.q ?? '');

    const applyFilter = (extra: Partial<Filters>) => {
        router.get('/registrations', { ...filters, q: search, ...extra }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Pendaftaran Member">
            <Head title="Pendaftaran Member" />

            <SectionTitle
                action={
                    <Link href="/settings" className={buttonClass('ghost', 'px-3 py-2')}>
                        <Settings2 className="h-4 w-4" /> Link pendaftaran
                    </Link>
                }
            >
                {registrations.total} pendaftaran
            </SectionTitle>

            <div className="mb-4 flex gap-2 overflow-x-auto">
                {[
                    { value: 'pending', label: `Menunggu (${counts.pending})` },
                    { value: 'approved', label: `Disetujui (${counts.approved})` },
                    { value: '', label: 'Semua' },
                ].map((tab) => (
                    <button
                        key={tab.value || 'all'}
                        type="button"
                        onClick={() => applyFilter({ status: tab.value || undefined })}
                        className={
                            'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ' +
                            ((filters.status ?? '') === tab.value
                                ? 'bg-ink text-white'
                                : 'border border-line bg-white text-slate')
                        }
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                    <input
                        className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-base outline-none focus:border-ink"
                        placeholder="Cari nama anak atau orang tua"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && applyFilter({})}
                    />
                </div>
                <button type="button" className={buttonClass('primary', 'px-4')} onClick={() => applyFilter({})}>
                    Cari
                </button>
            </div>

            {registrations.data.length === 0 ? (
                <EmptyState
                    title="Belum ada pendaftaran"
                    description="Bagikan link pendaftaran dari halaman Pengaturan kepada orang tua calon member."
                />
            ) : (
                <div className="space-y-2">
                    {registrations.data.map((registration) => (
                        <Link key={registration.id} href={`/registrations/${registration.id}`}>
                            <Card className="flex items-center gap-3 py-3 transition hover:border-ink">
                                {registration.photo_url ? (
                                    <img
                                        src={registration.photo_url}
                                        alt={registration.full_name}
                                        className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover"
                                    />
                                ) : (
                                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime/30 text-base font-extrabold text-ink">
                                        {registration.full_name.charAt(0).toUpperCase()}
                                    </span>
                                )}

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate font-semibold text-ink">{registration.full_name}</p>
                                        {registration.age ? <Badge>{registration.age} th</Badge> : null}
                                    </div>
                                    <p className="truncate text-xs text-slate">
                                        {[registration.guardian_name, registration.guardian_phone]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                    <p className="truncate text-xs text-slate">
                                        {[registration.branch, registration.package, formatDate(registration.submitted_at)]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <StatusBadge status={registration.status} />
                                    <ChevronRight className="h-4 w-4 text-slate" />
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {registrations.links.length > 3 ? (
                <div className="mt-4 flex flex-wrap justify-center gap-1">
                    {registrations.links.map((link, index) =>
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
                            <span
                                key={index}
                                className="rounded-lg px-3 py-1.5 text-sm text-slate/50"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                </div>
            ) : null}
        </AppLayout>
    );
}
