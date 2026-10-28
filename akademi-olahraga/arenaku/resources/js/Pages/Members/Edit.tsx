import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import MemberForm, {
    emptyGuardian,
    type GuardianRow,
    type MemberFormData,
    type Option,
} from '@/Components/MemberForm';
import { buttonClass } from '@/Components/ui';

export default function MembersEdit({
    member,
    guardians,
    branches,
    packages,
    coaches,
}: {
    member: Partial<MemberFormData> & { id: number };
    guardians: GuardianRow[];
    branches: Option[];
    packages: Option[];
    coaches: Option[];
}) {
    const { data, setData, put, processing, errors } = useForm<MemberFormData>({
        full_name: member.full_name ?? '',
        nickname: member.nickname ?? '',
        gender: member.gender ?? '',
        birth_date: member.birth_date ?? '',
        education_level: member.education_level ?? '',
        grade_class: member.grade_class ?? '',
        school_name: member.school_name ?? '',
        address: member.address ?? '',
        city: member.city ?? '',
        postal_code: member.postal_code ?? '',
        joined_at: member.joined_at ?? '',
        level: member.level ?? 'beginner',
        status: member.status ?? 'trial',
        branch_id: member.branch_id ? String(member.branch_id) : '',
        package_id: member.package_id ? String(member.package_id) : '',
        primary_coach_id: member.primary_coach_id ? String(member.primary_coach_id) : '',
        health_notes: member.health_notes ?? '',
        allergy_notes: member.allergy_notes ?? '',
        emergency_name: member.emergency_name ?? '',
        emergency_phone: member.emergency_phone ?? '',
        source: member.source ?? '',
        notes: member.notes ?? '',
        guardians:
            guardians.length > 0
                ? guardians.map((guardian) => ({ ...guardian, email: guardian.email ?? '', occupation: guardian.occupation ?? '' }))
                : [emptyGuardian()],
    });

    const onChange = (field: keyof MemberFormData, value: string) => setData(field, value as never);

    const onGuardianChange = (index: number, field: keyof GuardianRow, value: string | boolean) =>
        setData(
            'guardians',
            data.guardians.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
        );

    const submit = () => put(`/members/${member.id}`);

    return (
        <AppLayout title={`Edit ${member.full_name ?? 'Member'}`}>
            <Head title="Edit Member" />
            <Link href={`/members/${member.id}`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Detail member
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
                    <Check className="h-4 w-4" /> {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                </button>
            </div>
        </AppLayout>
    );
}
