<?php

namespace App\Services;

use App\Enums\AcademyRole;
use App\Models\Academy;
use App\Models\AcademyMembership;
use App\Models\User;
use App\Notifications\AccountCredentialsNotification;
use App\Support\PhoneNumber;
use Illuminate\Support\Str;

class AccountService
{
    public function __construct(protected AcademyRoleProvisioner $roles) {}

    /**
     * Create (or reuse) a user and attach them to the academy with a role.
     *
     * @param  array{name?: string, email?: ?string, phone?: ?string, password?: ?string}  $data
     * @return array{user: User, password: ?string, created: bool}
     */
    public function provision(
        Academy $academy,
        array $data,
        AcademyRole $role,
        ?User $actor = null,
        bool $sendCredentials = true,
    ): array {
        $email = isset($data['email']) && trim((string) $data['email']) !== ''
            ? Str::lower(trim($data['email']))
            : null;
        $phone = PhoneNumber::normalize($data['phone'] ?? null);

        $user = null;

        if ($email) {
            $user = User::where('email', $email)->first();
        }

        if (! $user && $phone) {
            $user = User::where('phone', $phone)->first();
        }

        $password = null;
        $created = false;

        if (! $user) {
            $password = ($data['password'] ?? null) ?: Str::password(10);

            $user = User::create([
                'name' => $data['name'] ?? 'Tanpa Nama',
                'email' => $email,
                'phone' => $phone,
                'password' => $password,
                'is_active' => true,
                'must_change_password' => true,
                'created_by' => $actor?->id,
            ]);

            $created = true;
        }

        AcademyMembership::updateOrCreate(
            [
                'academy_id' => $academy->id,
                'user_id' => $user->id,
                'role' => $role->value,
            ],
            [
                'is_active' => true,
                'joined_at' => now(),
                'created_by' => $actor?->id,
            ],
        );

        $this->roles->assign($academy, $user, $role);

        if ($created && $sendCredentials && $email) {
            $user->notify(new AccountCredentialsNotification(
                $academy->name,
                $password,
                route('login'),
            ));
        }

        return ['user' => $user, 'password' => $password, 'created' => $created];
    }

    /**
     * Re-send credentials for an existing account, generating a fresh password.
     */
    public function resendCredentials(Academy $academy, User $user): ?string
    {
        if (! $user->email) {
            return null;
        }

        $password = Str::password(10);

        $user->forceFill([
            'password' => $password,
            'must_change_password' => true,
        ])->save();

        $user->notify(new AccountCredentialsNotification(
            $academy->name,
            $password,
            route('login'),
        ));

        return $password;
    }
}
