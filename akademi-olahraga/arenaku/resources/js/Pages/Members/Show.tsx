import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, KeyRound, MessageCircle, Pencil, Sparkles, Trash2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, SectionTitle, StatusBadge, buttonClass } from '@/Components/ui';
import { attendanceLabel, formatDate, formatRupiah, levelLabel } from '@/lib/utils';
import type { Credential, PageProps } from '@/types';

interface MemberInfo {
    id: number;
    full_name: string;
    nickname: string | null;
    member_code: string | null;
    gender: string | null;
    birth_date: string | null;
    age: number | null;
    education_level: string | null;
    grade_class: string | null;
    school_name: string | null;
    address: string | null;
    city: string | null;
    level: string;
    status: string;
    joined_at: string | null;
    photo_url: string | null;
    package: string | null;
    branch: string | null;
    coach: string | null;
    health_notes: string | null;
    allergy_notes: string | null;
    emergency_name: string | null;
    emergency_phone: string | null;
    notes: string | null;
}

interface GuardianInfo {
    id: number;
    full_name: string;
    relation: string;
    phone: string | null;
    email: string | null;
    occupation: string | null;
    is_primary: boolean;
}

interface HistoryRow {
    id: number;
    status: string;
    session_title: string | null;
    session_date: string | null;
}

interface SkillSummary {
    has_data: boolean;
    overall?: number;
    overall_delta?: number | null;
    latest_period?: string;
    categories?: { name: string; score: number; delta: number | null }[];
}

interface FinanceInvoice {
    id: number;
    number: string;
    period_start: string | null;
    total: number;
    paid_amount: number;
    outstanding: number;
    status: string;
}

interface Finance {
    outstanding: number;
    invoices: FinanceInvoice[];
}

interface SkillOptionGroup {
    id: number;
    name: string;
    skills: { id: number; name: string }[];
}

const relationLabel: Record<string, string> = { father: 'Ayah', mother: 'Ibu', guardian: 'Wali' };

function Row({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="flex justify-between gap-3 border-b border-line py-2 text-sm last:border-0">
            <span className="text-slate">{label}</span>
            <span className="text-right font-semibold text-ink">{value || '-'}</span>
        </div>
    );
}

