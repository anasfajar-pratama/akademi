import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState, type FormEvent, type ReactNode } from 'react';
import type { DemoAccount, PageProps } from '@/types';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-10">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex items-center gap-2 text-white">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime font-extrabold text-ink">
                        A
                    </span>
                    <span className="text-xl font-extrabold">Arenaku</span>
                </div>

                <div className="rounded-card bg-white p-6 shadow-xl">
                    <h1 className="text-xl font-extrabold text-ink">{title}</h1>
                    <p className="mt-1 text-sm text-slate">{subtitle}</p>
                    <div className="mt-5">{children}</div>
                </div>

                <p className="mt-6 text-center text-xs text-white/40">
                    © {new Date().getFullYear()} Arenaku · Manajemen akademi olahraga
                </p>
            </div>
        </div>
    );
}

export default function Login() {
    const { demoAccounts } = usePage<PageProps>().props;
    const { data, setData, post, processing, errors } = useForm({
        login: '',
        password: '',
        remember: false,
    });
    const [loadingAs, setLoadingAs] = useState<string | null>(null);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post('/login');
    };

    const loginAs = (account: DemoAccount) => {
        setData('login', account.login);
        setData('password', account.password);
        setLoadingAs(account.login);
        router.post(
            '/login',
            { login: account.login, password: account.password, remember: false },
            { onFinish: () => setLoadingAs(null) },
        );
    };

    const fill = (account: DemoAccount) => {
        setData('login', account.login);
        setData('password', account.password);
    };

    return (
        <>
            <Head title="Masuk" />
            <AuthShell title="Masuk" subtitle="Gunakan email atau nomor HP terdaftar.">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="login">
                            Email atau No. HP
                        </label>
                        <input
                            id="login"
                            type="text"
                            autoComplete="username"
                            inputMode="email"
                            value={data.login}
                            onChange={(event) => setData('login', event.target.value)}
                            className="w-full rounded-xl border border-line px-3 py-3 text-base outline-none focus:border-ink"
                            placeholder="nama@email.com atau 0812..."
                        />
                        {errors.login ? <p className="mt-1 text-sm text-rose">{errors.login}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="password">
                            Kata sandi
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            className="w-full rounded-xl border border-line px-3 py-3 text-base outline-none focus:border-ink"
                            placeholder="••••••••"
                        />
                        {errors.password ? <p className="mt-1 text-sm text-rose">{errors.password}</p> : null}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(event) => setData('remember', event.target.checked)}
                            className="h-4 w-4 rounded border-line"
                        />
                        Ingat saya
                    </label>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-xl bg-ink px-4 py-3 text-base font-semibold text-white transition hover:bg-ink-soft disabled:opacity-50"
                    >
                        {processing ? 'Memproses…' : 'Masuk'}
                    </button>
                </form>

                {demoAccounts.length > 0 ? (
                    <div className="mt-6 border-t border-line pt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate">Akun demo — klik untuk masuk</p>
                        <div className="mt-3 space-y-2">
                            {demoAccounts.map((account) => (
                                <div
                                    key={account.login}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3"
                                >
                                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => fill(account)}>
                                        <p className="truncate text-sm font-bold text-ink">{account.role}</p>
                                        <p className="truncate text-xs text-slate">{account.description}</p>
                                        <p className="mt-0.5 truncate font-mono text-[11px] text-slate">
                                            {account.login} · {account.password}
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => loginAs(account)}
                                        disabled={loadingAs === account.login}
                                        className="shrink-0 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink-soft disabled:opacity-50"
                                    >
                                        {loadingAs === account.login ? '…' : 'Masuk'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-center text-[11px] text-slate">
                            Hanya tampil saat mode demo. Di produksi daftar ini dimatikan.
                        </p>
                    </div>
                ) : null}
            </AuthShell>
        </>
    );
}
