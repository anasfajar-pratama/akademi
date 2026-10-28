import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, SectionTitle, buttonClass } from '@/Components/ui';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types';

type Status = 'present' | 'late' | 'permitted' | 'sick' | 'absent';

interface RosterRow {
    member_id: number;
    full_name: string;
    member_code: string | null;
    level: string;
    status: Status | null;
}

interface SessionInfo {
    id: number;
    title: string;
    session_date: string | null;
    status: string;
    attendance_filled: boolean;
}

const statuses: { value: Status; label: string; tone: string }[] = [
    { value: 'present', label: 'Hadir', tone: 'bg-emerald text-white' },
    { value: 'late', label: 'Telat', tone: 'bg-amber text-white' },
    { value: 'permitted', label: 'Izin', tone: 'bg-sky text-white' },
    { value: 'sick', label: 'Sakit', tone: 'bg-amber text-white' },
    { value: 'absent', label: 'Alpa', tone: 'bg-rose text-white' },
];

export default function CoachAttendance({ session, roster }: { session: SessionInfo; roster: RosterRow[] }) {
    const { flash } = usePage<PageProps>().props;
    const [state, setState] = useState<Record<number, Status | null>>(() =>
        Object.fromEntries(roster.map((row) => [row.member_id, row.status])) as Record<number, Status | null>,
    );
    const [processing, setProcessing] = useState(false);

    const summary = useMemo(() => {
        const values = Object.values(state);
        const marked = values.filter(Boolean).length;

        return { marked, total: roster.length };
    }, [state, roster.length]);

    const setStatus = (memberId: number, status: Status) =>
        setState((current) => ({ ...current, [memberId]: status }));

    const save = () => {
        const attendance = Object.entries(state)
            .filter(([, status]) => status !== null)
            .map(([memberId, status]) => ({ member_id: Number(memberId), status }));

        setProcessing(true);
        router.put(
            `/coach/sessions/${session.id}`,
            { attendance },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AppLayout title={session.title}>
            <Head title={`Absensi · ${session.title}`} />
            <Link href="/coach" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Jadwal saya
            </Link>

            <Card className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm text-slate">{session.session_date}</p>
                    <p className="font-bold text-ink">
                        {summary.marked}/{summary.total} tercatat
                    </p>
                </div>
                <Badge tone={session.status === 'open' ? 'emerald' : 'neutral'}>
                    {session.status === 'open' ? 'Sesi terbuka' : 'Sesi ditutup'}
                </Badge>
            </Card>

            <SectionTitle>Daftar member</SectionTitle>
            <div className="space-y-3">
                {roster.map((row) => (
                    <Card key={row.member_id} className="py-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-ink">{row.full_name}</p>
                                <p className="text-xs text-slate">{row.member_code ?? '-'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                            {statuses.map((status) => {
                                const active = state[row.member_id] === status.value;

                                return (
                                    <button
                                        key={status.value}
                                        type="button"
                                        onClick={() => setStatus(row.member_id, status.value)}
                                        className={cn(
                                            'rounded-xl py-2 text-xs font-semibold transition',
                                            active ? status.tone : 'bg-surface text-slate hover:bg-line',
                                        )}
                                    >
                                        {status.label}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-5 space-y-3">
                <button type="button" className={buttonClass('secondary', 'w-full')} disabled={processing} onClick={save}>
                    <Check className="h-4 w-4" /> {processing ? 'Menyimpan…' : 'Simpan absensi'}
                </button>

                {session.attendance_filled ? (
                    <Link href={`/assessments/${session.id}`} className={buttonClass('primary', 'w-full')}>
                        <Sparkles className="h-4 w-4" /> Lanjut isi penilaian skill
                    </Link>
                ) : (
                    <p className="text-center text-xs text-slate">
                        Simpan absensi dulu — setelah itu tombol penilaian skill akan aktif.
                    </p>
                )}
            </div>

            {flash?.success ? (
                <p className="mt-3 text-center text-sm font-semibold text-emerald">{flash.success}</p>
            ) : null}
        </AppLayout>
    );
}
