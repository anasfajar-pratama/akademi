<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMemberRegistrationRequest;
use App\Models\Academy;
use App\Models\MemberRegistration;
use App\Support\PhoneNumber;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PublicRegistrationController extends Controller
{
    public function show(string $token): Response
    {
        $academy = $this->academy($token);

        return Inertia::render('Public/Register', [
            'token' => $token,
            'academy' => [
                'name' => $academy->name,
                'sport' => $academy->sport?->name,
                'city' => $academy->city,
                'phone' => $academy->phone,
                'email' => $academy->email,
                'brand_color' => $academy->brand_color,
            ],
            'closed' => ! $academy->registration_open || $academy->status !== 'active',
            'branches' => $academy->branches()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'packages' => $academy->packages()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'level', 'monthly_price']),
        ]);
    }

    public function store(StoreMemberRegistrationRequest $request, string $token): RedirectResponse
    {
        $academy = $this->academy($token);

        abort_if(
            ! $academy->registration_open || $academy->status !== 'active',
            403,
            'Pendaftaran untuk akademi ini sedang ditutup.',
        );

        $data = $request->validated();
        $photoPath = $request->file('photo')->store('registrations/'.$academy->id, 'public');

        MemberRegistration::create([
            'academy_id' => $academy->id,
            'status' => MemberRegistration::STATUS_PENDING,
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
            'photo_path' => $photoPath,
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
            'consent' => true,
            'ip_address' => $request->ip(),
        ]);

        return redirect()
            ->route('registration.show', ['token' => $token])
            ->with('success', 'Pendaftaran '.$data['full_name'].' berhasil dikirim ke '.$academy->name.'. Admin akademi akan menghubungi Anda melalui WhatsApp.');
    }

    protected function academy(string $token): Academy
    {
        $academy = Academy::query()
            ->with('sport:id,name')
            ->where('registration_token', $token)
            ->first();

        abort_if(! $academy, 404, 'Link pendaftaran tidak ditemukan.');

        return $academy;
    }
}
