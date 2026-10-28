<?php

namespace App\Services;

use App\Enums\AcademyRole;
use App\Models\Academy;
use Spatie\Permission\Models\Role;

class AcademyRoleProvisioner
{
    /**
     * Make sure the per-academy roles exist for the given academy (teams = academy_id).
     */
    public function ensureForAcademy(Academy $academy): void
    {
        $previous = getPermissionsTeamId();
        setPermissionsTeamId($academy->id);

        foreach (AcademyRole::perAcademy() as $role) {
            Role::findOrCreate($role->value, 'web');
        }

        setPermissionsTeamId($previous);
    }

    /**
     * Assign a role to a user scoped to one academy.
     */
    public function assign(Academy $academy, \App\Models\User $user, AcademyRole $role): void
    {
        $previous = getPermissionsTeamId();
        setPermissionsTeamId($academy->id);

        if (! $user->hasRole($role->value)) {
            $user->assignRole($role->value);
        }

        setPermissionsTeamId($previous);
    }
}
