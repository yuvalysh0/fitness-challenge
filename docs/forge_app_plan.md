# FORGE: App UI/UX & Functionality Overhaul Plan

**Date:** March 12, 2026
**Project:** FORGE Fitness Challenge App
**Goal:** Transform the existing working prototype (based on the provided screenshots) into a dynamic, engaging, data-driven, and "Forged" experience, integrating all requested functionalities.

---

## 1. Executive Summary: The "Forge" Visual Identity

We are moving away from a static, form-based checklist to a dynamic, visual, data-driven experience that visualizes user effort and transformation. We must move from _tracking_ tasks to _forging_ habits.

### 1.1 Core Design Palette (The "Igneous" Theme)

- **Background (Canvas):** Dark Warm Charcoal (`#1A1D21`).
- **Surface (Cards/Elements):** A slightly lighter, textured grey (`#2A2E35`) with **subtly rounded corners** (e.g., `border-radius: 12px` or `16px`). These should feel like "islands" or "raised surfaces" against the canvas.
- **Primary Accent:** Solid, Bold Forge Red (`#D63031`). (Used for Buttons, Titles, Active Gauges).
- **Secondary Accent (The Glow):** Molten Orange-Red Gradient (`#E17055` to `#D63031`). Use this **sparingly** as a subtle "glow" border or background accent for checked/completed items and avatars.
- **Inactive/Muted:** Muted Grey (`#9A9EA4`).
- **Typography:** White (`#FFFFFF`) for bold titles; Muted Grey (`#9A9EA4`) for body text/data labels. Use a bold geometric font for headers (e.g., `Montserrat Bold`) and a clean font for body text (e.g., `Roboto`).

---

## 2. Phase 1: Dashboard Redesign (The Command Center)

**Reference:** Target Screen = `image_3.png`

**Goal:** Integrate new functionalities (Weight, Nutrition, Visual Comparison) directly onto the home screen while improving information hierarchy and spacing. We will adopt a vertical, flowing, data-driven _Feed_ structure instead of static grids.

### 2.1 The Fixed Header

- **Text (Title):** "**FORGE**" (Geometric font, Bold, White, `#FFFFFF`).
- **Icon (The Profile/Reset Option):** The circular avatar moves to the **far right** of the header (or top left depending on preference). A gear icon (`image_5.png`) remains, but the _actual_ Reset button is buried within Settings. Tapping the avatar **opens the settings screen.**

### 2.2 Section 1: Mindset & Profile

- **Welcome Card:** A raised surface (`#2A2E35`). Inside: Avatar (`border-radius: 50%`, subtle glow) + Text: "Hello, Liaa."
- **UX Upgrade (Motivational Carousel):** The quote section becomes an **interactive, swipeable card.**
  - **UI:** Raised surface card.
  - **Content:** A quote (e.g., "_The journey of the Freedom Seeker..._").
  - **UX:** Small left/right arrows or pagination dots imply it's a carousel. Allow user to swipe through curated motivational quotes or messages from the "Coach."

### 2.3 Section 2: Core Challenge & Progress (Action Items)

_We are combining the progress gauge and the task checklist into one unified 'Challenge Feed' element._

- **1. The Daily Gauge (Visual Progress):**
  - **UI:** The circular gauge (`image_3.png`) remains central and prominent. Empty track: `#2A2E35`. Filled track: Glow Gradient (`#D63031` to `#E17055`).
  - **Data Display:** Inside the circle, **only** show the most vital data. Large White: "**DAY 2 / 50**". Beneath it: "**4% COMPLETE**".
  - **UX Option:** Tapping the center of the circle **flips it** (or triggers an animation) to show sub-text: "Logs: 3" and "Left: 48," satisfying the function of the old data cards.

- **2. The Challenge Checklist (Feed Card 1):**
  - **UI:** Convert the old checklist into a raised surface feed card.
  - **Functionality:** Task items retain their title, emoji, and checkbox (solid red when checked).
  - **Crucial UX Upgrade (Edit/Notes Modal):** Tapping the checkbox **immediately logs it.** Tapping the **task title/body text** opens a clean, simple **modal (pop-up) window** which allows the user to:
    1.  **Reorder** tasks (drag-and-drop handles).
    2.  **Add/View notes** for that task.
    3.  **Edit details** (e.g., change "10 pages" to "15 pages").
    4.  **Delete/Trash** a _custom_ task. (Default challenge tasks should be immutable from this view).

### 2.4 Section 3: Data Insights (NEW FEED CARDS)

_We are integrating new data cards beneath the Core Challenge Feed._

- **Feed Card 2: Daily Nutrition (NEW FUNCTIONALITY):**
  - **Header:** Text: "TODAY'S FUEL (KETO)" (White).
  - **Content (Budget vs Actual):** A prominent vertical bar chart or circular gauge showing "Calories Consumed (e.g., 1800) / Goal (2100 KCAL)".
  - **Macro Breakdown (Data points from Action Center):** Smaller bar graphs visualizing C/P/F balance vs goal (`image_1.png`). C: `#D63031` Red; P: `#E17055` Orange; F: `#9A9EA4` Muted substance.
  - **CTA:** A "Log Meals" button that jumps to the Daily Log screen.

