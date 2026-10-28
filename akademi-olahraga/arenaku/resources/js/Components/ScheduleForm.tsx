import { Card, SectionTitle } from '@/Components/ui';

export interface ScheduleFormData {
    title: string;
    type: string;
    status: string;
    branch_id: string;
    package_id: string;
    coach_id: string;
    starts_at: string;
    ends_at: string;
    location_name: string;
    address: string;
    maps_url: string;
    opponent_name: string;
    opponent_note: string;
    notes: string;
}

export interface Option {
    id: number;
    name: string;
}

export const emptySchedule = (): ScheduleFormData => ({
    title: '',
    type: 'training',
    status: 'draft',
    branch_id: '',
    package_id: '',
    coach_id: '',
    starts_at: '',
    ends_at: '',
    location_name: '',
    address: '',
    maps_url: '',
    opponent_name: '',
    opponent_note: '',
    notes: '',
});

const input = 'w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-ink';
const label = 'mb-1 block text-sm font-semibold text-ink';

export default function ScheduleForm({
    data,
    errors,
    onChange,
    branches,
    packages,
    coaches,
}: {
    data: ScheduleFormData;
    errors: Partial<Record<string, string>>;
    onChange: (field: keyof ScheduleFormData, value: string) => void;
    branches: Option[];
    packages: Option[];
    coaches: Option[];
}) {
    const isSparring = data.type === 'sparring';

    return (
        <div className="space-y-4">
            <Card>
                <SectionTitle>Detail jadwal</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className={label}>Judul</label>
                        <input className={input} value={data.title} onChange={(e) => onChange('title', e.target.value)} placeholder="Latihan rutin U-12" />
                        {errors.title ? <p className="mt-1 text-sm text-rose">{errors.title}</p> : null}
                    </div>
                    <div>
                        <label className={label}>Tipe</label>
                        <select className={input} value={data.type} onChange={(e) => onChange('type', e.target.value)}>
                            <option value="training">Latihan</option>
                            <option value="sparring">Sparring</option>
                            <option value="tournament">Turnamen</option>
                            <option value="event">Event</option>
                        </select>
                    </div>
                    <div>
                        <label className={label}>Status</label>
                        <select className={input} value={data.status} onChange={(e) => onChange('status', e.target.value)}>
                            <option value="draft">Draft</option>
                            <option value="published">Terbit</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Batal</option>
                        </select>
                    </div>
                    <div>
                        <label className={label}>Mulai</label>
                        <input type="datetime-local" className={input} value={data.starts_at} onChange={(e) => onChange('starts_at', e.target.value)} />
                        {errors.starts_at ? <p className="mt-1 text-sm text-rose">{errors.starts_at}</p> : null}
                    </div>
                    <div>
                        <label className={label}>Selesai</label>
                        <input type="datetime-local" className={input} value={data.ends_at} onChange={(e) => onChange('ends_at', e.target.value)} />
                        {errors.ends_at ? <p className="mt-1 text-sm text-rose">{errors.ends_at}</p> : null}
                    </div>
                </div>
            </Card>

            <Card>
                <SectionTitle>Kelas & lokasi</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={label}>Paket / kelas</label>
                        <select className={input} value={data.package_id} onChange={(e) => onChange('package_id', e.target.value)}>
                            <option value="">-</option>
                            {packages.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={label}>Pelatih</label>
                        <select className={input} value={data.coach_id} onChange={(e) => onChange('coach_id', e.target.value)}>
                            <option value="">-</option>
                            {coaches.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={label}>Lokasi (GOR)</label>
                        <select className={input} value={data.branch_id} onChange={(e) => onChange('branch_id', e.target.value)}>
                            <option value="">-</option>
                            {branches.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={label}>Nama tempat</label>
                        <input className={input} value={data.location_name} onChange={(e) => onChange('location_name', e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={label}>Alamat</label>
                        <input className={input} value={data.address} onChange={(e) => onChange('address', e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={label}>Link Google Maps</label>
                        <input className={input} value={data.maps_url} onChange={(e) => onChange('maps_url', e.target.value)} placeholder="https://maps.google.com/..." />
                    </div>
                </div>
            </Card>

            {isSparring ? (
                <Card>
                    <SectionTitle>Sparring</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={label}>Lawan</label>
                            <input className={input} value={data.opponent_name} onChange={(e) => onChange('opponent_name', e.target.value)} />
                        </div>
                        <div>
                            <label className={label}>Catatan lawan</label>
                            <input className={input} value={data.opponent_note} onChange={(e) => onChange('opponent_note', e.target.value)} />
                        </div>
                    </div>
                </Card>
            ) : null}

            <Card>
                <SectionTitle>Catatan</SectionTitle>
                <textarea
                    className={input}
                    rows={3}
                    value={data.notes}
                    onChange={(e) => onChange('notes', e.target.value)}
                />
            </Card>
        </div>
    );
}
