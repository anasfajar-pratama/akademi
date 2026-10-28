import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ClipboardCheck, MapPin } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, EmptyState, SectionTitle, StatusBadge } from '@/Components/ui';
import { formatDateTime } from '@/lib/utils';

interface ScheduleRow {
    id: number;
    title: string;
    type: string;
    status: string;
    starts_at: string | null;
    location: string | null;
    session_id: number | null;
}

interface SessionRow {
    id: number;
    title: string;
    session_date: string | null;
    attended: number;
}

export default function CoachIndex({
    schedules,
    openSessions,
}: {
    schedules: ScheduleRow[];
    openSessions: SessionRow[];
}) {
    return (
        <AppLayout title="Jadwal Saya">
            <Head title="Jadwal Saya" />

            {openSessions.length > 0 ? (
                <div className="mb-5">
                    <SectionTitle>Sesi terbuka</SectionTitle>
                    <div className="space-y-2">
                        {openSessions.map((session) => (
                            <Link key={session.id} href={`/coach/sessions/${session.id}`}>
                                <Card className="flex items-center justify-between gap-3 border-lime/60 bg-lime/10 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-ink">{session.title}</p>
                                        <p className="text-xs text-slate">{session.session_date} · {session.attended} tercatat</p>
                                    </div>
                                    <ClipboardCheck className="h-5 w-5 shrink-0 text-ink" />
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}

            <SectionTitle>Jadwal mendatang</SectionTitle>
            {schedules.length === 0 ? (
                <EmptyState title="Belum ada jadwal" description="Jadwal yang ditugaskan ke Anda akan muncul di sini." />
            ) : (
                <div className="space-y-2">
                    {schedules.map((schedule) => (
                        <Card key={schedule.id} className="flex items-start gap-3">
                            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate font-semibold text-ink">{schedule.title}</p>
                                    <StatusBadge status={schedule.type} />
                                </div>
                                <p className="text-xs text-slate">{formatDateTime(schedule.starts_at)}</p>
                                {schedule.location ? (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate">
                                        <MapPin className="h-3 w-3" /> {schedule.location}
                                    </p>
                                ) : null}
                                {schedule.session_id ? (
                                    <Link
                                        href={`/coach/sessions/${schedule.session_id}`}
                                        className="mt-2 inline-block text-xs font-semibold text-ink underline"
                                    >
                                        Buka absensi
                                    </Link>
                                ) : null}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
