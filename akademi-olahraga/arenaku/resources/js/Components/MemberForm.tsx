import { Plus, Trash2 } from 'lucide-react';
import { Card, SectionTitle, buttonClass } from '@/Components/ui';

export interface GuardianRow {
    id?: number;
    full_name: string;
    relation: string;
    phone: string;
    email: string;
    occupation: string;
    is_primary: boolean;
}

export interface MemberFormData {
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
    joined_at: string;
    level: string;
    status: string;
    branch_id: string;
    package_id: string;
    primary_coach_id: string;
    health_notes: string;
    allergy_notes: string;
    emergency_name: string;
    emergency_phone: string;
    source: string;
    notes: string;
    guardians: GuardianRow[];
}

export interface Option {
    id: number;
    name: string;
}

export const emptyGuardian = (): GuardianRow => ({
    full_name: '',
    relation: 'mother',
    phone: '',
    email: '',
    occupation: '',
    is_primary: false,
});

export const emptyMember = (): MemberFormData => ({
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
    joined_at: '',
    level: 'beginner',
    status: 'trial',
    branch_id: '',
    package_id: '',
    primary_coach_id: '',
    health_notes: '',
    allergy_notes: '',
    emergency_name: '',
    emergency_phone: '',
    source: '',
    notes: '',
    guardians: [emptyGuardian()],
});

const input = 'w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink';
const label = 'mb-1 block text-sm font-semibold text-ink';

