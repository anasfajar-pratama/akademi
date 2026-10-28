import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, EmptyState, SectionTitle, buttonClass } from '@/Components/ui';

interface Category {
    id: number;
    name: string;
    skills: { id: number; name: string; description: string | null }[];
}

const input = 'w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink';
const label = 'mb-1 block text-sm font-semibold text-ink';

export default function SkillsIndex({ categories }: { categories: Category[] }) {
    const categoryForm = useForm({ name: '' });
    const skillForm = useForm({
        skill_category_id: categories[0] ? String(categories[0].id) : '',
        name: '',
        description: '',
    });

    const totalSkills = categories.reduce((total, category) => total + category.skills.length, 0);

    return (
        <AppLayout title="Skill">
            <Head title="Skill" />

            <SectionTitle>{totalSkills} skill dalam {categories.length} kategori</SectionTitle>
            <p className="mb-4 text-sm text-slate">
                Pelatih bisa menambah skill dan kategori baru sesuai kebutuhan akademi.
            </p>

            <div className="grid gap-4 lg:grid-cols-2">
                <div>
                    <Card className="mb-3">
                        <p className="mb-3 text-sm font-semibold text-ink">Tambah skill</p>
                        <div className="grid gap-3">
                            <div>
                                <label className={label}>Kategori</label>
                                <select
                                    className={input}
                                    value={skillForm.data.skill_category_id}
                                    onChange={(event) => skillForm.setData('skill_category_id', event.target.value)}
                                >
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {skillForm.errors.skill_category_id ? (
                                    <p className="mt-1 text-sm text-rose">{skillForm.errors.skill_category_id}</p>
                                ) : null}
                            </div>
                            <div>
                                <label className={label}>Nama skill</label>
                                <input
                                    className={input}
                                    value={skillForm.data.name}
                                    onChange={(event) => skillForm.setData('name', event.target.value)}
                                    placeholder="mis. Smash silang"
                                />
                                {skillForm.errors.name ? <p className="mt-1 text-sm text-rose">{skillForm.errors.name}</p> : null}
                            </div>
                            <div>
                                <label className={label}>Deskripsi (opsional)</label>
                                <input
                                    className={input}
                                    value={skillForm.data.description}
                                    onChange={(event) => skillForm.setData('description', event.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            className={buttonClass('primary', 'mt-3 w-full')}
                            disabled={skillForm.processing || categories.length === 0}
                            onClick={() => skillForm.post('/skills', { preserveScroll: true, onSuccess: () => skillForm.reset('name', 'description') })}
                        >
                            <Plus className="h-4 w-4" /> Tambah skill
                        </button>
                    </Card>

                    <Card>
                        <p className="mb-3 text-sm font-semibold text-ink">Tambah kategori</p>
                        <label className={label}>Nama kategori</label>
                        <input
                            className={input}
                            value={categoryForm.data.name}
                            onChange={(event) => categoryForm.setData('name', event.target.value)}
                            placeholder="mis. Kecepatan"
                        />
                        {categoryForm.errors.name ? <p className="mt-1 text-sm text-rose">{categoryForm.errors.name}</p> : null}
                        <button
                            type="button"
                            className={buttonClass('ghost', 'mt-3 w-full')}
                            disabled={categoryForm.processing}
                            onClick={() => categoryForm.post('/skills/categories', { preserveScroll: true, onSuccess: () => categoryForm.reset() })}
                        >
                            <Plus className="h-4 w-4" /> Tambah kategori
                        </button>
                    </Card>
                </div>

                <div>
                    <SectionTitle>Daftar skill</SectionTitle>
                    {categories.length === 0 ? (
                        <EmptyState title="Belum ada kategori skill" />
                    ) : (
                        <div className="space-y-3">
                            {categories.map((category) => (
                                <Card key={category.id}>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate">{category.name}</p>
                                    {category.skills.length === 0 ? (
                                        <p className="text-sm text-slate">Belum ada skill.</p>
                                    ) : (
                                        <div className="divide-y divide-line">
                                            {category.skills.map((skill) => (
                                                <div key={skill.id} className="flex items-center justify-between gap-3 py-2">
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-sm font-semibold text-ink">{skill.name}</span>
                                                        {skill.description ? (
                                                            <span className="block truncate text-xs text-slate">{skill.description}</span>
                                                        ) : null}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="text-rose"
                                                        onClick={() => router.delete(`/skills/${skill.id}`, { preserveScroll: true })}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
