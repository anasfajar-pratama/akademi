<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAcademyOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Academy::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'academy' => ['required', 'array'],
            'academy.name' => ['required', 'string', 'max:120'],
            'academy.sport_id' => ['required', 'integer', 'exists:sports,id'],
            'academy.city' => ['nullable', 'string', 'max:80'],
            'academy.address' => ['nullable', 'string', 'max:180'],
            'academy.phone' => ['nullable', 'string', 'max:20'],
            'academy.email' => ['nullable', 'email', 'max:120'],
            'academy.brand_color' => ['nullable', 'string', 'max:20'],
            'academy.timezone' => ['nullable', 'string', 'max:40'],

            'admins' => ['required', 'array', 'min:1'],
            'admins.*.name' => ['required', 'string', 'max:120'],
            'admins.*.email' => ['nullable', 'email', 'max:120'],
            'admins.*.phone' => ['nullable', 'string', 'max:20'],
            'admins.*.password' => ['nullable', 'string', 'min:8'],

            'coaches' => ['array'],
            'coaches.*.name' => ['required', 'string', 'max:120'],
            'coaches.*.email' => ['nullable', 'email', 'max:120'],
            'coaches.*.phone' => ['nullable', 'string', 'max:20'],
            'coaches.*.password' => ['nullable', 'string', 'min:8'],
            'coaches.*.specialization' => ['nullable', 'string', 'max:120'],

            'members' => ['array'],
            'members.*.full_name' => ['required', 'string', 'max:120'],
            'members.*.nickname' => ['nullable', 'string', 'max:60'],
            'members.*.gender' => ['nullable', 'in:male,female'],
            'members.*.birth_date' => ['nullable', 'date'],
            'members.*.guardian_name' => ['nullable', 'string', 'max:120'],
            'members.*.guardian_phone' => ['nullable', 'string', 'max:20'],
            'members.*.guardian_email' => ['nullable', 'email', 'max:120'],
            'members.*.guardian_relation' => ['nullable', 'in:father,mother,guardian'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function ($validator) {
                foreach ((array) $this->input('admins', []) as $index => $admin) {
                    if (empty($admin['email']) && empty($admin['phone'])) {
                        $validator->errors()->add(
                            "admins.$index.email",
                            'Isi minimal email atau nomor HP untuk setiap admin.'
                        );
                    }
                }

                foreach ((array) $this->input('coaches', []) as $index => $coach) {
                    if (empty($coach['email']) && empty($coach['phone'])) {
                        $validator->errors()->add(
                            "coaches.$index.email",
                            'Isi minimal email atau nomor HP untuk setiap pelatih.'
                        );
                    }
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'academy.name' => 'nama akademi',
            'academy.sport_id' => 'cabang olahraga',
        ];
    }
}
