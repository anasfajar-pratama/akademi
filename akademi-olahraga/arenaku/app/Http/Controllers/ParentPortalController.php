<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Member;
use App\Models\Schedule;
use App\Models\SessionAttendance;
use App\Services\MemberProgressService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ParentPortalController extends Controller
{
    public function __construct(protected MemberProgressService $progress) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        $children = Member::query()
            ->whereHas('guardians', fn ($query) => $query->where('guardians.user_id', $user->id))
            ->with(['package:id,name', 'branch:id,name'])
            ->orderBy('full_name')
            ->get()
            ->map(fn (Member $member) => [
                'id' => $member->id,
                'full_name' => $member->full_name,
                'nickname' => $member->nickname,
                'member_code' => $member->member_code,
                'level' => $member->level,
                'status' => $member->status,
                'package' => $member->package?->name,
                'branch' => $member->branch?->name,
                'attendance_summary' => $this->attendanceSummary($member),
            ]);

        if ($children->isEmpty()) {
            throw new NotFoundHttpException('Belum ada data anak yang terhubung dengan akun ini.');
        }

        return Inertia::render('Portal/Index', [
            'children' => $children,
        ]);
    }

    public function show(Request $request, Member $member): Response
    {
        $this->authorize('view', $member);

        $member->load(['package:id,name,duration_minutes,sessions_per_month', 'branch:id,name', 'primaryCoach:id,name']);

        $upcoming = Schedule::with('branch:id,name')
            ->where('status', 'published')
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->limit(5)
            ->get()
            ->map(fn (Schedule $schedule) => [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'type' => $schedule->type,
                'starts_at' => $schedule->starts_at?->toIso8601String(),
                'location' => $schedule->location_name ?? $schedule->branch?->name,
                'maps_url' => $schedule->maps_url,
            ]);

        $history = SessionAttendance::query()
            ->where('member_id', $member->id)
            ->with('session:id,title,session_date')
            ->latest('id')
            ->limit(10)
            ->get()
            ->map(fn (SessionAttendance $attendance) => [
                'id' => $attendance->id,
                'status' => $attendance->status,
                'session_title' => $attendance->session?->title,
                'session_date' => $attendance->session?->session_date?->toDateString(),
            ]);

        return Inertia::render('Portal/Child', [
            'member' => [
                'id' => $member->id,
                'full_name' => $member->full_name,
                'nickname' => $member->nickname,
                'member_code' => $member->member_code,
                'level' => $member->level,
                'status' => $member->status,
                'age' => $member->age(),
                'package' => $member->package?->name,
                'branch' => $member->branch?->name,
                'coach' => $member->primaryCoach?->name,
            ],
            'attendance' => $this->attendanceSummary($member),
            'skills' => $this->progress->summary($member),
            'invoices' => $this->invoices($member),
            'upcoming' => $upcoming,
            'history' => $history,
        ]);
    }

    /**
     * @return array{outstanding: int, items: array<int, array<string, mixed>>}
     */
    protected function invoices(Member $member): array
    {
        $invoices = Invoice::query()
            ->where('member_id', $member->id)
            ->orderByDesc('period_start')
            ->limit(6)
            ->get();

        return [
            'outstanding' => (int) Invoice::query()
                ->where('member_id', $member->id)
                ->whereIn('status', ['unpaid', 'partial'])
                ->sum('total'),
            'items' => $invoices->map(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'period_start' => $invoice->period_start?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'total' => $invoice->total,
                'paid_amount' => $invoice->paid_amount,
                'outstanding' => $invoice->outstanding(),
                'status' => $invoice->displayStatus(),
            ])->all(),
        ];
    }

    /**
     * @return array{present: int, late: int, permitted: int, sick: int, absent: int, total: int, rate: int}
     */
    protected function attendanceSummary(Member $member): array
    {
        $counts = SessionAttendance::query()
            ->where('member_id', $member->id)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $present = (int) ($counts['present'] ?? 0);
        $late = (int) ($counts['late'] ?? 0);
        $permitted = (int) ($counts['permitted'] ?? 0);
        $sick = (int) ($counts['sick'] ?? 0);
        $absent = (int) ($counts['absent'] ?? 0);
        $total = $present + $late + $permitted + $sick + $absent;

        return [
            'present' => $present,
            'late' => $late,
            'permitted' => $permitted,
            'sick' => $sick,
            'absent' => $absent,
            'total' => $total,
            'rate' => $total > 0 ? (int) round((($present + $late) / $total) * 100) : 0,
        ];
    }
}
