import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div className={cn('rounded-card border border-line bg-white p-4 shadow-sm sm:p-5', className)}>
            {children}
        </div>
    );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">{children}</h2>
            {action}
        </div>
    );
}

const badgeTones: Record<string, string> = {
    neutral: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    sky: 'bg-sky-50 text-sky-700',
    lime: 'bg-lime/30 text-ink',
    ink: 'bg-ink text-white',
};

export function Badge({
    children,
    tone = 'neutral',
    className,
}: {
    children: ReactNode;
    tone?: keyof typeof badgeTones | string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                badgeTones[tone] ?? badgeTones.neutral,
                className,
            )}
        >
            {children}
        </span>
    );
}

export function StatusBadge({ status }: { status?: string | null }) {
    const map: Record<string, { label: string; tone: string }> = {
        trial: { label: 'Trial', tone: 'sky' },
        active: { label: 'Aktif', tone: 'emerald' },
        inactive: { label: 'Non-aktif', tone: 'slate' },
        alumni: { label: 'Alumni', tone: 'neutral' },
        present: { label: 'Hadir', tone: 'emerald' },
        late: { label: 'Terlambat', tone: 'amber' },
        permitted: { label: 'Izin', tone: 'sky' },
        sick: { label: 'Sakit', tone: 'amber' },
        absent: { label: 'Alpa', tone: 'rose' },
        published: { label: 'Terbit', tone: 'emerald' },
        draft: { label: 'Draft', tone: 'neutral' },
        unpaid: { label: 'Belum bayar', tone: 'amber' },
        partial: { label: 'Sebagian', tone: 'sky' },
        paid: { label: 'Lunas', tone: 'emerald' },
        overdue: { label: 'Terlambat', tone: 'rose' },
        void: { label: 'Dibatalkan', tone: 'neutral' },
        completed: { label: 'Selesai', tone: 'sky' },
        cancelled: { label: 'Batal', tone: 'rose' },
    };

    const entry = status ? map[status] : undefined;

    return <Badge tone={entry?.tone ?? 'neutral'}>{entry?.label ?? status ?? '-'}</Badge>;
}

export function StatCard({
    label,
    value,
    hint,
    icon,
}: {
    label: string;
    value: ReactNode;
    hint?: string;
    icon?: ReactNode;
}) {
    return (
        <Card className="flex items-start justify-between gap-3">
            <div>
                <p className="text-xs font-medium text-slate">{label}</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{value}</p>
                {hint ? <p className="mt-1 text-xs text-slate">{hint}</p> : null}
            </div>
            {icon ? (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-ink">
                    {icon}
                </span>
            ) : null}
        </Card>
    );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
    return (
        <div className="rounded-card border border-dashed border-line bg-white p-8 text-center">
            <p className="font-semibold text-ink">{title}</p>
            {description ? <p className="mt-1 text-sm text-slate">{description}</p> : null}
        </div>
    );
}

const buttonVariants = {
    primary: 'bg-ink text-white hover:bg-ink-soft',
    secondary: 'bg-lime text-ink hover:brightness-95',
    ghost: 'bg-transparent text-ink hover:bg-surface',
    danger: 'bg-rose text-white hover:brightness-95',
};

export function buttonClass(variant: keyof typeof buttonVariants = 'primary', className?: string): string {
    return cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 tap-target',
        buttonVariants[variant],
        className,
    );
}
