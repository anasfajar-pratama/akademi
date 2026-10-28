<?php

use App\Http\Controllers\AcademyController;
use App\Http\Controllers\AcademySwitchController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ForcePasswordController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CoachController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\ParentPortalController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SkillAssessmentController;
use App\Http\Controllers\SkillController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard');

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware(['auth', 'password.changed'])->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('password/force', [ForcePasswordController::class, 'edit'])->name('password.force');
    Route::put('password/force', [ForcePasswordController::class, 'update'])->name('password.force.update');

    Route::post('academy/switch', [AcademySwitchController::class, 'store'])->name('academy.switch');

    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Super Admin — akademi & provisioning
    Route::resource('academies', AcademyController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update']);
    Route::post('academies/{academy}/status', [AcademyController::class, 'toggleStatus'])->name('academies.status');
    Route::post('academies/{academy}/accounts', [AccountController::class, 'store'])->name('academies.accounts.store');
    Route::post('academies/{academy}/accounts/{user}/resend', [AccountController::class, 'resend'])->name('academies.accounts.resend');
    Route::patch('academies/{academy}/accounts/{user}/toggle', [AccountController::class, 'toggle'])->name('academies.accounts.toggle');

    // Scoped to the current academy
    Route::middleware('academy')->group(function () {
        // Pengaturan akademi
        Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('settings/branches', [BranchController::class, 'store'])->name('branches.store');
        Route::delete('settings/branches/{branch}', [BranchController::class, 'destroy'])->name('branches.destroy');
        Route::post('settings/packages', [PackageController::class, 'store'])->name('packages.store');
        Route::delete('settings/packages/{package}', [PackageController::class, 'destroy'])->name('packages.destroy');

        // Member
        Route::resource('members', MemberController::class);

        // Jadwal & absensi
        Route::resource('schedules', ScheduleController::class)->except(['show']);
        Route::post('schedules/{schedule}/start', [AttendanceController::class, 'start'])->name('schedules.start');

        // Skill & penilaian
        Route::get('skills', [SkillController::class, 'index'])->name('skills.index');
        Route::post('skills/categories', [SkillController::class, 'storeCategory'])->name('skills.categories.store');
        Route::post('skills', [SkillController::class, 'store'])->name('skills.store');
        Route::delete('skills/{skill}', [SkillController::class, 'destroy'])->name('skills.destroy');

        Route::get('assessments', [SkillAssessmentController::class, 'index'])->name('assessments.index');
        Route::get('assessments/{session}', [SkillAssessmentController::class, 'show'])->name('assessments.show');
        Route::put('assessments/{session}', [SkillAssessmentController::class, 'update'])->name('assessments.update');

        // Keuangan
        Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
        Route::post('invoices/generate', [InvoiceController::class, 'generate'])->name('invoices.generate');
        Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
        Route::get('invoices/{invoice}/print', [InvoiceController::class, 'printable'])->name('invoices.print');
        Route::post('invoices/{invoice}/void', [InvoiceController::class, 'void'])->name('invoices.void');
        Route::post('invoices/{invoice}/payments', [PaymentController::class, 'store'])->name('invoices.payments.store');

        // Portal orang tua
        Route::get('portal', [ParentPortalController::class, 'index'])->name('portal.index');
        Route::get('portal/children/{member}', [ParentPortalController::class, 'show'])->name('portal.children.show');

        // Pelatih
        Route::get('coach', [CoachController::class, 'index'])->name('coach.index');
        Route::get('coach/sessions/{session}', [CoachController::class, 'attendance'])->name('coach.attendance');
        Route::put('coach/sessions/{session}', [CoachController::class, 'updateAttendance'])->name('coach.attendance.update');
    });
});
