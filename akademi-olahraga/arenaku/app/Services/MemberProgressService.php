<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\Member;

class MemberProgressService
{
    /**
     * Ringkasan penilaian skill seorang member: skor terbaru per skill,
     * rata-rata per kategori (berbobot), dan delta vs periode sebelumnya.
     *
     * @return array<string, mixed>
     */
    public function summary(Member $member): array
    {
        $assessments = Assessment::query()
            ->where('member_id', $member->id)
            ->with(['skill:id,name,skill_category_id', 'skill.category:id,name,weight'])
            ->orderBy('assessed_at')
            ->orderBy('id')
            ->get();

        if ($assessments->isEmpty()) {
            return ['has_data' => false];
        }

        $categoryAverages = fn ($rows) => $rows
            ->groupBy(fn (Assessment $assessment) => $assessment->skill?->category?->name ?? 'Lainnya')
            ->map(fn ($group, $category) => [
                'name' => $category,
                'score' => round($group->avg('score'), 2),
                'weight' => (float) ($group->first()->skill?->category?->weight ?? 1),
            ]);

        $weighted = function ($categories) {
            $total = collect($categories)->sum('weight');

            return $total > 0
                ? round(collect($categories)->sum(fn ($c) => $c['score'] * $c['weight']) / $total, 2)
                : 0.0;
        };

        $byPeriod = $assessments->groupBy('period')->sortKeys();
        $periods = $byPeriod->keys()->values();

        $latestPeriod = (string) $periods->last();
        $previousPeriod = $periods->count() > 1 ? (string) $periods[$periods->count() - 2] : null;

        $latestCategories = $categoryAverages($byPeriod[$latestPeriod]);
        $previousCategories = $previousPeriod
            ? $categoryAverages($byPeriod[$previousPeriod])->keyBy('name')
            : collect();

        $categories = $latestCategories
            ->map(fn ($category) => [
                'name' => $category['name'],
                'score' => $category['score'],
                'delta' => $previousCategories->has($category['name'])
                    ? round($category['score'] - $previousCategories[$category['name']]['score'], 2)
                    : null,
            ])
            ->values()
            ->all();

        $overall = $weighted($latestCategories);
        $previousOverall = $previousPeriod ? $weighted($categoryAverages($byPeriod[$previousPeriod])) : null;

        $skills = $assessments
            ->groupBy('skill_id')
            ->map(function ($rows) {
                $rows = $rows->sortBy('assessed_at')->values();
                $latest = $rows->last();
                $before = $rows->count() > 1 ? $rows[$rows->count() - 2] : null;

                return [
                    'name' => $latest->skill?->name,
                    'category' => $latest->skill?->category?->name,
                    'score' => $latest->score,
                    'delta' => $before ? $latest->score - $before->score : null,
                    // Catatan bertanda "internal" tidak ditampilkan ke orang tua.
                    'note' => $latest->note_visibility === 'parent' ? $latest->note : null,
                    'date' => $latest->assessed_at?->toDateString(),
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();

        return [
            'has_data' => true,
            'latest_period' => $latestPeriod,
            'previous_period' => $previousPeriod,
            'overall' => $overall,
            'overall_delta' => $previousOverall !== null ? round($overall - $previousOverall, 2) : null,
            'categories' => $categories,
            'skills' => $skills,
            'assessed_count' => $assessments->count(),
        ];
    }
}
