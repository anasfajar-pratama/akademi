<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Services\BillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(protected BillingService $billing) {}

    public function store(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorize('view', $invoice);

        if ($invoice->status === 'void') {
            return back()->with('error', 'Tagihan sudah dibatalkan.');
        }

        $data = $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
            'method' => ['required', 'in:cash,transfer,qris,other'],
            'reference' => ['nullable', 'string', 'max:120'],
            'paid_at' => ['nullable', 'date'],
        ]);

        $this->billing->recordPayment($invoice, $data, $request->user());

        return back()->with('success', 'Pembayaran dicatat.');
    }
}
