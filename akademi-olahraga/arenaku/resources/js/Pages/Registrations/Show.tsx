import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, Save, Trash2, UserRound } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import PhotoCapture from '@/Components/PhotoCapture';
import { Badge, Card, SectionTitle, StatusBadge, buttonClass } from '@/Components/ui';
import { confirmDialog, escapeHtml, showMessages, showValidationErrors } from '@/lib/alerts';
import { formatDate, levelLabel } from '@/lib/utils';
import type { PageProps } from '@/types';

interface Registration {
    id: number;
    status: string;
    full_name: string;
    nickname: string | null;
    gender: string;
    birth_date: string | null;
    age: number | null;
    photo_url: string | null;
    branch_id: number | null;
    package_id: number | null;
    branch: string | null;
    package: string | null;
    education_level: string | null;
    grade_class: string | null;
    school_name: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    guardian_name: string;
    guardian_relation: string;
    guardian_phone: string | null;
    guardian_email: string | null;
    guardian_occupation: string | null;
    guardian_address: string | null;
    health_notes: string | null;
    allergy_notes: string | null;
    emergency_name: string | null;
    emergency_phone: string | null;
    notes: string | null;
    admin_notes: string | null;
    member_id: number | null;
    submitted_at: string | null;
    reviewed_at: string | null;
}

interface Option {
    id: number;
    name: string;
    level?: string;
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
    level: string;
    primary_coach_id: string;
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
    admin_notes: string;
    photo: File | null;
}

const input = 'w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink disabled:bg-surface disabled:text-slate';
const label = 'mb-1 block text-sm font-semibold text-ink';

