# Module 2 — QC Failure Investigation

**LabReady Chemistry Competency System** · Draft v0.1 for founding-lab pilots
**Time:** lesson ~20 min · quiz ~15 min · case ~15 min
**Prerequisite:** Module 1
**Competency methods covered:** 3 (QC and corrective-action records), 6 (problem solving)
**Tool:** [QC Troubleshooting Assistant](../qc-assistant/) · [printable checklist](../resources/qc-failure-checklist.html)

> Author's note (Elie): review everything marked **[CHECK]** against your experience and the pilot lab's procedures.

---

## Learning objectives

1. Take the right immediate actions when QC is rejected, before investigating.
2. Use the rule and pattern to decide whether to look for random or systematic error first.
3. Work through a structured investigation: control, reagent, calibration, instrument, environment, operator.
4. Define the patient look-back window and decide which results need rerunning.
5. Write a complete investigation and corrective-action record.

---

## Lesson

### 1. Patients first

When QC is rejected, the first job isn't finding the cause. It's making sure no unreliable result reaches a patient's chart.

1. Stop reporting that test on that instrument.
2. Hold results from the failed run.
3. Tell the charge tech or supervisor, especially if stat or critical testing is waiting.
4. Move urgent work to a backup instrument or method if one is available and its QC is in.
5. Open the LJ chart and find where the problem started.

### 2. The one thing not to do

Rerunning the same control until it lands inside the limits isn't troubleshooting. Each rerun has a chance of falling in range even if the system is still wrong, so eventually one "passes" and the problem goes into the patient results.

A single repeat with **fresh** control can be reasonable when you suspect a one-off random error (a bubble, a short sample) and your procedure allows it. If it fails again, or if the rule points to systematic error, investigate. **[CHECK: your lab's repeat policy.]**

### 3. Let the pattern steer you

| What you see | Look here first |
|---|---|
| 1-3s or R-4s | Random error: bubbles, clots, short sample, probe, mixing, a bad vial |
| 2-2s, 4-1s, 10x | Systematic error: calibration, reagent or calibrator lot, drift, ageing lamp/electrode |
| One level only | That control vial: reconstitution, stability, evaporation, storage |
| Only the high (or only the low) level | Concentration-dependent: calibration at the ends of the range, linearity; also the vial |
| All levels, same direction | Common cause: reagent, calibration, instrument |
| Levels moving apart | Imprecision rather than a shift |
| Several tests on the same analyser | Shared component: water, temperature, probe, lamp, ISE module |

### 4. The investigation, in order

Work through each area and write down what you found, including "no issue". A record saying only "recalibrated, QC OK" doesn't show an investigation.

**Control material:** right control and level; reconstituted properly (diluent, volume, mixing, wait time); within open-vial stability; stored and thawed correctly; not evaporated. Evaporation concentrates the control and pushes results **up**. Test a fresh vial.

**Reagent:** recent lot change; on-board stability; volume, bubbles, precipitate, contamination; storage before loading. Test a fresh pack.

**Calibration:** age of the calibration; calibrator lot, reconstitution, expiry; compare the curve or factor with the last good calibration. Recalibrate if indicated, then run **all** QC levels.

**Instrument and maintenance:** flags and alarms; maintenance up to date; probes, mixers, wash station, cuvettes, lamp, electrodes; reaction temperature.

**Environment:** room temperature and humidity; water quality; power interruptions; recent service visits.

**Operator and procedure:** correct procedure followed; recent changes in workflow, staff or SOP; other tests affected.

Only resume patient testing once **all** control levels are acceptable after the correction.

### 5. Patient look-back

1. Find the **last acceptable QC** for that test on that instrument. That's the start of your window.
2. Count patient samples run between then and the failure.
3. Rerun a selection from that window, spread across the range and including results near decision limits. **[CHECK: how many, and how your lab selects them.]**
4. Compare with the original results against your lab's **allowable difference** for the analyte.
5. If differences exceed it, follow your corrected-report procedure: correct, notify the clinician, document who was told and when.
6. If nothing was reported in the window (results were held), record that.

### 6. What a complete record contains

- Test, instrument, date/time, tech
- Control material and lot, reagent lot, last calibration
- Control values, SD, rule violated
- Immediate actions taken
- Each area checked and what was found
- Root cause (or "random error, no assignable cause" after a full investigation)
- Corrective action and repeat QC
- Look-back window, samples rerun, outcome, notifications
- Follow-up and prevention
- Performer's and supervisor's signatures

The QC Troubleshooting Assistant produces exactly this record.

---

## Question bank

**Pass mark: 80%. [CHECK]**

1. **QC is rejected at 03:00 with the ER waiting on results. What is your first action?**
   **Answer:** Stop reporting and hold patient results from the failed run, then notify the charge tech/supervisor and move stats to a backup if available. Investigation comes after patients are protected.

2. **Why is rerunning the same control until it passes unacceptable?**
   **Answer:** Each repeat has a chance of falling in range by chance while the system is still wrong. It hides real error and exposes patients to it.

3. **Only the Level 3 (high) glucose control is out, +2.6 SD. Level 1 is fine. Name two likely causes.**
   **Answer (any two):** Level 3 vial problem (evaporation, reconstitution, stability); calibration problem affecting the high end; linearity issue.

4. **A control vial left uncapped on the bench for several hours will most likely read:**
   a) Low b) High c) Unchanged d) Randomly high or low
   **Answer: b.** Evaporation concentrates it.

