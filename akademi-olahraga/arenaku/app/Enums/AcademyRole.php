<?php

namespace App\Enums;

enum AcademyRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case Coach = 'coach';
    case Parent = 'parent';
    case Member = 'member';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Admin Akademi',
            self::Coach => 'Pelatih',
            self::Parent => 'Orang Tua',
            self::Member => 'Member',
        };
    }

    /** Roles that can be assigned inside one academy. */
    public static function perAcademy(): array
    {
        return [self::Admin, self::Coach, self::Parent, self::Member];
    }
}
