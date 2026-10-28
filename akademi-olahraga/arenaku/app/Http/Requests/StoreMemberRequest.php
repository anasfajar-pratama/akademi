<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMemberRequest extends FormRequest
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
        return [
            'full_name' => ['required', 'string', 'max:120'],
            'nickname' => ['nullable', 'string', 'max:60'],
            'gender' => ['nullable', 'in:male,female'],
            'birth_date' => ['nullable', 'date'],
            'education_level' => ['nullable', 'string', 'max:40'],
            'grade_class' => ['nullable', 'string', 'max:40'],
            'school_name' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:180'],
            'city' => ['nullable', 'string', 'max:80'],
            'postal_code' => ['nullable', 'string', 'max:12'],
            'joined_at' => ['nullable', 'date'],
            'level' => ['required', 'in:beginner,intermediate,advanced'],
            'status' => ['required', 'in:trial,active,inactive,alumni'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'package_id' => ['nullable', 'integer', 'exists:packages,id'],
            'primary_coach_id' => ['nullable', 'integer', 'exists:users,id'],
            'health_notes' => ['nullable', 'string', 'max:1000'],
            'allergy_notes' => ['nullable', 'string', 'max:1000'],
            'emergency_name' => ['nullable', 'string', 'max:120'],
            'emergency_phone' => ['nullable', 'string', 'max:20'],
            'source' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string', 'max:1000'],

            'guardians' => ['array'],
            'guardians.*.full_name' => ['required', 'string', 'max:120'],
            'guardians.*.relation' => ['required', 'in:father,mother,guardian'],
            'guardians.*.phone' => ['required', 'string', 'max:20'],
            'guardians.*.email' => ['nullable', 'email', 'max:120'],
            'guardians.*.occupation' => ['nullable', 'string', 'max:80'],
            'guardians.*.is_primary' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['full_name' => 'nama lengkap'];
    }
}
