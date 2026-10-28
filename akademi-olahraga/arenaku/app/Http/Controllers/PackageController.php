<?php

namespace App\Http\Controllers;

use App\Enums\AcademyRole;
use App\Http\Requests\StorePackageRequest;
use App\Models\Package;
use App\Models\User;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\RedirectResponse;

class PackageController extends Controller
{
    public function store(StorePackageRequest $request): RedirectResponse
    {
        $this->authorizeAdmin($request->user());

        Package::create($request->validated());

        return back()->with('success', 'Paket ditambahkan.');
    }

    public function destroy(Package $package): RedirectResponse
    {
        $this->authorizeAdmin(request()->user());

        $package->delete();

        return back()->with('success', 'Paket dihapus.');
    }

    protected function authorizeAdmin(User $user): void
    {
        $academy = app(CurrentAcademy::class)->get();

        abort_unless(
            $user->is_super_admin || ($academy && $user->hasRoleIn($academy, AcademyRole::Admin)),
            403,
        );
    }
}