- **Feed Card 3: Weight Journey (NEW FUNCTIONALITY):**
  - **Header:** "WEIGHT TREND (Last 14 Days)". Text Data: "**88.5 kg** (-2.1 kg)" (White Data).
  - **Content:** A stylized, interactive line graph on a subtle grid (`image_1.png`). The line is bold red (`#D63031`), data points are glow-orange (`#E17055`). Tapping this expands to a full screen history view.

- **Feed Card 4: Transformation Visual (NEW FUNCTIONALITY):**
  - **Header:** "TRANSFORMATION VISUAL".
  - **Content:** Side-by-side comparison of "DAY 1 PHOTO" and a large camera icon/placeholder with text: "**UPLOAD DAY 22 PHOTO**".

### 2.5 Section 4: Navigation Bar

- **UI:** Simple dark charcoal background (`#1A1D21`). Active icon is highlighted in solid red (`#D63031`) with a subtle glow or indicator dot beneath it. (Icons: Dashboard, Checklist, Community/History, Profile/Settings).

---

## 3. Phase 2: Action Center (The Daily Log)

**Reference:** Target Screen = `image_6.png`

**Goal:** Upgrade the standard input form into a dynamic, engaging logging center using interactive inputs and meaningful visual feedback.

### 3.1 Date/Header

- Retain the simple date input and title.

### 3.2 Dynamic Visual Photo Logging

- **UI:** Replace the simple dashed boxes (`image_6.png`) with two stylized, textured metallic frame placeholders (Front & Side) with raised surface effect.
- **UX:** Tapping the placeholder activates the camera immediately for capture, providing meaningful feedback (an arrow or flash) once uploaded.

### 3.3 Dynamic Effort Inputs

_We are moving from basic text boxes to visual data input methods._

- **Weight Input (NEW FUNCTIONALITY):**
  - **UI:** Replace the weight text box with a simple, interactive **segmented slider.** As the user slides it, the weight number is displayed in large, bold, glowing text (`#D63031`) that updates dynamically.
- **Mood/How did you feel?**
  - **UI:** Replace the text box with a row of 5 large, stylized "Forge rock" emoji icons (e.g., Happy, Energetic, Neutral, Tired, Stressed). Tapping an emoji highlights it.

### 3.4 Challenge Requirement Logging (NEW FUNCTIONALITY)

_These new sections pre-fill based on the challenge constraints._

- **Workout 1 (45 min):** A raised card with pre-filled duration ("45 min"). Inputs for 'Type (Cardio/Strength)', 'Duration (if over 45 min)', 'Calories Burned', and a 'Did you go outside?' checkbox.
- **Nutrition:**
  - Dedicated input fields (not just notes) for Carbs (g), Protein (g), Fats (g). The app must automatically calculate and display the resulting **Total Calories.**
  - A 'Log Meals' button. (Future: connect to food database).

---

## 4. Phase 3: Progress and Analysis (The Blueprint)

**Reference:** Target Screen = `image_4.png`

**Goal:** Transform the static image list into a comprehensive "Transformation Hub" combining side-by-side visuals and data trends.

### 4.1 Hub Header

- Rename from "Progress" to "**THE BLUEPRINT**." The dumbbell icon remains, potentially with a red glow accent.

### 4.2 Transformation Hub: Visuals

- **UI (Refined):** The existing side-by-side image comparison (`image_4.png`) remains the core, but presented within textured metallic "Frames." The Day/Weight labels should be integrated into the frame design.
- **UX Upgrade (Swipe Gallery):** Tapping a comparison opens a modal gallery view, allowing the user to swipe through their _full transformation timeline_ over the 50 days, not just the start and end.

### 4.3 Transformation Hub: Data Insights (NEW FUNCTIONALITY)

_Add a new section beneath the photos._

- **Analysis Card 1: "Weight Journey":** A professional, interactive line graph (as shown in `image_1.png`) visualizing weight data over the 75 days.
- **Analysis Card 2: "Nutritional Adherence":** A pie chart or segmented bar graph showing average macro split vs. goal split over time.
- **Analysis Card 3: "Streak History" (NEW FUNCTIONALITY):**
  - **UI:** A visual calendar grid (similar to GitHub's contribution activity grid, 75 squares).
  - **Color Key:** Green square = Perfect Day. Red square = Missed Task/Failure.
  - **UX:** Tapping a square in the calendar jumps directly to that specific daily log on the Dashboard screen. This provides deep navigational value.

---

## 5. Phase 4: Settings (The Forge Blueprint)

**Reference:** Target Screen = `image_5.png`

**Goal:** Improve information hierarchy and consolidate critical challenge controls.

### 5.1 Program Management (The Core Settings)

- **Display name & Date of Birth:** Keep as is.
- **Weight Goal:** Convert the goal input into a simple **"Target Goal" visual**, showing Start Weight vs. Target Weight with a simple line.
- **The Reset Button (NEW FUNCTIONALITY - CRUCIAL):** This is where you put your 'reset' button.
  - **UI:** A large, prominent, solid red (`#D63031`) cautionary button titled: **"FAIL / RESTART FROM DAY 1."**
  - **UX:** Tapping this triggers a model with a prominent warning message and **double confirmation requirements** to prevent accidental resets.

---

_(Note: Ensure all UI mockups are done with high border-radius, subtle depth shadows, and appropriate spacing to enhance the "Forged" feel against the dark charcoal canvas.)_
