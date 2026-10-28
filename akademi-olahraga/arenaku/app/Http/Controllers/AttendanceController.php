<?php

namespace App\Http\Controllers;

use App\Enums\AcademyRole;
use App\Models\AttendanceSession;
use App\Models\Member;
use App\Models\Schedule;
use App\Models\SessionAttendance;
use App\Models\User;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function start(Request $request, Schedule $schedule): RedirectResponse
    {
        $this->authorizeStart($request->user(), $schedule);

        $session = AttendanceSession::create([
            'academy_id' => $schedule->academy_id,
            'schedule_id' => $schedule->id,
            'branch_id' => $schedule->branch_id,
            'coach_id' => $schedule->coach_id ?? $request->user()->id,
            'title' => $schedule->title,
            'session_date' => $schedule->starts_at?->toDateString() ?? today()->toDateString(),
            'started_at' => now(),
            'status' => 'open',
        ]);

        $members = Member::query()
            ->when($schedule->package_id, fn ($query, $packageId) => $query->where('package_id', $packageId))
            ->whereIn('status', ['active', 'trial'])
            ->get(['id']);

        foreach ($members as $member) {
            SessionAttendance::create([
                'attendance_session_id' => $session->id,
                'member_id' => $member->id,
                'status' => 'present',
            ]);
        }

        return redirect()
            ->route('coach.attendance', $session)
            ->with('success', 'Sesi dibuka untuk '.$members->count().' member.');
    }

    protected function authorizeStart(User $user, Schedule $schedule): void
    {
        if ($user->is_super_admin) {
            return;
        }

        if ($schedule->academy_id !== app(CurrentAcademy::class)->id()) {
            abort(403);
        }

        if ($schedule->coach_id === $user->id) {
            return;
        }

        $academy = app(CurrentAcademy::class)->get();

        abort_unless($academy && $user->hasRoleIn($academy, AcademyRole::Admin), 403);
    }
}
