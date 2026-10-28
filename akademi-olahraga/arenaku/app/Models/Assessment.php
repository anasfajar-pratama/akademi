<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assessment extends Model
{
    use BelongsToAcademy, HasFactory;

    protected $fillable = [
        'academy_id',
        'member_id',
        'skill_id',
        'attendance_session_id',
        'assessed_by',
        'score',
        'note',
        'note_visibility',
        'period',
        'assessed_at',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'assessed_at' => 'date',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class, 'attendance_session_id');
    }

    public function assessor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assessed_by');
    }

    /**
     * Rata-rata skor per kategori skill untuk seorang member pada periode tertentu.
     *
     * @return array<int, array{category: string, score: float, weight: float}>
     */
    public static function categoryScores(int $memberId, ?string $period = null): array
    {
        $rows = static::query()
            ->where('member_id', $memberId)
            ->when($period, fn ($query) => $query->where('period', $period))
            ->with('skill.category:id,name,weight')
            ->get();

        return $rows
            ->groupBy(fn (Assessment $assessment) => $assessment->skill?->category?->name ?? 'Lainnya')
            ->map(fn ($group, $category) => [
                'category' => $category,
                'score' => round($group->avg('score'), 2),
                'weight' => (float) ($group->first()->skill?->category?->weight ?? 1),
            ])
            ->values()
            ->all();
    }
}
