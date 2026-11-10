<?php

namespace App\Enums;

enum AcademyRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case AdminCoach = 'admin_coach';
    case Coach = 'coach';
    case Parent = 'parent';
    case Member = 'member';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Admin Akademi',
            self::AdminCoach => 'Admin & Pelatih',
            self::Coach => 'Pelatih',
            self::Parent => 'Orang Tua',
            self::Member => 'Member',
        };
    }

    public function isAdmin(): bool
    {
        return in_array($this, [self::Admin, self::AdminCoach], true);
    }

    public function isCoach(): bool
    {
        return in_array($this, [self::Coach, self::AdminCoach], true);
    }

    /** Roles that can be assigned inside one academy. */
    public static function perAcademy(): array
    {
        return [self::Admin, self::AdminCoach, self::Coach, self::Parent, self::Member];
    }
}
