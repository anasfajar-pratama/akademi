import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, MapPin, TrendingDown, TrendingUp } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, SectionTitle, StatusBadge } from '@/Components/ui';
import { attendanceLabel, cn, formatDate, formatDateTime, formatRupiah, levelLabel } from '@/lib/utils';

interface Attendance {
    present: number;
    late: number;
    permitted: number;
    sick: number;
    absent: number;
    total: number;
    rate: number;
}

interface SkillCategoryScore {
    name: string;
    score: number;
    delta: number | null;
}

interface SkillScore {
    name: string | null;
    category: string | null;
    score: number;
    delta: number | null;
    note: string | null;
    date: string | null;
}

interface SkillProgress {
    has_data: boolean;
    latest_period?: string;
    previous_period?: string | null;
    overall?: number;
    overall_delta?: number | null;
    categories?: SkillCategoryScore[];
    skills?: SkillScore[];
    assessed_count?: number;
}

interface Upcoming {
    id: number;
    title: string;
    type: string;
    starts_at: string | null;
    location: string | null;
    maps_url: string | null;
}

interface History {
    id: number;
    status: string;
    session_title: string | null;
    session_date: string | null;
}

interface InvoiceRow {
    id: number;
    number: string;
    period_start: string | null;
    due_date: string | null;
    total: number;
    paid_amount: number;
    outstanding: number;
    status: string;
}

interface Invoices {
    outstanding: number;
    items: InvoiceRow[];
}

interface MemberInfo {
    id: number;
    full_name: string;
    nickname: string | null;
    member_code: string | null;
    level: string;
    status: string;
    age: number | null;
    package: string | null;
    branch: string | null;
    coach: string | null;
}

function Delta({ value }: { value: number | null | undefined }) {
    if (value === null || value === undefined || value === 0) {
        return null;
    }

    const up = value > 0;

    return (
        <span className={cn('inline-flex items-center gap-0.5 text-xs font-bold', up ? 'text-emerald' : 'text-rose')}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {up ? '+' : ''}
            {value}
        </span>
    );
}

