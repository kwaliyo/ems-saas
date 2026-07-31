<?php

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Module;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('module questions remain intact in module question bank when assessment is deleted', function () {
    $user = User::factory()->create();

    $course = Course::create([
        'user_id' => $user->id,
        'title' => 'Cybersecurity 101',
        'code' => 'CS101',
    ]);

    $module = $course->modules()->create([
        'title' => 'Network Protocols',
        'code' => 'M1',
    ]);

    $assessment = $user->assessments()->create([
        'module_id' => $module->id,
        'title' => '[M1] Network Protocols Exam',
        'subject' => $course->title,
    ]);

    $question1 = Question::create([
        'module_id' => $module->id,
        'assessment_id' => $assessment->id,
        'order' => 0,
        'type' => 'multiple_choice',
        'question_text' => 'What port is used by HTTP?',
        'points' => 1,
    ]);

    $question2 = Question::create([
        'module_id' => $module->id,
        'assessment_id' => $assessment->id,
        'order' => 1,
        'type' => 'true_false',
        'question_text' => 'TCP is connection-oriented.',
        'points' => 1,
    ]);

    // Delete the assessment container
    $this->actingAs($user)
        ->delete(route('assessments.destroy', $assessment->id))
        ->assertRedirect(route('assessments.index'));

    // Assert assessment is deleted
    $this->assertDatabaseMissing('assessments', ['id' => $assessment->id]);

    // Assert questions STILL EXIST in the module's question bank
    $this->assertDatabaseHas('questions', ['id' => $question1->id, 'module_id' => $module->id, 'assessment_id' => null]);
    $this->assertDatabaseHas('questions', ['id' => $question2->id, 'module_id' => $module->id, 'assessment_id' => null]);

    expect($module->questions()->count())->toBe(2);

    // Visiting the module question manager loads question bank items
    $response = $this->actingAs($user)->get(route('courses.modules.questions.index', [$course->id, $module->id]));
    $response->assertStatus(200);

    // Adding a question creates the active assessment container and links bank items
    $this->actingAs($user)->post(route('courses.modules.questions.store', [$course->id, $module->id]), [
        'type' => 'multiple_choice',
        'question_text' => 'New Question',
        'points' => 1,
        'options' => [
            ['option_text' => 'Option 1', 'is_correct' => true],
            ['option_text' => 'Option 2', 'is_correct' => false],
        ],
    ]);

    $newAssessment = $module->assessments()->latest()->first();
    expect($newAssessment)->not->toBeNull();
    expect($newAssessment->questions()->count())->toBe(3);
});
