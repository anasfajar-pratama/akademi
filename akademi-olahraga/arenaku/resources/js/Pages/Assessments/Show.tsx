import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, SectionTitle, buttonClass } from '@/Components/ui';
import { cn, formatDate } from '@/lib/utils';

interface Category {
    id: number;
    name: string;
    skills: { id: number; name: string }[];
}

interface MemberRow {
    id: number;
    full_name: string;
    member_code: string | null;
    level: string;
}

interface ExistingScore {
    member_id: number;
    skill_id: number;
    score: number;
    note: string | null;
    note_visibility: 'internal' | 'parent' | null;
}

interface SessionInfo {
    id: number;
    title: string;
    session_date: string | null;
    period: string;
}

const rubric = [
    { value: 1, label: 'Belum menguasai' },
    { value: 2, label: 'Dasar' },
    { value: 3, label: 'Cukup' },
    { value: 4, label: 'Baik' },
    { value: 5, label: 'Sangat baik' },
];

export default function AssessmentShow({
    session,
    members,
    categories,
    existing,
}: {
    session: SessionInfo;
    members: MemberRow[];
    categories: Category[];
    existing: ExistingScore[];
}) {
    const [selected, setSelected] = useState<number[]>(() =>
        Array.from(new Set(existing.map((row) => row.skill_id))),
    );

    const [scores, setScores] = useState<Record<number, Record<number, number | null>>>(() => {
        const map: Record<number, Record<number, number | null>> = {};

        existing.forEach((row) => {
            map[row.member_id] = { ...(map[row.member_id] ?? {}), [row.skill_id]: row.score };
        });

        return map;
    });

    const [notes, setNotes] = useState<Record<number, string>>(() => {
        const map: Record<number, string> = {};

        existing.forEach((row) => {
            if (row.note) {
                map[row.member_id] = row.note;
            }
        });

        return map;
    });

    const [notesVisibility, setNotesVisibility] = useState<Record<number, 'internal' | 'parent'>>(() => {
        const map: Record<number, 'internal' | 'parent'> = {};

        existing.forEach((row) => {
            if (row.note && row.note_visibility) {
                map[row.member_id] = row.note_visibility;
            }
        });

        return map;
    });

    const [processing, setProcessing] = useState(false);

    const skillLookup = useMemo(() => {
        const map = new Map<number, string>();

        categories.forEach((category) =>
            category.skills.forEach((skill) => map.set(skill.id, skill.name)),
        );

        return map;
    }, [categories]);

    const selectedSkills = selected.filter((id) => skillLookup.has(id));

    const filledCount = useMemo(
        () =>
            Object.values(scores).reduce(
                (total, perSkill) => total + Object.values(perSkill).filter((value) => value !== null).length,
                0,
            ),
        [scores],
    );

    const toggleSkill = (skillId: number) =>
        setSelected((current) =>
            current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
        );

    const setScore = (memberId: number, skillId: number, value: number) =>
        setScores((current) => ({
            ...current,
            [memberId]: { ...(current[memberId] ?? {}), [skillId]: value },
        }));

    const save = () => {
        setProcessing(true);
        router.put(
            `/assessments/${session.id}`,
            { scores, notes, notes_visibility: notesVisibility },
            { preserveScroll: true, onFinish: () => setProcessing(false) },
        );
    };

    return (
        <AppLayout title="Penilaian Skill">
            <Head title={`Penilaian · ${session.title}`} />
            <Link href="/assessments" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Daftar penilaian
            </Link>

            <Card className="mb-4">
                <p className="font-bold text-ink">{session.title}</p>
                <p className="text-sm text-slate">
                    {formatDate(session.session_date)} · periode {session.period}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="sky">{members.length} member hadir</Badge>
                    <Badge tone="lime">{filledCount} nilai terisi</Badge>
                </div>
            </Card>

            <Card className="mb-4">
                <SectionTitle>1. Pilih skill yang dinilai</SectionTitle>
                <p className="mb-3 text-sm text-slate">
                    Centang skill yang ingin dinilai sesi ini. Tidak perlu semua.
                </p>

                <div className="space-y-3">
                    {categories.map((category) => (
                        <div key={category.id}>
                            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate">{category.name}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {category.skills.map((skill) => {
                                    const active = selected.includes(skill.id);

                                    return (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            onClick={() => toggleSkill(skill.id)}
                                            className={cn(
                                                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                                                active ? 'bg-ink text-white' : 'border border-line bg-white text-slate',
                                            )}
                                        >
                                            {skill.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="mb-4">
                <SectionTitle>2. Beri nilai (1–5)</SectionTitle>

                {selectedSkills.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line p-4 text-sm text-slate">
                        Pilih minimal satu skill di atas untuk mulai menilai.
                    </p>
                ) : (
                    <>
                        <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate">
                            {rubric.map((item) => (
                                <span key={item.value}>
                                    <b className="text-ink">{item.value}</b> {item.label}
                                </span>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {members.map((member) => (
                                <div key={member.id} className="rounded-xl border border-line p-3">
                                    <p className="font-semibold text-ink">{member.full_name}</p>
                                    <p className="mb-2 text-xs text-slate">{member.member_code ?? '-'}</p>

                                    <div className="space-y-2">
                                        {selectedSkills.map((skillId) => (
                                            <div key={skillId} className="flex items-center justify-between gap-3">
                                                <span className="min-w-0 flex-1 truncate text-sm text-slate">
                                                    {skillLookup.get(skillId)}
                                                </span>
                                                <div className="flex shrink-0 gap-1">
                                                    {[1, 2, 3, 4, 5].map((value) => {
                                                        const active = scores[member.id]?.[skillId] === value;

                                                        return (
                                                            <button
                                                                key={value}
                                                                type="button"
                                                                onClick={() => setScore(member.id, skillId, value)}
                                                                className={cn(
                                                                    'h-9 w-9 rounded-lg text-sm font-bold transition',
                                                                    active
                                                                        ? 'bg-lime text-ink'
                                                                        : 'bg-surface text-slate hover:bg-line',
                                                                )}
                                                            >
                                                                {value}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <input
                                        className="mt-3 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-ink"
                                        placeholder="Catatan untuk member ini (opsional)"
                                        value={notes[member.id] ?? ''}
                                        onChange={(event) =>
                                            setNotes((current) => ({ ...current, [member.id]: event.target.value }))
                                        }
                                    />

                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-slate">Catatan terlihat oleh:</span>
                                        {(['parent', 'internal'] as const).map((value) => {
                                            const active = (notesVisibility[member.id] ?? 'parent') === value;

                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() =>
                                                        setNotesVisibility((current) => ({ ...current, [member.id]: value }))
                                                    }
                                                    className={cn(
                                                        'rounded-full px-3 py-1 text-xs font-semibold transition',
                                                        active
                                                            ? value === 'parent'
                                                                ? 'bg-lime text-ink'
                                                                : 'bg-ink text-white'
                                                            : 'border border-line bg-white text-slate',
                                                    )}
                                                >
                                                    {value === 'parent' ? 'Orang tua' : 'Internal'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            <button
                type="button"
                className={buttonClass('secondary', 'w-full')}
                disabled={processing || selectedSkills.length === 0}
                onClick={save}
            >
                <Check className="h-4 w-4" /> {processing ? 'Menyimpan…' : 'Simpan penilaian'}
            </button>
        </AppLayout>
    );
}
