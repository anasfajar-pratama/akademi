<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Services\BillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function __construct(protected BillingService $billing) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Invoice::class);

        $period = $request->string('period')->toString() ?: now()->format('Y-m');
        $start = Carbon::createFromFormat('Y-m', $period)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $status = $request->string('status')->toString();
        $search = $request->string('q')->toString();

        $applyFilters = function ($query) use ($status, $search) {
            $query->when($status !== '', fn ($q) => $q->where('status', $status))
                ->when($search !== '', fn ($q) => $q->whereHas('member', fn ($member) => $member
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('member_code', 'like', "%{$search}%")));

            return $query;
        };

        $summaryQuery = $applyFilters(Invoice::query()->whereBetween('period_start', [$start, $end]));
        $summary = [
            'count' => (clone $summaryQuery)->count(),
            'total' => (int) (clone $summaryQuery)->sum('total'),
            'paid' => (int) (clone $summaryQuery)->sum('paid_amount'),
        ];
        $summary['outstanding'] = max(0, $summary['total'] - $summary['paid']);
        $summary['collectibility'] = $summary['total'] > 0
            ? (int) round($summary['paid'] / $summary['total'] * 100)
            : 0;

        $invoices = $applyFilters(Invoice::query()->whereBetween('period_start', [$start, $end]))
            ->with('member:id,full_name,member_code')
            ->orderByDesc('period_start')
            ->orderBy('number')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'member' => $invoice->member?->full_name,
                'member_code' => $invoice->member?->member_code,
                'total' => $invoice->total,
                'paid_amount' => $invoice->paid_amount,
                'outstanding' => $invoice->outstanding(),
                'status' => $invoice->displayStatus(),
                'due_date' => $invoice->due_date?->toDateString(),
            ]);

        $periods = collect(range(0, 11))
            ->map(fn ($i) => now()->subMonths($i)->format('Y-m'))
            ->values();

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'summary' => $summary,
            'filters' => ['period' => $period, 'status' => $status, 'q' => $search],
            'periods' => $periods,
        ]);
    }

    public function show(Invoice $invoice): Response
    {
        $this->authorize('view', $invoice);

        $invoice->load(['items', 'payments.recorder:id,name', 'member:id,full_name,member_code,package_id', 'member.package:id,name']);

        return Inertia::render('Invoices/Show', [
            'invoice' => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'period_start' => $invoice->period_start?->toDateString(),
                'period_end' => $invoice->period_end?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'subtotal' => $invoice->subtotal,
                'discount' => $invoice->discount,
                'total' => $invoice->total,
                'paid_amount' => $invoice->paid_amount,
                'outstanding' => $invoice->outstanding(),
                'status' => $invoice->displayStatus(),
                'paid_at' => $invoice->paid_at?->toIso8601String(),
                'notes' => $invoice->notes,
                'member' => [
                    'id' => $invoice->member?->id,
                    'name' => $invoice->member?->full_name,
                    'code' => $invoice->member?->member_code,
                    'package' => $invoice->member?->package?->name,
                ],
                'items' => $invoice->items->map(fn ($item) => [
                    'id' => $item->id,
                    'description' => $item->description,
                    'qty' => $item->qty,
                    'unit_price' => $item->unit_price,
                    'amount' => $item->amount,
                ]),
                'payments' => $invoice->payments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'method' => $payment->method,
                    'reference' => $payment->reference,
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                    'recorded_by' => $payment->recorder?->name,
                ]),
            ],
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $this->authorize('create', Invoice::class);

        $data = $request->validate([
            'period' => ['required', 'date_format:Y-m'],
        ]);

        $result = $this->billing->generateForAcademy(
            app(\App\Tenancy\CurrentAcademy::class)->get(),
            Carbon::createFromFormat('Y-m', $data['period']),
        );

        $message = "{$result['created']} tagihan dibuat, {$result['skipped']} dilewati (sudah ada).";

        return back()->with('success', $message);
    }

    public function void(Invoice $invoice): RedirectResponse
    {
        $this->authorize('view', $invoice);

        if ($invoice->status === 'paid') {
            return back()->with('error', 'Tagihan yang sudah lunas tidak bisa dibatalkan.');
        }

        $this->billing->void($invoice);

        return back()->with('success', 'Tagihan dibatalkan.');
    }

    public function printable(Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $invoice->load(['items', 'payments', 'member', 'academy']);

        return view('invoices.print', [
            'invoice' => $invoice,
            'academy' => $invoice->academy,
            'member' => $invoice->member,
        ]);
    }
}
