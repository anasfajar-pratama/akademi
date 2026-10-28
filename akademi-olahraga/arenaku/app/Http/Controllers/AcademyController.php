<?php

namespace App\Http\Controllers;

use App\Enums\AcademyRole;
use App\Http\Requests\StoreAcademyOnboardingRequest;
use App\Http\Requests\UpdateAcademyRequest;
use App\Models\Academy;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SessionAttendance;
use App\Models\Skill;
use App\Models\Sport;
use App\Services\AcademyProvisioningService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademyController extends Controller
{
    public function __construct(protected AcademyProvisioningService $provisioning) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Academy::class);

        $academies = Academy::query()
            ->with('sport:id,name,slug')
            ->withCount([
                'members' => fn ($query) => $query->withoutGlobalScope('academy'),
                'memberships as users_count' => fn ($query) => $query->where('is_active', true),
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (Academy $academy) => [
                'id' => $academy->id,
                'name' => $academy->name,
                'slug' => $academy->slug,
                'sport' => $academy->sport?->name,
                'city' => $academy->city,
                'status' => $academy->status,
                'brand_color' => $academy->brand_color,
                'members_count' => $academy->members_count,
                'users_count' => $academy->users_count,
            ]);

        return Inertia::render('Academies/Index', [
            'academies' => $academies,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Academy::class);

        return Inertia::render('Academies/Create', [
            'sports' => Sport::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Sport $sport) => [
                    'id' => $sport->id,
                    'name' => $sport->name,
                    'slug' => $sport->slug,
                    'skills_count' => Skill::withoutGlobalScope('academy')
                        ->whereNull('academy_id')
                        ->where('sport_id', $sport->id)
                        ->count(),
                ]),
        ]);
    }

    public function store(StoreAcademyOnboardingRequest $request): RedirectResponse
    {
        $result = $this->provisioning->provision($request->validated(), $request->user());

        return redirect()
            ->route('academies.show', $result['academy'])
            ->with('success', 'Akademi "'.$result['academy']->name.'" berhasil dibuat.')
            ->with('credentials', $result['credentials']);
    }

    public function show(Request $request, Academy $academy): Response
    {
        $this->authorize('view', $academy);

        // Super Admin tidak punya keanggotaan, jadi akademi yang dibuka dijadikan akademi aktif.
        if ($request->user()->is_super_admin) {
            $request->session()->put('current_academy_id', $academy->id);
        }

        $academy->load(['sport:id,name']);

        return Inertia::render('Academies/Show', [
            'academy' => [
                'id' => $academy->id,
                'name' => $academy->name,
                'slug' => $academy->slug,
                'sport' => $academy->sport?->name,
                'city' => $academy->city,
                'address' => $academy->address,
                'phone' => $academy->phone,
                'email' => $academy->email,
                'status' => $academy->status,
                'brand_color' => $academy->brand_color,
            ],
            'accounts' => $academy->memberships()
                ->with('user:id,name,email,phone,is_active')
                ->get()
                ->map(fn ($membership) => [
                    'id' => $membership->id,
                    'user_id' => $membership->user_id,
                    'name' => $membership->user?->name,
                    'email' => $membership->user?->email,
                    'phone' => $membership->user?->phone,
                    'role' => $membership->role->value,
                    'role_label' => $membership->role->label(),
                    'is_active' => (bool) $membership->user?->is_active,
                ]),
            'members' => $academy->members()
                ->withoutGlobalScope('academy')
                ->with('guardians:id,full_name,phone')
                ->orderBy('full_name')
                ->get(['id', 'full_name', 'member_code', 'level', 'status']),
            'stats' => $this->stats($academy),
        ]);
    }

    /**
     * @return array<string, int>
     */
    protected function stats(Academy $academy): array
    {
        $monthStart = now()->startOfMonth();

        $revenue = (int) Payment::withoutGlobalScope('academy')
            ->where('academy_id', $academy->id)
            ->whereBetween('paid_at', [$monthStart, now()])
            ->sum('amount');

        $outstanding = (int) Invoice::withoutGlobalScope('academy')
            ->where('academy_id', $academy->id)
            ->whereIn('status', ['unpaid', 'partial'])
            ->sum('total');

        $attendance = SessionAttendance::query()
            ->join('attendance_sessions', 'attendance_sessions.id', '=', 'session_attendance.attendance_session_id')
            ->where('attendance_sessions.academy_id', $academy->id)
            ->whereBetween('attendance_sessions.session_date', [$monthStart, now()])
            ->selectRaw('count(*) as total')
            ->selectRaw('sum(case when session_attendance.status in ("present","late") then 1 else 0 end) as present')
            ->first();

        $total = (int) ($attendance->total ?? 0);

        return [
            'members_total' => $academy->members()->withoutGlobalScope('academy')->count(),
            'members_active' => $academy->members()->withoutGlobalScope('academy')->where('status', 'active')->count(),
            'coaches' => $academy->memberships()->where('role', AcademyRole::Coach->value)->where('is_active', true)->count(),
            'revenue_month' => $revenue,
            'outstanding' => $outstanding,
            'attendance_rate' => $total > 0 ? (int) round(((int) $attendance->present) / $total * 100) : 0,
        ];
    }

    public function edit(Academy $academy): Response
    {
        $this->authorize('update', $academy);

        return Inertia::render('Academies/Edit', [
            'academy' => [
                'id' => $academy->id,
                'name' => $academy->name,
                'sport_id' => $academy->sport_id,
                'city' => $academy->city,
                'address' => $academy->address,
                'phone' => $academy->phone,
                'email' => $academy->email,
                'brand_color' => $academy->brand_color,
                'timezone' => $academy->timezone,
                'status' => $academy->status,
            ],
            'sports' => Sport::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateAcademyRequest $request, Academy $academy): RedirectResponse
    {
        $academy->update($request->validated());

        return redirect()->route('academies.show', $academy)->with('success', 'Akademi diperbarui.');
    }

    public function toggleStatus(Academy $academy): RedirectResponse
    {
        $this->authorize('update', $academy);

        $academy->forceFill([
            'status' => $academy->status === 'active' ? 'inactive' : 'active',
        ])->save();

        return back()->with('success', $academy->status === 'active' ? 'Akademi diaktifkan.' : 'Akademi dinonaktifkan.');
    }
}
