import { router, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    ClipboardCheck,
    Layers,
    LayoutDashboard,
    LogOut,
    Settings,
    Sparkles,
    Users,
    Wallet,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types';

interface NavItem {
    label: string;
    href: string;
    icon: ReactNode;
    show: boolean;
    mobile?: boolean;
}

export default function AppLayout({
    title,
    children,
    actions,
}: {
    title: string;
    children: ReactNode;
    actions?: ReactNode;
}) {
    const { auth, currentAcademy, flash, academies } = usePage<PageProps>().props;
    const url = usePage().url;
    const role = auth.role;
    const isSuperAdmin = auth.user?.is_super_admin ?? false;

    const isAdmin = isSuperAdmin || role === 'admin';
    const canSwitchAcademy = isSuperAdmin ? academies.length > 0 : auth.memberships.length > 1;

    const items: NavItem[] = [
        {
            label: 'Dashboard',
            href: '/dashboard',
            icon: <LayoutDashboard className="h-5 w-5" />,
            show: true,
            mobile: true,
        },
        {
            label: 'Member',
            href: '/members',
            icon: <Users className="h-5 w-5" />,
            show: isAdmin || role === 'coach',
            mobile: true,
        },
        {
            label: 'Keuangan',
            href: '/invoices',
            icon: <Wallet className="h-5 w-5" />,
            show: isAdmin,
            mobile: true,
        },
        {
            label: 'Jadwal',
            href: '/schedules',
            icon: <CalendarDays className="h-5 w-5" />,
            show: isAdmin,
            mobile: false,
        },
        {
            label: 'Penilaian',
            href: '/assessments',
            icon: <Sparkles className="h-5 w-5" />,
            show: isAdmin || role === 'coach',
            mobile: true,
        },
        {
            label: 'Skill',
            href: '/skills',
            icon: <Layers className="h-5 w-5" />,
            show: isAdmin || role === 'coach',
        },
        {
            label: 'Pengaturan',
            href: '/settings',
            icon: <Settings className="h-5 w-5" />,
            show: isAdmin,
            mobile: true,
        },
        {
            label: 'Akademi',
            href: '/academies',
            icon: <Building2 className="h-5 w-5" />,
            show: isSuperAdmin,
        },
        {
            label: 'Jadwal Saya',
            href: '/coach',
            icon: <ClipboardCheck className="h-5 w-5" />,
            show: role === 'coach',
            mobile: role === 'coach',
        },
        {
            label: 'Anak Saya',
            href: '/portal',
            icon: <Users className="h-5 w-5" />,
            show: role === 'parent' || role === 'member',
            mobile: true,
        },
    ];

    const visible = items.filter((item) => item.show);
    const mobileItems = visible.filter((item) => item.mobile).slice(0, 4);

    const isActive = (href: string) => url === href || url.startsWith(href + '/');

    const [toast, setToast] = useState<string | null>(null);
    const [toastTone, setToastTone] = useState<'success' | 'error'>('success');

    useEffect(() => {
        if (flash?.success) {
            setToast(flash.success);
            setToastTone('success');
        } else if (flash?.error) {
            setToast(flash.error);
            setToastTone('error');
        } else {
            return;
        }

        const timer = setTimeout(() => setToast(null), 4000);

        return () => clearTimeout(timer);
    }, [flash?.success, flash?.error]);

    const switchAcademy = (value: string) => {
        router.post('/academy/switch', { academy_id: Number(value) }, { preserveScroll: true });
    };

    return (
        <div className="min-h-screen bg-surface md:flex">
            <aside className="hidden w-64 shrink-0 flex-col bg-ink px-4 py-6 text-white md:flex">
                <div className="flex items-center gap-2 px-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime font-extrabold text-ink">
                        A
                    </span>
                    <span className="text-lg font-extrabold">Arenaku</span>
                </div>

                <nav className="mt-8 flex flex-1 flex-col gap-1">
                    {visible.map((item) => (
                        <a
                            key={item.href + item.label}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                                isActive(item.href)
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="mt-6 rounded-xl bg-white/5 p-3">
                    <p className="text-sm font-semibold">{auth.user?.name}</p>
                    <p className="text-xs text-white/50">{auth.user?.email ?? auth.user?.phone}</p>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur md:static">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-bold text-ink md:text-xl">{title}</h1>
                            {currentAcademy ? (
                                <p className="truncate text-xs text-slate">{currentAcademy.name}</p>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                            {actions}
                            {canSwitchAcademy ? (
                                <select
                                    className="max-w-[10rem] rounded-xl border border-line bg-white px-2 py-2 text-sm font-medium"
                                    value={currentAcademy?.id ?? ''}
                                    onChange={(event) => switchAcademy(event.target.value)}
                                >
                                    <option value="" disabled>
                                        Pilih akademi…
                                    </option>
                                    {isSuperAdmin
                                        ? academies.map((academy) => (
                                              <option key={academy.id} value={academy.id}>
                                                  {academy.name}
                                              </option>
                                          ))
                                        : auth.memberships.map((membership) => (
                                              <option key={membership.academy_id} value={membership.academy_id}>
                                                  {membership.academy_name} · {membership.role_label}
                                              </option>
                                          ))}
                                </select>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="grid h-10 w-10 place-items-center rounded-xl border border-line text-slate hover:bg-surface"
                                aria-label="Keluar"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-6">{children}</main>

                {mobileItems.length > 0 ? (
                    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white/95 backdrop-blur md:hidden">
                        {mobileItems.map((item) => (
                            <a
                                key={item.href + item.label}
                                href={item.href}
                                className={cn(
                                    'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold',
                                    isActive(item.href) ? 'text-ink' : 'text-slate',
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </a>
                        ))}
                    </nav>
                ) : null}
            </div>

            {toast ? (
                <div
                    className={
                        'fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ' +
                        (toastTone === 'error' ? 'bg-rose' : 'bg-emerald')
                    }
                >
                    {toast}
                </div>
            ) : null}
        </div>
    );
}
