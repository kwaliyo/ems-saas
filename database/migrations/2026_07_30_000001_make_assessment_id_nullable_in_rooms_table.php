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
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropForeign(['assessment_id']);
            $table->foreignId('assessment_id')->nullable()->change();
            $table->foreign('assessment_id')->references('id')->on('assessments')->nullOnDelete();
            $table->string('assessment_title')->nullable()->after('assessment_id');
            $table->string('assessment_subject')->nullable()->after('assessment_title');
            $table->json('questions_snapshot')->nullable()->after('settings');
        });

        Schema::table('participant_answers', function (Blueprint $table) {
            $table->dropForeign(['question_id']);
            $table->foreignId('question_id')->nullable()->change();
            $table->foreign('question_id')->references('id')->on('questions')->nullOnDelete();
            $table->text('question_text')->nullable()->after('question_id');
            $table->string('question_type')->nullable()->after('question_text');
            $table->integer('points')->default(1)->after('question_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('participant_answers', function (Blueprint $table) {
            $table->dropForeign(['question_id']);
            $table->dropColumn(['question_text', 'question_type', 'points']);
            $table->foreignId('question_id')->nullable(false)->change();
            $table->foreign('question_id')->references('id')->on('questions')->cascadeOnDelete();
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropForeign(['assessment_id']);
            $table->dropColumn(['assessment_title', 'assessment_subject', 'questions_snapshot']);
            $table->foreignId('assessment_id')->nullable(false)->change();
            $table->foreign('assessment_id')->references('id')->on('assessments')->cascadeOnDelete();
        });
    }
};
