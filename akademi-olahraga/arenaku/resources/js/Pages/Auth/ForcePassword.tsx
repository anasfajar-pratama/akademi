import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthShell } from './Login';

export default function ForcePassword() {
    const { data, setData, put, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put('/password/force', {
            onSuccess: () => reset(),
        });
    };

    return (
        <>
            <Head title="Ganti Kata Sandi" />
            <AuthShell
                title="Ganti kata sandi"
                subtitle="Demi keamanan, ganti kata sandi sementara Anda sebelum melanjutkan."
            >
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="password">
                            Kata sandi baru
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            className="w-full rounded-xl border border-line px-3 py-3 text-base outline-none focus:border-ink"
                            placeholder="Minimal 8 karakter"
                        />
                        {errors.password ? <p className="mt-1 text-sm text-rose">{errors.password}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="password_confirmation">
                            Ulangi kata sandi baru
                        </label>
                        <input
                            id="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(event) => setData('password_confirmation', event.target.value)}
                            className="w-full rounded-xl border border-line px-3 py-3 text-base outline-none focus:border-ink"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-xl bg-ink px-4 py-3 text-base font-semibold text-white transition hover:bg-ink-soft disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan…' : 'Simpan & lanjut'}
                    </button>
                </form>
            </AuthShell>
        </>
    );
}
