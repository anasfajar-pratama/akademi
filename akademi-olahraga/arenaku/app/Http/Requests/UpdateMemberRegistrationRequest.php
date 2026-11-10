<?php

namespace App\Http\Requests;

use App\Models\Academy;
use App\Models\MemberRegistration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $academyId = $this->academyId();

        return [
            'full_name' => ['required', 'string', 'max:120'],
            'nickname' => ['nullable', 'string', 'max:60'],
            'gender' => ['required', 'in:male,female'],
            'birth_date' => ['required', 'date', 'before:today'],
            'education_level' => ['nullable', 'string', 'max:40'],
            'grade_class' => ['nullable', 'string', 'max:40'],
            'school_name' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:180'],
            'city' => ['nullable', 'string', 'max:80'],
            'postal_code' => ['nullable', 'string', 'max:12'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'branch_id' => [
                'nullable',
                'integer',
                Rule::exists('branches', 'id')->where(fn ($query) => $query->where('academy_id', $academyId)),
            ],
            'package_id' => [
                'nullable',
                'integer',
                Rule::exists('packages', 'id')->where(fn ($query) => $query->where('academy_id', $academyId)),
            ],

            'guardian_name' => ['required', 'string', 'max:120'],
            'guardian_relation' => ['required', 'in:father,mother,guardian'],
            'guardian_phone' => ['required', 'string', 'max:20'],
            'guardian_email' => ['nullable', 'email', 'max:120'],
            'guardian_occupation' => ['nullable', 'string', 'max:80'],
            'guardian_address' => ['nullable', 'string', 'max:180'],

            'health_notes' => ['nullable', 'string', 'max:1000'],
            'allergy_notes' => ['nullable', 'string', 'max:1000'],
            'emergency_name' => ['nullable', 'string', 'max:120'],
            'emergency_phone' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'full_name' => 'nama lengkap anak',
            'birth_date' => 'tanggal lahir',
            'photo' => 'foto member',
            'guardian_name' => 'nama orang tua/wali',
            'guardian_phone' => 'nomor HP orang tua/wali',
            'guardian_relation' => 'hubungan dengan member',
        ];
    }

    protected function academyId(): ?int
    {
        $registration = $this->route('registration');

        if ($registration instanceof MemberRegistration) {
            return $registration->academy_id;
        }

        $token = $this->route('token');

        return $token
            ? Academy::where('registration_token', $token)->value('id')
            : null;
    }
}
