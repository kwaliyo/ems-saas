<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Participant;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    private function authorizeStudentOwnership(User $student, int $instructorId): void
    {
        $user = auth()->user();
        $isAuthorized = $student->created_by_user_id === $instructorId ||
            $student->enrolledCourses()->where('courses.user_id', $instructorId)->exists() ||
            $user?->isSuperAdmin() ||
            $user?->role === 'instructor';

        if (! $isAuthorized) {
            abort(403, 'Unauthorized access to student record.');
        }
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $instructorId = $user->id;

        // Auto-sync room participants into student records & course enrollments
        $rooms = $user->isSuperAdmin()
            ? Room::with(['assessment.module.course'])->get()
            : Room::where('user_id', $instructorId)->with(['assessment.module.course'])->get();

        foreach ($rooms as $room) {
            $course = $room->assessment?->module?->course;
            if (! $course) {
                continue;
            }

            $participants = Participant::where('room_id', $room->id)->get();
            foreach ($participants as $p) {
                if (empty($p->student_id_code) && empty($p->name)) {
                    continue;
                }

                $studentNumber = ! empty($p->student_id_code) ? trim($p->student_id_code) : 'EXT-'.strtoupper(substr(md5($p->name), 0, 8));
                $email = strtolower($studentNumber.'@guest.exam');

                $student = User::where('student_number', $studentNumber)
                    ->orWhere('email', $email)
                    ->first();

                if (! $student) {
                    $nameParts = explode(' ', trim($p->name), 2);
                    $firstName = $nameParts[0] ?? $p->name;
                    $surname = $nameParts[1] ?? 'Student';

                    $student = User::create([
                        'created_by_user_id' => $room->user_id,
                        'student_number' => $studentNumber,
                        'first_name' => $firstName,
                        'surname' => $surname,
                        'name' => trim($p->name),
                        'email' => $email,
                        'password' => bcrypt('password123'),
                        'role' => 'student',
                        'email_verified_at' => now(),
                    ]);
                }

                if (! $student->enrolledCourses()->where('courses.id', $course->id)->exists()) {
                    $student->enrolledCourses()->attach($course->id);
                }
            }
        }

        $availableCourses = Course::with('instructor')->latest()->get();

        $students = User::where('id', '!=', $user->id)
            ->where(function ($query) {
                $query->where('role', '!=', 'super_admin')
                    ->orWhereHas('enrolledCourses')
                    ->orWhereNotNull('created_by_user_id')
                    ->orWhereNotNull('student_number');
            })
            ->with(['enrolledCourses'])
            ->latest()
            ->get();

        return Inertia::render('students/Index', [
            'students' => $students,
            'availableCourses' => $availableCourses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $instructorId = $request->user()->id;

        $validated = $request->validate([
            'student_number' => 'nullable|string|max:50|unique:users,student_number',
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'surname' => 'required|string|max:100',
            'gender' => 'nullable|string|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:6',
            'course_ids' => 'nullable|array',
            'course_ids.*' => 'exists:courses,id',
        ]);

        $firstName = trim($validated['first_name']);
        $middleName = ! empty($validated['middle_name']) ? trim($validated['middle_name']) : null;
        $surname = trim($validated['surname']);

        $fullName = trim($firstName.($middleName ? ' '.$middleName : '').' '.$surname);

        $student = User::create([
            'created_by_user_id' => $instructorId,
            'student_number' => ! empty($validated['student_number']) ? trim($validated['student_number']) : User::generateNextStudentNumber(),
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'surname' => $surname,
            'gender' => $validated['gender'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'name' => $fullName,
            'email' => strtolower(trim($validated['email'])),
            'password' => bcrypt($validated['password'] ?? 'password123'),
            'email_verified_at' => now(),
        ]);

        if (! empty($validated['course_ids'])) {
            // Verify instructor owns these courses
            $validCourseIds = Course::where('user_id', $instructorId)
                ->whereIn('id', $validated['course_ids'])
                ->pluck('id');
            $student->enrolledCourses()->syncWithoutDetaching($validCourseIds);
        }

        return back()->with('success', "Student {$student->name} created and enrolled successfully.");
    }

    public function show(User $student, Request $request): Response
    {
        $instructorId = $request->user()->id;

        $this->authorizeStudentOwnership($student, $instructorId);

        // Load enrolled courses taught by this instructor
        $student->load([
            'enrolledCourses' => function ($query) use ($instructorId) {
                $query->where('courses.user_id', $instructorId)->with(['modules.assessments']);
            },
        ]);

        // Available courses taught by this instructor to attach
        $availableCourses = Course::where('user_id', $instructorId)->get();

        // Fetch exam room participation history matching candidate email or name
        $participantRecords = Participant::where(function ($query) use ($student) {
            $query->where('name', $student->name)
                ->orWhere('student_id_code', $student->email)
                ->orWhere('student_id_code', $student->student_number);
        })
            ->with(['room.assessment', 'answers'])
            ->latest()
            ->get();

        return Inertia::render('students/Show', [
            'student' => $student,
            'participantRecords' => $participantRecords,
            'availableCourses' => $availableCourses,
        ]);
    }

    public function update(Request $request, User $student): RedirectResponse
    {
        $instructorId = $request->user()->id;

        $this->authorizeStudentOwnership($student, $instructorId);

        $validated = $request->validate([
            'student_number' => 'nullable|string|max:50|unique:users,student_number,'.$student->id,
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'surname' => 'required|string|max:100',
            'gender' => 'nullable|string|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'email' => 'required|email|unique:users,email,'.$student->id,
            'password' => 'nullable|string|min:6',
            'course_ids' => 'nullable|array',
            'course_ids.*' => 'exists:courses,id',
        ]);

        $firstName = trim($validated['first_name']);
        $middleName = ! empty($validated['middle_name']) ? trim($validated['middle_name']) : null;
        $surname = trim($validated['surname']);

        $fullName = trim($firstName.($middleName ? ' '.$middleName : '').' '.$surname);

        $updateData = [
            'student_number' => ! empty($validated['student_number']) ? trim($validated['student_number']) : null,
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'surname' => $surname,
            'gender' => $validated['gender'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'name' => $fullName,
            'email' => strtolower(trim($validated['email'])),
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = bcrypt($validated['password']);
        }

        $student->update($updateData);

        if (isset($validated['course_ids'])) {
            $instructorCourseIds = Course::where('user_id', $instructorId)->pluck('id')->toArray();
            $syncCourseIds = array_intersect($validated['course_ids'], $instructorCourseIds);

            // Detach instructor's courses not in list, attach new ones
            $student->enrolledCourses()->detach($instructorCourseIds);
            if (! empty($syncCourseIds)) {
                $student->enrolledCourses()->attach($syncCourseIds);
            }
        }

        return back()->with('success', "Student {$student->name} record updated.");
    }

    public function attachCourses(Request $request, User $student): RedirectResponse
    {
        $instructorId = $request->user()->id;

        $this->authorizeStudentOwnership($student, $instructorId);

        $validated = $request->validate([
            'course_ids' => 'required|array',
            'course_ids.*' => 'exists:courses,id',
        ]);

        $validCourseIds = Course::whereIn('id', $validated['course_ids'])->pluck('id');

        $student->enrolledCourses()->syncWithoutDetaching($validCourseIds);

        return back()->with('success', "Attached courses to {$student->name}.");
    }

    public function detachCourse(Request $request, User $student, Course $course): RedirectResponse
    {
        $instructorId = $request->user()->id;

        $this->authorizeStudentOwnership($student, $instructorId);

        $student->enrolledCourses()->detach($course->id);

        return back()->with('success', "Detached course {$course->code} from {$student->name}.");
    }

    public function importCsv(Request $request): RedirectResponse
    {
        $instructorId = $request->user()->id;

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
            'course_ids' => 'nullable|array',
            'course_ids.*' => 'exists:courses,id',
        ]);

        $file = $request->file('csv_file');
        $courseIds = Course::where('user_id', $instructorId)
            ->whereIn('id', $request->input('course_ids', []))
            ->pluck('id')
            ->toArray();

        $importedCount = 0;

        DB::transaction(function () use ($file, $courseIds, $instructorId, &$importedCount) {
            $handle = fopen($file->getRealPath(), 'r');
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

            while (($row = fgetcsv($handle)) !== false) {
                if (empty(array_filter($row))) {
                    continue;
                }

                $studentNumber = null;
                $firstName = null;
                $middleName = null;
                $surname = null;
                $gender = null;
                $dob = null;
                $email = null;
                $password = 'password123';

                if ($isHeader) {
                    foreach ($headerMap as $col => $idx) {
                        $val = isset($row[$idx]) ? trim($row[$idx]) : '';
                        if (str_contains($col, 'studentnumber') || str_contains($col, 'studentid') || str_contains($col, 'regno')) {
                            $studentNumber = $val;
                        } elseif (str_contains($col, 'firstname') || str_contains($col, 'first')) {
                            $firstName = $val;
                        } elseif (str_contains($col, 'middlename') || str_contains($col, 'middle')) {
                            $middleName = $val;
                        } elseif (str_contains($col, 'surname') || str_contains($col, 'lastname') || str_contains($col, 'last')) {
                            $surname = $val;
                        } elseif (str_contains($col, 'gender') || str_contains($col, 'sex')) {
                            $gender = strtolower($val);
                        } elseif (str_contains($col, 'dob') || str_contains($col, 'birth') || str_contains($col, 'dateofbirth')) {
                            $dob = $val;
                        } elseif (str_contains($col, 'email')) {
                            $email = $val;
                        } elseif (str_contains($col, 'password')) {
                            if (! empty($val)) {
                                $password = $val;
                            }
                        }
                    }
                } else {
                    if (count($row) >= 7) {
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
                    if (! $student->created_by_user_id) {
                        $upData['created_by_user_id'] = $instructorId;
                    }
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

                if (! empty($courseIds)) {
                    $student->enrolledCourses()->syncWithoutDetaching($courseIds);
                }

                $importedCount++;
            }

            fclose($handle);
        });

        return back()->with('success', "Imported {$importedCount} student accounts successfully.");
    }

    public function generateMissingStudentNumbers(Request $request): RedirectResponse
    {
        $instructorId = $request->user()->id;

        $studentsWithoutId = User::where(function ($query) use ($instructorId) {
            $query->whereHas('enrolledCourses', function ($q) use ($instructorId) {
                $q->where('courses.user_id', $instructorId);
            })->orWhere('created_by_user_id', $instructorId);
        })
            ->where(function ($q) {
                $q->whereNull('student_number')->orWhere('student_number', '');
            })
            ->get();

        $count = 0;
        foreach ($studentsWithoutId as $student) {
            $student->update([
                'student_number' => User::generateNextStudentNumber(),
            ]);
            $count++;
        }

        return back()->with('success', "Generated Student IDs for {$count} student(s).");
    }

    public function destroy(Request $request, User $student): RedirectResponse
    {
        if ($student->id === $request->user()->id) {
            return back()->with('error', 'You cannot delete your own account from student directory.');
        }

        $studentName = $student->name;
        $student->enrolledCourses()->detach();
        $student->delete();

        return back()->with('success', "Student {$studentName} deleted successfully.");
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'integer|exists:users,id',
        ]);

        $studentIds = array_diff($validated['student_ids'], [$user->id]);

        $students = User::whereIn('id', $studentIds)->get();

        $count = 0;
        DB::transaction(function () use ($students, &$count) {
            foreach ($students as $student) {
                $student->enrolledCourses()->detach();
                $student->delete();
                $count++;
            }
        });

        return back()->with('success', "Deleted {$count} student record(s) successfully.");
    }

    public function generateExternalStudentIds(Request $request): RedirectResponse
    {
        $instructorId = $request->user()->id;

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:100',
            'prefix' => 'nullable|string|max:10',
            'label' => 'nullable|string|max:100',
            'course_id' => 'nullable|integer|exists:courses,id',
        ]);

        $quantity = (int) $validated['quantity'];
        $prefix = strtoupper(trim($validated['prefix'] ?? 'EXT')) ?: 'EXT';
        $label = trim($validated['label'] ?? 'Guest Candidate');
        $courseId = $validated['course_id'] ?? null;

        $count = 0;
        DB::transaction(function () use ($instructorId, $quantity, $prefix, $label, $courseId, &$count) {
            for ($i = 0; $i < $quantity; $i++) {
                $studentNumber = User::generateNextExternalStudentNumber($prefix);
                $cleanNumber = str_replace('-', '', strtolower($studentNumber));
                $email = "{$cleanNumber}@guest.exam";
                $name = "{$label} (".substr($studentNumber, -4).')';

                $student = User::create([
                    'created_by_user_id' => $instructorId,
                    'student_number' => $studentNumber,
                    'first_name' => $label,
                    'surname' => substr($studentNumber, -4),
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make('guest123'),
                ]);

                if ($courseId) {
                    $student->enrolledCourses()->syncWithoutDetaching([$courseId]);
                }

                $count++;
            }
        });

        return back()->with('success', "Generated {$count} Guest / External Student ID(s) successfully.");
    }
}
