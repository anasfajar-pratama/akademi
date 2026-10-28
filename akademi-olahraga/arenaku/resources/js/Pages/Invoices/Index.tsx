import { Head, Link, router } from '@inertiajs/react';
import { FileText, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, EmptyState, SectionTitle, StatCard, StatusBadge, buttonClass } from '@/Components/ui';
import { formatDate, formatRupiah } from '@/lib/utils';

interface InvoiceRow {
    id: number;
    number: string;
    member: string | null;
    member_code: string | null;
    total: number;
    paid_amount: number;
    outstanding: number;
    status: string;
    due_date: string | null;
}

interface Paginated {
    data: InvoiceRow[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
}

interface Summary {
    count: number;
    total: number;
    paid: number;
    outstanding: number;
    collectibility: number;
}

interface Filters {
    period: string;
    status?: string;
    q?: string;
}

const statuses = [
    { value: '', label: 'Semua' },
    { value: 'unpaid', label: 'Belum bayar' },
    { value: 'partial', label: 'Sebagian' },
    { value: 'paid', label: 'Lunas' },
    { value: 'void', label: 'Dibatalkan' },
];

export default function InvoicesIndex({
    invoices,
    summary,
    filters,
    periods,
}: {
    invoices: Paginated;
    summary: Summary;
    filters: Filters;
    periods: string[];
}) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [period, setPeriod] = useState(filters.period);

    const applyFilter = (extra: Partial<Filters>) =>
        router.get('/invoices', { ...filters, q: search, period, ...extra }, { preserveState: true, replace: true });

    return (
        <AppLayout title="Keuangan">
            <Head title="Keuangan" />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Tagihan periode" value={formatRupiah(summary.total)} hint={`${summary.count} tagihan`} />
                <StatCard label="Terbayar" value={formatRupiah(summary.paid)} />
                <StatCard label="Tunggakan" value={formatRupiah(summary.outstanding)} />
                <StatCard label="Kolektibilitas" value={`${summary.collectibility}%`} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
                <select
                    className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium"
                    value={period}
                    onChange={(event) => {
                        setPeriod(event.target.value);
                        router.get('/invoices', { ...filters, period: event.target.value }, { preserveState: true, replace: true });
                    }}
                >
                    {periods.map((value) => (
                        <option key={value} value={value}>
                            {new Date(`${value}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                        </option>
                    ))}
                </select>

                <div className="relative min-w-[12rem] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                    <input
                        className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-base outline-none focus:border-ink"
                        placeholder="Cari nama atau kode member"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && applyFilter({})}
                    />
                </div>

                <button type="button" className={buttonClass('primary', 'px-4')} onClick={() => applyFilter({})}>
                    Cari
                </button>
                <button
                    type="button"
                    className={buttonClass('secondary', 'px-4')}
                    onClick={() => router.post('/invoices/generate', { period })}
                >
                    <Sparkles className="h-4 w-4" /> Generate {period}
                </button>
            </div>

            <div className="mb-4 mt-3 flex gap-2 overflow-x-auto">
                {statuses.map((status) => (
                    <button
                        key={status.value || 'all'}
                        type="button"
                        onClick={() => applyFilter({ status: status.value || undefined })}
                        className={
                            'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ' +
                            ((filters.status ?? '') === status.value ? 'bg-ink text-white' : 'border border-line bg-white text-slate')
                        }
                    >
                        {status.label}
                    </button>
                ))}
            </div>

            {invoices.data.length === 0 ? (
                <EmptyState
                    title="Belum ada tagihan"
                    description="Klik Generate untuk membuat tagihan bulanan member aktif."
                />
            ) : (
                <div className="space-y-2">
                    {invoices.data.map((invoice) => (
                        <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                            <Card className="flex items-center justify-between gap-3 py-3 transition hover:border-ink">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-ink">
                                        {invoice.member ?? '-'}{' '}
                                        <span className="font-normal text-slate">· {invoice.number}</span>
                                    </p>
                                    <p className="truncate text-xs text-slate">
                                        Jatuh tempo {formatDate(invoice.due_date)} · sisa {formatRupiah(invoice.outstanding)}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="font-bold tabular-nums text-ink">{formatRupiah(invoice.total)}</p>
                                    <StatusBadge status={invoice.status} />
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <div className="mt-4 flex justify-center gap-1">
                {invoices.links.map((link, index) =>
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

            <p className="mt-4 flex items-center justify-center gap-1 text-xs text-slate">
                <FileText className="h-3 w-3" /> Kwitansi bisa dibuka dan dicetak dari halaman detail tagihan.
            </p>
        </AppLayout>
    );
}
