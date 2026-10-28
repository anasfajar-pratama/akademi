<?php

namespace App\Services;

use App\Models\Academy;
use App\Models\Invoice;
use App\Models\Member;
use App\Models\Payment;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BillingService
{
    /**
     * Buat tagihan bulanan untuk semua member aktif yang punya paket.
     * Anti-duplikat: invoice per member per periode hanya dibuat sekali.
     *
     * @return array{created: int, skipped: int, amount: int}
     */
    public function generateForAcademy(Academy $academy, CarbonInterface $month): array
    {
        $periodStart = Carbon::parse($month)->startOfMonth();
        $periodEnd = $periodStart->copy()->endOfMonth();
        $dueDate = $periodStart->copy()->addDays(9);

        $created = 0;
        $skipped = 0;
        $amount = 0;

        DB::transaction(function () use ($academy, $periodStart, $periodEnd, $dueDate, &$created, &$skipped, &$amount) {
            $members = Member::withoutGlobalScope('academy')
                ->where('academy_id', $academy->id)
                ->where('status', 'active')
                ->whereNotNull('package_id')
                ->with('package')
                ->get();

            foreach ($members as $member) {
                $exists = Invoice::withoutGlobalScope('academy')
                    ->where('member_id', $member->id)
                    ->whereDate('period_start', $periodStart)
                    ->whereDate('period_end', $periodEnd)
                    ->exists();

                if ($exists) {
                    $skipped++;

                    continue;
                }

                $price = (int) ($member->package?->monthly_price ?? 0);
                [$itemAmount, $description] = $this->priceForPeriod($member, $price, $periodStart);

                $invoice = Invoice::create([
                    'academy_id' => $academy->id,
                    'member_id' => $member->id,
                    'number' => $this->nextNumber($academy, $periodStart),
                    'period_start' => $periodStart,
                    'period_end' => $periodEnd,
                    'due_date' => $dueDate,
                    'subtotal' => $itemAmount,
                    'discount' => 0,
                    'total' => $itemAmount,
                    'paid_amount' => 0,
                    'status' => 'unpaid',
                ]);

                $invoice->items()->create([
                    'description' => $description,
                    'qty' => 1,
                    'unit_price' => $itemAmount,
                    'amount' => $itemAmount,
                ]);

                $created++;
                $amount += $itemAmount;
            }
        });

        return ['created' => $created, 'skipped' => $skipped, 'amount' => $amount];
    }

    /**
     * Harga dengan prorata bila member bergabung di tengah periode.
     *
     * @return array{0: int, 1: string}
     */
    protected function priceForPeriod(Member $member, int $price, CarbonInterface $periodStart): array
    {
        $packageName = $member->package?->name ?? 'Paket';
        $joined = $member->joined_at;

        if ($joined && $joined->gt($periodStart)) {
            $daysInMonth = $periodStart->daysInMonth;
            $remaining = max(0, $daysInMonth - $joined->day + 1);
            $prorated = (int) (round($price * $remaining / $daysInMonth / 1000) * 1000);

            return [$prorated, $packageName.' (prorata '.$remaining.'/'.$daysInMonth.' hari)'];
        }

        return [$price, $packageName];
    }

    protected function nextNumber(Academy $academy, CarbonInterface $periodStart): string
    {
        $prefix = 'INV-'.$periodStart->format('Ym').'-';

        $count = Invoice::withoutGlobalScope('academy')
            ->where('academy_id', $academy->id)
            ->where('number', 'like', $prefix.'%')
            ->count() + 1;

        return $prefix.str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Catat pembayaran dan perbarui status invoice.
     */
    public function recordPayment(Invoice $invoice, array $data, ?User $user = null): Payment
    {
        $payment = $invoice->payments()->create([
            'academy_id' => $invoice->academy_id,
            'amount' => (int) $data['amount'],
            'method' => $data['method'] ?? 'transfer',
            'reference' => $data['reference'] ?? null,
            'paid_at' => $data['paid_at'] ?? now(),
            'recorded_by' => $user?->id,
        ]);

        $this->recalculate($invoice);

        return $payment;
    }

    public function recalculate(Invoice $invoice): void
    {
        $paid = (int) $invoice->payments()->sum('amount');

        $status = match (true) {
            $invoice->status === 'void' => 'void',
            $invoice->total > 0 && $paid >= $invoice->total => 'paid',
            $paid > 0 => 'partial',
            default => 'unpaid',
        };

        $invoice->forceFill([
            'paid_amount' => $paid,
            'status' => $status,
            'paid_at' => $status === 'paid'
                ? $invoice->payments()->max('paid_at')
                : null,
        ])->save();
    }

    public function void(Invoice $invoice): void
    {
        $invoice->forceFill(['status' => 'void', 'paid_at' => null])->save();
    }
}
