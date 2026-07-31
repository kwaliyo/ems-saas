<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('subject')->default('General');
            $table->string('grade_level')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->integer('order')->default(0);
            $table->string('type')->default('multiple_choice'); // multiple_choice, true_false, short_answer, multi_select
            $table->text('question_text');
            $table->text('explanation')->nullable();
            $table->integer('points')->default(1);
            $table->integer('time_limit_seconds')->nullable();
            $table->timestamps();
        });

        Schema::create('question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->text('option_text');
            $table->boolean('is_correct')->default(false);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->string('code')->unique();
            $table->string('mode')->default('student_paced'); // student_paced, teacher_paced, space_race, exit_ticket
            $table->string('status')->default('waiting'); // waiting, active, paused, completed
            $table->integer('current_question_index')->default(0);
            $table->json('settings')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });

        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('student_id_code')->nullable();
            $table->string('session_token')->unique();
            $table->string('team_color')->default('blue');
            $table->integer('score')->default(0);
            $table->integer('total_questions')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('participant_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->json('selected_option_ids')->nullable();
            $table->text('short_answer_text')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->integer('score_awarded')->default(0);
            $table->integer('time_taken_seconds')->default(0);
            $table->timestamps();

            $table->unique(['participant_id', 'question_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('participant_answers');
        Schema::dropIfExists('participants');
        Schema::dropIfExists('rooms');
        Schema::dropIfExists('question_options');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('assessments');
    }
};
