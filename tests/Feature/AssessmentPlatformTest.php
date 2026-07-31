<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssessmentPlatformTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_join_room_with_valid_room_code_without_account()
    {
        $user = User::factory()->create();
        $assessment = Assessment::create([
            'user_id' => $user->id,
            'title' => 'Test Physics Assessment',
            'subject' => 'Physics',
        ]);
        $question = Question::create([
            'assessment_id' => $assessment->id,
            'type' => 'multiple_choice',
            'question_text' => 'What is the speed of light?',
            'points' => 1,
        ]);
        QuestionOption::create([
            'question_id' => $question->id,
            'option_text' => '3x10^8 m/s',
            'is_correct' => true,
        ]);

        $room = Room::create([
            'user_id' => $user->id,
            'assessment_id' => $assessment->id,
            'code' => 'PHYS01',
            'status' => 'active',
        ]);

        $response = $this->post('/join', [
            'code' => 'PHYS01',
            'name' => 'Jane Student',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('participants', [
            'room_id' => $room->id,
            'name' => 'Jane Student',
        ]);
    }

    public function test_student_can_submit_answer_and_calculate_score_correctly()
    {
        $user = User::factory()->create();
        $assessment = Assessment::create([
            'user_id' => $user->id,
            'title' => 'Chemistry Quiz',
            'subject' => 'Chemistry',
        ]);
        $question = Question::create([
            'assessment_id' => $assessment->id,
            'type' => 'multiple_choice',
            'question_text' => 'What is H2O?',
            'points' => 1,
        ]);
        $option = QuestionOption::create([
            'question_id' => $question->id,
            'option_text' => 'Water',
            'is_correct' => true,
        ]);

        $room = Room::create([
            'user_id' => $user->id,
            'assessment_id' => $assessment->id,
            'code' => 'CHEM01',
            'status' => 'active',
        ]);

        $participant = $room->participants()->create([
            'name' => 'Bob Test',
            'session_token' => 'test-token-123',
            'total_questions' => 1,
        ]);

        $response = $this->postJson("/api/room/{$room->id}/student/test-token-123/submit", [
            'question_id' => $question->id,
            'selected_option_ids' => [$option->id],
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'is_correct' => true,
                'total_score' => 1,
            ]);
    }

    public function test_instructor_can_create_assessment_and_launch_room()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/assessments', [
            'title' => 'Math Assessment',
            'subject' => 'Math',
            'questions' => [
                [
                    'type' => 'multiple_choice',
                    'question_text' => '2 + 2 = ?',
                    'points' => 1,
                    'options' => [
                        ['option_text' => '4', 'is_correct' => true],
                        ['option_text' => '5', 'is_correct' => false],
                    ],
                ],
            ],
        ]);

        $response->assertRedirect('/assessments');
        $this->assertDatabaseHas('assessments', [
            'user_id' => $user->id,
            'title' => 'Math Assessment',
        ]);

        $assessment = Assessment::where('title', 'Math Assessment')->first();

        $launchResponse = $this->actingAs($user)->post("/assessments/{$assessment->id}/launch", [
            'mode' => 'student_paced',
        ]);

        $launchResponse->assertRedirect();
        $this->assertDatabaseHas('rooms', [
            'assessment_id' => $assessment->id,
            'mode' => 'student_paced',
            'status' => 'active',
        ]);
    }
}
