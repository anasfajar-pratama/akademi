<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class ApproveMemberRegistrationRequest extends UpdateMemberRegistrationRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $academyId = $this->academyId();

        return [
            ...parent::rules(),
            'level' => ['required', 'in:beginner,intermediate,advanced'],
            'primary_coach_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(function ($query) use ($academyId) {
                    $query->whereIn('id', function ($sub) use ($academyId) {
                        $sub->select('user_id')
                            ->from('academy_user')
                            ->where('academy_id', $academyId)
                            ->whereIn('role', ['coach', 'admin_coach'])
                            ->where('is_active', true);
                    });
                }),
            ],
        ];
    }
}
