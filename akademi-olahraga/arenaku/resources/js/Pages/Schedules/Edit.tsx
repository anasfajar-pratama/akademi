import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import ScheduleForm, { type Option, type ScheduleFormData } from '@/Components/ScheduleForm';
import { buttonClass } from '@/Components/ui';

export default function SchedulesEdit({
    schedule,
    branches,
    packages,
    coaches,
}: {
    schedule: Partial<ScheduleFormData> & { id: number; title: string };
    branches: Option[];
    packages: Option[];
    coaches: Option[];
}) {
    const { data, setData, put, processing, errors } = useForm<ScheduleFormData>({
        title: schedule.title ?? '',
        type: schedule.type ?? 'training',
        status: schedule.status ?? 'draft',
        branch_id: schedule.branch_id ? String(schedule.branch_id) : '',
        package_id: schedule.package_id ? String(schedule.package_id) : '',
        coach_id: schedule.coach_id ? String(schedule.coach_id) : '',
        starts_at: schedule.starts_at ?? '',
        ends_at: schedule.ends_at ?? '',
        location_name: schedule.location_name ?? '',
        address: schedule.address ?? '',
        maps_url: schedule.maps_url ?? '',
        opponent_name: schedule.opponent_name ?? '',
        opponent_note: schedule.opponent_note ?? '',
        notes: schedule.notes ?? '',
    });

    const onChange = (field: keyof ScheduleFormData, value: string) => setData(field, value);

    return (
        <AppLayout title="Edit Jadwal">
            <Head title="Edit Jadwal" />
            <Link href="/schedules" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Jadwal
            </Link>

            <ScheduleForm data={data} errors={errors} onChange={onChange} branches={branches} packages={packages} coaches={coaches} />

            <div className="mt-5">
                <button type="button" className={buttonClass('secondary', 'w-full')} disabled={processing} onClick={() => put(`/schedules/${schedule.id}`)}>
                    <Check className="h-4 w-4" /> {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                </button>
            </div>
        </AppLayout>
    );
}
