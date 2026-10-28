<?php

namespace App\Http\Middleware;

use App\Models\Academy;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $current = app(CurrentAcademy::class);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'initials' => $user->initials(),
                    'is_super_admin' => $user->is_super_admin,
                    'must_change_password' => $user->must_change_password,
                ] : null,
                'role' => $user && $current->check()
                    ? $user->roleIn($current->get())?->value
                    : null,
                'memberships' => $user
                    ? $user->activeMemberships()
                        ->with('academy:id,name,slug')
                        ->get()
                        ->map(fn ($membership) => [
                            'academy_id' => $membership->academy_id,
                            'academy_name' => $membership->academy?->name,
                            'role' => $membership->role->value,
                            'role_label' => $membership->role->label(),
                        ])
                        ->values()
                    : [],
            ],
            'currentAcademy' => $current->check() ? [
                'id' => $current->get()->id,
                'name' => $current->get()->name,
                'slug' => $current->get()->slug,
                'brand_color' => $current->get()->brand_color,
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'credentials' => fn () => $request->session()->get('credentials'),
            ],
            'demoAccounts' => config('demo.enabled') ? config('demo.accounts') : [],
            'academies' => $user && $user->is_super_admin
                ? Academy::orderBy('name')->get(['id', 'name'])
                    ->map(fn (Academy $academy) => ['id' => $academy->id, 'name' => $academy->name])
                    ->values()
                : [],
        ];
    }
}
