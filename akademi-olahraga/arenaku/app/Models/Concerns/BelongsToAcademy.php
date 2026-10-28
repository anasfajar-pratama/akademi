<?php

namespace App\Models\Concerns;

use App\Models\Academy;
use App\Tenancy\CurrentAcademy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToAcademy
{
    public static function bootBelongsToAcademy(): void
    {
        static::addGlobalScope('academy', function (Builder $builder) {
            $current = app(CurrentAcademy::class);

            if ($current->check()) {
                $builder->where(
                    $builder->getModel()->getTable().'.academy_id',
                    $current->id()
                );
            }
        });

        static::creating(function ($model) {
            if (! $model->academy_id && ($id = app(CurrentAcademy::class)->id())) {
                $model->academy_id = $id;
            }
        });
    }

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }
}
