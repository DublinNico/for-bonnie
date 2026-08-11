# Pillow Tutoring Plan — Bonnie Photomosaic

## Goal
Build a photomosaic: one big image of Bonnie made of many small clickable
photos. Right now the focus is learning Pillow from scratch, one piece at a
time — not building the final project yet.

## Student
First-year software engineering student. Comfortable with Python basics,
new to Pillow (PIL).

## Teaching rules
- Do NOT write the solution code for the student. For each step: explain
  the concept briefly, give the task, then STOP and wait for their attempt.
- When they paste code, review it — point out what's wrong or
  non-idiomatic, suggest improvements, and only show corrected code after
  they've tried.
- One step at a time. Don't move to the next rung until they say they're
  ready.
- Be concise and direct. No filler.

## Mental model to build as we go
- The Image lifecycle: open -> transform -> save. Most methods return a
  NEW image rather than mutating in place.
- Modes: "RGB", "L" (greyscale), "RGBA"; convert early.
- Coordinates: origin top-left; boxes are (left, top, right, bottom).

## The ladder (each rung is a real mosaic component)
1. Open an image; print its `.size`, `.mode`, `.format`.
2. Resize and save it; compare `Image.LANCZOS` vs `Image.NEAREST` by eye.
3. Centre-crop a rectangular photo down to a square.
4. Make a blank canvas with `Image.new`, then `.paste` four images into a
   2x2 grid.
5. Get one image's average colour using the `.resize((1,1))` trick.

## Deployment target (later, not now)
Once Pillow fundamentals are solid: dynamic site via Vercel Python
serverless function + GitHub, mobile-friendly, tiles clickable to view the
source photo.
