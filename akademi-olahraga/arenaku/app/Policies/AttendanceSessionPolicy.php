<?php

namespace App\Policies;

use App\Enums\AcademyRole;
use App\Models\AttendanceSession;
use App\Models\User;
use App\Tenancy\CurrentAcademy;

class AttendanceSessionPolicy
{
    protected function role(User $user): ?AcademyRole
    {
        $current = app(CurrentAcademy::class);

        return $current->check() ? $user->roleIn($current->get()) : null;
    }

    public function view(User $user, AttendanceSession $session): bool
    {
        return $this->assess($user, $session);
    }

    /**
     * Boleh menilai skill untuk sesi ini: pelatih pemilik sesi, atau admin akademi.
     */
    public function assess(User $user, AttendanceSession $session): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        if ($session->academy_id !== app(CurrentAcademy::class)->id()) {
            return false;
        }

        if ($this->role($user) === AcademyRole::Admin) {
            return true;
        }

        return $session->coach_id === $user->id;
    }
}
