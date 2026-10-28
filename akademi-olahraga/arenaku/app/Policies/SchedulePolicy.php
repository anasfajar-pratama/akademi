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
            || in_array($this->roleIn($user), [AcademyRole::Admin, AcademyRole::Coach], true);
    }

    public function create(User $user): bool
    {
        return $user->is_super_admin || $this->roleIn($user) === AcademyRole::Admin;
    }

    public function update(User $user, Schedule $schedule): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        return $schedule->academy_id === app(CurrentAcademy::class)->id()
            && $this->roleIn($user) === AcademyRole::Admin;
    }

    public function delete(User $user, Schedule $schedule): bool
    {
        return $this->update($user, $schedule);
    }
}
