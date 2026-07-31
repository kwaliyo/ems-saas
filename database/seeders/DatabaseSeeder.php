<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Module;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $instructor = User::firstOrCreate(
            ['email' => 'instructor@example.com'],
            [
                'name' => 'Dr. Elena Vance',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        $student = User::firstOrCreate(
            ['email' => 'student@example.com'],
            [
                'name' => 'Alex Rivera',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Course & Modules
        $course = Course::create([
            'user_id' => $instructor->id,
            'title' => 'Advanced Cellular Biology (BIO-101)',
            'code' => 'BIO101',
            'description' => 'Comprehensive exploration of organelle biology, metabolic pathways, and gene expression.',
        ]);

        $m1 = Module::create([
            'course_id' => $course->id,
            'title' => 'Module 1: Cellular Structure & Respiration',
            'description' => 'Mitochondria, ATP synthesis, and Photosynthetic reactions.',
            'order' => 0,
        ]);

        $m2 = Module::create([
            'course_id' => $course->id,
            'title' => 'Module 2: Genetics & Nucleic Acids',
            'description' => 'Transcription, translation, and chromosomal inheritance.',
            'order' => 1,
        ]);

        // Enroll Student
        $course->students()->syncWithoutDetaching([$student->id]);

        // Seed Assessment assigned to Module 1
        $assessment1 = Assessment::create([
            'user_id' => $instructor->id,
            'module_id' => $m1->id,
            'title' => 'Cell Biology & Photosynthesis Midterm',
            'description' => 'Comprehensive check on cellular structures, respiration, and photosynthetic reactions.',
            'subject' => 'Biology',
            'grade_level' => 'High School',
            'settings' => [
                'shuffle_questions' => false,
                'shuffle_answers' => false,
                'show_feedback' => true,
                'require_names' => true,
            ],
        ]);

        $q1 = Question::create([
            'assessment_id' => $assessment1->id,
            'order' => 0,
            'type' => 'multiple_choice',
            'question_text' => 'Which organelle is responsible for generating ATP through cellular respiration?',
            'explanation' => 'Mitochondria act as the cellular powerhouse, producing ATP via oxygen and glucose processing.',
            'points' => 1,
        ]);
        QuestionOption::create(['question_id' => $q1->id, 'option_text' => 'Mitochondria', 'is_correct' => true, 'order' => 0]);
        QuestionOption::create(['question_id' => $q1->id, 'option_text' => 'Nucleus', 'is_correct' => false, 'order' => 1]);
        QuestionOption::create(['question_id' => $q1->id, 'option_text' => 'Ribosome', 'is_correct' => false, 'order' => 2]);
        QuestionOption::create(['question_id' => $q1->id, 'option_text' => 'Golgi Apparatus', 'is_correct' => false, 'order' => 3]);

        $q2 = Question::create([
            'assessment_id' => $assessment1->id,
            'order' => 1,
            'type' => 'true_false',
            'question_text' => 'Photosynthesis takes place primarily in the thylakoid membranes and stroma of chloroplasts.',
            'explanation' => 'Light reactions take place in the thylakoids and the Calvin cycle occurs in the stroma.',
            'points' => 1,
        ]);
        QuestionOption::create(['question_id' => $q2->id, 'option_text' => 'True', 'is_correct' => true, 'order' => 0]);
        QuestionOption::create(['question_id' => $q2->id, 'option_text' => 'False', 'is_correct' => false, 'order' => 1]);

        $q3 = Question::create([
            'assessment_id' => $assessment1->id,
            'order' => 2,
            'type' => 'short_answer',
            'question_text' => 'What gas is released into the atmosphere as a byproduct of water splitting during light reactions?',
            'explanation' => 'Oxygen (O2) gas is released into the atmosphere.',
            'points' => 1,
        ]);
        QuestionOption::create(['question_id' => $q3->id, 'option_text' => 'Oxygen', 'is_correct' => true, 'order' => 0]);

        // Seed active room ALPHA7
        $room = Room::create([
            'user_id' => $instructor->id,
            'assessment_id' => $assessment1->id,
            'code' => 'ALPHA7',
            'mode' => 'student_paced',
            'status' => 'active',
            'current_question_index' => 0,
            'settings' => ['show_feedback' => true],
            'started_at' => now(),
        ]);
    }
}
