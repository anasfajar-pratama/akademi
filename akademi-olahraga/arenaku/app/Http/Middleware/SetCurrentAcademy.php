<?php

namespace App\Http\Middleware;

use App\Models\Academy;
use App\Tenancy\CurrentAcademy;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentAcademy
{
    public function __construct(protected CurrentAcademy $current) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $academyId = $request->session()->get('current_academy_id');

            if (! $user->is_super_admin) {
                $allowed = $user->activeMemberships()->pluck('academy_id');

                if (! $academyId || ! $allowed->contains($academyId)) {
                    $academyId = $allowed->first();
                    $academyId
                        ? $request->session()->put('current_academy_id', $academyId)
                        : $request->session()->forget('current_academy_id');
                }
            }

            if ($academyId) {
                $this->current->set(Academy::find($academyId));
            }
        }

        setPermissionsTeamId($this->current->id());

        return $next($request);
    }
}
