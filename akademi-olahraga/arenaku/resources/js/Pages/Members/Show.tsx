import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, SectionTitle, StatusBadge, buttonClass } from '@/Components/ui';
import { attendanceLabel, formatDate, formatRupiah, levelLabel } from '@/lib/utils';

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
}: {
    member: MemberInfo;
    guardians: GuardianInfo[];
    history: HistoryRow[];
    skills: SkillSummary;
    finance: Finance;
}) {
    const remove = () => {
        if (confirm(`Hapus member ${member.full_name}?`)) {
            router.delete(`/members/${member.id}`);
        }
    };

    return (
        <AppLayout title={member.full_name}>
            <Head title={member.full_name} />
            <Link href="/members" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Member
            </Link>

            <Card className="mb-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
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
