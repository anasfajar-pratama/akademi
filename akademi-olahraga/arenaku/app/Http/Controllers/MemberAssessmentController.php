<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\Member;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MemberAssessmentController extends Controller
{
    public function store(Request $request, Member $member): RedirectResponse
    {
        $this->authorize('assess', $member);

        $data = $request->validate([
            'skill_id' => [
                'required',
                'integer',
                Rule::exists('skills', 'id')->where(fn ($query) => $query
                    ->where('academy_id', $member->academy_id)
                    ->where('is_active', true)),
            ],
            'score' => ['required', 'integer', 'min:1', 'max:5'],
            'note' => ['nullable', 'string', 'max:500'],
            'note_visibility' => ['required', 'in:internal,parent'],
        ]);

        $period = now()->format('Y-m');

        $assessment = Assessment::query()
            ->where('member_id', $member->id)
            ->where('skill_id', $data['skill_id'])
            ->whereNull('attendance_session_id')
            ->where('period', $period)
            ->first();

        $attributes = [
            'academy_id' => $member->academy_id,
            'assessed_by' => $request->user()->id,
            'score' => $data['score'],
            'note' => $data['note'] ?? null,
            'note_visibility' => $data['note_visibility'],
            'period' => $period,
            'assessed_at' => today()->toDateString(),
        ];

        if ($assessment) {
            $assessment->update($attributes);
        } else {
            Assessment::create([
                'member_id' => $member->id,
                'skill_id' => $data['skill_id'],
                ...$attributes,
            ]);
        }

        return back()->with('success', 'Penilaian skill tersimpan.');
    }
}
