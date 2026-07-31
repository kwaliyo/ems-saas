<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Module;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Testing\File;
use Tests\TestCase;

class CourseModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_create_course_with_modules()
    {
        $instructor = User::factory()->create();

        $response = $this->actingAs($instructor)->post('/courses', [
            'title' => 'Physics 101',
            'code' => 'PHY101',
            'description' => 'Introductory mechanics',
            'modules' => [
                ['title' => 'Module 1: Kinematics', 'description' => 'Motion in 1D'],
                ['title' => 'Module 2: Dynamics', 'description' => 'Forces and Newton Laws'],
            ],
        ]);

        $course = Course::where('code', 'PHY101')->first();
        $this->assertNotNull($course);
        $this->assertEquals(2, $course->modules()->count());
    }

    public function test_instructor_can_enroll_student_in_course()
    {
        $instructor = User::factory()->create();
        $course = Course::create([
            'user_id' => $instructor->id,
            'title' => 'Chemistry 101',
            'code' => 'CHEM101',
        ]);

        $response = $this->actingAs($instructor)->post("/courses/{$course->id}/enroll", [
            'name' => 'John Doe',
            'email' => 'student@test.com',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['email' => 'student@test.com']);
    }

    public function test_instructor_can_import_students_from_csv()
    {
        $instructor = User::factory()->create();
        $course = Course::create([
            'user_id' => $instructor->id,
            'title' => 'Cybersecurity 101',
            'code' => 'BCC14',
        ]);

        $csvContent = "name,email\n"
            . "\"Jane Doe\",jane.doe@example.com\n"
            . "\"Alex Smith\",alex.smith@example.com\n";

        $file = File::createWithContent('students.csv', $csvContent);

        $response = $this->actingAs($instructor)->post("/courses/{$course->id}/import-students-csv", [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['email' => 'jane.doe@example.com']);
        $this->assertDatabaseHas('users', ['email' => 'alex.smith@example.com']);
        $this->assertEquals(2, $course->students()->count());
    }

    public function test_student_can_view_enrolled_courses_and_exam_modules()
    {
        $instructor = User::factory()->create();
        $student = User::factory()->create();

        $course = Course::create([
            'user_id' => $instructor->id,
            'title' => 'Biology 101',
            'code' => 'BIO101',
        ]);
        $module = Module::create([
            'course_id' => $course->id,
            'title' => 'Module 1: Genetics',
            'order' => 0,
        ]);
        $assessment = Assessment::create([
            'user_id' => $instructor->id,
            'module_id' => $module->id,
            'title' => 'Genetics Exam',
            'subject' => 'Biology',
        ]);

        $course->students()->attach($student->id);

        $response = $this->actingAs($student)->get('/courses');

        $response->assertOk();
    }

    public function test_instructor_can_view_students_directory_without_ambiguous_column_error()
    {
        $instructor = User::factory()->create();
        $student = User::factory()->create(['email' => 'student2@test.com']);

        $course = Course::create([
            'user_id' => $instructor->id,
            'title' => 'Computer Science 101',
            'code' => 'CS101',
        ]);
        $course->students()->attach($student->id);

        $response = $this->actingAs($instructor)->get('/students');

        $response->assertOk();
    }
}