export default function RegistrationShow({
    registration,
    branches,
    packages,
    coaches,
}: {
    registration: Registration;
    branches: Option[];
    packages: Option[];
    coaches: Option[];
}) {
    const isApproved = registration.status === 'approved';
    const academyName = usePage<PageProps>().props.currentAcademy?.name ?? 'akademi';

    const { data, setData, put, post, processing, errors, hasErrors, clearErrors } = useForm<RegistrationForm>({
        full_name: registration.full_name,
        nickname: registration.nickname ?? '',
        gender: registration.gender,
        birth_date: registration.birth_date ?? '',
        education_level: registration.education_level ?? '',
        grade_class: registration.grade_class ?? '',
        school_name: registration.school_name ?? '',
        address: registration.address ?? '',
        city: registration.city ?? '',
        postal_code: registration.postal_code ?? '',
        branch_id: registration.branch_id ? String(registration.branch_id) : '',
        package_id: registration.package_id ? String(registration.package_id) : '',
        level: 'beginner',
        primary_coach_id: '',
        guardian_name: registration.guardian_name,
        guardian_relation: registration.guardian_relation,
        guardian_phone: registration.guardian_phone ?? '',
        guardian_email: registration.guardian_email ?? '',
        guardian_occupation: registration.guardian_occupation ?? '',
        guardian_address: registration.guardian_address ?? '',
        health_notes: registration.health_notes ?? '',
        allergy_notes: registration.allergy_notes ?? '',
        emergency_name: registration.emergency_name ?? '',
        emergency_phone: registration.emergency_phone ?? '',
        notes: registration.notes ?? '',
        admin_notes: registration.admin_notes ?? '',
        photo: null,
    });

    const setField = <K extends keyof RegistrationForm>(field: K, value: RegistrationForm[K]) => {
        setData({ ...data, [field]: value });
        clearErrors(field);
    };

    const requiredFields: { field: keyof RegistrationForm; label: string }[] = [
        { field: 'full_name', label: 'Nama lengkap anak' },
        { field: 'gender', label: 'Jenis kelamin' },
        { field: 'birth_date', label: 'Tanggal lahir' },
        { field: 'guardian_name', label: 'Nama orang tua/wali' },
        { field: 'guardian_relation', label: 'Hubungan orang tua/wali' },
        { field: 'guardian_phone', label: 'No. HP orang tua/wali' },
        { field: 'level', label: 'Level awal' },
    ];

    const validateForm = (): boolean => {
        const messages = requiredFields
            .filter(({ field }) => !String(data[field] ?? '').trim())
            .map(({ label }) => `${label} wajib diisi.`);

        if (data.full_name.trim().length > 120) {
            messages.push('Nama lengkap anak maksimal 120 karakter.');
        }

        if (data.guardian_name.trim().length > 120) {
            messages.push('Nama orang tua/wali maksimal 120 karakter.');
        }

        if (data.guardian_phone.replace(/\D/g, '').length < 8) {
            messages.push('Nomor HP orang tua/wali minimal 8 digit.');
        }

        if (data.birth_date && data.birth_date >= new Date().toISOString().slice(0, 10)) {
            messages.push('Tanggal lahir harus sebelum hari ini.');
        }

        if (messages.length > 0) {
            showMessages('warning', 'Lengkapi data terlebih dahulu', messages);
            return false;
        }

        return true;
    };

    const save = () => {
        if (!validateForm()) {
            return;
        }

        put(`/registrations/${registration.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onError: (serverErrors) => showValidationErrors(serverErrors),
        });
    };

    const approve = async () => {
        if (!validateForm()) {
            return;
        }

        const confirmed = await confirmDialog({
            title: 'Setujui pendaftaran?',
            html: `<b>${escapeHtml(registration.full_name)}</b> akan didaftarkan sebagai member trial di <b>${escapeHtml(
                academyName,
            )}</b> dan akun portal orang tua akan dibuat.`,
            confirmText: 'Ya, setujui',
        });

        if (!confirmed) {
            return;
        }

        post(`/registrations/${registration.id}/approve`, {
            forceFormData: true,
            onError: (serverErrors) => showValidationErrors(serverErrors),
        });
    };

    const remove = async () => {
        const confirmed = await confirmDialog({
            title: 'Hapus pendaftaran?',
            html: `Pendaftaran <b>${escapeHtml(registration.full_name)}</b> akan dihapus. Tindakan ini tidak bisa dibatalkan.`,
            confirmText: 'Ya, hapus',
        });

        if (confirmed) {
            router.delete(`/registrations/${registration.id}`);
        }
    };

    return (
        <AppLayout title={`Pendaftaran · ${registration.full_name}`}>
            <Head title={`Pendaftaran ${registration.full_name}`} />
            <Link href="/registrations" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Pendaftaran
            </Link>

            {hasErrors ? (
                <Card className="mb-4 border-rose/30 bg-rose-50">
                    <p className="text-sm font-semibold text-rose">Periksa kembali data:</p>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-rose">
                        {Array.from(
                            new Set(
                                Object.values(errors).filter(
                                    (message): message is string =>
                                        typeof message === 'string' && message.length > 0,
                                ),
                            ),
                        ).map((message) => (
                            <li key={message}>{message}</li>
                        ))}
                    </ul>
                </Card>
            ) : null}

            <Card className="mb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        {registration.photo_url ? (
                            <img
                                src={registration.photo_url}
                                alt={registration.full_name}
                                className="h-14 w-14 rounded-xl border border-line object-cover"
                            />
                        ) : (
                            <span className="grid h-14 w-14 place-items-center rounded-xl bg-lime/30 text-xl font-extrabold text-ink">
                                {registration.full_name.charAt(0).toUpperCase()}
                            </span>
                        )}
                        <div className="min-w-0">
                            <h2 className="truncate text-lg font-extrabold text-ink">{registration.full_name}</h2>
                            <p className="text-sm text-slate">
                                {registration.age ? `${registration.age} tahun · ` : ''}
                                Diajukan {formatDate(registration.submitted_at)}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2">
                                <StatusBadge status={registration.status} />
                                {registration.branch ? <Badge tone="lime">{registration.branch}</Badge> : null}
                                {registration.package ? <Badge>{registration.package}</Badge> : null}
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                        {isApproved && registration.member_id ? (
                            <Link
                                href={`/members/${registration.member_id}`}
                                className={buttonClass('secondary', 'px-3 py-2')}
                            >
                                <UserRound className="h-4 w-4" /> Lihat member
                            </Link>
                        ) : null}
                        <button type="button" onClick={remove} className={buttonClass('ghost', 'px-3 py-2 text-rose')}>
                            <Trash2 className="h-4 w-4" /> Hapus
                        </button>
                    </div>
                </div>
            </Card>

            <div className="space-y-4">
                <Card>
                    <SectionTitle>Data calon member</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className={label}>Nama lengkap</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.full_name}
                                onChange={(event) => setField('full_name', event.target.value)}
                            />
                            {errors.full_name ? <p className="mt-1 text-sm text-rose">{errors.full_name}</p> : null}
                        </div>
                        <div>
                            <label className={label}>Nama panggilan</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.nickname}
                                onChange={(event) => setField('nickname', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className={label}>Jenis kelamin</label>
                            <select
                                className={input}
                                disabled={isApproved}
                                value={data.gender}
                                onChange={(event) => setField('gender', event.target.value)}
                            >
                                <option value="male">Laki-laki</option>
                                <option value="female">Perempuan</option>
                            </select>
                            {errors.gender ? <p className="mt-1 text-sm text-rose">{errors.gender}</p> : null}
                        </div>
                        <div>
                            <label className={label}>Tanggal lahir</label>
                            <input
                                type="date"
                                className={input}
                                disabled={isApproved}
                                value={data.birth_date}
                                onChange={(event) => setField('birth_date', event.target.value)}
                            />
                            {errors.birth_date ? <p className="mt-1 text-sm text-rose">{errors.birth_date}</p> : null}
                        </div>
                        <div>
                            <label className={label}>Sekolah</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.school_name}
                                onChange={(event) => setField('school_name', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className={label}>Jenjang</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.education_level}
                                onChange={(event) => setField('education_level', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className={label}>Kelas</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.grade_class}
                                onChange={(event) => setField('grade_class', event.target.value)}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={label}>Alamat</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.address}
                                onChange={(event) => setField('address', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className={label}>Kota</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.city}
                                onChange={(event) => setField('city', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className={label}>Kode pos</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.postal_code}
                                onChange={(event) => setField('postal_code', event.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                <Card>
                    <SectionTitle>Foto member</SectionTitle>
                    {isApproved ? (
                        registration.photo_url ? (
                            <img
                                src={registration.photo_url}
                                alt={registration.full_name}
                                className="aspect-square w-full max-w-xs rounded-xl border border-line object-cover"
                            />
                        ) : (
                            <p className="text-sm text-slate">Tidak ada foto.</p>
                        )
                    ) : (
                        <PhotoCapture
                            file={data.photo}
                            onChange={(file) => setField('photo', file)}
                            existingUrl={registration.photo_url}
                            error={errors.photo}
                        />
                    )}
                </Card>

                <Card>
                    <SectionTitle>Penempatan member</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={label}>Level awal</label>
                            <select
                                className={input}
                                disabled={isApproved}
                                value={data.level}
                                onChange={(event) => setField('level', event.target.value)}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                            {errors.level ? <p className="mt-1 text-sm text-rose">{errors.level}</p> : null}
                            <p className="mt-1 text-xs text-slate">
                                Status setelah disetujui: <span className="font-semibold text-ink">Trial</span>
                            </p>
                        </div>
                        <div>
                            <label className={label}>Pelatih utama</label>
                            <select
                                className={input}
                                disabled={isApproved}
                                value={data.primary_coach_id}
                                onChange={(event) => setField('primary_coach_id', event.target.value)}
                            >
                                <option value="">-</option>
                                {coaches.map((coach) => (
                                    <option key={coach.id} value={coach.id}>
                                        {coach.name}
                                    </option>
                                ))}
                            </select>
                            {errors.primary_coach_id ? (
                                <p className="mt-1 text-sm text-rose">{errors.primary_coach_id}</p>
                            ) : null}
                        </div>
                        <div>
                            <label className={label}>Lokasi</label>
                            <select
                                className={input}
                                disabled={isApproved}
                                value={data.branch_id}
                                onChange={(event) => setField('branch_id', event.target.value)}
                            >
                                <option value="">-</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                            {errors.branch_id ? <p className="mt-1 text-sm text-rose">{errors.branch_id}</p> : null}
                        </div>
                        <div>
                            <label className={label}>Paket</label>
                            <select
                                className={input}
                                disabled={isApproved}
                                value={data.package_id}
                                onChange={(event) => setField('package_id', event.target.value)}
                            >
                                <option value="">-</option>
                                {packages.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                        {option.level ? ` · ${levelLabel[option.level] ?? option.level}` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.package_id ? <p className="mt-1 text-sm text-rose">{errors.package_id}</p> : null}
                        </div>
                    </div>
                </Card>

                <Card>
                    <SectionTitle>Data orang tua / wali</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className={label}>Nama orang tua / wali</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.guardian_name}
                                onChange={(event) => setField('guardian_name', event.target.value)}
                            />
                            {errors.guardian_name ? <p className="mt-1 text-sm text-rose">{errors.guardian_name}</p> : null}
                        </div>
                        <div>
                            <label className={label}>Hubungan</label>
                            <select
                                className={input}
                                disabled={isApproved}
                                value={data.guardian_relation}
                                onChange={(event) => setField('guardian_relation', event.target.value)}
                            >
                                <option value="mother">Ibu</option>
                                <option value="father">Ayah</option>
                                <option value="guardian">Wali</option>
                            </select>
                            {errors.guardian_relation ? (
                                <p className="mt-1 text-sm text-rose">{errors.guardian_relation}</p>
                            ) : null}
                        </div>
                        <div>
                            <label className={label}>No. HP / WhatsApp</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.guardian_phone}
                                onChange={(event) => setField('guardian_phone', event.target.value)}
                            />
                            {errors.guardian_phone ? <p className="mt-1 text-sm text-rose">{errors.guardian_phone}</p> : null}
                        </div>
                        <div>
                            <label className={label}>Email</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.guardian_email}
                                onChange={(event) => setField('guardian_email', event.target.value)}
                            />
                            {errors.guardian_email ? <p className="mt-1 text-sm text-rose">{errors.guardian_email}</p> : null}
                        </div>
                        <div>
                            <label className={label}>Pekerjaan</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.guardian_occupation}
                                onChange={(event) => setField('guardian_occupation', event.target.value)}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={label}>Alamat</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.guardian_address}
                                onChange={(event) => setField('guardian_address', event.target.value)}
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
                                disabled={isApproved}
                                value={data.allergy_notes}
                                onChange={(event) => setField('allergy_notes', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className={label}>Riwayat cedera / kondisi khusus</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.health_notes}
                                onChange={(event) => setField('health_notes', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className={label}>Nama kontak darurat</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.emergency_name}
                                onChange={(event) => setField('emergency_name', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className={label}>No. kontak darurat</label>
                            <input
                                className={input}
                                disabled={isApproved}
                                value={data.emergency_phone}
                                onChange={(event) => setField('emergency_phone', event.target.value)}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={label}>Catatan dari orang tua</label>
                            <textarea
                                className={input}
                                rows={2}
                                disabled={isApproved}
                                value={data.notes}
                                onChange={(event) => setField('notes', event.target.value)}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={label}>Catatan internal admin</label>
                            <textarea
                                className={input}
                                rows={2}
                                disabled={isApproved}
                                value={data.admin_notes}
                                onChange={(event) => setField('admin_notes', event.target.value)}
                                placeholder="Hanya terlihat oleh admin/pelatih"
                            />
                        </div>
                    </div>
                </Card>

                {!isApproved ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            className={buttonClass('ghost', 'flex-1')}
                            disabled={processing}
                            onClick={save}
                        >
                            <Save className="h-4 w-4" /> {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                        </button>
                        <button
                            type="button"
                            className={buttonClass('secondary', 'flex-1')}
                            disabled={processing}
                            onClick={approve}
                        >
                            <Check className="h-4 w-4" /> Setujui & daftarkan
                        </button>
                    </div>
                ) : (
                    <Card className="border-emerald/30 bg-emerald-50 text-sm text-emerald-700">
                        Pendaftaran sudah disetujui{registration.reviewed_at ? ` pada ${formatDate(registration.reviewed_at)}` : ''}.
                        Data member dapat diubah dari halaman member.
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