5. **All three levels of ALT shifted about +2.5 SD the morning after a new reagent lot was loaded. Where do you look first?**
   **Answer:** The new reagent lot (and whether lot-to-lot verification was done) and calibration after the lot change. Pattern is systematic and affects all levels.

6. **Within one run, Level 1 is +2.3 SD and Level 2 is −2.2 SD. Which areas do you check first?**
   **Answer:** Random error causes: bubbles, clots, probe, mixing, sample volume, control handling. (R-4s.)

7. **Sodium, potassium and chloride QC all fail on the same analyser at the same time. What does that suggest?**
   **Answer:** A shared component: the ISE module, reference electrode, reagents or calibrators common to the ISE tests.

8. **You recalibrate and Level 2 is now in range. Can you resume patient testing?**
   **Answer:** Not yet. Run all control levels; resume only when all are acceptable.

9. **How do you define the start of the patient look-back window?**
   **Answer:** The last acceptable QC run for that test on that instrument.

10. **Rerun results differ from the originals by more than the lab's allowable difference. What must happen?**
    **Answer:** Follow the corrected-report procedure: correct results, notify the clinician/responsible person, document who, when and what was reported.

11. **After a full investigation you can't find a cause, and a fresh control is in range. How do you document the root cause?**
    **Answer:** "Random error, no assignable cause identified", with every area checked listed, plus the repeat QC result and any look-back.

12. **What's missing from this record: "Glu L3 high. Recalibrated. QC OK. —JM"?**
    **Answer:** Control values/SD and rule; lot numbers; immediate actions; what was checked and found; root cause; repeat QC for all levels; look-back; notification; follow-up; date/time; supervisor review.

13. **True or false: if patient results were held during the whole failure window, no look-back is needed.**
    **Answer:** True for this event, provided no results were released since the last acceptable QC. Document that.

14. **Give one prevention step you might record after a control evaporation event.**
    **Answer (example):** Remind staff to cap controls between runs; limit on-board time; add to shift checklist; monitor that level on the LJ chart for several days.

15. **Which is the stronger evidence the problem is fixed?**
    a) One level back in range b) All levels in range after the correction c) The next patient results look normal
    **Answer: b.**

---

## Case: 03:40, glucose, Cobas Pure 1

**Scenario.** You're on nights. MultiQual Level 3 glucose reads 318 mg/dL (+2.4 SD). Level 1 is 92 mg/dL (+0.4 SD). The ER has a DKA patient waiting. The glucose reagent pack was opened a week ago and glucose was last calibrated six days ago. The LJ chart shows Level 3 was at +0.2 SD at 00:15. You notice the Level 3 vial on the bench without its cap.
**[CHECK: example values are illustrative. Replace with realistic ranges for the pilot lab's control lot.]**

**Questions**
1. Which rule fired, and is the run rejected under a standard multirule procedure?
2. What do you do before anything else?
3. What does the pattern suggest?
4. What's your first check, and what do you expect?
5. What do you do for the DKA patient's glucose?
6. What's the look-back window, and does anything need rerunning?
7. Write the root cause, corrective action and follow-up in two sentences.

**Model answer**
1. 1-2s on Level 3. Alone it's a warning; check the other rules. With no other violation, many labs would accept. **But** the uncapped vial gives you a clear reason to suspect the control itself, so you investigate before trusting it. **[CHECK: your lab's handling of 1-2s.]**
2. Hold glucose results from the run, tell the charge tech, and look at the LJ chart.
3. One level, high only, sudden change since 00:15. Control material first, then the high end of the calibration.
4. The uncapped vial: evaporation would read high. Open a fresh Level 3 vial and run both levels. Expected: back near the mean.
5. Run it once QC is acceptable, or on a backup analyser with acceptable QC, and phone it through if critical per policy. Don't release it from the unverified run.
6. From 00:15 (last acceptable) to 03:40. If glucose results were released in that window, rerun a selection and compare against your allowable difference. If none were released, document that.
7. "Level 3 control evaporated after being left uncapped on the bench. Fresh vial opened, both levels acceptable at 04:05, testing resumed; night staff reminded to cap controls between runs and Level 3 to be watched on the LJ chart for five days."

Try the same case in the [QC Troubleshooting Assistant](../qc-assistant/) using **Load the example case**.

---

## Direct observation checklist (Method 6)

Use a real event or a simulated failure. The technologist…

| # | Behaviour | ✔ / ✘ |
|---|---|---|
| 1 | Stops reporting and holds patient results immediately | |
| 2 | Notifies the appropriate person | |
| 3 | Reviews the LJ chart to find when the problem began | |
| 4 | Identifies likely error type from the rule and pattern | |
| 5 | Investigates in a logical order, not by repeated reruns | |
| 6 | Corrects the cause and verifies with all QC levels | |
| 7 | Defines the look-back window and reruns appropriately | |
| 8 | Follows corrected-report procedure when needed | |
| 9 | Completes a full investigation record | |
| 10 | Can explain the reasoning for each step | |

Assessor: ________ Date: ________ Result: Satisfactory / Unsatisfactory

## Corrective-action record review (Method 3)

Select two or three recent QC failure records for the employee.

| Check | Yes / No / N/A |
|---|---|
| Immediate actions documented | |
| Areas investigated listed with findings | |
| Root cause stated (or "no assignable cause" after investigation) | |
| All levels verified before resuming | |
| Look-back documented with outcome | |
| Notifications documented where required | |
| Follow-up / prevention recorded | |
| Supervisor review signed and dated | |

---

*LabReady Pro training content. Follow your laboratory's QC and corrected-report procedures, the manufacturer's instructions and your accrediting body's requirements.*
