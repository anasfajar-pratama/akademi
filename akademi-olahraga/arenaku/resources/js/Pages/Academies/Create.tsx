import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, SectionTitle, buttonClass } from '@/Components/ui';
import { cn } from '@/lib/utils';

interface Sport {
    id: number;
    name: string;
    slug: string;
    skills_count: number;
}

interface PersonRow {
    name: string;
    email: string;
    phone: string;
    password: string;
}

interface MemberRow {
    full_name: string;
    nickname: string;
    gender: string;
    birth_date: string;
    guardian_name: string;
    guardian_phone: string;
    guardian_email: string;
    guardian_relation: string;
}

const steps = ['Data akademi', 'Admin', 'Pelatih', 'Member', 'Tinjau'] as const;

const emptyPerson = (): PersonRow => ({ name: '', email: '', phone: '', password: '' });
const emptyMember = (): MemberRow => ({
    full_name: '',
    nickname: '',
    gender: '',
    birth_date: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relation: 'mother',
});

const inputClass =
    'w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink';
const labelClass = 'mb-1 block text-sm font-semibold text-ink';

export default function CreateAcademy({ sports }: { sports: Sport[] }) {
    const [step, setStep] = useState(0);

    const { data, setData, post, processing, errors } = useForm({
        academy: {
            name: '',
            sport_id: '',
            city: '',
            address: '',
            phone: '',
            email: '',
            brand_color: '#0B1220',
            timezone: 'Asia/Jakarta',
        },
        admins: [emptyPerson()],
        coaches: [] as PersonRow[],
        members: [] as MemberRow[],
    });

    const selectedSport = sports.find((sport) => String(sport.id) === String(data.academy.sport_id));

    const updateAcademy = (field: keyof typeof data.academy, value: string) =>
        setData('academy', { ...data.academy, [field]: value });

    const updatePerson = (key: 'admins' | 'coaches', index: number, field: keyof PersonRow, value: string) =>
        setData(
            key,
            data[key].map((row, i) => (i === index ? { ...row, [field]: value } : row)),
        );

    const updateMember = (index: number, field: keyof MemberRow, value: string) =>
        setData(
            'members',
            data.members.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
        );

    const errorList = Object.entries(errors);

    const submit = () => post('/academies');

    return (
        <AppLayout title="Buat Akademi">
            <Head title="Buat Akademi" />

            <div className="mb-5 flex items-center gap-1.5 overflow-x-auto">
                {steps.map((label, index) => (
                    <button
                        key={label}
                        type="button"
                        onClick={() => setStep(index)}
                        className={cn(
                            'flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                            index === step ? 'bg-ink text-white' : 'bg-white text-slate border border-line',
                        )}
                    >
                        <span
                            className={cn(
                                'grid h-5 w-5 place-items-center rounded-full text-[10px]',
                                index <= step ? 'bg-lime text-ink' : 'bg-surface text-slate',
                            )}
                        >
                            {index + 1}
                        </span>
                        {label}
                    </button>
                ))}
            </div>

            {errorList.length > 0 ? (
                <Card className="mb-4 border-rose/40 bg-rose-50">
                    <p className="text-sm font-semibold text-rose">Periksa kembali:</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-rose">
                        {errorList.slice(0, 6).map(([key, message]) => (
                            <li key={key}>{message}</li>
                        ))}
                    </ul>
                </Card>
            ) : null}

            {step === 0 ? (
                <Card>
                    <SectionTitle>Data akademi</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Nama akademi</label>
                            <input
                                className={inputClass}
                                value={data.academy.name}
                                onChange={(e) => updateAcademy('name', e.target.value)}
                                placeholder="mis. Arenaku Badminton Club"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Cabang olahraga</label>
                            <select
                                className={inputClass}
                                value={data.academy.sport_id}
                                onChange={(e) => updateAcademy('sport_id', e.target.value)}
                            >
                                <option value="">Pilih cabang…</option>
                                {sports.map((sport) => (
                                    <option key={sport.id} value={sport.id}>
                                        {sport.name}
                                    </option>
                                ))}
                            </select>
                            {selectedSport ? (
                                <p className="mt-1 text-xs text-slate">
                                    {selectedSport.skills_count} template skill akan disalin ke akademi ini.
                                </p>
                            ) : null}
                        </div>
                        <div>
                            <label className={labelClass}>Kota</label>
                            <input
                                className={inputClass}
                                value={data.academy.city}
                                onChange={(e) => updateAcademy('city', e.target.value)}
                                placeholder="mis. Bandung"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Telepon</label>
                            <input
                                className={inputClass}
                                value={data.academy.phone}
                                onChange={(e) => updateAcademy('phone', e.target.value)}
                                placeholder="0812..."
                                inputMode="tel"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Email</label>
                            <input
                                className={inputClass}
                                value={data.academy.email}
                                onChange={(e) => updateAcademy('email', e.target.value)}
                                placeholder="opsional"
                                inputMode="email"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Warna brand</label>
                            <input
                                type="color"
                                className="h-11 w-full rounded-xl border border-line"
                                value={data.academy.brand_color}
                                onChange={(e) => updateAcademy('brand_color', e.target.value)}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Alamat</label>
                            <input
                                className={inputClass}
                                value={data.academy.address}
                                onChange={(e) => updateAcademy('address', e.target.value)}
                                placeholder="opsional"
                            />
                        </div>
                    </div>
                </Card>
            ) : null}

            {step === 1 || step === 2 ? (
                <Card>
                    <SectionTitle
                        action={
                            <button
                                type="button"
                                className={buttonClass('ghost', 'px-3 py-2')}
                                onClick={() =>
                                    setData(step === 1 ? 'admins' : 'coaches', [
                                        ...(step === 1 ? data.admins : data.coaches),
                                        emptyPerson(),
                                    ])
                                }
                            >
                                <Plus className="h-4 w-4" /> Tambah
                            </button>
                        }
                    >
                        {step === 1 ? 'Admin akademi' : 'Pelatih'}
                    </SectionTitle>

                    <p className="mb-3 text-sm text-slate">
                        Isi minimal email atau nomor HP. Kata sandi dikosongkan = sistem membuat otomatis dan mengirim
                        kredensial.
                    </p>

                    <div className="space-y-4">
                        {(step === 1 ? data.admins : data.coaches).map((person, index) => (
                            <div key={index} className="rounded-xl border border-line p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate">
                                        {step === 1 ? 'Admin' : 'Pelatih'} #{index + 1}
                                    </span>
                                    {(step === 1 ? data.admins : data.coaches).length > (step === 1 ? 1 : 0) ? (
                                        <button
                                            type="button"
                                            className="text-rose"
                                            onClick={() =>
                                                setData(
                                                    step === 1 ? 'admins' : 'coaches',
                                                    (step === 1 ? data.admins : data.coaches).filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    ) : null}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Nama</label>
                                        <input
                                            className={inputClass}
                                            value={person.name}
                                            onChange={(e) =>
                                                updatePerson(step === 1 ? 'admins' : 'coaches', index, 'name', e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input
                                            className={inputClass}
                                            value={person.email}
                                            inputMode="email"
                                            onChange={(e) =>
                                                updatePerson(step === 1 ? 'admins' : 'coaches', index, 'email', e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>No. HP</label>
                                        <input
                                            className={inputClass}
                                            value={person.phone}
                                            inputMode="tel"
                                            onChange={(e) =>
                                                updatePerson(step === 1 ? 'admins' : 'coaches', index, 'phone', e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : null}

            {step === 3 ? (
                <Card>
                    <SectionTitle
                        action={
                            <button
                                type="button"
                                className={buttonClass('ghost', 'px-3 py-2')}
                                onClick={() => setData('members', [...data.members, emptyMember()])}
                            >
                                <Plus className="h-4 w-4" /> Tambah
                            </button>
                        }
                    >
                        Member awal
                    </SectionTitle>
                    <p className="mb-3 text-sm text-slate">
                        Opsional. Sertakan data wali agar orang tua bisa login ke portal.
                    </p>

                    {data.members.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-line p-4 text-sm text-slate">
                            Belum ada member. Anda bisa menambahkan nanti setelah akademi dibuat.
                        </p>
                    ) : null}

                    <div className="space-y-4">
                        {data.members.map((member, index) => (
                            <div key={index} className="rounded-xl border border-line p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate">Member #{index + 1}</span>
                                    <button
                                        type="button"
                                        className="text-rose"
                                        onClick={() =>
                                            setData('members', data.members.filter((_, i) => i !== index))
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>Nama lengkap anak</label>
                                        <input
                                            className={inputClass}
                                            value={member.full_name}
                                            onChange={(e) => updateMember(index, 'full_name', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Panggilan</label>
                                        <input
                                            className={inputClass}
                                            value={member.nickname}
                                            onChange={(e) => updateMember(index, 'nickname', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Jenis kelamin</label>
                                        <select
                                            className={inputClass}
                                            value={member.gender}
                                            onChange={(e) => updateMember(index, 'gender', e.target.value)}
                                        >
                                            <option value="">-</option>
                                            <option value="male">Laki-laki</option>
                                            <option value="female">Perempuan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tanggal lahir</label>
                                        <input
                                            type="date"
                                            className={inputClass}
                                            value={member.birth_date}
                                            onChange={(e) => updateMember(index, 'birth_date', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Nama wali</label>
                                        <input
                                            className={inputClass}
                                            value={member.guardian_name}
                                            onChange={(e) => updateMember(index, 'guardian_name', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>No. HP wali</label>
                                        <input
                                            className={inputClass}
                                            value={member.guardian_phone}
                                            inputMode="tel"
                                            onChange={(e) => updateMember(index, 'guardian_phone', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : null}

            {step === 4 ? (
                <Card>
                    <SectionTitle>Tinjau & simpan</SectionTitle>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between gap-3 border-b border-line pb-2">
                            <dt className="text-slate">Akademi</dt>
                            <dd className="text-right font-semibold">
                                {data.academy.name || '-'} · {selectedSport?.name ?? '-'}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-3 border-b border-line pb-2">
                            <dt className="text-slate">Admin</dt>
                            <dd className="text-right font-semibold">{data.admins.length} akun</dd>
                        </div>
                        <div className="flex justify-between gap-3 border-b border-line pb-2">
                            <dt className="text-slate">Pelatih</dt>
                            <dd className="text-right font-semibold">{data.coaches.length} akun</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate">Member awal</dt>
                            <dd className="text-right font-semibold">{data.members.length} orang</dd>
                        </div>
                    </dl>
                    <p className="mt-4 rounded-xl bg-surface p-3 text-xs text-slate">
                        Semua dibuat dalam satu transaksi. Kredensial akun baru dikirim via email (dan ditampilkan
                        sekali setelah akademi dibuat).
                    </p>
                </Card>
            ) : null}

            <div className="mt-5 flex items-center justify-between gap-3">
                <button
                    type="button"
                    className={buttonClass('ghost', step === 0 ? 'invisible' : '')}
                    onClick={() => setStep((current) => Math.max(0, current - 1))}
                >
                    <ArrowLeft className="h-4 w-4" /> Sebelumnya
                </button>

                {step < steps.length - 1 ? (
                    <button
                        type="button"
                        className={buttonClass('primary')}
                        onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
                    >
                        Lanjut <ArrowRight className="h-4 w-4" />
                    </button>
                ) : (
                    <button type="button" className={buttonClass('secondary')} disabled={processing} onClick={submit}>
                        <Check className="h-4 w-4" /> {processing ? 'Menyimpan…' : 'Simpan akademi'}
                    </button>
                )}
            </div>

            <div className="mt-4 text-center">
                <Link href="/academies" className="text-sm font-semibold text-slate hover:text-ink">
                    Batal
                </Link>
            </div>
        </AppLayout>
    );
}
