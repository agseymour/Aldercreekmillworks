# Alder Creek Millworks: Teacher Guide

## Setting up a class
1. Pick a class code (e.g. `PRODTECH11A`) and tell students to type it on the start screen.
2. Open `teacher.html` (also linked from the student start screen, "Teacher? Open the class dashboard").
3. Enter the class code and a teacher PIN (4+ characters). The first PIN used for a class code becomes that class's teacher PIN.

Students don't need accounts: each uses a workshop name plus a 4-digit PIN to protect their save.

## Reading the dashboard
- **Worth a conversation**: flags raised automatically: low quiz accuracy, machines used without permits, rising mistakes, no finished work, stuck on a permit test, failing certification exams, several finished projects not yet handed over, often abandoning builds part-way (dropping a commission after cutting starts loses the wood, so it can't be used to wipe mistakes).
- **Table**: click a column to sort; click a student for detail (mistakes per delivery, quiz topics, permits, drafting, habits).
- **Most-missed questions**: class-wide safety and quiz questions students miss most. Good material for a warm-up or review.
- **Drafting**: lessons completed, designs made, and how accurately students labelled their own plans.
- **Exports**: class summary CSV and a raw events CSV (every logged action, by game day).

## Things to know
- Until the cloud key is set up (see `SUPABASE_SETUP.md`), the dashboard only sees saves made on the same device.
- Safety questions marked unconfirmed in `SAFETY_ANSWER_KEY.md` are not graded until you confirm them.
- Flags are prompts for a conversation, not grades.
