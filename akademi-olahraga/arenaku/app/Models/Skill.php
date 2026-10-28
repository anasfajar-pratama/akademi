<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Skill extends Model
{
    use BelongsToAcademy, HasFactory;

    protected $fillable = [
        'academy_id',
        'sport_id',
        'skill_category_id',
        'name',
        'description',
        'rubric',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'rubric' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(SkillCategory::class, 'skill_category_id');
    }

    public function sport(): BelongsTo
    {
        return $this->belongsTo(Sport::class);
    }
}
