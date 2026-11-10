<?php

namespace App\Http\Requests;

use App\Models\Academy;

class StoreMemberRegistrationRequest extends UpdateMemberRegistrationRequest
{
    public function authorize(): bool
    {
        $token = $this->route('token');

        $academy = $token
            ? Academy::where('registration_token', $token)->first()
            : null;

        return $academy !== null
            && $academy->registration_open
            && $academy->status === 'active';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'consent' => ['accepted'],
        ];
    }
}
