import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import ScheduleForm, { emptySchedule, type Option, type ScheduleFormData } from '@/Components/ScheduleForm';
import { buttonClass } from '@/Components/ui';

export default function SchedulesCreate({
    branches,
    packages,
    coaches,
}: {
    branches: Option[];
    packages: Option[];
    coaches: Option[];
}) {
    const { data, setData, post, processing, errors } = useForm<ScheduleFormData>(emptySchedule());

    const onChange = (field: keyof ScheduleFormData, value: string) => setData(field, value);

    return (
        <AppLayout title="Buat Jadwal">
            <Head title="Buat Jadwal" />
            <Link href="/schedules" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Jadwal
            </Link>

            <ScheduleForm data={data} errors={errors} onChange={onChange} branches={branches} packages={packages} coaches={coaches} />

            <div className="mt-5">
                <button type="button" className={buttonClass('secondary', 'w-full')} disabled={processing} onClick={() => post('/schedules')}>
                    <Check className="h-4 w-4" /> {processing ? 'Menyimpan…' : 'Simpan jadwal'}
                </button>
            </div>
        </AppLayout>
    );
}
