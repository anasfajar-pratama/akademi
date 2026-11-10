<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MemberRegistration extends Model
{
    use BelongsToAcademy, HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    protected $fillable = [
        'academy_id',
        'status',
        'full_name',
        'nickname',
        'gender',
        'birth_date',
        'education_level',
        'grade_class',
        'school_name',
        'address',
        'city',
        'postal_code',
        'photo_path',
        'branch_id',
        'package_id',
        'guardian_name',
        'guardian_relation',
        'guardian_phone',
        'guardian_email',
        'guardian_occupation',
        'guardian_address',
        'health_notes',
        'allergy_notes',
        'emergency_name',
        'emergency_phone',
        'notes',
        'admin_notes',
        'consent',
        'member_id',
        'guardian_id',
        'reviewed_by',
        'reviewed_at',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'consent' => 'boolean',
            'reviewed_at' => 'datetime',
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

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Guardian::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function photoUrl(): ?string
    {
        return $this->photo_path ? Storage::disk('public')->url($this->photo_path) : null;
    }

    public function age(): ?int
    {
        return $this->birth_date?->age;
    }
}
