<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Module;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Testing\File;
use Tests\TestCase;

class ModuleQuestionTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_access_dedicated_module_questions_page()
    {
        $instructor = User::factory()->create();
        $course = Course::create([
            'user_id' => $instructor->id,
            'title' => 'Physics 101',
            'code' => 'PHY101',
        ]);
        $module = Module::create([
            'course_id' => $course->id,
            'title' => 'Kinematics Module',
            'order' => 0,
        ]);

        $response = $this->actingAs($instructor)->get("/courses/{$course->id}/modules/{$module->id}/questions");

        $response->assertOk();
        // Opening questions page without adding questions does not create empty assessment in DB
        $this->assertDatabaseMissing('assessments', [
            'module_id' => $module->id,
        ]);
    }

    public function test_instructor_can_manually_add_question_to_module()
    {
        $instructor = User::factory()->create();
        $course = Course::create([
            'user_id' => $instructor->id,
            'title' => 'Chemistry 101',
            'code' => 'CHEM101',
        ]);
        $module = Module::create([
            'course_id' => $course->id,
            'title' => 'Thermodynamics Module',
            'order' => 0,
        ]);

        $this->actingAs($instructor)->get("/courses/{$course->id}/modules/{$module->id}/questions");

        $postData = [
            'type' => 'multiple_choice',
            'question_text' => 'What is the SI unit of temperature?',
            'explanation' => 'Kelvin is the SI base unit.',
            'points' => 2,
            'options' => [
                ['option_text' => 'Celsius', 'is_correct' => false],
                ['option_text' => 'Kelvin', 'is_correct' => true],
                ['option_text' => 'Fahrenheit', 'is_correct' => false],
            ],
        ];

        $response = $this->actingAs($instructor)->post("/courses/{$course->id}/modules/{$module->id}/questions", $postData);

        $response->assertRedirect();
        $this->assertDatabaseHas('questions', [
            'question_text' => 'What is the SI unit of temperature?',
            'points' => 2,
        ]);

        $this->assertDatabaseHas('question_options', [
            'option_text' => 'Kelvin',
            'is_correct' => true,
        ]);
    }

    public function test_instructor_can_import_csv_questions_to_module()
    {
        $instructor = User::factory()->create();
        $course = Course::create([
            'user_id' => $instructor->id,
            'title' => 'Biology 101',
            'code' => 'BIO101',
        ]);
        $module = Module::create([
            'course_id' => $course->id,
            'title' => 'Genetics Module',
            'order' => 0,
        ]);

        $csvContent = "Question Text,Type,Points,Explanation,Option 1,Option 2,Option 3,Option 4,Correct Option Index\n";
        $csvContent .= "What is DNA?,multiple_choice,1,Deoxyribonucleic acid,Ribonucleic Acid,Deoxyribonucleic Acid,Protein,Lipid,2\n";

        $file = File::createWithContent('test_questions.csv', $csvContent);

        $response = $this->actingAs($instructor)->post("/courses/{$course->id}/modules/{$module->id}/questions/import-csv", [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('questions', [
            'question_text' => 'What is DNA?',
        ]);
        $this->assertDatabaseHas('question_options', [
            'option_text' => 'Deoxyribonucleic Acid',
            'is_correct' => true,
        ]);
    }
}
