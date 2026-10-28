<?php

namespace App\Http\Controllers;

use App\Enums\AcademyRole;
use App\Models\Assessment;
use App\Models\AttendanceSession;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SkillAssessmentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Assessment::class);

        $user = $request->user();
        $current = app(CurrentAcademy::class);
        $role = $current->check() ? $user->roleIn($current->get()) : null;

        $sessions = AttendanceSession::query()
            ->when($role === AcademyRole::Coach && ! $user->is_super_admin,
                fn ($query) => $query->where('coach_id', $user->id))
            ->withCount([
                'attendances as present_count' => fn ($query) => $query->whereIn('status', ['present', 'late']),
                'assessments as assessed_count',
            ])
            ->latest('session_date')
            ->limit(25)
            ->get()
            ->map(fn (AttendanceSession $session) => [
                'id' => $session->id,
                'title' => $session->title,
                'session_date' => $session->session_date?->toDateString(),
                'attendance_filled' => $session->attendanceFilled(),
                'present_count' => $session->present_count,
                'assessed_count' => $session->assessed_count,
            ]);

        return Inertia::render('Assessments/Index', [
            'sessions' => $sessions,
        ]);
    }

    public function show(Request $request, AttendanceSession $session): Response|RedirectResponse
    {
        $this->authorize('assess', $session);

        if (! $session->attendanceFilled()) {
            return redirect()
                ->route('coach.attendance', $session)
                ->with('error', 'Isi dan simpan absensi sesi ini dulu sebelum menilai skill.');
        }

        $roster = $this->roster($session);

        return Inertia::render('Assessments/Show', [
            'session' => [
                'id' => $session->id,
                'title' => $session->title,
                'session_date' => $session->session_date?->toDateString(),
                'period' => $session->session_date?->format('Y-m'),
            ],
            'members' => $roster,
            'categories' => $this->categories(),
            'existing' => $this->existingScores($session, $roster),
        ]);
    }

    public function update(Request $request, AttendanceSession $session): RedirectResponse
    {
        $this->authorize('assess', $session);

        if (! $session->attendanceFilled()) {
            return back()->with('error', 'Absensi belum diisi untuk sesi ini.');
        }

        $data = $request->validate([
            'scores' => ['required', 'array'],
            'scores.*' => ['array'],
            'scores.*.*' => ['nullable', 'integer', 'min:1', 'max:5'],
            'notes' => ['array'],
            'notes.*' => ['nullable', 'string', 'max:500'],
            'notes_visibility' => ['array'],
            'notes_visibility.*' => ['nullable', 'in:internal,parent'],
        ]);

        $rosterIds = collect($this->roster($session))->pluck('id')->all();
        $validSkillIds = Skill::query()->pluck('id')->all();
        $period = $session->session_date?->format('Y-m') ?? now()->format('Y-m');

        $saved = 0;

        foreach ($data['scores'] as $memberId => $skills) {
            if (! in_array((int) $memberId, $rosterIds, true)) {
                continue;
            }

            $note = $data['notes'][$memberId] ?? null;
            $noteVisibility = $data['notes_visibility'][$memberId] ?? 'parent';

            foreach ((array) $skills as $skillId => $score) {
                if ($score === null || $score === '' || ! in_array((int) $skillId, $validSkillIds, true)) {
                    continue;
                }

                Assessment::updateOrCreate(
                    [
                        'attendance_session_id' => $session->id,
                        'member_id' => (int) $memberId,
                        'skill_id' => (int) $skillId,
                    ],
                    [
                        'academy_id' => $session->academy_id,
                        'assessed_by' => $request->user()->id,
                        'score' => (int) $score,
                        'note' => $note,
                        'note_visibility' => $noteVisibility,
                        'period' => $period,
                        'assessed_at' => $session->session_date ?? today(),
                    ],
                );

                $saved++;
            }
        }

        return redirect()
            ->route('assessments.index')
            ->with('success', $saved.' nilai skill tersimpan.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function roster(AttendanceSession $session): array
    {
        return $session->attendances()
            ->whereIn('status', ['present', 'late'])
            ->with('member:id,full_name,member_code,level')
            ->get()
            ->map(fn ($attendance) => [
                'id' => $attendance->member_id,
                'full_name' => $attendance->member?->full_name ?? '-',
                'member_code' => $attendance->member?->member_code,
                'level' => $attendance->member?->level,
            ])
            ->sortBy('full_name')
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function categories(): array
    {
        $sportId = app(CurrentAcademy::class)->get()->sport_id;

        return SkillCategory::query()
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
                ])->all(),
            ])
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $roster
     * @return array<int, array{member_id: int, skill_id: int, score: int, note: ?string}>
     */
    protected function existingScores(AttendanceSession $session, array $roster): array
    {
        return Assessment::query()
            ->where('attendance_session_id', $session->id)
            ->whereIn('member_id', collect($roster)->pluck('id')->all())
            ->get(['member_id', 'skill_id', 'score', 'note', 'note_visibility'])
            ->map(fn (Assessment $assessment) => [
                'member_id' => $assessment->member_id,
                'skill_id' => $assessment->skill_id,
                'score' => $assessment->score,
                'note' => $assessment->note,
                'note_visibility' => $assessment->note_visibility,
            ])
            ->all();
    }
}
