import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { type FormEvent } from 'react';
import PhotoCapture from '@/Components/PhotoCapture';
import { Card, SectionTitle, buttonClass } from '@/Components/ui';
import { formatRupiah, levelLabel } from '@/lib/utils';
import type { PageProps } from '@/types';

interface PublicAcademy {
    name: string;
    sport: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    brand_color: string;
}

interface BranchOption {
    id: number;
    name: string;
}

interface PackageOption {
    id: number;
    name: string;
    level: string;
    monthly_price: number;
}

interface RegistrationForm {
    full_name: string;
    nickname: string;
    gender: string;
    birth_date: string;
    education_level: string;
    grade_class: string;
    school_name: string;
    address: string;
    city: string;
    postal_code: string;
    branch_id: string;
    package_id: string;
    guardian_name: string;
    guardian_relation: string;
    guardian_phone: string;
    guardian_email: string;
    guardian_occupation: string;
    guardian_address: string;
    health_notes: string;
    allergy_notes: string;
    emergency_name: string;
    emergency_phone: string;
    notes: string;
    consent: boolean;
    photo: File | null;
}

const input = 'w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink';
const label = 'mb-1 block text-sm font-semibold text-ink';

export default function PublicRegister({
    token,
    academy,
    closed,
    branches,
    packages,
}: {
    token: string;
    academy: PublicAcademy;
    closed: boolean;
    branches: BranchOption[];
    packages: PackageOption[];
}) {
    const { flash } = usePage<PageProps>().props;
    const { data, setData, post, processing, errors } = useForm<RegistrationForm>({
        full_name: '',
        nickname: '',
        gender: '',
        birth_date: '',
        education_level: '',
        grade_class: '',
        school_name: '',
        address: '',
        city: '',
        postal_code: '',
        branch_id: '',
        package_id: '',
        guardian_name: '',
        guardian_relation: 'mother',
        guardian_phone: '',
        guardian_email: '',
        guardian_occupation: '',
        guardian_address: '',
        health_notes: '',
        allergy_notes: '',
        emergency_name: '',
        emergency_phone: '',
        notes: '',
        consent: false,
        photo: null,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(`/daftar/${token}`, { forceFormData: true, preserveScroll: true });
    };

    return (
        <div className="min-h-screen bg-surface pb-10">
            <Head title={`Pendaftaran ${academy.name}`} />

            <header className="bg-ink text-white">
                <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-5">
                    <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-white"
                        style={{ backgroundColor: academy.brand_color || '#c9f24d' }}
                    >
                        {academy.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-base font-extrabold">{academy.name}</p>
                        <p className="truncate text-xs text-white/60">
                            {[academy.sport, academy.city].filter(Boolean).join(' · ') || 'Pendaftaran member baru'}
                        </p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
                {flash.success ? (
                    <Card className="border-emerald/30 bg-emerald-50">
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-emerald shadow-sm">
                                <CheckCircle2 className="h-7 w-7" />
                            </span>
                            <div>
                                <h1 className="text-lg font-extrabold text-ink">
                                    Pendaftaran terkirim ke {academy.name}
                                </h1>
                                <p className="mt-1 text-sm text-slate">{flash.success}</p>
                            </div>
                            <div className="rounded-xl bg-white px-4 py-3 text-sm">
                                <p className="font-semibold text-ink">{academy.name}</p>
                                <p className="text-xs text-slate">
                                    {[academy.sport, academy.city].filter(Boolean).join(' · ') || 'Akademi olahraga'}
                                </p>
                                {academy.phone || academy.email ? (
                                    <p className="mt-1 text-xs text-slate">
                                        {[academy.phone, academy.email].filter(Boolean).join(' · ')}
                                    </p>
                                ) : null}
                            </div>
                            <p className="max-w-sm text-xs text-slate">
                                Simpan halaman ini. Admin {academy.name} akan menghubungi Anda melalui WhatsApp.
                            </p>
                        </div>
                    </Card>
                ) : closed ? (
                    <Card className="text-center">
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber">
                            <ShieldCheck className="h-6 w-6" />
                        </span>
                        <h1 className="mt-3 text-lg font-extrabold text-ink">Pendaftaran sedang ditutup</h1>
                        <p className="mt-1 text-sm text-slate">
                            Pendaftaran online {academy.name} belum dibuka atau sudah ditutup sementara. Silakan hubungi
                            akademi untuk informasi lebih lanjut.
                        </p>
                        {academy.phone || academy.email ? (
                            <p className="mt-3 text-sm font-semibold text-ink">
                                {[academy.phone, academy.email].filter(Boolean).join(' · ')}
                            </p>
                        ) : null}
                    </Card>
                ) : (
                    <>
                        <Card className="border-lime/60 bg-lime/10">
                            <div className="flex items-start gap-3">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-ink">
                                    <ShieldCheck className="h-5 w-5" />
                                </span>
                                <div>
                                    <h1 className="text-lg font-extrabold text-ink">Pendaftaran member baru</h1>
                                    <p className="mt-1 text-sm text-slate">
                                        Formulir ini diisi oleh orang tua / wali. Setelah dikirim, admin akademi akan
                                        memeriksa data dan menghubungi Anda melalui WhatsApp.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <form onSubmit={submit} className="space-y-4">
                            <Card>
                                <SectionTitle>Data calon member</SectionTitle>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className={label}>Nama lengkap anak *</label>
                                        <input
                                            className={input}
                                            value={data.full_name}
                                            onChange={(event) => setData('full_name', event.target.value)}
                                            placeholder="Nama sesuai akta / sekolah"
                                        />
                                        {errors.full_name ? <p className="mt-1 text-sm text-rose">{errors.full_name}</p> : null}
                                    </div>
                                    <div>
                                        <label className={label}>Nama panggilan</label>
                                        <input
                                            className={input}
                                            value={data.nickname}
                                            onChange={(event) => setData('nickname', event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>Jenis kelamin *</label>
                                        <select
                                            className={input}
                                            value={data.gender}
                                            onChange={(event) => setData('gender', event.target.value)}
                                        >
                                            <option value="">Pilih…</option>
                                            <option value="male">Laki-laki</option>
                                            <option value="female">Perempuan</option>
                                        </select>
                                        {errors.gender ? <p className="mt-1 text-sm text-rose">{errors.gender}</p> : null}
                                    </div>
                                    <div>
                                        <label className={label}>Tanggal lahir *</label>
                                        <input
                                            type="date"
                                            className={input}
                                            value={data.birth_date}
                                            max={new Date().toISOString().slice(0, 10)}
                                            onChange={(event) => setData('birth_date', event.target.value)}
                                        />
                                        {errors.birth_date ? <p className="mt-1 text-sm text-rose">{errors.birth_date}</p> : null}
                                    </div>
                                    <div>
                                        <label className={label}>Sekolah</label>
                                        <input
                                            className={input}
                                            value={data.school_name}
                                            onChange={(event) => setData('school_name', event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>Jenjang</label>
                                        <input
                                            className={input}
                                            placeholder="SD / SMP / SMA"
                                            value={data.education_level}
                                            onChange={(event) => setData('education_level', event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>Kelas</label>
                                        <input
                                            className={input}
                                            placeholder="4A"
                                            value={data.grade_class}
                                            onChange={(event) => setData('grade_class', event.target.value)}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={label}>Alamat rumah</label>
                                        <input
                                            className={input}
                                            value={data.address}
                                            onChange={(event) => setData('address', event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>Kota</label>
                                        <input
                                            className={input}
                                            value={data.city}
                                            onChange={(event) => setData('city', event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>Kode pos</label>
                                        <input
                                            className={input}
                                            inputMode="numeric"
                                            value={data.postal_code}
                                            onChange={(event) => setData('postal_code', event.target.value)}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <SectionTitle>Foto member</SectionTitle>
                                <PhotoCapture
                                    file={data.photo}
                                    onChange={(file) => setData('photo', file)}
                                    error={errors.photo}
                                />
                            </Card>

                            <Card>
                                <SectionTitle>Lokasi & paket (opsional)</SectionTitle>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={label}>Lokasi latihan</label>
                                        <select
                                            className={input}
                                            value={data.branch_id}
                                            onChange={(event) => setData('branch_id', event.target.value)}
                                        >
                                            <option value="">Belum tahu / ikuti arahan admin</option>
                                            {branches.map((branch) => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={label}>Paket</label>
                                        <select
                                            className={input}
                                            value={data.package_id}
                                            onChange={(event) => setData('package_id', event.target.value)}
                                        >
                                            <option value="">Belum tahu / ikuti arahan admin</option>
                                            {packages.map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {option.name} · {levelLabel[option.level] ?? option.level} ·{' '}
                                                    {formatRupiah(option.monthly_price)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <SectionTitle>Data orang tua / wali</SectionTitle>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className={label}>Nama orang tua / wali *</label>
                                        <input
                                            className={input}
                                            value={data.guardian_name}
                                            onChange={(event) => setData('guardian_name', event.target.value)}
                                        />
                                        {errors.guardian_name ? <p className="mt-1 text-sm text-rose">{errors.guardian_name}</p> : null}
                                    </div>
                                    <div>
                                        <label className={label}>Hubungan *</label>
                                        <select
                                            className={input}
                                            value={data.guardian_relation}
                                            onChange={(event) => setData('guardian_relation', event.target.value)}
                                        >
                                            <option value="mother">Ibu</option>
                                            <option value="father">Ayah</option>
                                            <option value="guardian">Wali</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={label}>No. HP / WhatsApp *</label>
                                        <input
                                            className={input}
                                            inputMode="tel"
                                            placeholder="0812..."
                                            value={data.guardian_phone}
                                            onChange={(event) => setData('guardian_phone', event.target.value)}
                                        />
                                        {errors.guardian_phone ? <p className="mt-1 text-sm text-rose">{errors.guardian_phone}</p> : null}
                                    </div>
                                    <div>
                                        <label className={label}>Email</label>
                                        <input
                                            className={input}
                                            inputMode="email"
                                            placeholder="opsional"
                                            value={data.guardian_email}
                                            onChange={(event) => setData('guardian_email', event.target.value)}
                                        />
                                        {errors.guardian_email ? <p className="mt-1 text-sm text-rose">{errors.guardian_email}</p> : null}
                                    </div>
                                    <div>
                                        <label className={label}>Pekerjaan</label>
                                        <input
                                            className={input}
                                            value={data.guardian_occupation}
                                            onChange={(event) => setData('guardian_occupation', event.target.value)}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={label}>Alamat orang tua / wali</label>
                                        <input
                                            className={input}
                                            value={data.guardian_address}
                                            onChange={(event) => setData('guardian_address', event.target.value)}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <SectionTitle>Kesehatan & catatan</SectionTitle>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={label}>Alergi</label>
                                        <input
                                            className={input}
                                            value={data.allergy_notes}
                                            onChange={(event) => setData('allergy_notes', event.target.value)}
                                            placeholder="mis. alergi debu"
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>Riwayat cedera / kondisi khusus</label>
                                        <input
                                            className={input}
                                            value={data.health_notes}
                                            onChange={(event) => setData('health_notes', event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>Nama kontak darurat</label>
                                        <input
                                            className={input}
                                            value={data.emergency_name}
                                            onChange={(event) => setData('emergency_name', event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>No. kontak darurat</label>
                                        <input
                                            className={input}
                                            inputMode="tel"
                                            value={data.emergency_phone}
                                            onChange={(event) => setData('emergency_phone', event.target.value)}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={label}>Catatan tambahan</label>
                                        <textarea
                                            className={input}
                                            rows={3}
                                            value={data.notes}
                                            onChange={(event) => setData('notes', event.target.value)}
                                            placeholder="Jadwal yang diinginkan, pertanyaan, dll."
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <label className="flex items-start gap-3 text-sm text-slate">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-line"
                                        checked={data.consent}
                                        onChange={(event) => setData('consent', event.target.checked)}
                                    />
                                    <span>
                                        Saya adalah orang tua / wali dari calon member dan menyetujui data serta foto ini
                                        digunakan untuk proses pendaftaran dan administrasi di {academy.name}.
                                    </span>
                                </label>
                                {errors.consent ? <p className="mt-2 text-sm text-rose">{errors.consent}</p> : null}

                                <button
                                    type="submit"
                                    className={buttonClass('secondary', 'mt-4 w-full')}
                                    disabled={processing}
                                >
                                    {processing ? 'Mengirim…' : 'Kirim pendaftaran'}
                                </button>
                            </Card>
                        </form>

                        <p className="pb-4 text-center text-xs text-slate">
                            Data Anda hanya digunakan untuk keperluan pendaftaran dan pengelolaan member di{' '}
                            {academy.name}.
                        </p>
                    </>
                )}
            </main>
        </div>
    );
}