export default function PortalChild({
    member,
    attendance,
    skills,
    invoices,
    upcoming,
    history,
}: {
    member: MemberInfo;
    attendance: Attendance;
    skills: SkillProgress;
    invoices: Invoices;
    upcoming: Upcoming[];
    history: History[];
}) {
    const stats = [
        { key: 'present', label: 'Hadir', tone: 'emerald' },
        { key: 'late', label: 'Terlambat', tone: 'amber' },
        { key: 'permitted', label: 'Izin', tone: 'sky' },
        { key: 'sick', label: 'Sakit', tone: 'amber' },
        { key: 'absent', label: 'Alpa', tone: 'rose' },
    ] as const;

    return (
        <AppLayout title={member.full_name}>
            <Head title={member.full_name} />
            <Link href="/portal" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Anak saya
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
                    <div className="shrink-0 text-center">
                        <p className="text-3xl font-extrabold tabular-nums text-emerald">{attendance.rate}%</p>
                        <p className="text-[11px] text-slate">kehadiran</p>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate">
                    <p>Paket: <span className="font-semibold text-ink">{member.package ?? '-'}</span></p>
                    <p>Lokasi: <span className="font-semibold text-ink">{member.branch ?? '-'}</span></p>
                    <p>Pelatih: <span className="font-semibold text-ink">{member.coach ?? '-'}</span></p>
                    <p>Total sesi: <span className="font-semibold text-ink">{attendance.total}</span></p>
                </div>
            </Card>

            {skills.has_data ? (
                <>
                    <Card className="mb-4">
                        <SectionTitle>Perkembangan skill</SectionTitle>
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <p className="text-xs text-slate">Nilai keseluruhan · {skills.latest_period}</p>
                                <p className="text-3xl font-extrabold tabular-nums text-ink">{skills.overall}</p>
                                <p className="text-[11px] text-slate">dari skala 5</p>
                            </div>
                            <div className="text-right">
                                <Delta value={skills.overall_delta} />
                                {skills.previous_period ? (
                                    <p className="text-[11px] text-slate">vs {skills.previous_period}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            {(skills.categories ?? []).map((category) => (
                                <div key={category.name}>
                                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                                        <span className="truncate text-slate">{category.name}</span>
                                        <span className="flex shrink-0 items-center gap-2">
                                            <Delta value={category.delta} />
                                            <span className="font-bold tabular-nums text-ink">{category.score}</span>
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-surface">
                                        <span
                                            className="block h-full rounded-full bg-lime"
                                            style={{ width: `${(category.score / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="mb-4">
                        <SectionTitle>Nilai per skill ({skills.skills?.length ?? 0})</SectionTitle>
                        <p className="mb-2 text-xs text-slate">
                            Diisi pelatih · total {skills.assessed_count} penilaian
                        </p>
                        <div className="divide-y divide-line">
                            {(skills.skills ?? []).map((skill) => (
                                <div key={skill.name} className="flex items-start justify-between gap-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">{skill.name ?? '-'}</p>
                                        <p className="text-xs text-slate">
                                            {skill.category ?? '-'}
                                            {skill.date ? ` · ${formatDate(skill.date)}` : ''}
                                        </p>
                                        {skill.note ? (
                                            <p className="mt-1 text-xs italic text-slate">“{skill.note}”</p>
                                        ) : null}
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xl font-extrabold tabular-nums text-ink">{skill.score}</p>
                                        <Delta value={skill.delta} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </>
            ) : (
                <Card className="mb-4">
                    <SectionTitle>Perkembangan skill</SectionTitle>
                    <p className="text-sm text-slate">
                        Belum ada penilaian skill dari pelatih untuk saat ini.
                    </p>
                </Card>
            )}

            <Card className="mb-4">
                <SectionTitle>Rekap kehadiran</SectionTitle>
                <div className="grid grid-cols-5 gap-2">
                    {stats.map((stat) => (
                        <div key={stat.key} className="rounded-xl bg-surface p-2 text-center">
                            <p className="text-lg font-extrabold tabular-nums text-ink">{attendance[stat.key]}</p>
                            <p className="text-[10px] font-medium text-slate">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="mb-4">
                <SectionTitle>Tagihan</SectionTitle>
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-slate">Total tunggakan</span>
                    <span className="font-bold tabular-nums text-ink">{formatRupiah(invoices.outstanding)}</span>
                </div>
                {invoices.items.length === 0 ? (
                    <p className="text-sm text-slate">Belum ada tagihan.</p>
                ) : (
                    <div className="divide-y divide-line">
                        {invoices.items.map((invoice) => (
                            <div key={invoice.id} className="flex items-center justify-between gap-3 py-2.5">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">{invoice.number}</p>
                                    <p className="text-xs text-slate">Jatuh tempo {formatDate(invoice.due_date)}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <span className="font-semibold tabular-nums text-ink">{formatRupiah(invoice.total)}</span>
                                    <StatusBadge status={invoice.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <p className="mt-3 text-[11px] text-slate">
                    Konfirmasi pembayaran dilakukan ke admin akademi. Upload bukti bayar menyusul.
                </p>
            </Card>

            <Card className="mb-4">
                <SectionTitle>Jadwal terdekat</SectionTitle>
                {upcoming.length === 0 ? (
                    <p className="text-sm text-slate">Belum ada jadwal.</p>
                ) : (
                    <div className="space-y-2">
                        {upcoming.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
                                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-ink">{item.title}</p>
                                    <p className="text-xs text-slate">{formatDateTime(item.starts_at)}</p>
                                    {item.location ? (
                                        <p className="mt-1 flex items-center gap-1 text-xs text-slate">
                                            <MapPin className="h-3 w-3" /> {item.location}
                                        </p>
                                    ) : null}
                                </div>
                                <StatusBadge status={item.type} />
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
                            <div key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">{row.session_title ?? '-'}</p>
                                    <p className="text-xs text-slate">{formatDate(row.session_date)}</p>
                                </div>
                                <Badge
                                    tone={
                                        row.status === 'present'
                                            ? 'emerald'
                                            : row.status === 'absent'
                                              ? 'rose'
                                              : 'amber'
                                    }
                                >
                                    {attendanceLabel[row.status] ?? row.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </AppLayout>
    );
}
