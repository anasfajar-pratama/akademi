<?php

namespace App\Policies;

use App\Enums\AcademyRole;
use App\Models\Schedule;
use App\Models\User;
use App\Tenancy\CurrentAcademy;

class SchedulePolicy
{
    protected function roleIn(User $user): ?AcademyRole
    {
        $current = app(CurrentAcademy::class);

        return $current->check() ? $user->roleIn($current->get()) : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->is_super_admin
            || in_array($this->roleIn($user), [
                AcademyRole::Admin,
                AcademyRole::AdminCoach,
                AcademyRole::Coach,
            ], true);
    }

    public function create(User $user): bool
    {
        return $user->is_super_admin || (bool) $this->roleIn($user)?->isAdmin();
    }

    public function update(User $user, Schedule $schedule): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        return $schedule->academy_id === app(CurrentAcademy::class)->id()
            && (bool) $this->roleIn($user)?->isAdmin();
    }

    public function delete(User $user, Schedule $schedule): bool
    {
        return $this->update($user, $schedule);
    }
}
