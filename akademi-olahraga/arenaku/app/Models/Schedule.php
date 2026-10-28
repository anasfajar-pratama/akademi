<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    use BelongsToAcademy, HasFactory;

    protected $fillable = [
        'academy_id',
        'branch_id',
        'package_id',
        'type',
        'title',
        'coach_id',
        'starts_at',
        'ends_at',
        'location_name',
        'address',
        'latitude',
        'longitude',
        'maps_url',
        'opponent_name',
        'opponent_note',
        'status',
        'is_recurring',
        'recurrence_rule',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_recurring' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
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

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class);
    }
}
