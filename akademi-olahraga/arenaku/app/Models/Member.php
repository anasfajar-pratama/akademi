<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use BelongsToAcademy, HasFactory, SoftDeletes;

    protected $fillable = [
        'academy_id',
        'branch_id',
        'package_id',
        'member_code',
        'full_name',
        'nickname',
        'photo_path',
        'gender',
        'birth_date',
        'education_level',
        'grade_class',
        'school_name',
        'address',
        'city',
        'postal_code',
        'joined_at',
        'level',
        'status',
        'primary_coach_id',
        'health_notes',
        'allergy_notes',
        'emergency_name',
        'emergency_phone',
        'source',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'joined_at' => 'date',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function primaryCoach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'primary_coach_id');
    }

    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(Guardian::class, 'member_guardian')
            ->withPivot('is_primary');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }

    public function age(): ?int
    {
        return $this->birth_date?->age;
    }
}