export default function MembersShow({
    member,
    guardians,
    history,
    skills,
    finance,
    can_assess,
    skill_options,
}: {
    member: MemberInfo;
    guardians: GuardianInfo[];
    history: HistoryRow[];
    skills: SkillSummary;
    finance: Finance;
    can_assess: boolean;
    skill_options: SkillOptionGroup[];
}) {
    const { flash, currentAcademy } = usePage<PageProps>().props;
    const credentials: Credential[] = flash.credentials ?? [];
    const loginUrl = `${window.location.origin}/login`;
    const assessForm = useForm({
        skill_id: '',
        score: '3',
        note: '',
        note_visibility: 'parent',
    });

    const remove = () => {
        if (confirm(`Hapus member ${member.full_name}?`)) {
            router.delete(`/members/${member.id}`);
        }
    };

    const submitAssessment = () => {
        assessForm.post(`/members/${member.id}/assessments`, {
            preserveScroll: true,
            onSuccess: () => assessForm.reset('skill_id', 'note'),
        });
    };

    const whatsappLink = (row: Credential): string | null => {
        const phone = row.phone?.replace(/\D/g, '');

        if (!phone) {
            return null;
        }

        const message = [
            `Halo ${row.name},`,
            '',
            `Pendaftaran ${member.full_name} di ${currentAcademy?.name ?? 'akademi'} telah disetujui.`,
            row.created && row.password
                ? 'Akun portal orang tua sudah dibuat.'
                : 'Akun portal orang tua Anda sudah aktif.',
            '',
            `Login: ${loginUrl}`,
            `Email/No. HP: ${row.email ?? row.phone ?? '-'}`,
            row.password ? `Kata sandi sementara: ${row.password}` : null,
            '',
            'Demi keamanan, segera ganti kata sandi setelah login.',
        ].filter((line): line is string => line !== null);

        return `https://wa.me/${phone}?text=${encodeURIComponent(message.join('\n'))}`;
    };

    return (
        <AppLayout title={member.full_name}>
            <Head title={member.full_name} />
            <Link href="/members" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Member
            </Link>

            {credentials.length > 0 ? (
                <Card className="mb-4 border-lime/60 bg-lime/10">
                    <SectionTitle>Kredensial akun orang tua</SectionTitle>
                    <p className="mb-3 text-sm text-slate">
                        Salin dan bagikan sekarang — kata sandi hanya ditampilkan sekali. Tombol WhatsApp berisi
                        link login dan kredensial akun orang tua.
                    </p>
                    <div className="space-y-2">
                        {credentials.map((row, index) => {
                            const waLink = whatsappLink(row);

                            return (
                                <div
                                    key={index}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-ink">
                                            {row.name} {row.role_label ? `· ${row.role_label}` : ''}
                                        </p>
                                        <p className="truncate text-xs text-slate">
                                            {[row.email, row.phone].filter(Boolean).join(' · ') || '-'}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                                        {row.created && row.password ? (
                                            <Badge tone="ink">
                                                <KeyRound className="h-3 w-3" /> {row.password}
                                            </Badge>
                                        ) : (
                                            <Badge tone="sky">Akun dipakai ulang</Badge>
                                        )}
                                        {row.created && row.password && waLink ? (
                                            <a
                                                href={waLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={buttonClass(
                                                    'primary',
                                                    'bg-emerald px-3 py-2 text-xs hover:brightness-95',
                                                )}
                                            >
                                                <MessageCircle className="h-4 w-4" /> Kirim via WhatsApp
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            ) : null}

            <Card className="mb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        {member.photo_url ? (
                            <img
                                src={member.photo_url}
                                alt={member.full_name}
                                className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
                            />
                        ) : (
                            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-lime/30 text-xl font-extrabold text-ink">
                                {member.full_name.charAt(0).toUpperCase()}
                            </span>
                        )}
                        <div className="min-w-0">
                            <h2 className="text-lg font-extrabold text-ink">{member.full_name}</h2>
                            <p className="text-sm text-slate">
                                {member.nickname ? `${member.nickname} · ` : ''}
                                {member.member_code ?? '-'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge tone="lime">{levelLabel[member.level] ?? member.level}</Badge>
                                <StatusBadge status={member.status} />
                                {member.age ? <Badge>{member.age} th</Badge> : null}
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Link href={`/members/${member.id}/edit`} className={buttonClass('ghost', 'px-3 py-2')}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                        <button type="button" onClick={remove} className={buttonClass('ghost', 'px-3 py-2 text-rose')}>
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <SectionTitle>Profil</SectionTitle>
                    <Row label="Panggilan" value={member.nickname} />
                    <Row label="Jenis kelamin" value={member.gender === 'male' ? 'Laki-laki' : member.gender === 'female' ? 'Perempuan' : null} />
                    <Row label="Tanggal lahir" value={formatDate(member.birth_date)} />
                    <Row label="Sekolah" value={[member.education_level, member.grade_class, member.school_name].filter(Boolean).join(' · ')} />
                    <Row label="Kota" value={member.city} />
                    <Row label="Alamat" value={member.address} />
                    <Row label="Bergabung" value={formatDate(member.joined_at)} />
                    <Row label="Paket" value={member.package} />
                    <Row label="Lokasi" value={member.branch} />
                    <Row label="Pelatih utama" value={member.coach} />
                    <Row label="Kontak darurat" value={[member.emergency_name, member.emergency_phone].filter(Boolean).join(' · ')} />
                    <Row label="Alergi" value={member.allergy_notes} />
                    <Row label="Catatan kesehatan" value={member.health_notes} />
                    <Row label="Catatan" value={member.notes} />
                </Card>

                <div className="space-y-4">
                    <Card>
                        <SectionTitle>Wali ({guardians.length})</SectionTitle>
                        {guardians.length === 0 ? (
                            <p className="text-sm text-slate">Belum ada wali.</p>
                        ) : (
                            <div className="space-y-3">
                                {guardians.map((guardian) => (
                                    <div key={guardian.id} className="rounded-xl border border-line p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-semibold text-ink">{guardian.full_name}</p>
                                            {guardian.is_primary ? <Badge tone="emerald">Wali utama</Badge> : null}
                                        </div>
                                        <p className="text-xs text-slate">
                                            {relationLabel[guardian.relation] ?? guardian.relation} · {guardian.phone ?? '-'}
                                        </p>
                                        {guardian.email ? <p className="text-xs text-slate">{guardian.email}</p> : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card>
                        <SectionTitle>Riwayat absensi</SectionTitle>
                        {history.length === 0 ? (
                            <p className="text-sm text-slate">Belum ada riwayat.</p>
                        ) : (
                            <div className="divide-y divide-line">
                                {history.map((row) => (
                                    <div key={row.id} className="flex items-center justify-between gap-3 py-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-ink">{row.session_title ?? '-'}</p>
                                            <p className="text-xs text-slate">{formatDate(row.session_date)}</p>
                                        </div>
                                        <Badge tone={row.status === 'present' ? 'emerald' : row.status === 'absent' ? 'rose' : 'amber'}>
                                            {attendanceLabel[row.status] ?? row.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {can_assess && skill_options.length > 0 ? (
                        <Card>
                            <SectionTitle>Beri penilaian skill</SectionTitle>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-sm font-semibold text-ink">Skill</label>
                                    <select
                                        className="w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink"
                                        value={assessForm.data.skill_id}
                                        onChange={(event) => assessForm.setData('skill_id', event.target.value)}
                                    >
                                        <option value="">Pilih skill…</option>
                                        {skill_options.map((group) => (
                                            <optgroup key={group.id} label={group.name}>
                                                {group.skills.map((skill) => (
                                                    <option key={skill.id} value={skill.id}>
                                                        {skill.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {assessForm.errors.skill_id ? (
                                        <p className="mt-1 text-sm text-rose">{assessForm.errors.skill_id}</p>
                                    ) : null}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-ink">Nilai (1–5)</label>
                                    <select
                                        className="w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink"
                                        value={assessForm.data.score}
                                        onChange={(event) => assessForm.setData('score', event.target.value)}
                                    >
                                        <option value="1">1 · Perlu bimbingan</option>
                                        <option value="2">2 · Berkembang</option>
                                        <option value="3">3 · Cukup</option>
                                        <option value="4">4 · Baik</option>
                                        <option value="5">5 · Sangat baik</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-ink">Catatan terlihat</label>
                                    <select
                                        className="w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink"
                                        value={assessForm.data.note_visibility}
                                        onChange={(event) => assessForm.setData('note_visibility', event.target.value)}
                                    >
                                        <option value="parent">Orang tua & pelatih</option>
                                        <option value="internal">Internal pelatih</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-sm font-semibold text-ink">Catatan (opsional)</label>
                                    <input
                                        className="w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink"
                                        value={assessForm.data.note}
                                        onChange={(event) => assessForm.setData('note', event.target.value)}
                                        placeholder="mis. servis makin konsisten"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                className={buttonClass('primary', 'mt-3 w-full')}
                                disabled={assessForm.processing}
                                onClick={submitAssessment}
                            >
                                <Sparkles className="h-4 w-4" />
                                {assessForm.processing ? 'Menyimpan…' : 'Simpan penilaian'}
                            </button>
                        </Card>
                    ) : null}

                    <Card>
                        <SectionTitle>Progres skill</SectionTitle>
                        {skills.has_data ? (
                            <>
                                <div className="flex items-end justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-slate">Nilai keseluruhan · {skills.latest_period}</p>
                                        <p className="text-2xl font-extrabold tabular-nums text-ink">{skills.overall}</p>
                                    </div>
                                    <span className="text-xs font-bold text-slate">
                                        {skills.overall_delta ? `${skills.overall_delta > 0 ? '+' : ''}${skills.overall_delta}` : ''}
                                    </span>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {(skills.categories ?? []).map((category) => (
                                        <div key={category.name}>
                                            <div className="mb-1 flex justify-between text-sm">
                                                <span className="truncate text-slate">{category.name}</span>
                                                <span className="font-semibold tabular-nums text-ink">{category.score}</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-surface">
                                                <span className="block h-full rounded-full bg-lime" style={{ width: `${(category.score / 5) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-slate">Belum ada penilaian skill.</p>
                        )}
                    </Card>

                    <Card>
                        <SectionTitle>Keuangan</SectionTitle>
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-slate">Tunggakan</span>
                            <span className="font-bold tabular-nums text-ink">{formatRupiah(finance.outstanding)}</span>
                        </div>
                        {finance.invoices.length === 0 ? (
                            <p className="text-sm text-slate">Belum ada tagihan.</p>
                        ) : (
                            <div className="divide-y divide-line">
                                {finance.invoices.map((invoice) => (
                                    <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="flex items-center justify-between gap-3 py-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-ink">{invoice.number}</p>
                                            <p className="text-xs text-slate">{formatDate(invoice.period_start)}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <span className="font-semibold tabular-nums text-ink">{formatRupiah(invoice.total)}</span>
                                            <StatusBadge status={invoice.status} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
