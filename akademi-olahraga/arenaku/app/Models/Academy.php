<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Academy extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sport_id',
        'name',
        'slug',
        'owner_user_id',
        'logo_path',
        'brand_color',
        'address',
        'city',
        'phone',
        'email',
        'timezone',
        'currency',
        'settings',
        'status',
    ];

    protected function casts(): array
    {
        return ['settings' => 'array'];
    }

    public function sport(): BelongsTo
    {
        return $this->belongsTo(Sport::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(AcademyMembership::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'academy_user')
            ->withPivot(['role', 'is_active', 'joined_at'])
            ->withTimestamps();
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function packages(): HasMany
    {
        return $this->hasMany(Package::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }
}
