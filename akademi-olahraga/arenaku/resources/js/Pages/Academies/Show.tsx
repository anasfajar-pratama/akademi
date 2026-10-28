import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, KeyRound, Pencil, Plus, Power, Send } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, EmptyState, SectionTitle, StatCard, StatusBadge, buttonClass } from '@/Components/ui';
import { formatRupiah } from '@/lib/utils';
import type { Credential, PageProps } from '@/types';

interface Account {
    id: number;
    user_id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    role_label: string;
    is_active: boolean;
}

interface MemberRow {
    id: number;
    full_name: string;
    member_code: string | null;
    level: string;
    status: string;
    guardians: { id: number; full_name: string; phone: string }[];
}

interface Academy {
    id: number;
    name: string;
    slug: string;
    sport: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    status: string;
    brand_color: string;
}

const input = 'w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink';
const label = 'mb-1 block text-sm font-semibold text-ink';

export default function AcademyShow({
    academy,
    accounts,
    members,
    stats,
}: {
    academy: Academy;
    accounts: Account[];
    members: MemberRow[];
    stats: {
        members_total: number;
        members_active: number;
        coaches: number;
        revenue_month: number;
        outstanding: number;
        attendance_rate: number;
    };
}) {
    const { flash } = usePage<PageProps>().props;
    const credentials: Credential[] = flash.credentials ?? [];

    const accountForm = useForm({
        name: '',
        role: 'admin',
        email: '',
        phone: '',
        password: '',
        specialization: '',
    });

    const addAccount = () => {
        accountForm.post(`/academies/${academy.id}/accounts`, {
            preserveScroll: true,
            onSuccess: () => accountForm.reset(),
        });
    };

    return (
        <AppLayout title={academy.name}>
            <Head title={academy.name} />

            <Link href="/academies" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Semua akademi
            </Link>

            {credentials.length > 0 ? (
                <Card className="mb-4 border-lime/60 bg-lime/10">
                    <SectionTitle>Kredensial akun</SectionTitle>
                    <p className="mb-3 text-sm text-slate">Salin dan bagikan sekarang — kata sandi hanya ditampilkan sekali.</p>
                    <div className="space-y-2">
                        {credentials.map((row, index) => (
                            <div key={index} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm">
                                <div className="min-w-0">
                                    <p className="font-semibold text-ink">
                                        {row.name} {row.role_label ? `· ${row.role_label}` : ''}
                                    </p>
                                    <p className="text-xs text-slate">{row.email ?? row.phone ?? row.note}</p>
                                </div>
                                {row.created && row.password ? (
                                    <Badge tone="ink">
                                        <KeyRound className="h-3 w-3" /> {row.password}
                                    </Badge>
                                ) : (
                                    <Badge tone="sky">Akun dipakai ulang</Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            ) : null}

            <Card className="mb-4">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 h-12 w-1.5 rounded-full" style={{ backgroundColor: academy.brand_color }} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="truncate text-lg font-extrabold text-ink">{academy.name}</h2>
                            <StatusBadge status={academy.status} />
                        </div>
                        <p className="text-sm text-slate">
                            {academy.sport ?? '-'}
                            {academy.city ? ` · ${academy.city}` : ''}
                        </p>
                        {academy.address ? <p className="mt-1 text-sm text-slate">{academy.address}</p> : null}
                        <p className="mt-1 text-sm text-slate">
                            {academy.phone ?? '-'} {academy.email ? `· ${academy.email}` : ''}
                        </p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/academies/${academy.id}/edit`} className={buttonClass('ghost', 'px-3 py-2')}>
                        <Pencil className="h-4 w-4" /> Edit
                    </Link>
                    <button
                        type="button"
                        className={buttonClass('ghost', 'px-3 py-2')}
                        onClick={() => router.post(`/academies/${academy.id}/status`, {}, { preserveScroll: true })}
                    >
                        <Power className="h-4 w-4" /> {academy.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                </div>
            </Card>

            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Member" value={stats.members_total} hint={`${stats.members_active} aktif`} />
                <StatCard label="Pelatih" value={stats.coaches} />
                <StatCard label="Pendapatan bulan ini" value={formatRupiah(stats.revenue_month)} />
                <StatCard label="Tunggakan" value={formatRupiah(stats.outstanding)} />
                <StatCard label="Kehadiran bulan ini" value={`${stats.attendance_rate}%`} />
                <StatCard label="Akun" value={accounts.length} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div>
                    <SectionTitle>Akun ({accounts.length})</SectionTitle>

                    <Card className="mb-3">
                        <p className="mb-3 text-sm font-semibold text-ink">Tambah akun</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className={label}>Nama</label>
                                <input className={input} value={accountForm.data.name} onChange={(e) => accountForm.setData('name', e.target.value)} />
                                {accountForm.errors.name ? <p className="mt-1 text-sm text-rose">{accountForm.errors.name}</p> : null}
                            </div>
                            <div>
                                <label className={label}>Peran</label>
                                <select className={input} value={accountForm.data.role} onChange={(e) => accountForm.setData('role', e.target.value)}>
                                    <option value="admin">Admin Akademi</option>
                                    <option value="coach">Pelatih</option>
                                    <option value="parent">Orang Tua</option>
                                    <option value="member">Member</option>
                                </select>
                            </div>
                            <div>
                                <label className={label}>Email</label>
                                <input className={input} inputMode="email" value={accountForm.data.email} onChange={(e) => accountForm.setData('email', e.target.value)} />
                            </div>
                            <div>
                                <label className={label}>No. HP</label>
                                <input className={input} inputMode="tel" value={accountForm.data.phone} onChange={(e) => accountForm.setData('phone', e.target.value)} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className={label}>Kata sandi (opsional)</label>
                                <input className={input} value={accountForm.data.password} onChange={(e) => accountForm.setData('password', e.target.value)} placeholder="Kosongkan = dibuat otomatis" />
                                {accountForm.errors.email ? <p className="mt-1 text-sm text-rose">{accountForm.errors.email}</p> : null}
                            </div>
                        </div>
                        <button type="button" className={buttonClass('primary', 'mt-3 w-full')} disabled={accountForm.processing} onClick={addAccount}>
                            <Plus className="h-4 w-4" /> Tambah akun
                        </button>
                    </Card>

                    {accounts.length === 0 ? (
                        <EmptyState title="Belum ada akun" />
                    ) : (
                        <div className="space-y-2">
                            {accounts.map((account) => (
                                <Card key={account.id} className="py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-ink">{account.name ?? '-'}</p>
                                            <p className="truncate text-xs text-slate">{account.email ?? account.phone ?? '-'}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            {!account.is_active ? <Badge tone="rose">Nonaktif</Badge> : null}
                                            <Badge tone="lime">{account.role_label}</Badge>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline"
                                            onClick={() => router.post(`/academies/${academy.id}/accounts/${account.user_id}/resend`, {}, { preserveScroll: true })}
                                        >
                                            <Send className="h-3 w-3" /> Kirim ulang kredensial
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate underline"
                                            onClick={() => router.patch(`/academies/${academy.id}/accounts/${account.user_id}/toggle`, {}, { preserveScroll: true })}
                                        >
                                            <Power className="h-3 w-3" /> {account.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <SectionTitle>Member ({members.length})</SectionTitle>
                    {members.length === 0 ? (
                        <EmptyState title="Belum ada member" description="Member ditambahkan dari menu Member akademi." />
                    ) : (
                        <div className="space-y-2">
                            {members.map((member) => (
                                <Card key={member.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-ink">{member.full_name}</p>
                                        <p className="truncate text-xs text-slate">
                                            {member.member_code ?? '-'} · {member.guardians[0]?.full_name ?? 'tanpa wali'}
                                        </p>
                                    </div>
                                    <StatusBadge status={member.status} />
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
