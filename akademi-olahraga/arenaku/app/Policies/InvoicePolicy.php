<?php

namespace App\Policies;

use App\Enums\AcademyRole;
use App\Models\Invoice;
use App\Models\User;
use App\Tenancy\CurrentAcademy;

class InvoicePolicy
{
    protected function isAdmin(User $user): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        $current = app(CurrentAcademy::class);

        return $current->check() && $user->hasRoleIn($current->get(), AcademyRole::Admin);
    }

    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $this->isAdmin($user) && $invoice->academy_id === app(CurrentAcademy::class)->id();
    }

    public function create(User $user): bool
    {
        return $this->isAdmin($user);
    }
}
