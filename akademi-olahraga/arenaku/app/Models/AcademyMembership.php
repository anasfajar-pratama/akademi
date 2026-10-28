<?php

namespace App\Models;

use App\Enums\AcademyRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademyMembership extends Model
{
    use HasFactory;

    protected $table = 'academy_user';

    protected $fillable = [
        'academy_id',
        'user_id',
        'role',
        'joined_at',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'role' => AcademyRole::class,
            'is_active' => 'boolean',
            'joined_at' => 'datetime',
        ];
    }

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
