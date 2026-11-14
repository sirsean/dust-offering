# Dust Offering — prototype plan

Source: https://chatgpt.com/space/page_ad5cbe9d6d2881919e3df3cfb9f08feb

Snapshot read on 2026-11-14, source sequence 1. This is the implementation reference; consult the source for later revisions. Repository decisions and current progress live in `architecture.md` and `status.md`.

+Build a portrait-first browser game where the player redirects falling dust across the face of the Black Pyramid. The player draws a ridge, watches dust pile up, and rubs a hole through the ridge to split the stream while it is still flowing. The first playable scene has one dust source, two bowls, and one drawing tool with Draw and Rub modes.

**The moment to prove** — I open a gap under my thumb, see dust trickle through that gap while the rest keeps following the ridge, and immediately want to try opening it a little wider.

# Reference and tone

- Use [Mesmegraph’s dark triangle](https://github.com/sirsean/mesmegraph/blob/4f498bacc30d3a4018bd3111f3fd769cbe6dfa3e/art/replacement-1.png) for the silhouette, amber light leak and subdued grain. Use [the companion image](https://github.com/sirsean/mesmegraph/blob/4f498bacc30d3a4018bd3111f3fd769cbe6dfa3e/art/replacement-3.png) for how pale lines emerge from the darkness.

- The dust and its paths create the luminous geometry during play. Keep texture and haze subtle enough that a fresh ridge, a gap and active grains remain legible on a phone. Recreate the scene procedurally for the first build.

- [Pyramid Order insignia 48](https://chatgpt.com/space/page_739e2a9e65cc8191a41bdd629ed27b07) is the lore anchor. Dividing a measure of dust between two vessels is a proposed rite for this game. Keep the in-game text to the title and controls while evaluating the mechanic.

- Start as a standalone web prototype. Open the target repository and read its instructions before editing. In a blank workspace, use Vite, vanilla ES modules and Canvas 2D. In an existing app, preserve its stack and isolate the prototype in its own route or entry point.

# First playable screen

Fit the pyramid and both bowls above a thumb-accessible control strip. Put the apex near the top center. Leave enough space between the apex and bowls for a long sloped ridge and a second corrective ridge. Show two distinct bowl mouths and a visible spill gap between them. With an untouched face, the stream falls into the gap. A diagonal ridge can feed either bowl.

| Control               | Behavior                                                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draw                  | Default tool. A drag deposits a continuous ridge along the pointer path. It stays after release. Multiple ridges allow catches and redirects.                                                             |
| Rub                   | An explicit toggle next to Draw. A rub clears the ridge under a round brush. Show the brush footprint during contact. Short rubs create a narrow opening and moving sideways widens it.                   |
| Stop pour / Resume    | Tap once to stop or restart emission. Grains already released continue moving. Editing works in either state. Keep the button in the control strip so a hold at the apex cannot be mistaken for a stroke. |
| Reset                 | Clears ridges, grains and bowl fills and resets the selected mode's supply. Free Pour resumes. A scored run returns to its ready state.                                                                   |
| Free Pour / Challenge | Free Pour opens by default with an ongoing stream. Challenge loads a fixed starting layout, two visible target marks and a finite supply.                                                                 |

Use Pointer Events for touch, pen and mouse. Capture the active pointer during a stroke and interpolate between sampled points so a fast swipe leaves a continuous ridge. Apply `touch-action: none` to the playfield only. End the stroke cleanly on pointer-up, pointer cancellation or loss of capture. Keep tool buttons at least 44 CSS pixels high and expose the selected state. Show a single hint on first use: “Draw a ridge to redirect the dust. Rub a gap to split it.”

# Dust behavior

Use a bounded 2D particle simulation with continuous positions and velocities, smooth ridge collisions and local grain contacts. Grains must slide along shallow slopes, accumulate in catches, and retain enough sideways momentum for some to cross a small opening while others fall through. The down-or-diagonal cellular rule is not the implementation target. Keep this to circles, short line segments and a spatial hash; a fluid solver or full rigid-body simulation is unnecessary.

1. Use a fixed logical playfield of **160 × 200 units**, scaled uniformly to the screen. Start with grain radius **0.65 units** and ridge thickness **2 units**. Store each grain's position and velocity separately from the ridges. Represent drawn ridges as connected short line segments with rounded thickness, so the contact surface has a smooth tangent rather than grid stair steps. Draw directly to Canvas 2D with a capped device pixel ratio; screen resolution must not change the physics.

2. Advance a fixed **60 Hz** simulation with **two collision substeps** initially, and render on `requestAnimationFrame`. Starting values are gravity **160 units per second squared** and a maximum grain speed of **78 units per second**. At those values, travel per substep is at most one grain radius; preserve that bound if tuning speed or substeps so grains cannot jump through a ridge. Emit **120 grains per second** across a **12-unit-wide source** near the apex. Use seeded spawn positions and small seeded sideways launch velocities between **−4 and +4 units per second**, so the stream has some breadth rather than identical trajectories. Treat these as tuning defaults; the behavior checks below determine readiness.

3. Resolve grain–ridge contact against the nearest point on each nearby segment: separate overlap along the contact normal, remove inward normal velocity, and preserve tangential motion with low friction and almost no bounce. Gravity then accelerates grains down the slope. Resolve grain–grain overlap and inward relative velocity using a spatial hash and a small fixed number of contact passes, starting with three per substep. Give grain contacts enough friction and damping for catches to hold a pile. Process contacts in a stable order. Supported grains may sleep after remaining nearly still, but removing support or contact from a moving grain must wake them and affected neighbors. Do not let sleeping grains become permanent supports after a rub.

4. At a cut, remove the physical support immediately and let existing velocity and gravity determine the paths. Slower grains should fall through while faster or higher grains can reach the remaining ridge. A wider opening gives more grains time to fall clear. Tune source breadth, contact friction, grain radius and incoming speed together to produce a gradual change in split. Do not fake the split with a random choice of bowl, an invisible barrier or a quota on grains allowed through the hole.

5. Interpolate Draw and Rub strokes. Start with a **3-unit-wide Rub brush**; a short rub opens a small cut and a sideways drag widens it continuously. Clip the affected ridge segments rather than removing an entire stroke. The visible cut and its collision opening must agree, including rounded segment ends. Rub never deletes grains. Drawing through dust adds ridge geometry and resolves local overlap without changing grain counts or injecting a launch impulse. Show the brush footprint during contact, and prevent edits over the source and bowl mouths.

6. Count each grain once when its path crosses the collection line; use its interpolated crossing position to choose a bowl or spill, then remove that grain. Side exits also count as spill. Bowl mounds display those counts without remaining simulated grains. Cap Free Pour at **6,000 grains on the face**, including sleeping grains, and stop emission at that cap or when the source is blocked. Resume at the normal rate when space opens; never delete old grains or release a catch-up burst. The challenge has only **4,800 grains** in total and must not discard grains for performance.

7. Suspend stepping while the document is hidden and reset the frame clock on return. Preserve ridge geometry, grain positions and velocities, bowl totals and remaining supply on resize or rotation. Keep physics and emission tied to fixed simulation steps, not display frames.

**Required physics check before scoring.** Keep a reproducible developer scene with a shallow ramp, an optional catch for a visible pile, and a cut that can be widened. Save its coordinates, seed and parameters in configuration. First show transport on ramps around **20° and 35° below horizontal**, in both directions, without a staircase jam. Show a supported pile beginning to drain within **0.2 seconds** of removing support. Then run the same scene with three increasing cut widths, initially **3, 6 and 9 units**: after a five-second warm-up, measure the fraction taking the gap over ten seconds. At least two widths must sustain both paths, with each path carrying at least **10%** of exiting grains, and each widening must increase the gap fraction by at least **10 percentage points**. Count paths locally below the gap and beyond the ramp end, so bowl placement does not distort this check. Repeat with three fixed seeds. Widths and physics defaults may be tuned, but the final configuration and measured fractions must be reported. If the first cut captures nearly everything, or the split remains effectively on/off, keep working on the simulation before adding scores, texture, glow or sound. This check establishes the behavior; it does not replace trying the controls on a phone.

# Challenge and sharing

Add this once the physics check and live interaction pass. Use one fixed challenge with identifier `first-offering-v2`. Keep the scene, seed, physics parameters, source rate, supply and targets in one configuration object. The starting challenge is **40 seconds of unobstructed active pouring at 120 grains per second: 4,800 grains total, with a target of 1,800 left and 3,000 right**. This preserves the 3:5 target ratio. Time spent with emission stopped or blocked, and time spent settling or rescuing dust, is additional; there is no countdown or time penalty. Use a fixed-step emission accumulator and spend supply only on successful spawns. Stopped or blocked emission must not build a backlog. Each emitted grain spends one unit, including grains that later spill. If the rate is tuned, derive supply from `rate × 40 seconds`, keep the targets at 3/8 and 5/8 of supply using integer counts that sum to the supply, and version the challenge whenever physics or scoring conditions change.

Start the run with an explicit **Begin** button. Players may draw before beginning and may stop and resume pouring as often as they want. Show remaining supply, current fills and target marks. If a pile blocks emission, show “Clear the dust below the source” near the apex. Once the source is empty, let dust in flight settle. Enable **Finish** after either one second with no meaningful movement or five seconds since supply exhaustion or the latest edit, whichever comes first. Use a small velocity tolerance for settling rather than requiring exact zero motion. Keep editing available for rescuing resting grains; a new edit restarts the settling check and fallback timer. On Finish, any dust still on the face stays outside the bowl totals.

Use one transparent scoring rule:

```text
error = abs(leftFill - leftTarget) + abs(rightFill - rightTarget)
score = max(0, floor(1000 * (startingSupply - error) / startingSupply))
```

For example, **1,700 / 3,000** earns **979** with those targets. Each grain of underfill or overfill contributes to the error. Round down so **1000 requires both targets exactly**, even with the larger supply. The score screen shows the final and target counts for both bowls. No time bonus or penalty. Keep the best score for that challenge in local storage. Identical outcomes can tie.

Add a **Share score** action. It shares the score, both bowl fills and a URL that opens the same challenge. Use native sharing when available and otherwise copy the text and URL. Handle a failed copy by showing the text and link for manual copying. Keep the first comparison between friends via shared links and scores. A hosted leaderboard, rotating challenges and video replays can follow after playtesting.

# Feel and feedback

- Give grains a warm pale core and a short trail. Let a stationary pocket become visibly denser. Make the ridge a faint raised line, with its brightest cue where dust touches it.

- Make the first few grains through a new opening easy to see. Avoid post-processing that hides the gap. Use the bowl fill line and number to signal progress even with sound muted.

- Optionally add one soft tone per bowl, driven by recent arrival rate and limited in frequency so a dense flow sounds smooth. Add sound after the first input, with an accessible mute control. Treat sound as a polish pass.

- Use clear labels, subdued transitions and no countdown. Under reduced motion, drop decorative trails, flicker and background effects while retaining the dust movement needed to read the puzzle.

# Build order and checks

| Pass         | Deliverable                                                                  | Check before moving on                                                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Scene     | Portrait layout, fixed logical playfield, source, bowls, spill and Reset     | With a blank face, dust reliably falls into the center gap. The scene and controls fit on a narrow phone.                                                                                                                            |
| 2. Live play | Draw, Rub, Stop pour and visible accumulation                                | Pass the shallow-ramp, support-removal and three-width split checks. Show that a player can widen a gap and visibly change the split while the stream runs. Record the final configuration and measured fractions before proceeding. |
| 3. Score     | Forty-second active pour, fixed targets, result, best score and share action | Verify the 4,800-grain supply, 1,800 / 3,000 targets, exact and near-perfect scores, partial fill, overfill and total spill. Confirm the shared URL opens the same challenge and Reset restores identical conditions.                |
| 4. Tune      | Legible visuals, optional sound and mobile pass                              | Try several runs on a real phone if available and in a desktop browser. Check responsiveness with a large retained pile, and record devices and limits.                                                                              |

Keep the simulation and score functions independent of the DOM. Add focused tests for contact and collection accounting, shallow-ramp transport, support removal and waking, the three-width split check, and scoring. Verify throughout a challenge: **initial supply = remaining supply + left bowl + right bowl + spill + all grains on the face**, including sleeping grains. At Finish the remaining supply is zero. Confirm that an unobstructed source emits exactly **4,800 grains over 2,400 simulation steps**, and that blocking or stopping it spends no supply and produces no catch-up burst. Test exact targets, a one-grain error, partial fill, overfill and total spill. Test that a fixed seed and identical edits on the same simulation steps give identical results in the same runtime; use stable contact ordering and no unseeded randomness. Manually check fast strokes, stopping emission while dust is in flight, reset, repeated mode switches, resize, hidden-tab recovery and disabled or failed sharing. Run the production build and the repository’s lint checks.

**Playtest prompt:** “Get some dust into both bowls while the stream is running.” Watch whether a player can make a split and correct it without coaching. During that first free-play session, notice whether they keep experimenting after they succeed. If they can hit the targets but don’t want another pour, tune the dust and the controls before expanding the score system.

# Handoff to the implementing Codex session

> Build the Dust Offering prototype described here. Complete Free Pour and pass the shallow-ramp, support-removal and three-width split checks before adding the fixed 40-second, 4,800-grain challenge. Preserve the standalone scope and use the provided Mesmegraph images as visual references. Report the final physics parameters and measured split fractions, run the checks above, and explain how to run the prototype, what you verified on touch hardware, and which tuning values need playtesting.

[Download the Markdown plan](https://chatgpt.com/library?file_id=libfile_fde3_f-c87999abfb4c81919c04034c94b7ab90_96a44738c60881918ea4ad355f1ce0d7&account_id=personal)
