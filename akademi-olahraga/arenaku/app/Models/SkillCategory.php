<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SkillCategory extends Model
{
    use HasFactory;

    protected $fillable = ['sport_id', 'name', 'weight', 'sort_order'];

    protected function casts(): array
    {
        return ['weight' => 'float'];
    }

    public function sport(): BelongsTo
    {
        return $this->belongsTo(Sport::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }
}
