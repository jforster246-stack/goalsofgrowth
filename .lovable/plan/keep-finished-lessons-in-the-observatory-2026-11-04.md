# Keep finished lessons in the Observatory

Right now, revealing a lesson's last fact shows confetti and the Observatory moves straight on to the next lesson. The finished picture and its facts disappear from view.

## What you'll see

- A new **"Learned"** shelf under the lesson card. It shows a small picture for every lesson you've finished, newest first, with its title and course (Art or Night sky).
- **Tap a picture** and it opens in a pop-up with the full picture, its title, subtitle and details, and all of its facts, so you can read them again.
- **Pick a course** in "Your courses" and the shelf shows only that course's finished lessons. A count, like "Learned · 3", sits next to the heading.
- **Before you've finished any lessons**, the shelf shows a gentle line such as "Finish a lesson and it'll be kept here."
- **When a course is complete**, the lesson card still says so, and every lesson in that course sits on the shelf.

Nothing new needs saving. The app already remembers how many facts you've revealed in each course on your account, so it can work out which lessons are finished, including ones you finished before this change.

## Technical details

- Add a `completedLessons(course, revealedCount)` helper next to `lessonProgress` in the curriculum code. It returns the lessons whose facts are all revealed, in order.
- In `observatory.tsx`, add a `LearnedShelf` section after `LessonCard`. It is a grid of thumbnails using `lesson.image` or the tint gradient with the course icon, filtered to the active course.
- Add a `LearnedLessonDialog` that reuses the plate and the `RevealedFact` rows.
- Add a small test for `completedLessons`: 0 revealed gives none, exactly one lesson's facts gives that lesson, and a partial second lesson isn't included.
- No database change.
