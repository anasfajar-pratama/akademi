<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForcePasswordRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ForcePasswordController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Auth/ForcePassword');
    }

    public function update(ForcePasswordRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->forceFill([
            'password' => $request->validated('password'),
            'must_change_password' => false,
            'password_changed_at' => now(),
        ])->save();

        return redirect()->route('dashboard')->with('success', 'Kata sandi berhasil diperbarui.');
    }
}
