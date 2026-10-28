import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, SectionTitle, buttonClass } from '@/Components/ui';

interface Option {
    id: number;
    name: string;
}

interface AcademyInfo {
    id: number;
    name: string;
    sport_id: number;
    city: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    brand_color: string;
    timezone: string;
    status: string;
}

const input = 'w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink';
const label = 'mb-1 block text-sm font-semibold text-ink';

export default function AcademiesEdit({ academy, sports }: { academy: AcademyInfo; sports: Option[] }) {
    const { data, setData, put, processing, errors } = useForm({
        name: academy.name,
        sport_id: String(academy.sport_id),
        city: academy.city ?? '',
        address: academy.address ?? '',
        phone: academy.phone ?? '',
        email: academy.email ?? '',
        brand_color: academy.brand_color ?? '#0B1220',
        timezone: academy.timezone ?? 'Asia/Jakarta',
        status: academy.status,
    });

    return (
        <AppLayout title={`Edit ${academy.name}`}>
            <Head title="Edit Akademi" />
            <Link href={`/academies/${academy.id}`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Detail akademi
            </Link>

            <Card>
                <SectionTitle>Data akademi</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className={label}>Nama akademi</label>
                        <input className={input} value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        {errors.name ? <p className="mt-1 text-sm text-rose">{errors.name}</p> : null}
                    </div>
                    <div>
                        <label className={label}>Cabang olahraga</label>
                        <select className={input} value={data.sport_id} onChange={(e) => setData('sport_id', e.target.value)}>
                            {sports.map((sport) => (
                                <option key={sport.id} value={sport.id}>
                                    {sport.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={label}>Status</label>
                        <select className={input} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                            <option value="active">Aktif</option>
                            <option value="inactive">Non-aktif</option>
                            <option value="suspended">Ditangguhkan</option>
                        </select>
                    </div>
                    <div>
                        <label className={label}>Kota</label>
                        <input className={input} value={data.city} onChange={(e) => setData('city', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Telepon</label>
                        <input className={input} inputMode="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Email</label>
                        <input className={input} inputMode="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Zona waktu</label>
                        <input className={input} value={data.timezone} onChange={(e) => setData('timezone', e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={label}>Alamat</label>
                        <input className={input} value={data.address} onChange={(e) => setData('address', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Warna brand</label>
                        <input
                            type="color"
                            className="h-11 w-full rounded-xl border border-line"
                            value={data.brand_color}
                            onChange={(e) => setData('brand_color', e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            <div className="mt-5">
                <button
                    type="button"
                    className={buttonClass('secondary', 'w-full')}
                    disabled={processing}
                    onClick={() => put(`/academies/${academy.id}`)}
                >
                    <Check className="h-4 w-4" /> {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                </button>
            </div>
        </AppLayout>
    );
}
