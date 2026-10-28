<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAcademy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use BelongsToAcademy, HasFactory;

    protected $fillable = [
        'academy_id',
        'member_id',
        'number',
        'period_start',
        'period_end',
        'due_date',
        'subtotal',
        'discount',
        'total',
        'paid_amount',
        'status',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'due_date' => 'date',
            'paid_at' => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Status tampilan: unpaid/partial yang lewat jatuh tempo dianggap "terlambat".
     */
    public function displayStatus(): string
    {
        if (in_array($this->status, ['unpaid', 'partial'], true) && $this->due_date?->isPast()) {
            return 'overdue';
        }

        return $this->status;
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function outstanding(): int
    {
        return max(0, $this->total - $this->paid_amount);
    }
}
