<?php

namespace App\Http\Controllers;

use App\Enums\AcademyRole;
use App\Http\Requests\StoreAccountRequest;
use App\Models\Academy;
use App\Models\CoachProfile;
use App\Models\User;
use App\Services\AccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(protected AccountService $accounts) {}

    public function store(StoreAccountRequest $request, Academy $academy): RedirectResponse
    {
        $this->authorizeManage($academy, $request->user());

        $role = AcademyRole::from($request->input('role'));
        $result = $this->accounts->provision($academy, $request->validated(), $role, $request->user());

        if ($role === AcademyRole::Coach) {
            CoachProfile::updateOrCreate(
                ['academy_id' => $academy->id, 'user_id' => $result['user']->id],
                ['specialization' => $request->input('specialization')],
            );
        }

        return back()
            ->with('success', 'Akun '.$result['user']->name.' diproses.')
            ->with('credentials', [$this->credentialRow($result, $role)]);
    }

    public function resend(Request $request, Academy $academy, User $user): RedirectResponse
    {
        $this->authorizeManage($academy, $request->user());

        $password = $this->accounts->resendCredentials($academy, $user);

        if ($password === null) {
            return back()->with('error', 'Akun ini tidak punya email, kredensial tidak bisa dikirim.');
        }

        return back()
            ->with('success', 'Kredensial baru dikirim ke '.$user->email.'.')
            ->with('credentials', [[
                'name' => $user->name,
                'role' => '',
                'role_label' => 'Kredensial dikirim ulang',
                'email' => $user->email,
                'phone' => $user->phone,
                'password' => $password,
                'created' => true,
            ]]);
    }

    public function toggle(Request $request, Academy $academy, User $user): RedirectResponse
    {
        $this->authorizeManage($academy, $request->user());

        $user->forceFill(['is_active' => ! $user->is_active])->save();

        return back()->with('success', $user->is_active ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.');
    }

    protected function authorizeManage(Academy $academy, User $user): void
    {
        abort_unless(
            $user->is_super_admin || $user->hasRoleIn($academy, AcademyRole::Admin),
            403,
        );
    }

    /**
     * @param  array{user: User, password: ?string, created: bool}  $result
     * @return array<string, mixed>
     */
    protected function credentialRow(array $result, AcademyRole $role): array
    {
        return [
            'name' => $result['user']->name,
            'role' => $role->value,
            'role_label' => $role->label(),
            'email' => $result['user']->email,
            'phone' => $result['user']->phone,
            'password' => $result['password'],
            'created' => $result['created'],
        ];
    }
}
