<?php

namespace App\Http\Controllers;

use App\Enums\AcademyRole;
use App\Http\Requests\StoreBranchRequest;
use App\Models\Branch;
use App\Models\User;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\RedirectResponse;

class BranchController extends Controller
{
    public function store(StoreBranchRequest $request): RedirectResponse
    {
        $this->authorizeAdmin($request->user());

        Branch::create($request->validated());

        return back()->with('success', 'Lokasi ditambahkan.');
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        $this->authorizeAdmin(request()->user());

        $branch->delete();

        return back()->with('success', 'Lokasi dihapus.');
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
