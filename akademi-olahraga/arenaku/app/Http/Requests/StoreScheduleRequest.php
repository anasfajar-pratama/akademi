<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:140'],
            'type' => ['required', 'in:training,sparring,tournament,event'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'package_id' => ['nullable', 'integer', 'exists:packages,id'],
            'coach_id' => ['nullable', 'integer', 'exists:users,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'location_name' => ['nullable', 'string', 'max:140'],
            'address' => ['nullable', 'string', 'max:180'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'maps_url' => ['nullable', 'string', 'max:255'],
            'opponent_name' => ['nullable', 'string', 'max:140'],
            'opponent_note' => ['nullable', 'string', 'max:180'],
            'status' => ['required', 'in:draft,published,completed,cancelled'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
