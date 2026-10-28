<?php

namespace App\Http\Controllers;

use App\Models\Academy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AcademySwitchController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'academy_id' => ['required', 'integer', 'exists:academies,id'],
        ]);

        $academy = Academy::findOrFail($data['academy_id']);

        abort_unless($request->user()->belongsToAcademy($academy), 403);

        $request->session()->put('current_academy_id', $academy->id);

        return back();
    }
}
