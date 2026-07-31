<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class GenerateStudentIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'students:generate-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto-generate unique formatted Student IDs for all students without one';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $studentsWithoutId = User::whereNull('student_number')
            ->orWhere('student_number', '')
            ->get();

        if ($studentsWithoutId->isEmpty()) {
            $this->info('All students already have Student IDs assigned.');
            return Command::SUCCESS;
        }

        $count = 0;
        foreach ($studentsWithoutId as $student) {
            $newId = User::generateNextStudentNumber();
            $student->update([
                'student_number' => $newId,
            ]);
            $this->line("Assigned Student ID [{$newId}] to student {$student->name} ({$student->email})");
            $count++;
        }

        $this->info("Successfully generated Student IDs for {$count} student(s).");

        return Command::SUCCESS;
    }
}
