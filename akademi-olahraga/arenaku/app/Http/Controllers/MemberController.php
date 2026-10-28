<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMemberRequest;
use App\Models\Branch;
use App\Models\Guardian;
use App\Models\Invoice;
use App\Models\Member;
use App\Models\Package;
use App\Models\SessionAttendance;
use App\Models\User;
use App\Services\AcademyProvisioningService;
use App\Services\MemberProgressService;
use App\Support\PhoneNumber;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    public function __construct(
        protected AcademyProvisioningService $provisioning,
        protected MemberProgressService $progress,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Member::class);

        $search = $request->string('q')->toString();

        $members = Member::query()
            ->with(['package:id,name', 'branch:id,name'])
            ->when($search !== '', fn ($query) => $query->where(function ($inner) use ($search) {
                $inner->where('full_name', 'like', "%{$search}%")
                    ->orWhere('member_code', 'like', "%{$search}%");
            }))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('level'), fn ($query) => $query->where('level', $request->string('level')))
            ->when($request->filled('branch_id'), fn ($query) => $query->where('branch_id', $request->integer('branch_id')))
            ->orderBy('full_name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Member $member) => [
                'id' => $member->id,
                'full_name' => $member->full_name,
                'nickname' => $member->nickname,
                'member_code' => $member->member_code,
                'level' => $member->level,
                'status' => $member->status,
                'age' => $member->age(),
                'package' => $member->package?->name,
                'branch' => $member->branch?->name,
            ]);

        return Inertia::render('Members/Index', [
            'members' => $members,
            'filters' => $request->only('q', 'status', 'level', 'branch_id'),
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Member::class);

        return Inertia::render('Members/Create', $this->formOptions());
    }

    public function store(StoreMemberRequest $request): RedirectResponse
    {
        $this->authorize('create', Member::class);

        $data = $request->validated();
        $academy = app(CurrentAcademy::class)->get();

        $member = Member::create([
            ...collect($data)->except('guardians')->all(),
            'member_code' => $this->provisioning->nextMemberCode($academy, $data['full_name']),
            'joined_at' => $data['joined_at'] ?? now()->toDateString(),
        ]);

        $this->syncGuardians($member, $data['guardians'] ?? []);

        return redirect()->route('members.show', $member)->with('success', 'Member ditambahkan.');
    }

    public function show(Member $member): Response
    {
        $this->authorize('view', $member);

        $member->load(['package:id,name', 'branch:id,name', 'primaryCoach:id,name', 'guardians']);

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

        return Inertia::render('Members/Show', [
            'member' => [
                'id' => $member->id,
                'full_name' => $member->full_name,
                'nickname' => $member->nickname,
                'member_code' => $member->member_code,
                'gender' => $member->gender,
                'birth_date' => $member->birth_date?->toDateString(),
                'age' => $member->age(),
                'education_level' => $member->education_level,
                'grade_class' => $member->grade_class,
                'school_name' => $member->school_name,
                'address' => $member->address,
                'city' => $member->city,
                'level' => $member->level,
                'status' => $member->status,
                'joined_at' => $member->joined_at?->toDateString(),
                'package' => $member->package?->name,
                'branch' => $member->branch?->name,
                'coach' => $member->primaryCoach?->name,
                'health_notes' => $member->health_notes,
                'allergy_notes' => $member->allergy_notes,
                'emergency_name' => $member->emergency_name,
                'emergency_phone' => $member->emergency_phone,
                'notes' => $member->notes,
            ],
            'guardians' => $member->guardians->map(fn (Guardian $guardian) => [
                'id' => $guardian->id,
                'full_name' => $guardian->full_name,
                'relation' => $guardian->relation,
                'phone' => PhoneNumber::display($guardian->phone),
                'email' => $guardian->email,
                'occupation' => $guardian->occupation,
                'is_primary' => (bool) $guardian->pivot->is_primary,
            ]),
            'history' => $history,
            'skills' => $this->progress->summary($member),
            'finance' => [
                'outstanding' => (int) Invoice::query()
                    ->where('member_id', $member->id)
                    ->whereIn('status', ['unpaid', 'partial'])
                    ->sum('total'),
                'invoices' => Invoice::query()
                    ->where('member_id', $member->id)
                    ->orderByDesc('period_start')
                    ->limit(6)
                    ->get()
                    ->map(fn (Invoice $invoice) => [
                        'id' => $invoice->id,
                        'number' => $invoice->number,
                        'period_start' => $invoice->period_start?->toDateString(),
                        'total' => $invoice->total,
                        'paid_amount' => $invoice->paid_amount,
                        'outstanding' => $invoice->outstanding(),
                        'status' => $invoice->displayStatus(),
                    ])
                    ->all(),
            ],
        ]);
    }

    public function edit(Member $member): Response
    {
        $this->authorize('update', $member);

        $member->load('guardians');

        return Inertia::render('Members/Edit', [
            ...$this->formOptions(),
            'member' => [
                ...collect($member->only([
                    'id', 'full_name', 'nickname', 'gender', 'education_level', 'grade_class',
                    'school_name', 'address', 'city', 'postal_code', 'level', 'status', 'source',
                    'health_notes', 'allergy_notes', 'emergency_name', 'emergency_phone', 'notes',
                ]))->all(),
                'birth_date' => $member->birth_date?->toDateString(),
                'joined_at' => $member->joined_at?->toDateString(),
                'branch_id' => $member->branch_id,
                'package_id' => $member->package_id,
                'primary_coach_id' => $member->primary_coach_id,
            ],
            'guardians' => $member->guardians->map(fn (Guardian $guardian) => [
                'id' => $guardian->id,
                'full_name' => $guardian->full_name,
                'relation' => $guardian->relation,
                'phone' => $guardian->phone,
                'email' => $guardian->email,
                'occupation' => $guardian->occupation,
                'is_primary' => (bool) $guardian->pivot->is_primary,
            ]),
        ]);
    }

    public function update(StoreMemberRequest $request, Member $member): RedirectResponse
    {
        $this->authorize('update', $member);

        $data = $request->validated();

        $member->update(collect($data)->except('guardians')->all());
        $this->syncGuardians($member, $data['guardians'] ?? []);

        return redirect()->route('members.show', $member)->with('success', 'Data member diperbarui.');
    }

    public function destroy(Member $member): RedirectResponse
    {
        $this->authorize('delete', $member);

        $member->delete();

        return redirect()->route('members.index')->with('success', 'Member dihapus.');
    }

    /**
     * @param  array<int, array<string, mixed>>  $guardians
     */
    protected function syncGuardians(Member $member, array $guardians): void
    {
        $academyId = $member->academy_id;
        $kept = [];

        foreach ($guardians as $index => $row) {
            $attributes = [
                'academy_id' => $academyId,
                'full_name' => $row['full_name'],
                'relation' => $row['relation'],
                'phone' => PhoneNumber::normalize($row['phone']),
                'email' => $row['email'] ?? null,
                'occupation' => $row['occupation'] ?? null,
                'is_primary' => (bool) ($row['is_primary'] ?? false) || $index === 0,
            ];

            if (! empty($row['id'])) {
                $guardian = Guardian::withoutGlobalScope('academy')->find($row['id']);
                $guardian?->update(collect($attributes)->except('academy_id')->all());
            } else {
                $guardian = Guardian::create($attributes);
            }

            if ($guardian) {
                $member->guardians()->syncWithoutDetaching([
                    $guardian->id => ['is_primary' => $attributes['is_primary']],
                ]);
                $kept[] = $guardian->id;
            }
        }

        $member->guardians()->detach(
            $member->guardians()->pluck('guardians.id')->diff($kept)->all()
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function formOptions(): array
    {
        $academyId = app(CurrentAcademy::class)->id();

        return [
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
            'packages' => Package::orderBy('name')->get(['id', 'name', 'level']),
            'coaches' => User::query()
                ->whereHas('memberships', fn ($query) => $query
                    ->where('academy_id', $academyId)
                    ->where('role', 'coach'))
                ->orderBy('name')
                ->get(['id', 'name']),
        ];
    }
}
