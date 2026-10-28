import { Head, router, useForm } from '@inertiajs/react';
import { MapPin, Package as PackageIcon, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, EmptyState, SectionTitle, buttonClass } from '@/Components/ui';
import { formatRupiah, levelLabel } from '@/lib/utils';

interface BranchRow {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    is_active: boolean;
}

interface PackageRow {
    id: number;
    name: string;
    level: string;
    monthly_price: number;
    sessions_per_month: number;
    branch: string | null;
    is_active: boolean;
}

interface AcademyInfo {
    name: string;
    sport: string | null;
    city: string | null;
    timezone: string;
}

const input = 'w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink';
const label = 'mb-1 block text-sm font-semibold text-ink';

export default function SettingsIndex({
    academy,
    branches,
    packages,
}: {
    academy: AcademyInfo;
    branches: BranchRow[];
    packages: PackageRow[];
    coaches: { id: number; name: string | null; specialization: string | null }[];
}) {
    const branchForm = useForm({ name: '', address: '', city: '' });
    const packageForm = useForm({
        name: '',
        branch_id: '',
        level: 'beginner',
        monthly_price: 0,
        sessions_per_month: 8,
        duration_minutes: 60,
        quota: 0,
    });

    return (
        <AppLayout title="Pengaturan Akademi">
            <Head title="Pengaturan" />

            <Card className="mb-4">
                <SectionTitle>Profil akademi</SectionTitle>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p className="text-slate">Nama: <span className="font-semibold text-ink">{academy.name}</span></p>
                    <p className="text-slate">Cabang: <span className="font-semibold text-ink">{academy.sport ?? '-'}</span></p>
                    <p className="text-slate">Kota: <span className="font-semibold text-ink">{academy.city ?? '-'}</span></p>
                    <p className="text-slate">Zona waktu: <span className="font-semibold text-ink">{academy.timezone}</span></p>
                </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                <div>
                    <SectionTitle>Lokasi / GOR ({branches.length})</SectionTitle>

                    <Card className="mb-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className={label}>Nama lokasi</label>
                                <input className={input} value={branchForm.data.name} onChange={(e) => branchForm.setData('name', e.target.value)} placeholder="GOR Melati" />
                                {branchForm.errors.name ? <p className="mt-1 text-sm text-rose">{branchForm.errors.name}</p> : null}
                            </div>
                            <div>
                                <label className={label}>Kota</label>
                                <input className={input} value={branchForm.data.city} onChange={(e) => branchForm.setData('city', e.target.value)} />
                            </div>
                            <div>
                                <label className={label}>Alamat</label>
                                <input className={input} value={branchForm.data.address} onChange={(e) => branchForm.setData('address', e.target.value)} />
                            </div>
                        </div>
                        <button
                            type="button"
                            className={buttonClass('primary', 'mt-3 w-full')}
                            disabled={branchForm.processing}
                            onClick={() =>
                                branchForm.post('/settings/branches', { preserveScroll: true, onSuccess: () => branchForm.reset() })
                            }
                        >
                            <Plus className="h-4 w-4" /> Tambah lokasi
                        </button>
                    </Card>

                    {branches.length === 0 ? (
                        <EmptyState title="Belum ada lokasi" />
                    ) : (
                        <div className="space-y-2">
                            {branches.map((branch) => (
                                <Card key={branch.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-1 truncate font-semibold text-ink">
                                            <MapPin className="h-4 w-4 text-slate" /> {branch.name}
                                        </p>
                                        <p className="truncate text-xs text-slate">{[branch.city, branch.address].filter(Boolean).join(' · ') || '-'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-rose"
                                        onClick={() => router.delete(`/settings/branches/${branch.id}`, { preserveScroll: true })}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <SectionTitle>Paket & harga ({packages.length})</SectionTitle>

                    <Card className="mb-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className={label}>Nama paket</label>
                                <input className={input} value={packageForm.data.name} onChange={(e) => packageForm.setData('name', e.target.value)} placeholder="Reguler U-12" />
                                {packageForm.errors.name ? <p className="mt-1 text-sm text-rose">{packageForm.errors.name}</p> : null}
                            </div>
                            <div>
                                <label className={label}>Level</label>
                                <select className={input} value={packageForm.data.level} onChange={(e) => packageForm.setData('level', e.target.value)}>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className={label}>Harga bulanan (Rp)</label>
                                <input
                                    type="number"
                                    className={input}
                                    value={packageForm.data.monthly_price}
                                    onChange={(e) => packageForm.setData('monthly_price', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className={label}>Sesi/bulan</label>
                                <input
                                    type="number"
                                    className={input}
                                    value={packageForm.data.sessions_per_month}
                                    onChange={(e) => packageForm.setData('sessions_per_month', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className={label}>Lokasi</label>
                                <select className={input} value={packageForm.data.branch_id} onChange={(e) => packageForm.setData('branch_id', e.target.value)}>
                                    <option value="">-</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            type="button"
                            className={buttonClass('primary', 'mt-3 w-full')}
                            disabled={packageForm.processing}
                            onClick={() =>
                                packageForm.post('/settings/packages', { preserveScroll: true, onSuccess: () => packageForm.reset() })
                            }
                        >
                            <Plus className="h-4 w-4" /> Tambah paket
                        </button>
                    </Card>

                    {packages.length === 0 ? (
                        <EmptyState title="Belum ada paket" />
                    ) : (
                        <div className="space-y-2">
                            {packages.map((row) => (
                                <Card key={row.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-1 truncate font-semibold text-ink">
                                            <PackageIcon className="h-4 w-4 text-slate" /> {row.name}
                                        </p>
                                        <p className="truncate text-xs text-slate">
                                            {formatRupiah(row.monthly_price)} · {row.sessions_per_month} sesi
                                            {row.branch ? ` · ${row.branch}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <Badge tone="lime">{levelLabel[row.level] ?? row.level}</Badge>
                                        <button
                                            type="button"
                                            className="text-rose"
                                            onClick={() => router.delete(`/settings/packages/${row.id}`, { preserveScroll: true })}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
