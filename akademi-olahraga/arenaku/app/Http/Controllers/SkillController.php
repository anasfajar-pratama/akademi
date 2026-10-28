<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use App\Models\SkillCategory;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SkillController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Skill::class);

        $sportId = app(CurrentAcademy::class)->get()->sport_id;

        $categories = SkillCategory::query()
            ->where('sport_id', $sportId)
            ->with(['skills' => fn ($query) => $query->orderBy('sort_order')->orderBy('name')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (SkillCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'skills' => $category->skills->map(fn (Skill $skill) => [
                    'id' => $skill->id,
                    'name' => $skill->name,
                    'description' => $skill->description,
                ])->all(),
            ]);

        return Inertia::render('Skills/Index', [
            'categories' => $categories,
        ]);
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $this->authorize('create', Skill::class);

        $sportId = app(CurrentAcademy::class)->get()->sport_id;

        $data = $request->validate([
            'name' => [
                'required', 'string', 'max:80',
                Rule::unique('skill_categories', 'name')->where('sport_id', $sportId),
            ],
        ]);

        SkillCategory::create([
            'sport_id' => $sportId,
            'name' => $data['name'],
            'weight' => 1.00,
        ]);

        return back()->with('success', 'Kategori skill ditambahkan.');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Skill::class);

        $sportId = app(CurrentAcademy::class)->get()->sport_id;

        $data = $request->validate([
            'skill_category_id' => ['required', 'integer', 'exists:skill_categories,id'],
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        Skill::create([
            ...$data,
            'sport_id' => $sportId,
            'is_active' => true,
        ]);

        return back()->with('success', 'Skill ditambahkan.');
    }

    public function destroy(Skill $skill): RedirectResponse
    {
        $this->authorize('delete', $skill);

        $skill->delete();

        return back()->with('success', 'Skill dihapus.');
    }
}
