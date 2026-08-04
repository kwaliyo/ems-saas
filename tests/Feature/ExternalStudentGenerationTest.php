<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Module;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExternalStudentGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_batch_generate_external_guest_student_ids(): void
    {
        $instructor = User::factory()->create();
        $course = Course::create([
            'user_id' => $instructor->id,
            'code' => 'GUEST101',
            'title' => 'External Exam Course',
        ]);

        $response = $this->actingAs($instructor)->post('/students/generate-external-ids', [
            'quantity' => 5,
            'prefix' => 'EXT',
            'label' => 'Guest Candidate',
            'course_id' => $course->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $guestCount = User::where('student_number', 'like', 'EXT-2026-%')->count();
        $this->assertEquals(5, $guestCount);

        $guestStudent = User::where('student_number', 'EXT-2026-0001')->first();
        $this->assertNotNull($guestStudent);
        $this->assertTrue($guestStudent->enrolledCourses->contains($course->id));
    }

    public function test_instructor_can_generate_external_students_with_names_list(): void
    {
        $instructor = User::factory()->create();

        $response = $this->actingAs($instructor)->post('/students/generate-external-ids', [
            'names_list' => "John Doe\nJane Smith\nAmina Bello",
            'prefix' => 'EXT',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'name' => 'John Doe',
            'first_name' => 'John',
            'surname' => 'Doe',
            'student_number' => 'EXT-2026-0001',
        ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Jane Smith',
            'first_name' => 'Jane',
            'surname' => 'Smith',
            'student_number' => 'EXT-2026-0002',
        ]);
    }

    public function test_join_page_receives_initial_student_id_query_parameter(): void
    {
        $response = $this->get('/join?code=NMOB7T&student_id=EXT-2026-0001');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('student/JoinRoom')
            ->where('initialCode', 'NMOB7T')
            ->where('initialStudentId', 'EXT-2026-0001')
        );
    }

    public function test_guest_cannot_retake_exam_when_allow_retake_is_false(): void
    {
        $instructor = User::factory()->create();
        $course = Course::create([
            'user_id' => $instructor->id,
            'code' => 'CS202',
            'title' => 'System Admin',
        ]);
        $module = Module::create([
            'course_id' => $course->id,
            'title' => 'Final Exam',
            'allow_retake' => false,
            'allow_review' => true,
            'hide_score' => false,
        ]);
        $assessment = $instructor->assessments()->create([
            'module_id' => $module->id,
            'title' => 'Final Exam',
            'subject' => 'CS202',
        ]);
        $room = Room::create([
            'user_id' => $instructor->id,
            'assessment_id' => $assessment->id,
            'code' => 'RETAKE1',
            'mode' => 'student_paced',
            'status' => 'active',
            'settings' => ['allow_retake' => false],
        ]);

        $room->participants()->create([
            'name' => 'Guest #001',
            'student_id_code' => 'EXT-2026-0001',
            'session_token' => 'guest-token-123',
            'completed_at' => now(),
        ]);

        $response = $this->post('/join', [
            'code' => 'RETAKE1',
            'student_id_code' => 'EXT-2026-0001',
        ]);

        $response->assertSessionHasErrors(['code', 'student_id_code']);
    }

    public function test_guest_candidate_blocked_when_allow_guests_is_false(): void
    {
        $instructor = User::factory()->create();
        $course = Course::create([
            'user_id' => $instructor->id,
            'code' => 'CS301',
            'title' => 'Official Exam Course',
        ]);
        $module = Module::create([
            'course_id' => $course->id,
            'title' => 'Official Final',
        ]);
        $assessment = $instructor->assessments()->create([
            'module_id' => $module->id,
            'title' => 'Official Final Exam',
            'subject' => 'CS301',
        ]);
        $room = Room::create([
            'user_id' => $instructor->id,
            'assessment_id' => $assessment->id,
            'code' => 'OFFICIAL1',
            'mode' => 'time_based',
            'status' => 'active',
            'settings' => ['allow_guests' => false],
        ]);

        $response = $this->post('/join', [
            'code' => 'OFFICIAL1',
            'student_id_code' => 'EXT-2026-9999',
        ]);

        $response->assertSessionHasErrors(['student_id_code']);
    }
}
