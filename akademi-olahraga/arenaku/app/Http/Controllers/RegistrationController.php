<?php

namespace App\Http\Controllers;

use App\Enums\AcademyRole;
use App\Http\Requests\ApproveMemberRegistrationRequest;
use App\Http\Requests\UpdateMemberRegistrationRequest;
use App\Models\Branch;
use App\Models\MemberRegistration;
use App\Models\Package;
use App\Models\User;
use App\Services\MemberRegistrationService;
use App\Support\PhoneNumber;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function __construct(protected MemberRegistrationService $registrations) {}

    public function index(Request $request): Response
    {
        $this->authorizeStaff();

        $search = $request->string('q')->toString();

        $registrations = MemberRegistration::query()
            ->with(['branch:id,name', 'package:id,name'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($search !== '', fn ($query) => $query->where(function ($inner) use ($search) {
                $inner->where('full_name', 'like', "%{$search}%")
                    ->orWhere('guardian_name', 'like', "%{$search}%")
                    ->orWhere('guardian_phone', 'like', "%{$search}%");
            }))
            ->orderByRaw("status = 'pending' desc")
            ->latest('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (MemberRegistration $registration) => [
                'id' => $registration->id,
                'full_name' => $registration->full_name,
                'gender' => $registration->gender,
                'age' => $registration->age(),
                'photo_url' => $registration->photoUrl(),
                'guardian_name' => $registration->guardian_name,
                'guardian_phone' => PhoneNumber::display($registration->guardian_phone),
                'status' => $registration->status,
                'branch' => $registration->branch?->name,
                'package' => $registration->package?->name,
                'submitted_at' => $registration->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Registrations/Index', [
            'registrations' => $registrations,
            'filters' => $request->only('q', 'status'),
            'counts' => [
                'pending' => MemberRegistration::query()->where('status', MemberRegistration::STATUS_PENDING)->count(),
                'approved' => MemberRegistration::query()->where('status', MemberRegistration::STATUS_APPROVED)->count(),
            ],
        ]);
    }

    public function show(MemberRegistration $registration): Response
    {
        $this->authorizeStaff();

        $registration->load(['branch:id,name', 'package:id,name']);

        return Inertia::render('Registrations/Show', [
            'registration' => [
                ...$registration->only([
                    'id', 'status', 'full_name', 'nickname', 'gender', 'education_level', 'grade_class',
                    'school_name', 'address', 'city', 'postal_code', 'health_notes', 'allergy_notes',
                    'emergency_name', 'emergency_phone', 'notes', 'admin_notes', 'member_id',
                ]),
                'birth_date' => $registration->birth_date?->toDateString(),
                'age' => $registration->age(),
                'photo_url' => $registration->photoUrl(),
                'branch_id' => $registration->branch_id,
                'package_id' => $registration->package_id,
                'branch' => $registration->branch?->name,
                'package' => $registration->package?->name,
                'guardian_name' => $registration->guardian_name,
                'guardian_relation' => $registration->guardian_relation,
                'guardian_phone' => PhoneNumber::display($registration->guardian_phone),
                'guardian_email' => $registration->guardian_email,
                'guardian_occupation' => $registration->guardian_occupation,
                'guardian_address' => $registration->guardian_address,
                'submitted_at' => $registration->created_at?->toIso8601String(),
                'reviewed_at' => $registration->reviewed_at?->toIso8601String(),
            ],
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateMemberRegistrationRequest $request, MemberRegistration $registration): RedirectResponse
    {
        $this->authorizeStaff();

        if ($registration->status === MemberRegistration::STATUS_APPROVED) {
            return back()->with('error', 'Pendaftaran sudah disetujui. Ubah data melalui halaman member.');
        }

        $registration->update($this->registrationAttributes($request->validated(), $request, $registration));

        return redirect()
            ->route('registrations.show', $registration)
            ->with('success', 'Data pendaftaran diperbarui.');
    }

    public function approve(ApproveMemberRegistrationRequest $request, MemberRegistration $registration): RedirectResponse
    {
        $this->authorizeStaff();

        if ($registration->status === MemberRegistration::STATUS_APPROVED) {
            return back()->with('error', 'Pendaftaran ini sudah disetujui.');
        }

        $data = $request->validated();
        $registration->update($this->registrationAttributes($data, $request, $registration));

        $result = $this->registrations->approve($registration->fresh(), $data, $request->user());

        return redirect()
            ->route('members.show', $result['member'])
            ->with('success', 'Pendaftaran disetujui. Member dan akun orang tua sudah dibuat.')
            ->with('credentials', [$result['credential']]);
    }

    public function destroy(MemberRegistration $registration): RedirectResponse
    {
        $this->authorizeStaff();

        if ($registration->status === MemberRegistration::STATUS_PENDING && $registration->photo_path) {
            Storage::disk('public')->delete($registration->photo_path);
        }

        $registration->delete();

        return redirect()
            ->route('registrations.index')
            ->with('success', 'Pendaftaran dihapus.');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function registrationAttributes(array $data, Request $request, MemberRegistration $registration): array
    {
        $attributes = [
            'full_name' => $data['full_name'],
            'nickname' => $data['nickname'] ?? null,
            'gender' => $data['gender'],
            'birth_date' => $data['birth_date'],
            'education_level' => $data['education_level'] ?? null,
            'grade_class' => $data['grade_class'] ?? null,
            'school_name' => $data['school_name'] ?? null,
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'branch_id' => $data['branch_id'] ?? null,
            'package_id' => $data['package_id'] ?? null,
            'guardian_name' => $data['guardian_name'],
            'guardian_relation' => $data['guardian_relation'],
            'guardian_phone' => PhoneNumber::normalize($data['guardian_phone']),
            'guardian_email' => $data['guardian_email'] ?? null,
            'guardian_occupation' => $data['guardian_occupation'] ?? null,
            'guardian_address' => $data['guardian_address'] ?? null,
            'health_notes' => $data['health_notes'] ?? null,
            'allergy_notes' => $data['allergy_notes'] ?? null,
            'emergency_name' => $data['emergency_name'] ?? null,
            'emergency_phone' => $data['emergency_phone'] ?? null,
            'notes' => $data['notes'] ?? null,
            'admin_notes' => $data['admin_notes'] ?? null,
        ];

        if ($request->hasFile('photo')) {
            if ($registration->photo_path) {
                Storage::disk('public')->delete($registration->photo_path);
            }

            $attributes['photo_path'] = $request->file('photo')->store(
                'registrations/'.$registration->academy_id,
                'public',
            );
        }

        return $attributes;
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
                    ->whereIn('role', [AcademyRole::Coach->value, AcademyRole::AdminCoach->value])
                    ->where('is_active', true))
                ->orderBy('name')
                ->get(['id', 'name']),
        ];
    }

    protected function authorizeStaff(): void
    {
        $user = request()->user();
        $academy = app(CurrentAcademy::class)->get();

        abort_unless(
            $user->is_super_admin
                || ($academy && $user->hasRoleIn(
                    $academy,
                    AcademyRole::Admin,
                    AcademyRole::AdminCoach,
                    AcademyRole::Coach,
                )),
            403,
        );
    }
}
