import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Ban, Check, Printer } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card, SectionTitle, StatusBadge, buttonClass } from '@/Components/ui';
import { formatDate, formatDateTime, formatRupiah } from '@/lib/utils';

interface Item {
    id: number;
    description: string;
    qty: number;
    unit_price: number;
    amount: number;
}

interface PaymentRow {
    id: number;
    amount: number;
    method: string;
    reference: string | null;
    paid_at: string | null;
    recorded_by: string | null;
}

interface InvoiceInfo {
    id: number;
    number: string;
    period_start: string | null;
    period_end: string | null;
    due_date: string | null;
    subtotal: number;
    discount: number;
    total: number;
    paid_amount: number;
    outstanding: number;
    status: string;
    paid_at: string | null;
    notes: string | null;
    member: { id: number | null; name: string | null; code: string | null; package: string | null };
    items: Item[];
    payments: PaymentRow[];
}

const input = 'w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink';
const label = 'mb-1 block text-sm font-semibold text-ink';

const methodLabel: Record<string, string> = {
    cash: 'Tunai',
    transfer: 'Transfer',
    qris: 'QRIS',
    other: 'Lainnya',
};

export default function InvoiceShow({ invoice }: { invoice: InvoiceInfo }) {
    const paymentForm = useForm({
        amount: invoice.outstanding > 0 ? invoice.outstanding : invoice.total,
        method: 'transfer',
        reference: '',
        paid_at: new Date().toISOString().slice(0, 10),
    });

    const recordPayment = () =>
        paymentForm.post(`/invoices/${invoice.id}/payments`, {
            preserveScroll: true,
            onSuccess: () => paymentForm.setData('reference', ''),
        });

    const voidInvoice = () => {
        if (confirm('Batalkan tagihan ini?')) {
            router.post(`/invoices/${invoice.id}/void`, {}, { preserveScroll: true });
        }
    };

    const canPay = invoice.status !== 'void' && invoice.status !== 'paid';

    return (
        <AppLayout title={`Tagihan ${invoice.number}`}>
            <Head title={invoice.number} />
            <Link href="/invoices" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate">
                <ArrowLeft className="h-4 w-4" /> Keuangan
            </Link>

            <Card className="mb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-lg font-extrabold text-ink">{invoice.member.name ?? '-'}</h2>
                        <p className="text-sm text-slate">
                            {invoice.member.code ?? '-'} · {invoice.member.package ?? 'Tanpa paket'}
                        </p>
                        <p className="mt-1 text-xs text-slate">
                            Periode {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)} · jatuh tempo{' '}
                            {formatDate(invoice.due_date)}
                        </p>
                    </div>
                    <StatusBadge status={invoice.status} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    <a
                        href={`/invoices/${invoice.id}/print`}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonClass('ghost', 'px-3 py-2')}
                    >
                        <Printer className="h-4 w-4" /> Kwitansi
                    </a>
                    {invoice.status !== 'void' && invoice.status !== 'paid' ? (
                        <button type="button" onClick={voidInvoice} className={buttonClass('ghost', 'px-3 py-2 text-rose')}>
                            <Ban className="h-4 w-4" /> Batalkan
                        </button>
                    ) : null}
                </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                <div>
                    <Card className="mb-4">
                        <SectionTitle>Rincian</SectionTitle>
                        <div className="divide-y divide-line">
                            {invoice.items.map((item) => (
                                <div key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">{item.description}</p>
                                        <p className="text-xs text-slate">
                                            {item.qty} × {formatRupiah(item.unit_price)}
                                        </p>
                                    </div>
                                    <span className="shrink-0 font-semibold tabular-nums text-ink">{formatRupiah(item.amount)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                            <div className="flex justify-between text-slate">
                                <span>Subtotal</span>
                                <span className="tabular-nums">{formatRupiah(invoice.subtotal)}</span>
                            </div>
                            {invoice.discount > 0 ? (
                                <div className="flex justify-between text-slate">
                                    <span>Diskon</span>
                                    <span className="tabular-nums">- {formatRupiah(invoice.discount)}</span>
                                </div>
                            ) : null}
                            <div className="flex justify-between text-base font-extrabold text-ink">
                                <span>Total</span>
                                <span className="tabular-nums">{formatRupiah(invoice.total)}</span>
                            </div>
                            <div className="flex justify-between text-slate">
                                <span>Sudah dibayar</span>
                                <span className="tabular-nums">{formatRupiah(invoice.paid_amount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-ink">
                                <span>Sisa</span>
                                <span className="tabular-nums">{formatRupiah(invoice.outstanding)}</span>
                            </div>
                        </div>
                    </Card>

                    {canPay ? (
                        <Card>
                            <SectionTitle>Catat pembayaran</SectionTitle>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className={label}>Jumlah (Rp)</label>
                                    <input
                                        type="number"
                                        className={input}
                                        value={paymentForm.data.amount}
                                        onChange={(event) => paymentForm.setData('amount', Number(event.target.value))}
                                    />
                                    {paymentForm.errors.amount ? (
                                        <p className="mt-1 text-sm text-rose">{paymentForm.errors.amount}</p>
                                    ) : null}
                                </div>
                                <div>
                                    <label className={label}>Metode</label>
                                    <select
                                        className={input}
                                        value={paymentForm.data.method}
                                        onChange={(event) => paymentForm.setData('method', event.target.value)}
                                    >
                                        <option value="transfer">Transfer</option>
                                        <option value="cash">Tunai</option>
                                        <option value="qris">QRIS</option>
                                        <option value="other">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={label}>Tanggal bayar</label>
                                    <input
                                        type="date"
                                        className={input}
                                        value={paymentForm.data.paid_at}
                                        onChange={(event) => paymentForm.setData('paid_at', event.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={label}>Referensi</label>
                                    <input
                                        className={input}
                                        value={paymentForm.data.reference}
                                        onChange={(event) => paymentForm.setData('reference', event.target.value)}
                                        placeholder="No. transfer / catatan"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                className={buttonClass('primary', 'mt-3 w-full')}
                                disabled={paymentForm.processing}
                                onClick={recordPayment}
                            >
                                <Check className="h-4 w-4" /> {paymentForm.processing ? 'Menyimpan…' : 'Simpan pembayaran'}
                            </button>
                        </Card>
                    ) : null}
                </div>

                <div>
                    <Card>
                        <SectionTitle>Riwayat pembayaran ({invoice.payments.length})</SectionTitle>
                        {invoice.payments.length === 0 ? (
                            <p className="text-sm text-slate">Belum ada pembayaran.</p>
                        ) : (
                            <div className="divide-y divide-line">
                                {invoice.payments.map((payment) => (
                                    <div key={payment.id} className="flex items-start justify-between gap-3 py-2.5">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-ink">{formatRupiah(payment.amount)}</p>
                                            <p className="text-xs text-slate">
                                                {formatDateTime(payment.paid_at)} · {methodLabel[payment.method] ?? payment.method}
                                            </p>
                                            {payment.reference ? (
                                                <p className="text-xs text-slate">Ref: {payment.reference}</p>
                                            ) : null}
                                        </div>
                                        {payment.recorded_by ? <Badge tone="neutral">{payment.recorded_by}</Badge> : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {invoice.status === 'paid' ? (
                        <Card className="mt-4 border-emerald/40 bg-emerald-50">
                            <p className="text-sm font-semibold text-emerald-700">
                                Lunas{invoice.paid_at ? ` pada ${formatDateTime(invoice.paid_at)}` : ''}.
                            </p>
                        </Card>
                    ) : null}
                </div>
            </div>
        </AppLayout>
    );
}
