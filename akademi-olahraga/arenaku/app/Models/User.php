<?php

namespace App\Models;

use App\Enums\AcademyRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'avatar_path',
        'locale',
        'is_active',
        'is_super_admin',
        'must_change_password',
        'password_changed_at',
        'created_by',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'is_super_admin' => 'boolean',
            'must_change_password' => 'boolean',
            'password_changed_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(AcademyMembership::class);
    }

    public function activeMemberships(): HasMany
    {
        return $this->memberships()->where('is_active', true);
    }

    public function academies(): BelongsToMany
    {
        return $this->belongsToMany(Academy::class, 'academy_user')
            ->withPivot(['role', 'is_active', 'joined_at'])
            ->withTimestamps();
    }

    public function roleIn(Academy $academy): ?AcademyRole
    {
        $role = $this->memberships()
            ->where('academy_id', $academy->id)
            ->where('is_active', true)
            ->value('role');

        if ($role instanceof AcademyRole) {
            return $role;
        }

        return $role ? AcademyRole::tryFrom($role) : null;
    }

    public function belongsToAcademy(Academy $academy): bool
    {
        return $this->is_super_admin
            || $this->memberships()
                ->where('academy_id', $academy->id)
                ->where('is_active', true)
                ->exists();
    }

    public function hasRoleIn(Academy $academy, AcademyRole|string ...$roles): bool
    {
        if ($this->is_super_admin) {
            return true;
        }

        $current = $this->roleIn($academy);
        $allowed = array_map(
            fn ($role) => $role instanceof AcademyRole ? $role : AcademyRole::from($role),
            $roles
        );

        return $current !== null && in_array($current, $allowed, true);
    }

    public function initials(): string
    {
        $parts = preg_split('/\s+/', trim((string) $this->name)) ?: [];

        return strtoupper(mb_substr($parts[0] ?? '', 0, 1).mb_substr($parts[1] ?? '', 0, 1));
    }
}
