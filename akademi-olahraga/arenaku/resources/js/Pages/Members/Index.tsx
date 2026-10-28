import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, EmptyState, SectionTitle, StatusBadge, buttonClass } from '@/Components/ui';
import { levelLabel } from '@/lib/utils';

interface Row {
    id: number;
    full_name: string;
    nickname: string | null;
    member_code: string | null;
    level: string;
    status: string;
    age: number | null;
    package: string | null;
    branch: string | null;
}

interface Paginated {
    data: Row[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
}

interface Filters {
    q?: string;
    status?: string;
    level?: string;
    branch_id?: string;
}

export default function MembersIndex({
    members,
    filters,
    branches,
}: {
    members: Paginated;
    filters: Filters;
    branches: { id: number; name: string }[];
}) {
    const [search, setSearch] = useState(filters.q ?? '');

    const applyFilter = (extra: Partial<Filters>) => {
        router.get('/members', { ...filters, q: search, ...extra }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Member">
            <Head title="Member" />

            <SectionTitle
                action={
                    <Link href="/members/create" className={buttonClass('secondary', 'px-3 py-2')}>
                        <Plus className="h-4 w-4" /> Tambah
                    </Link>
                }
            >
                {members.total} member
            </SectionTitle>

            <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                    <input
                        className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-base outline-none focus:border-ink"
                        placeholder="Cari nama atau kode member"
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
                {['', 'active', 'trial', 'inactive', 'alumni'].map((status) => (
                    <button
                        key={status || 'all'}
                        type="button"
                        onClick={() => applyFilter({ status: status || undefined })}
                        className={
                            'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ' +
                            ((filters.status ?? '') === status ? 'bg-ink text-white' : 'border border-line bg-white text-slate')
                        }
                    >
                        {status === '' ? 'Semua' : (status === 'active' ? 'Aktif' : status === 'trial' ? 'Trial' : status === 'inactive' ? 'Non-aktif' : 'Alumni')}
                    </button>
                ))}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <select
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium outline-none focus:border-ink"
                    value={filters.level ?? ''}
                    onChange={(event) => applyFilter({ level: event.target.value || undefined })}
                >
                    <option value="">Semua level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
                <select
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium outline-none focus:border-ink"
                    value={filters.branch_id ?? ''}
                    onChange={(event) => applyFilter({ branch_id: event.target.value || undefined })}
                >
                    <option value="">Semua lokasi</option>
                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name}
                        </option>
                    ))}
                </select>
            </div>

            {members.data.length === 0 ? (
                <EmptyState title="Belum ada member" description="Tambahkan member pertama untuk akademi ini." />
            ) : (
                <div className="space-y-2">
                    {members.data.map((member) => (
                        <Link key={member.id} href={`/members/${member.id}`}>
                            <Card className="flex items-center justify-between gap-3 py-3 transition hover:border-ink">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-ink">{member.full_name}</p>
                                    <p className="truncate text-xs text-slate">
                                        {member.member_code ?? '-'} · {levelLabel[member.level] ?? member.level}
                                        {member.age ? ` · ${member.age} th` : ''}
                                    </p>
                                </div>
                                <StatusBadge status={member.status} />
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {members.links.length > 3 ? (
                <div className="mt-4 flex flex-wrap justify-center gap-1">
                    {members.links.map((link, index) =>
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
