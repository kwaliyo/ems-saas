<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Module;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    private function authorizeCourseManagement(Course $course, User $user): void
    {
        $canManage = $course->user_id === $user->id || $user->isSuperAdmin() || $user->role === 'instructor';
        if (! $canManage) {
            abort(403, 'Unauthorized access to course management.');
        }
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        // Taught courses created by this instructor
        $taughtCourses = $user->taughtCourses()
            ->withCount(['modules', 'students'])
            ->with(['modules.assessments.rooms'])
            ->latest()
            ->get();

        // All courses in the institution directory
        $allCourses = Course::with('instructor')
            ->withCount(['modules', 'students'])
            ->with(['modules.assessments.rooms'])
            ->latest()
            ->get();

        if ($user->isSuperAdmin() || $taughtCourses->isEmpty() || $user->role === 'instructor') {
            $taughtCourses = $allCourses;
        }

        // Enrolled courses as a student
        $enrolledCourses = $user->enrolledCourses()
            ->with(['modules.assessments' => function ($q) {
                $q->with(['rooms' => function ($rq) {
                    $rq->whereIn('status', ['waiting', 'active', 'paused'])->latest();
                }]);
            }])
            ->latest()
            ->get();

        return Inertia::render('courses/Index', [
            'taughtCourses' => $taughtCourses,
            'enrolledCourses' => $enrolledCourses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:courses,code',
            'description' => 'nullable|string',
            'modules' => 'nullable|array',
            'modules.*.title' => 'required|string',
            'modules.*.code' => 'nullable|string|max:50',
            'modules.*.description' => 'nullable|string',
            'modules.*.exam_duration_minutes' => 'nullable|integer|min:1',
            'modules.*.allow_retake' => 'boolean',
            'modules.*.allow_review' => 'boolean',
            'modules.*.hide_score' => 'boolean',
            'modules.*.visibility' => 'nullable|string|in:published,draft,hidden',
        ]);

        $course = $request->user()->taughtCourses()->create([
            'title' => $validated['title'],
            'code' => strtoupper($validated['code']),
            'description' => $validated['description'] ?? null,
        ]);

        if (isset($validated['modules']) && is_array($validated['modules'])) {
            foreach ($validated['modules'] as $index => $m) {
                $course->modules()->create([
                    'title' => $m['title'],
                    'code' => isset($m['code']) ? strtoupper($m['code']) : null,
                    'description' => $m['description'] ?? null,
                    'exam_duration_minutes' => $m['exam_duration_minutes'] ?? null,
                    'allow_retake' => $m['allow_retake'] ?? false,
                    'allow_review' => $m['allow_review'] ?? true,
                    'hide_score' => $m['hide_score'] ?? false,
                    'visibility' => $m['visibility'] ?? 'published',
                    'order' => $index,
                ]);
            }
        }

        return redirect()->route('courses.show', $course->id)->with('success', 'Course created.');
    }

    public function show(Course $course): Response
    {
        $course->load([
            'instructor',
            'modules' => function ($mq) {
                $mq->withCount('questions')->with(['assessments' => function ($q) {
                    $q->withCount('questions')->with('rooms');
                }]);
            },
            'students',
        ]);

        // Get available assessments to assign to modules
        $availableAssessments = auth()->user()->assessments()->latest()->get();

        return Inertia::render('courses/Show', [
            'course' => $course,
            'availableAssessments' => $availableAssessments,
        ]);
    }

    public function addModule(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeCourseManagement($course, $request->user());

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'exam_duration_minutes' => 'nullable|integer|min:1',
            'allow_retake' => 'boolean',
            'allow_review' => 'boolean',
            'hide_score' => 'boolean',
            'visibility' => 'required|string|in:published,draft,hidden',
        ]);

        $module = $course->modules()->create([
            'title' => $validated['title'],
            'code' => isset($validated['code']) ? strtoupper($validated['code']) : null,
            'description' => $validated['description'] ?? null,
            'exam_duration_minutes' => $validated['exam_duration_minutes'] ?? null,
            'allow_retake' => $request->boolean('allow_retake'),
            'allow_review' => $request->boolean('allow_review', true),
            'hide_score' => $request->boolean('hide_score'),
            'visibility' => $validated['visibility'] ?? 'published',
            'order' => $course->modules()->count(),
        ]);

        return back()->with('success', 'Module added.');
    }

    public function updateModule(Request $request, Course $course, Module $module): RedirectResponse
    {
        $this->authorizeCourseManagement($course, $request->user());
        if ($module->course_id !== $course->id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'exam_duration_minutes' => 'nullable|integer|min:1',
            'allow_retake' => 'boolean',
            'allow_review' => 'boolean',
            'hide_score' => 'boolean',
            'visibility' => 'required|string|in:published,draft,hidden',
        ]);

        $module->update([
            'title' => $validated['title'],
            'code' => isset($validated['code']) ? strtoupper($validated['code']) : null,
            'description' => $validated['description'] ?? null,
            'exam_duration_minutes' => $validated['exam_duration_minutes'] ?? null,
            'allow_retake' => $request->boolean('allow_retake'),
            'allow_review' => $request->boolean('allow_review'),
            'hide_score' => $request->boolean('hide_score'),
            'visibility' => $validated['visibility'] ?? 'published',
        ]);

        return back()->with('success', 'Module updated.');
    }

    public function destroyModule(Request $request, Course $course, Module $module): RedirectResponse
    {
        $this->authorizeCourseManagement($course, $request->user());
        if ($module->course_id !== $course->id) {
            abort(403);
        }

        $module->delete();

        return back()->with('success', 'Module deleted.');
    }

    public function enrollStudent(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeCourseManagement($course, $request->user());

        $validated = $request->validate([
            'student_number' => 'nullable|string|max:50',
            'first_name' => 'nullable|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'surname' => 'nullable|string|max:100',
            'gender' => 'nullable|string|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'name' => 'nullable|string|max:255',
            'email' => 'required|email',
            'password' => 'nullable|string|min:6',
        ]);

        $email = strtolower(trim($validated['email']));
        $firstName = ! empty($validated['first_name']) ? trim($validated['first_name']) : null;
        $middleName = ! empty($validated['middle_name']) ? trim($validated['middle_name']) : null;
        $surname = ! empty($validated['surname']) ? trim($validated['surname']) : null;

        if ($firstName || $surname) {
            $fullName = trim(($firstName ?? '').($middleName ? ' '.$middleName : '').($surname ? ' '.$surname : ''));
        } else {
            $fullName = ! empty($validated['name']) ? trim($validated['name']) : explode('@', $email)[0];
            $nameParts = explode(' ', $fullName, 3);
            $firstName = $nameParts[0] ?? $fullName;
            $surname = isset($nameParts[1]) ? implode(' ', array_slice($nameParts, 1)) : '';
        }

        $student = User::where('email', $email)->first();

        if (! $student) {
            $student = User::create([
                'created_by_user_id' => $request->user()->id,
                'student_number' => ! empty($validated['student_number']) ? trim($validated['student_number']) : User::generateNextStudentNumber(),
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'surname' => $surname,
                'gender' => $validated['gender'] ?? null,
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'name' => $fullName,
                'email' => $email,
                'password' => bcrypt($validated['password'] ?? 'password123'),
                'email_verified_at' => now(),
            ]);
        } else {
            $upData = [];
            if (! empty($validated['student_number'])) {
                $upData['student_number'] = trim($validated['student_number']);
            }
            if ($firstName) {
                $upData['first_name'] = $firstName;
            }
            if ($middleName) {
                $upData['middle_name'] = $middleName;
            }
            if ($surname) {
                $upData['surname'] = $surname;
            }
            if (! empty($validated['gender'])) {
                $upData['gender'] = $validated['gender'];
            }
            if (! empty($validated['date_of_birth'])) {
                $upData['date_of_birth'] = $validated['date_of_birth'];
            }
            if (! empty($validated['password'])) {
                $upData['password'] = bcrypt($validated['password']);
            }
            if (! empty($upData)) {
                $student->update($upData);
            }
        }

        $course->students()->syncWithoutDetaching([$student->id]);

        return back()->with('success', "Student {$student->name} enrolled successfully.");
    }

    public function importStudentsCsv(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeCourseManagement($course, $request->user());

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('csv_file');
        $handle = fopen($file->getRealPath(), 'r');

        $enrolledCount = 0;
        $firstLine = fgetcsv($handle);
        $headerMap = [];
        $isHeader = false;

        if ($firstLine) {
            foreach ($firstLine as $colIdx => $colName) {
                $cleanCol = strtolower(trim(str_replace([' ', '_', '-'], '', $colName)));
                if (in_array($cleanCol, ['email', 'studentnumber', 'studentid', 'firstname', 'lastname', 'surname', 'gender', 'dateofbirth', 'dob', 'name'])) {
                    $isHeader = true;
                }
                $headerMap[$cleanCol] = $colIdx;
            }
        }

        if (! $isHeader) {
            rewind($handle);
            $headerMap = [];
        }

        $instructorId = $request->user()->id;

        DB::transaction(function () use ($handle, $headerMap, $course, $instructorId, &$enrolledCount) {
            while (($row = fgetcsv($handle)) !== false) {
                if (empty($row) || count(array_filter($row)) === 0) {
                    continue;
                }

                $email = null;
                $studentNumber = null;
                $firstName = null;
                $middleName = null;
                $surname = null;
                $gender = null;
                $dob = null;
                $password = 'password123';

                if (isset($headerMap['email']) && isset($row[$headerMap['email']])) {
                    $email = trim($row[$headerMap['email']]);
                    $studentNumber = isset($headerMap['studentnumber']) ? trim($row[$headerMap['studentnumber']]) : (isset($headerMap['studentid']) ? trim($row[$headerMap['studentid']]) : null);
                    $firstName = isset($headerMap['firstname']) ? trim($row[$headerMap['firstname']]) : null;
                    $middleName = isset($headerMap['middlename']) ? trim($row[$headerMap['middlename']]) : null;
                    $surname = isset($headerMap['surname']) ? trim($row[$headerMap['surname']]) : (isset($headerMap['lastname']) ? trim($row[$headerMap['lastname']]) : null);
                    $gender = isset($headerMap['gender']) ? trim($row[$headerMap['gender']]) : null;
                    $dob = isset($headerMap['dateofbirth']) ? trim($row[$headerMap['dateofbirth']]) : (isset($headerMap['dob']) ? trim($row[$headerMap['dob']]) : null);
                    $password = isset($headerMap['password']) && ! empty(trim($row[$headerMap['password']])) ? trim($row[$headerMap['password']]) : 'password123';

                    if (! $firstName && ! $surname && isset($headerMap['name']) && isset($row[$headerMap['name']])) {
                        $nameVal = trim($row[$headerMap['name']]);
                        $parts = explode(' ', $nameVal, 3);
                        $firstName = $parts[0] ?? $nameVal;
                        $surname = isset($parts[1]) ? implode(' ', array_slice($parts, 1)) : '';
                    }
                } else {
                    // Index-based fallback
                    if (count($row) >= 7) {
                        // student_number, first_name, middle_name, surname, gender, date_of_birth, email
                        $studentNumber = trim($row[0]);
                        $firstName = trim($row[1]);
                        $middleName = trim($row[2]);
                        $surname = trim($row[3]);
                        $gender = trim($row[4]);
                        $dob = trim($row[5]);
                        $email = trim($row[6]);
                    } else {
                        $col1 = trim($row[0]);
                        $col2 = isset($row[1]) ? trim($row[1]) : '';
                        $col3 = isset($row[2]) ? trim($row[2]) : '';

                        if (filter_var($col1, FILTER_VALIDATE_EMAIL)) {
                            $email = $col1;
                            $nameVal = $col2 ?: explode('@', $email)[0];
                            $studentNumber = $col3;
                        } else {
                            $email = filter_var($col2, FILTER_VALIDATE_EMAIL) ? $col2 : null;
                            $nameVal = $col1;
                            $studentNumber = $col3;
                        }

                        if (isset($nameVal)) {
                            $parts = explode(' ', $nameVal, 3);
                            $firstName = $parts[0] ?? $nameVal;
                            $surname = isset($parts[1]) ? implode(' ', array_slice($parts, 1)) : '';
                        }
                    }
                }

                if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    continue;
                }

                $fullName = trim(($firstName ?? '').($middleName ? ' '.$middleName : '').($surname ? ' '.$surname : ''));
                if (empty($fullName)) {
                    $fullName = explode('@', $email)[0];
                }

                $student = User::where('email', strtolower($email))->first();

                if (! $student) {
                    $student = User::create([
                        'created_by_user_id' => $instructorId,
                        'student_number' => $studentNumber ?: User::generateNextStudentNumber(),
                        'first_name' => $firstName,
                        'middle_name' => $middleName,
                        'surname' => $surname,
                        'gender' => $gender ?: null,
                        'date_of_birth' => $dob ?: null,
                        'name' => $fullName,
                        'email' => strtolower($email),
                        'password' => bcrypt($password),
                        'email_verified_at' => now(),
                    ]);
                } else {
                    $upData = [];
                    if ($studentNumber) {
                        $upData['student_number'] = $studentNumber;
                    }
                    if ($firstName) {
                        $upData['first_name'] = $firstName;
                    }
                    if ($middleName) {
                        $upData['middle_name'] = $middleName;
                    }
                    if ($surname) {
                        $upData['surname'] = $surname;
                    }
                    if ($gender) {
                        $upData['gender'] = $gender;
                    }
                    if ($dob) {
                        $upData['date_of_birth'] = $dob;
                    }
                    if (! empty($upData)) {
                        $student->update($upData);
                    }
                }

                $course->students()->syncWithoutDetaching([$student->id]);
                $enrolledCount++;
            }

            fclose($handle);
        });

        return back()->with('success', "Successfully imported and enrolled {$enrolledCount} students.");
    }

    public function assignAssessment(Request $request, Course $course, Module $module): RedirectResponse
    {
        if ($course->user_id !== $request->user()->id || $module->course_id !== $course->id) {
            abort(403);
        }

        $validated = $request->validate([
            'assessment_id' => 'required|exists:assessments,id',
        ]);

        $assessment = auth()->user()->assessments()->findOrFail($validated['assessment_id']);
        $assessment->update(['module_id' => $module->id]);

        return back()->with('success', 'Assessment assigned to module.');
    }
}
