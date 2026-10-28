<?php

namespace App\Http\Middleware;

use App\Tenancy\CurrentAcademy;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAcademyMembership
{
    public function __construct(protected CurrentAcademy $current) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $academy = $this->current->get();

        if (! $academy) {
            if ($user?->is_super_admin) {
                return redirect()
                    ->route('academies.index')
                    ->with('error', 'Pilih akademi terlebih dahulu sebelum membuka menu operasional.');
            }

            abort(403, 'Tidak ada akademi aktif.');
        }

        abort_unless($user && $user->belongsToAcademy($academy), 403, 'Anda tidak punya akses ke akademi ini.');

        return $next($request);
    }
}
