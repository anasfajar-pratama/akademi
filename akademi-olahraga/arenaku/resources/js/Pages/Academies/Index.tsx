import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, EmptyState, SectionTitle, StatusBadge, buttonClass } from '@/Components/ui';

interface Academy {
    id: number;
    name: string;
    slug: string;
    sport: string | null;
    city: string | null;
    status: string;
    brand_color: string;
    members_count: number;
    users_count: number;
}

export default function AcademiesIndex({ academies }: { academies: Academy[] }) {
    return (
        <AppLayout title="Akademi">
            <Head title="Akademi" />
            <SectionTitle
                action={
                    <Link href="/academies/create" className={buttonClass('secondary', 'px-3 py-2')}>
                        <Plus className="h-4 w-4" /> Buat akademi
                    </Link>
                }
            >
                Daftar akademi
            </SectionTitle>

            {academies.length === 0 ? (
                <EmptyState title="Belum ada akademi" description="Mulai dengan membuat akademi pertama." />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {academies.map((academy) => (
                        <Link key={academy.id} href={`/academies/${academy.id}`}>
                            <Card className="transition hover:border-ink">
                                <div className="flex items-start gap-3">
                                    <span
                                        className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: academy.brand_color }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate font-bold text-ink">{academy.name}</p>
                                            <StatusBadge status={academy.status} />
                                        </div>
                                        <p className="text-xs text-slate">
                                            {academy.sport ?? '-'} · {academy.city ?? 'Tanpa kota'}
                                        </p>
                                        <p className="mt-2 text-xs font-medium text-slate">
                                            {academy.members_count} member · {academy.users_count} akun
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
