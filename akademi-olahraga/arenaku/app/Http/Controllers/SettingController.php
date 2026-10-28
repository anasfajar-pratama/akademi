<?php

namespace App\Http\Controllers;

use App\Enums\AcademyRole;
use App\Models\Academy;
use App\Models\Branch;
use App\Models\CoachProfile;
use App\Models\Package;
use App\Models\User;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeAdmin();

        $academy = app(CurrentAcademy::class)->get();

        return Inertia::render('Settings/Index', [
            'academy' => [
                'name' => $academy->name,
                'sport' => $academy->sport?->name,
                'city' => $academy->city,
                'timezone' => $academy->timezone,
            ],
            'branches' => Branch::orderBy('name')->get(['id', 'name', 'address', 'city', 'is_active']),
            'packages' => Package::with('branch:id,name')->orderBy('name')->get()->map(fn (Package $package) => [
                'id' => $package->id,
                'name' => $package->name,
                'level' => $package->level,
                'monthly_price' => $package->monthly_price,
                'sessions_per_month' => $package->sessions_per_month,
                'branch' => $package->branch?->name,
                'is_active' => $package->is_active,
            ]),
            'coaches' => $this->coaches(),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function coaches(): array
    {
        return CoachProfile::with('user:id,name')
            ->get()
            ->map(fn (CoachProfile $profile) => [
                'id' => $profile->user_id,
                'name' => $profile->user?->name,
                'specialization' => $profile->specialization,
            ])
            ->all();
    }

    protected function authorizeAdmin(): void
    {
        $user = request()->user();
        $academy = app(CurrentAcademy::class)->get();

        abort_unless(
            $user->is_super_admin
                || ($academy && $user->hasRoleIn($academy, AcademyRole::Admin)),
            403,
        );
    }
}
