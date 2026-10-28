<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sport extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'icon', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function academies(): HasMany
    {
        return $this->hasMany(Academy::class);
    }

    public function skillCategories(): HasMany
    {
        return $this->hasMany(SkillCategory::class);
    }
}