export default function MemberForm({
    data,
    errors,
    onChange,
    onGuardianChange,
    onAddGuardian,
    onRemoveGuardian,
    branches,
    packages,
    coaches,
    showGuardians = true,
}: {
    data: MemberFormData;
    errors: Partial<Record<string, string>>;
    onChange: (field: keyof MemberFormData, value: string) => void;
    onGuardianChange: (index: number, field: keyof GuardianRow, value: string | boolean) => void;
    onAddGuardian: () => void;
    onRemoveGuardian: (index: number) => void;
    branches: Option[];
    packages: Option[];
    coaches: Option[];
    showGuardians?: boolean;
}) {
    return (
        <div className="space-y-4">
            <Card>
                <SectionTitle>Data anak</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className={label}>Nama lengkap</label>
                        <input className={input} value={data.full_name} onChange={(e) => onChange('full_name', e.target.value)} />
                        {errors.full_name ? <p className="mt-1 text-sm text-rose">{errors.full_name}</p> : null}
                    </div>
                    <div>
                        <label className={label}>Nama panggilan</label>
                        <input className={input} value={data.nickname} onChange={(e) => onChange('nickname', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Jenis kelamin</label>
                        <select className={input} value={data.gender} onChange={(e) => onChange('gender', e.target.value)}>
                            <option value="">-</option>
                            <option value="male">Laki-laki</option>
                            <option value="female">Perempuan</option>
                        </select>
                    </div>
                    <div>
                        <label className={label}>Tanggal lahir</label>
                        <input type="date" className={input} value={data.birth_date} onChange={(e) => onChange('birth_date', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Tanggal masuk</label>
                        <input type="date" className={input} value={data.joined_at} onChange={(e) => onChange('joined_at', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Sekolah</label>
                        <input className={input} value={data.school_name} onChange={(e) => onChange('school_name', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Jenjang / kelas</label>
                        <div className="flex gap-2">
                            <input className={input} placeholder="SD" value={data.education_level} onChange={(e) => onChange('education_level', e.target.value)} />
                            <input className={input} placeholder="4A" value={data.grade_class} onChange={(e) => onChange('grade_class', e.target.value)} />
                        </div>
                    </div>
                    <div className="sm:col-span-2">
                        <label className={label}>Alamat</label>
                        <input className={input} value={data.address} onChange={(e) => onChange('address', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Kota</label>
                        <input className={input} value={data.city} onChange={(e) => onChange('city', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Kode pos</label>
                        <input className={input} value={data.postal_code} onChange={(e) => onChange('postal_code', e.target.value)} />
                    </div>
                </div>
            </Card>

            <Card>
                <SectionTitle>Kelas & status</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={label}>Level</label>
                        <select className={input} value={data.level} onChange={(e) => onChange('level', e.target.value)}>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    <div>
                        <label className={label}>Status</label>
                        <select className={input} value={data.status} onChange={(e) => onChange('status', e.target.value)}>
                            <option value="trial">Trial</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Non-aktif</option>
                            <option value="alumni">Alumni</option>
                        </select>
                    </div>
                    <div>
                        <label className={label}>Paket</label>
                        <select className={input} value={data.package_id} onChange={(e) => onChange('package_id', e.target.value)}>
                            <option value="">-</option>
                            {packages.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={label}>Lokasi</label>
                        <select className={input} value={data.branch_id} onChange={(e) => onChange('branch_id', e.target.value)}>
                            <option value="">-</option>
                            {branches.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className={label}>Pelatih utama</label>
                        <select className={input} value={data.primary_coach_id} onChange={(e) => onChange('primary_coach_id', e.target.value)}>
                            <option value="">-</option>
                            {coaches.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {showGuardians ? (
                <Card>
                    <SectionTitle
                        action={
                            <button type="button" className={buttonClass('ghost', 'px-3 py-2')} onClick={onAddGuardian}>
                                <Plus className="h-4 w-4" /> Tambah wali
                            </button>
                        }
                    >
                        Data wali
                    </SectionTitle>

                    <div className="space-y-4">
                        {data.guardians.map((guardian, index) => (
                            <div key={index} className="rounded-xl border border-line p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate">Wali #{index + 1}</span>
                                    {data.guardians.length > 1 ? (
                                        <button type="button" className="text-rose" onClick={() => onRemoveGuardian(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    ) : null}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className={label}>Nama wali</label>
                                        <input className={input} value={guardian.full_name} onChange={(e) => onGuardianChange(index, 'full_name', e.target.value)} />
                                        {errors[`guardians.${index}.full_name`] ? (
                                            <p className="mt-1 text-sm text-rose">{errors[`guardians.${index}.full_name`]}</p>
                                        ) : null}
                                    </div>
                                    <div>
                                        <label className={label}>Hubungan</label>
                                        <select className={input} value={guardian.relation} onChange={(e) => onGuardianChange(index, 'relation', e.target.value)}>
                                            <option value="father">Ayah</option>
                                            <option value="mother">Ibu</option>
                                            <option value="guardian">Wali</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={label}>No. HP</label>
                                        <input className={input} inputMode="tel" value={guardian.phone} onChange={(e) => onGuardianChange(index, 'phone', e.target.value)} />
                                        {errors[`guardians.${index}.phone`] ? (
                                            <p className="mt-1 text-sm text-rose">{errors[`guardians.${index}.phone`]}</p>
                                        ) : null}
                                    </div>
                                    <div>
                                        <label className={label}>Email</label>
                                        <input className={input} inputMode="email" value={guardian.email} onChange={(e) => onGuardianChange(index, 'email', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={label}>Pekerjaan</label>
                                        <input className={input} value={guardian.occupation} onChange={(e) => onGuardianChange(index, 'occupation', e.target.value)} />
                                    </div>
                                    <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate">
                                        <input type="checkbox" className="h-4 w-4" checked={guardian.is_primary} onChange={(e) => onGuardianChange(index, 'is_primary', e.target.checked)} />
                                        Wali utama
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : null}

            <Card>
                <SectionTitle>Catatan & kontak darurat</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={label}>Nama kontak darurat</label>
                        <input className={input} value={data.emergency_name} onChange={(e) => onChange('emergency_name', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>No. kontak darurat</label>
                        <input className={input} inputMode="tel" value={data.emergency_phone} onChange={(e) => onChange('emergency_phone', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Alergi</label>
                        <input className={input} value={data.allergy_notes} onChange={(e) => onChange('allergy_notes', e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Riwayat cedera / catatan kesehatan</label>
                        <input className={input} value={data.health_notes} onChange={(e) => onChange('health_notes', e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={label}>Catatan tambahan</label>
                        <input className={input} value={data.notes} onChange={(e) => onChange('notes', e.target.value)} />
                    </div>
                </div>
            </Card>
        </div>
    );
}
