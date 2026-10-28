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
use Inertia\Inertia;
use Inertia\Response;

class CoachController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $schedules = Schedule::with('branch:id,name')
            ->where('coach_id', $user->id)
            ->whereDate('starts_at', '>=', today())
            ->orderBy('starts_at')
            ->limit(10)
            ->get()
            ->map(fn (Schedule $schedule) => [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'type' => $schedule->type,
                'status' => $schedule->status,
                'starts_at' => $schedule->starts_at?->toIso8601String(),
                'location' => $schedule->location_name ?? $schedule->branch?->name,
                'session_id' => $schedule->attendanceSessions()->where('status', 'open')->value('id'),
            ]);

        $openSessions = AttendanceSession::query()
            ->where('coach_id', $user->id)
            ->where('status', 'open')
            ->latest('session_date')
            ->get()
            ->map(fn (AttendanceSession $session) => [
                'id' => $session->id,
                'title' => $session->title,
                'session_date' => $session->session_date?->toDateString(),
                'attended' => $session->attendances()->count(),
                'attendance_filled' => $session->attendanceFilled(),
            ]);

        return Inertia::render('Coach/Index', [
            'schedules' => $schedules,
            'openSessions' => $openSessions,
        ]);
    }

    public function attendance(Request $request, AttendanceSession $session): Response
    {
        $this->authorizeSession($request->user(), $session);

        return Inertia::render('Coach/Attendance', [
            'session' => [
                'id' => $session->id,
                'title' => $session->title,
                'session_date' => $session->session_date?->toDateString(),
                'status' => $session->status,
                'attendance_filled' => $session->attendanceFilled(),
            ],
            'roster' => $this->roster($session),
        ]);
    }

    public function updateAttendance(Request $request, AttendanceSession $session): RedirectResponse
    {
        $this->authorizeSession($request->user(), $session);
        abort_if($session->status === 'closed', 403, 'Sesi sudah ditutup.');

        $data = $request->validate([
            'attendance' => ['required', 'array'],
            'attendance.*.member_id' => ['required', 'integer', 'exists:members,id'],
            'attendance.*.status' => ['required', 'in:present,late,permitted,sick,absent'],
        ]);

        foreach ($data['attendance'] as $row) {
            SessionAttendance::updateOrCreate(
                [
                    'attendance_session_id' => $session->id,
                    'member_id' => $row['member_id'],
                ],
                ['status' => $row['status']],
            );
        }

        $session->forceFill(['attendance_filled_at' => now()])->save();

        return back()->with('success', 'Absensi tersimpan. Lanjut isi penilaian skill.');
    }

    protected function authorizeSession(User $user, AttendanceSession $session): void
    {
        if ($user->is_super_admin) {
            return;
        }

        if ($session->academy_id !== app(CurrentAcademy::class)->id()) {
            abort(403);
        }

        if ($session->coach_id === $user->id) {
            return;
        }

        $academy = app(CurrentAcademy::class)->get();

        abort_unless($academy && $user->hasRoleIn($academy, AcademyRole::Admin), 403);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function roster(AttendanceSession $session): array
    {
        return SessionAttendance::query()
            ->where('attendance_session_id', $session->id)
            ->with('member:id,full_name,member_code,level')
            ->get()
            ->map(fn (SessionAttendance $attendance) => [
                'member_id' => $attendance->member_id,
                'full_name' => $attendance->member?->full_name ?? '-',
                'member_code' => $attendance->member?->member_code,
                'level' => $attendance->member?->level,
                'status' => $attendance->status,
            ])
            ->sortBy('full_name')
            ->values()
            ->all();
    }
}
