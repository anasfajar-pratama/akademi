<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kwitansi {{ $invoice->number }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0b1220; margin: 0; padding: 32px; background: #f5f7fa; }
        .sheet { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e6eaf1; border-radius: 14px; padding: 32px; }
        .row { display: flex; justify-content: space-between; gap: 24px; }
        .brand { display: flex; align-items: center; gap: 10px; }
        .brand-mark { width: 38px; height: 38px; border-radius: 12px; background: #c9f24d; color: #0b1220; display: grid; place-items: center; font-weight: 800; }
        h1 { font-size: 20px; margin: 0; }
        .muted { color: #64748b; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #eef1f6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e6eaf1; }
        td { padding: 11px 12px; border-bottom: 1px solid #eef1f6; font-size: 13px; }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        .total { font-size: 15px; font-weight: 800; }
        hr { border: 0; border-top: 1px solid #eef1f6; margin: 22px 0; }
        .actions { max-width: 720px; margin: 0 auto 16px; display: flex; gap: 8px; justify-content: flex-end; }
        .btn { border: 1px solid #e6eaf1; background: #fff; border-radius: 10px; padding: 9px 14px; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; color: #0b1220; }
        .btn-primary { background: #0b1220; color: #fff; border-color: #0b1220; }
        @media print {
            body { background: #fff; padding: 0; }
            .actions { display: none; }
            .sheet { border: 0; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="actions">
        <a class="btn" href="{{ url()->previous() }}">Kembali</a>
        <button class="btn btn-primary" onclick="window.print()">Cetak</button>
    </div>

    <div class="sheet">
        <div class="row">
            <div class="brand">
                <span class="brand-mark">A</span>
                <div>
                    <h1>{{ $academy->name }}</h1>
                    <div class="muted">{{ $academy->address }}{{ $academy->city ? ', '.$academy->city : '' }}</div>
                    <div class="muted">{{ $academy->phone }} {{ $academy->email ? '· '.$academy->email : '' }}</div>
                </div>
            </div>
            <div style="text-align:right">
                <div class="muted">Kwitansi / Tagihan</div>
                <h1>{{ $invoice->number }}</h1>
                <span class="badge">{{ strtoupper($invoice->status) }}</span>
            </div>
        </div>

        <hr>

        <div class="row">
            <div>
                <div class="muted">Ditagihkan kepada</div>
                <div><strong>{{ $member?->full_name ?? '-' }}</strong></div>
                <div class="muted">{{ $member?->member_code ?? '-' }}</div>
            </div>
            <div style="text-align:right">
                <div class="muted">Periode</div>
                <div><strong>{{ $invoice->period_start?->format('d M Y') }} – {{ $invoice->period_end?->format('d M Y') }}</strong></div>
                <div class="muted">Jatuh tempo {{ $invoice->due_date?->format('d M Y') }}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Deskripsi</th>
                    <th class="num">Qty</th>
                    <th class="num">Harga</th>
                    <th class="num">Jumlah</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($invoice->items as $item)
                    <tr>
                        <td>{{ $item->description }}</td>
                        <td class="num">{{ $item->qty }}</td>
                        <td class="num">Rp {{ number_format($item->unit_price, 0, ',', '.') }}</td>
                        <td class="num">Rp {{ number_format($item->amount, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
                <tr>
                    <td colspan="3" class="num muted">Subtotal</td>
                    <td class="num">Rp {{ number_format($invoice->subtotal, 0, ',', '.') }}</td>
                </tr>
                @if ($invoice->discount > 0)
                    <tr>
                        <td colspan="3" class="num muted">Diskon</td>
                        <td class="num">- Rp {{ number_format($invoice->discount, 0, ',', '.') }}</td>
                    </tr>
                @endif
                <tr>
                    <td colspan="3" class="num total">Total</td>
                    <td class="num total">Rp {{ number_format($invoice->total, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td colspan="3" class="num muted">Sudah dibayar</td>
                    <td class="num">Rp {{ number_format($invoice->paid_amount, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td colspan="3" class="num muted">Sisa</td>
                    <td class="num">Rp {{ number_format($invoice->outstanding(), 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

        @if ($invoice->payments->isNotEmpty())
            <hr>
            <div class="muted" style="margin-bottom:8px">Riwayat pembayaran</div>
            <table>
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Metode</th>
                        <th>Referensi</th>
                        <th class="num">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($invoice->payments as $payment)
                        <tr>
                            <td>{{ $payment->paid_at?->format('d M Y') }}</td>
                            <td>{{ strtoupper($payment->method) }}</td>
                            <td>{{ $payment->reference ?? '-' }}</td>
                            <td class="num">Rp {{ number_format($payment->amount, 0, ',', '.') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        @if ($invoice->notes)
            <hr>
            <div class="muted">{{ $invoice->notes }}</div>
        @endif

        <hr>
        <div class="muted">Terima kasih. Kwitansi ini dibuat otomatis oleh Arenaku.</div>
    </div>
</body>
</html>
