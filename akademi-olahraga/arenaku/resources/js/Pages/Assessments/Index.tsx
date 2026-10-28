import { Head, Link } from '@inertiajs/react';
import { ClipboardCheck, PenLine } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, EmptyState, SectionTitle, buttonClass } from '@/Components/ui';
import { formatDate } from '@/lib/utils';

interface SessionRow {
    id: number;
    title: string;
    session_date: string | null;
    attendance_filled: boolean;
    present_count: number;
    assessed_count: number;
}

export default function AssessmentsIndex({ sessions }: { sessions: SessionRow[] }) {
    return (
        <AppLayout title="Penilaian Skill">
            <Head title="Penilaian Skill" />

            <SectionTitle>Pilih sesi untuk dinilai</SectionTitle>
            <p className="mb-4 text-sm text-slate">
                Absensi harus disimpan lebih dulu. Setelah itu barulah nilai skill bisa diisi.
            </p>

            {sessions.length === 0 ? (
                <EmptyState title="Belum ada sesi" description="Buka sesi dari menu Jadwal Saya untuk memulai absensi." />
            ) : (
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <Card key={session.id} className="py-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-ink">{session.title}</p>
                                    <p className="text-xs text-slate">{formatDate(session.session_date)}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Badge tone={session.attendance_filled ? 'emerald' : 'amber'}>
                                            {session.attendance_filled ? 'Absensi terisi' : 'Absensi belum'}
                                        </Badge>
                                        <Badge tone="sky">{session.present_count} hadir</Badge>
                                        <Badge tone={session.assessed_count > 0 ? 'lime' : 'neutral'}>
                                            {session.assessed_count} nilai
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3">
                                {session.attendance_filled ? (
                                    <Link href={`/assessments/${session.id}`} className={buttonClass('secondary', 'w-full')}>
                                        <PenLine className="h-4 w-4" /> Isi penilaian skill
                                    </Link>
                                ) : (
                                    <Link href={`/coach/sessions/${session.id}`} className={buttonClass('primary', 'w-full')}>
                                        <ClipboardCheck className="h-4 w-4" /> Isi absensi dulu
                                    </Link>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
