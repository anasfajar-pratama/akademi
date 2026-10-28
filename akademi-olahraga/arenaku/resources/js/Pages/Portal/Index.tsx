import { Head, Link } from '@inertiajs/react';
import { ChevronRight, UserRound } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, SectionTitle, StatusBadge } from '@/Components/ui';

interface ChildRow {
    id: number;
    full_name: string;
    nickname: string | null;
    member_code: string | null;
    level: string;
    status: string;
    package: string | null;
    branch: string | null;
    attendance_summary: { rate: number; total: number };
}

export default function PortalIndex({ children }: { children: ChildRow[] }) {
    return (
        <AppLayout title="Anak Saya">
            <Head title="Anak Saya" />
            <SectionTitle>Pilih anak untuk melihat perkembangan</SectionTitle>

            <div className="space-y-3">
                {children.map((child) => (
                    <Link key={child.id} href={`/portal/children/${child.id}`}>
                        <Card className="flex items-center gap-3 transition hover:border-ink">
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-ink">
                                <UserRound className="h-6 w-6" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="truncate font-bold text-ink">{child.full_name}</p>
                                    <StatusBadge status={child.status} />
                                </div>
                                <p className="truncate text-xs text-slate">
                                    {child.package ?? 'Tanpa paket'}
                                    {child.branch ? ` · ${child.branch}` : ''}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-lg font-extrabold tabular-nums text-emerald">
                                    {child.attendance_summary.rate}%
                                </p>
                                <p className="text-[11px] text-slate">kehadiran</p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate" />
                        </Card>
                    </Link>
                ))}
            </div>
        </AppLayout>
    );
}
