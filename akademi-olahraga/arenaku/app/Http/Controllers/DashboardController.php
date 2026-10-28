<?php

namespace App\Http\Controllers;

use App\Enums\AcademyRole;
use App\Models\Academy;
use App\Models\AttendanceSession;
use App\Models\Invoice;
use App\Models\Member;
use App\Models\Payment;
use App\Models\Schedule;
use App\Models\SessionAttendance;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $current = app(CurrentAcademy::class);

        if (! $current->check()) {
            if (! $user->is_super_admin) {
                return Inertia::render('Dashboard', ['scope' => 'none', 'kpis' => [], 'actions' => [], 'today' => []]);
            }

            return $this->platformDashboard();
        }

        $academy = $current->get();
        $role = $user->roleIn($academy);

        return match ($role) {
            AcademyRole::Coach => $this->coachDashboard($academy, $user),
            AcademyRole::Parent, AcademyRole::Member => redirect()->route('portal.index'),
            default => $this->adminDashboard($academy, $user->is_super_admin ? 'Super Admin' : 'Admin Akademi'),
        };
    }

    protected function platformDashboard(): Response
    {
        $start = now()->startOfMonth();

        $academies = Academy::query()
            ->with('sport:id,name')
            ->withCount(['members' => fn ($query) => $query->withoutGlobalScope('academy')])
            ->orderBy('name')
            ->get()
            ->map(function (Academy $academy) use ($start) {
                $paid = (int) Payment::withoutGlobalScope('academy')
                    ->where('academy_id', $academy->id)
                    ->whereBetween('paid_at', [$start, now()])
                    ->sum('amount');

                $outstanding = (int) Invoice::withoutGlobalScope('academy')
                    ->where('academy_id', $academy->id)
                    ->whereIn('status', ['unpaid', 'partial'])
                    ->sum('total');

                return [
                    'id' => $academy->id,
                    'name' => $academy->name,
                    'sport' => $academy->sport?->name,
                    'members_count' => $academy->members_count,
                    'revenue' => $paid,
                    'outstanding' => $outstanding,
                    'status' => $academy->status,
                ];
            });

        $revenue = (int) Payment::withoutGlobalScope('academy')->whereBetween('paid_at', [$start, now()])->sum('amount');
        $outstanding = (int) Invoice::withoutGlobalScope('academy')->whereIn('status', ['unpaid', 'partial'])->sum('total');

        return Inertia::render('Dashboard', [
            'scope' => 'platform',
            'kpis' => [
                ['label' => 'Akademi', 'value' => $academies->count(), 'type' => 'number'],
                ['label' => 'Total member', 'value' => $academies->sum('members_count'), 'type' => 'number'],
                ['label' => 'Pendapatan bulan ini', 'value' => $revenue, 'type' => 'rupiah'],
                ['label' => 'Tunggakan', 'value' => $outstanding, 'type' => 'rupiah'],
            ],
            'actions' => [
                [
                    'label' => 'Akademi perlu perhatian (ada tunggakan)',
                    'count' => $academies->where('outstanding', '>', 0)->count(),
                    'href' => '/academies',
                    'tone' => 'amber',
                ],
            ],
            'academies' => $academies,
            'today' => [],
        ]);
    }

    protected function adminDashboard(Academy $academy, string $roleLabel): Response
    {
        $monthStart = now()->startOfMonth();
        $prevStart = now()->subMonthNoOverflow()->startOfMonth();
        $prevEnd = now()->subMonthNoOverflow()->endOfMonth();

        $membersActive = Member::where('status', 'active')->count();
        $membersTrial = Member::where('status', 'trial')->count();
        $membersInactive = Member::where('status', 'inactive')->count();
        $membersNew = Member::whereBetween('created_at', [$monthStart, now()])->count();

        $attendance = $this->attendanceRate($academy, $monthStart, now());
        $prevAttendance = $this->attendanceRate($academy, $prevStart, $prevEnd);

        $revenue = (int) Payment::whereBetween('paid_at', [$monthStart, now()])->sum('amount');
        $invoiced = (int) Invoice::whereBetween('period_start', [$monthStart, now()])->where('status', '!=', 'void')->sum('total');
        $paid = (int) Invoice::whereBetween('period_start', [$monthStart, now()])->where('status', '!=', 'void')->sum('paid_amount');
        $outstanding = (int) Invoice::whereIn('status', ['unpaid', 'partial'])->sum('total');
        $overdue = Invoice::whereIn('status', ['unpaid', 'partial'])->whereDate('due_date', '<', today())->count();

        $pendingAttendance = AttendanceSession::whereNull('attendance_filled_at')
            ->whereDate('session_date', '<=', today())
            ->count();

        $lowAttendance = $this->lowAttendanceCount($academy, $monthStart, now());

        $todaySchedules = Schedule::with('branch:id,name')
            ->whereDate('starts_at', today())
            ->orderBy('starts_at')
            ->get()
            ->map(fn (Schedule $schedule) => [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'type' => $schedule->type,
                'starts_at' => $schedule->starts_at?->toIso8601String(),
                'location' => $schedule->location_name ?? $schedule->branch?->name,
                'session_id' => $schedule->attendanceSessions()->where('status', 'open')->value('id'),
            ]);

        return Inertia::render('Dashboard', [
            'scope' => 'admin',
            'role_label' => $roleLabel,
            'kpis' => [
                ['label' => 'Member aktif', 'value' => $membersActive, 'type' => 'number', 'hint' => $membersNew.' baru bulan ini'],
                ['label' => 'Trial', 'value' => $membersTrial, 'type' => 'number'],
                ['label' => 'Non-aktif', 'value' => $membersInactive, 'type' => 'number'],
                [
                    'label' => 'Kehadiran bulan ini',
                    'value' => $attendance,
                    'type' => 'percent',
                    'delta' => $attendance - $prevAttendance,
                ],
                ['label' => 'Pendapatan bulan ini', 'value' => $revenue, 'type' => 'rupiah'],
                ['label' => 'Tagihan bulan ini', 'value' => $invoiced, 'type' => 'rupiah', 'hint' => 'Terbayar '.number_format($paid, 0, ',', '.')],
                ['label' => 'Tunggakan', 'value' => $outstanding, 'type' => 'rupiah', 'hint' => $overdue.' lewat jatuh tempo'],
                [
                    'label' => 'Kolektibilitas',
                    'value' => $invoiced > 0 ? (int) round($paid / $invoiced * 100) : 0,
                    'type' => 'percent',
                ],
            ],
            'actions' => [
                [
                    'label' => 'Tagihan lewat jatuh tempo',
                    'count' => $overdue,
                    'href' => '/invoices?status=unpaid',
                    'tone' => 'rose',
                ],
                [
                    'label' => 'Sesi belum diabsen',
                    'count' => $pendingAttendance,
                    'href' => '/schedules',
                    'tone' => 'amber',
                ],
                [
                    'label' => 'Member kehadiran < 70%',
                    'count' => $lowAttendance,
                    'href' => '/members',
                    'tone' => 'amber',
                ],
            ],
            'today' => $todaySchedules,
        ]);
    }

    protected function coachDashboard(Academy $academy, \App\Models\User $user): Response
    {
        $monthStart = now()->startOfMonth();

        $mySchedules = Schedule::with('branch:id,name')
            ->where('coach_id', $user->id)
            ->whereDate('starts_at', '>=', today())
            ->orderBy('starts_at')
            ->limit(5)
            ->get()
            ->map(fn (Schedule $schedule) => [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'type' => $schedule->type,
                'starts_at' => $schedule->starts_at?->toIso8601String(),
                'location' => $schedule->location_name ?? $schedule->branch?->name,
                'session_id' => $schedule->attendanceSessions()->where('status', 'open')->value('id'),
            ]);

        $pendingAttendance = AttendanceSession::where('coach_id', $user->id)
            ->whereNull('attendance_filled_at')
            ->whereDate('session_date', '<=', today())
            ->count();

        $pendingAssessment = AttendanceSession::where('coach_id', $user->id)
            ->whereNotNull('attendance_filled_at')
            ->whereDoesntHave('assessments')
            ->count();

        $lowAttendance = $this->lowAttendanceCount($academy, $monthStart, now());

        return Inertia::render('Dashboard', [
            'scope' => 'coach',
            'role_label' => 'Pelatih',
            'kpis' => [
                ['label' => 'Jadwal mendatang', 'value' => $mySchedules->count(), 'type' => 'number'],
                [
                    'label' => 'Absensi belum diisi',
                    'value' => $pendingAttendance,
                    'type' => 'number',
                    'hint' => 'Sesi yang sudah lewat',
                ],
                ['label' => 'Penilaian tertunda', 'value' => $pendingAssessment, 'type' => 'number', 'hint' => 'Absensi sudah, nilai belum'],
                ['label' => 'Member kehadiran < 70%', 'value' => $lowAttendance, 'type' => 'number'],
            ],
            'actions' => [
                ['label' => 'Isi absensi', 'count' => $pendingAttendance, 'href' => '/coach', 'tone' => 'amber'],
                ['label' => 'Isi penilaian skill', 'count' => $pendingAssessment, 'href' => '/assessments', 'tone' => 'sky'],
            ],
            'today' => $mySchedules,
        ]);
    }

    protected function attendanceRate(Academy $academy, Carbon $start, Carbon $end): int
    {
        $rows = SessionAttendance::query()
            ->join('attendance_sessions', 'attendance_sessions.id', '=', 'session_attendance.attendance_session_id')
            ->where('attendance_sessions.academy_id', $academy->id)
            ->whereBetween('attendance_sessions.session_date', [$start, $end])
            ->selectRaw('count(*) as total')
            ->selectRaw('sum(case when session_attendance.status in ("present","late") then 1 else 0 end) as present')
            ->first();

        $total = (int) ($rows->total ?? 0);

        return $total > 0 ? (int) round(((int) $rows->present) / $total * 100) : 0;
    }

    protected function lowAttendanceCount(Academy $academy, Carbon $start, Carbon $end): int
    {
        $rows = SessionAttendance::query()
            ->join('attendance_sessions', 'attendance_sessions.id', '=', 'session_attendance.attendance_session_id')
            ->where('attendance_sessions.academy_id', $academy->id)
            ->whereBetween('attendance_sessions.session_date', [$start, $end])
            ->selectRaw('session_attendance.member_id')
            ->selectRaw('count(*) as total')
            ->selectRaw('sum(case when session_attendance.status in ("present","late") then 1 else 0 end) as present')
            ->groupBy('session_attendance.member_id')
            ->get();

        return $rows
            ->filter(fn ($row) => (int) $row->total > 0 && ((int) $row->present / (int) $row->total) < 0.7)
            ->count();
    }
}
