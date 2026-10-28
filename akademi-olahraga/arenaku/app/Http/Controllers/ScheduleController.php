<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreScheduleRequest;
use App\Models\Branch;
use App\Models\Package;
use App\Models\Schedule;
use App\Models\User;
use App\Tenancy\CurrentAcademy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Schedule::class);

        $search = $request->string('q')->toString();

        $schedules = Schedule::query()
            ->with(['branch:id,name', 'package:id,name', 'coach:id,name'])
            ->when($search !== '', fn ($query) => $query->where('title', 'like', "%{$search}%"))
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByDesc('starts_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Schedule $schedule) => [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'type' => $schedule->type,
                'status' => $schedule->status,
                'starts_at' => $schedule->starts_at?->toIso8601String(),
                'location' => $schedule->location_name ?? $schedule->branch?->name,
                'package' => $schedule->package?->name,
                'coach' => $schedule->coach?->name,
                'open_session_id' => $schedule->attendanceSessions()->where('status', 'open')->value('id'),
            ]);

        return Inertia::render('Schedules/Index', [
            'schedules' => $schedules,
            'filters' => $request->only('q', 'type', 'status'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Schedule::class);

        return Inertia::render('Schedules/Create', $this->formOptions());
    }

    public function store(StoreScheduleRequest $request): RedirectResponse
    {
        $this->authorize('create', Schedule::class);

        Schedule::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('schedules.index')->with('success', 'Jadwal dibuat.');
    }

    public function edit(Schedule $schedule): Response
    {
        $this->authorize('update', $schedule);

        return Inertia::render('Schedules/Edit', [
            ...$this->formOptions(),
            'schedule' => [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'type' => $schedule->type,
                'status' => $schedule->status,
                'branch_id' => $schedule->branch_id,
                'package_id' => $schedule->package_id,
                'coach_id' => $schedule->coach_id,
                'starts_at' => $schedule->starts_at?->format('Y-m-d\TH:i'),
                'ends_at' => $schedule->ends_at?->format('Y-m-d\TH:i'),
                'location_name' => $schedule->location_name,
                'address' => $schedule->address,
                'maps_url' => $schedule->maps_url,
                'opponent_name' => $schedule->opponent_name,
                'opponent_note' => $schedule->opponent_note,
                'notes' => $schedule->notes,
            ],
        ]);
    }

    public function update(StoreScheduleRequest $request, Schedule $schedule): RedirectResponse
    {
        $this->authorize('update', $schedule);

        $schedule->update($request->validated());

        return redirect()->route('schedules.index')->with('success', 'Jadwal diperbarui.');
    }

    public function destroy(Schedule $schedule): RedirectResponse
    {
        $this->authorize('delete', $schedule);

        $schedule->delete();

        return back()->with('success', 'Jadwal dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function formOptions(): array
    {
        $academyId = app(CurrentAcademy::class)->id();

        return [
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
            'packages' => Package::orderBy('name')->get(['id', 'name']),
            'coaches' => User::query()
                ->whereHas('memberships', fn ($query) => $query
                    ->where('academy_id', $academyId)
                    ->where('role', 'coach'))
                ->orderBy('name')
                ->get(['id', 'name']),
        ];
    }
}
