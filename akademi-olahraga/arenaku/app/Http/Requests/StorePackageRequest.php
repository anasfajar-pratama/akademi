<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePackageRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'level' => ['required', 'in:beginner,intermediate,advanced'],
            'monthly_price' => ['required', 'integer', 'min:0'],
            'sessions_per_month' => ['nullable', 'integer', 'min:0', 'max:100'],
            'duration_minutes' => ['nullable', 'integer', 'min:15', 'max:300'],
            'quota' => ['nullable', 'integer', 'min:0', 'max:1000'],
        ];
    }
}
