import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import MemberForm, {
    emptyGuardian,
    emptyMember,
    type GuardianRow,
    type MemberFormData,
    type Option,
} from '@/Components/MemberForm';
import { buttonClass } from '@/Components/ui';

export default function MembersCreate({
    branches,
    packages,
    coaches,
}: {
    branches: Option[];
    packages: Option[];
    coaches: Option[];
}) {
    const { data, setData, post, processing, errors } = useForm<MemberFormData>(emptyMember());

    const onChange = (field: keyof MemberFormData, value: string) => setData(field, value as never);

    const onGuardianChange = (index: number, field: keyof GuardianRow, value: string | boolean) =>
        setData(
            'guardians',
            data.guardians.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
        );

    const submit = () => post('/members');

    return (
        <AppLayout title="Tambah Member">
            <Head title="Tambah Member" />
            <Link href="/members" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Member
            </Link>

            <MemberForm
                data={data}
                errors={errors}
                onChange={onChange}
                onGuardianChange={onGuardianChange}
                onAddGuardian={() => setData('guardians', [...data.guardians, emptyGuardian()])}
                onRemoveGuardian={(index) => setData('guardians', data.guardians.filter((_, i) => i !== index))}
                branches={branches}
                packages={packages}
                coaches={coaches}
            />

            <div className="mt-5">
                <button type="button" className={buttonClass('secondary', 'w-full')} disabled={processing} onClick={submit}>
                    <Check className="h-4 w-4" /> {processing ? 'Menyimpan…' : 'Simpan member'}
                </button>
            </div>
        </AppLayout>
    );
}
