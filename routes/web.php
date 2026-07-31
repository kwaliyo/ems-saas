<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ModuleQuestionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentJoinController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Student Instant Join & Experience (No Auth Required)
Route::get('/join/{code?}', [StudentJoinController::class, 'joinPage'])->name('join.page');
Route::post('/join', [StudentJoinController::class, 'joinSubmit'])->name('join.submit');
Route::get('/room/{room}/student/{token}', [StudentJoinController::class, 'studentRoom'])->name('student.room');
Route::get('/api/room/{room}/student/{token}/state', [StudentJoinController::class, 'studentState'])->name('student.state');
Route::post('/api/room/{room}/student/{token}/submit', [StudentJoinController::class, 'submitAnswer'])->name('student.submit');
Route::post('/api/room/{room}/student/{token}/complete', [StudentJoinController::class, 'completeExam'])->name('student.complete');

// Home Landing redirecting to join or login
Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Authenticated Instructor & Student Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Assessments
    Route::get('/assessments', [AssessmentController::class, 'index'])->name('assessments.index');
    Route::get('/assessments/create', [AssessmentController::class, 'create'])->name('assessments.create');
    Route::post('/assessments', [AssessmentController::class, 'store'])->name('assessments.store');
    Route::get('/assessments/{assessment}/edit', [AssessmentController::class, 'edit'])->name('assessments.edit');
    Route::put('/assessments/{assessment}', [AssessmentController::class, 'update'])->name('assessments.update');
    Route::delete('/assessments/{assessment}', [AssessmentController::class, 'destroy'])->name('assessments.destroy');
    Route::post('/assessments/{assessment}/duplicate', [AssessmentController::class, 'duplicate'])->name('assessments.duplicate');
    Route::post('/assessments/ai-generate', [AssessmentController::class, 'generateAi'])->name('assessments.ai');

    // Courses & Modules
    Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::get('/courses/{course}', [CourseController::class, 'show'])->name('courses.show');
    Route::post('/courses/{course}/modules', [CourseController::class, 'addModule'])->name('courses.modules.store');
    Route::put('/courses/{course}/modules/{module}', [CourseController::class, 'updateModule'])->name('courses.modules.update');
    Route::delete('/courses/{course}/modules/{module}', [CourseController::class, 'destroyModule'])->name('courses.modules.destroy');
    Route::post('/courses/{course}/enroll', [CourseController::class, 'enrollStudent'])->name('courses.enroll');
    Route::post('/courses/{course}/import-students-csv', [CourseController::class, 'importStudentsCsv'])->name('courses.import-students-csv');
    Route::post('/courses/{course}/modules/{module}/assign', [CourseController::class, 'assignAssessment'])->name('courses.modules.assign');

    // Module Dedicated Question Manager & Bulk CSV Import
    Route::get('/courses/{course}/modules/{module}/questions', [ModuleQuestionController::class, 'index'])->name('courses.modules.questions.index');
    Route::post('/courses/{course}/modules/{module}/questions', [ModuleQuestionController::class, 'storeQuestion'])->name('courses.modules.questions.store');
    Route::put('/courses/{course}/modules/{module}/questions/{question}', [ModuleQuestionController::class, 'updateQuestion'])->name('courses.modules.questions.update');
    Route::delete('/courses/{course}/modules/{module}/questions/{question}', [ModuleQuestionController::class, 'deleteQuestion'])->name('courses.modules.questions.destroy');
    Route::post('/courses/{course}/modules/{module}/questions/import-csv', [ModuleQuestionController::class, 'importCsv'])->name('courses.modules.questions.import-csv');

    // Students Directory, Profile & Course Attachments
    Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::post('/students/import-csv', [StudentController::class, 'importCsv'])->name('students.import-csv');
    Route::post('/students/generate-ids', [StudentController::class, 'generateMissingStudentNumbers'])->name('students.generate-ids');
    Route::post('/students/generate-external-ids', [StudentController::class, 'generateExternalStudentIds'])->name('students.generate-external-ids');
    Route::post('/students/bulk-destroy', [StudentController::class, 'bulkDestroy'])->name('students.bulk-destroy');
    Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show');
    Route::put('/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
    Route::post('/students/{student}/attach-courses', [StudentController::class, 'attachCourses'])->name('students.attach-courses');
    Route::delete('/students/{student}/detach-course/{course}', [StudentController::class, 'detachCourse'])->name('students.detach-course');

    // Rooms & Live Monitoring
    Route::post('/assessments/{assessment}/launch', [RoomController::class, 'launch'])->name('rooms.launch');
    Route::post('/modules/{module}/launch', [RoomController::class, 'launchModule'])->name('modules.launch');
    Route::get('/rooms/{room}/dashboard', [RoomController::class, 'liveDashboard'])->name('rooms.dashboard');
    Route::get('/api/rooms/{room}/live-data', [RoomController::class, 'liveData'])->name('rooms.live-data');
    Route::post('/rooms/{room}/next', [RoomController::class, 'nextQuestion'])->name('rooms.next');
    Route::post('/rooms/{room}/next-question', [RoomController::class, 'nextQuestion'])->name('rooms.next-question');
    Route::post('/rooms/{room}/prev', [RoomController::class, 'prevQuestion'])->name('rooms.prev');
    Route::post('/rooms/{room}/prev-question', [RoomController::class, 'prevQuestion'])->name('rooms.prev-question');
    Route::post('/rooms/{room}/pause', [RoomController::class, 'pause'])->name('rooms.pause');
    Route::post('/rooms/{room}/resume', [RoomController::class, 'resume'])->name('rooms.resume');
    Route::post('/rooms/{room}/toggle-lock', [RoomController::class, 'toggleLock'])->name('rooms.toggle-lock');
    Route::post('/rooms/{room}/end', [RoomController::class, 'end'])->name('rooms.end');

    // Reports & Export
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/{room}', [ReportController::class, 'show'])->name('reports.show');
    Route::delete('/reports/{room}', [ReportController::class, 'destroy'])->name('reports.destroy');
    Route::get('/reports/{room}/participant/{participant}', [ReportController::class, 'showScript'])->name('reports.participant-script');
    Route::get('/reports/{room}/export-csv', [ReportController::class, 'exportCsv'])->name('reports.export-csv');

    // Super Admin System Monitoring & Management
    Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('dashboard');
        Route::get('/users', [\App\Http\Controllers\Admin\AdminUserController::class, 'index'])->name('users.index');
        Route::post('/users/{user}/toggle-role', [\App\Http\Controllers\Admin\AdminUserController::class, 'toggleRole'])->name('users.toggle-role');
        Route::delete('/users/{user}', [\App\Http\Controllers\Admin\AdminUserController::class, 'destroy'])->name('users.destroy');
        Route::get('/rooms', [\App\Http\Controllers\Admin\AdminRoomController::class, 'index'])->name('rooms.index');
        Route::post('/rooms/{room}/end', [\App\Http\Controllers\Admin\AdminRoomController::class, 'endRoom'])->name('rooms.end');
    });
});

require __DIR__.'/settings.php';
