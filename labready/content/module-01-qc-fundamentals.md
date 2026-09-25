# Module 1 — QC Fundamentals & Westgard Rules

**LabReady Chemistry Competency System** · Draft v0.1 for founding-lab pilots
**Time:** lesson ~20 min · quiz ~15 min · case ~10 min
**Competency methods covered:** 3 (review of QC records), 6 (problem solving)

> Author's note (Elie): this draft is here for you to review and correct against your own experience before it goes to a pilot lab. Anything marked **[CHECK]** needs your judgement or your lab's numbers.

---

## Learning objectives

By the end of this module the technologist can:

1. Explain why we run QC and what it can and can't detect.
2. Calculate mean, SD and CV from a set of control results.
3. Read a Levey-Jennings chart and spot a shift, a trend and increased scatter.
4. Apply the common Westgard rules (1-2s, 1-3s, 2-2s, R-4s, 4-1s, 10x) and state which kind of error each detects.
5. Make and document an accept/reject decision for a run.

---

## Lesson

### 1. What QC is for

Quality control tells you whether the measuring system is performing the way it did when its performance was established. Controls are samples with a known expected range, run like patients. If they behave, you have reasonable confidence the patient results in the same run are right. If they don't, you can't trust the patients either.

QC can't tell you everything. It won't catch a mislabelled tube, a haemolysed specimen or a sample drawn above an IV. That's why pre-analytical checks and result review still matter (Modules 8 and 9).

### 2. The numbers behind the chart

For a new control lot, the lab establishes its own **mean** and **standard deviation (SD)** from repeated measurements, typically at least 20 data points over multiple days, runs and ideally reagent packs. **[CHECK: your lab's policy for establishing ranges, and whether you use a provisional range from the old lot until 20 points are available.]**

- **Mean** = sum of results ÷ number of results
- **SD** = how spread out the results are around the mean
- **CV (%)** = SD ÷ mean × 100. Lets you compare imprecision across levels and analytes.

Roughly 95% of results from a stable process fall within ±2 SD of the mean and about 99.7% within ±3 SD. So one result outside 2 SD will happen by chance around 1 run in 20 for each control level. That's why 1-2s on its own is a warning, not proof of a problem.

**Worked example.** Level 1 glucose, 10 results (mg/dL): 98, 101, 99, 102, 100, 97, 103, 100, 99, 101.
Mean = 1000 ÷ 10 = 100 mg/dL. SD ≈ 1.8 mg/dL. CV ≈ 1.8%.
±2 SD range ≈ 96.4–103.6. ±3 SD range ≈ 94.6–105.4.
(Ten points is for teaching only. Real ranges need more data.)

### 3. Reading a Levey-Jennings chart

The LJ chart plots each control result over time against lines at the mean, ±1, ±2 and ±3 SD.

- **Shift:** results suddenly settle on one side of the mean at a new level. Often lines up with a reagent lot change, a calibration or a maintenance event.
- **Trend:** results drift steadily in one direction over several runs. Think deteriorating reagent or control, ageing lamp, a slowly failing component.
- **Increased scatter:** results spread wider than before, in both directions. Think imprecision: probe, pipetting, bubbles, mixing, temperature instability.

Always look at the chart, not just today's point. The chart tells you when the problem started, which is what you need for patient look-back.

### 4. Westgard multirules

Rules are written as *number of results – limit*. "2-2s" means two results beyond the same 2 SD limit.

| Rule | What it means | Error it mainly detects | Typical action |
|---|---|---|---|
| **1-2s** | One control outside ±2 SD | Warning | Inspect the other rules before accepting or rejecting |
| **1-3s** | One control outside ±3 SD | Random (or large systematic) | Reject |
| **2-2s** | Two consecutive results beyond the same ±2 SD limit: same level across two runs, or two levels in one run | Systematic | Reject |
| **R-4s** | Within one run, one control above +2 SD and another below −2 SD | Random | Reject |
| **4-1s** | Four consecutive results beyond the same ±1 SD limit (one level over four runs, or across levels) | Systematic | Reject, or investigate per lab policy |
| **10x** | Ten consecutive results on the same side of the mean | Systematic | Reject, or investigate per lab policy |

**[CHECK: which rules your lab uses to reject and which only trigger review. Many labs now choose rules per analyte based on sigma metrics. Match this table to your QC policy before assigning the module.]**

**Random error** affects individual measurements unpredictably: a bubble, a clot, a short sample, a sticky probe. **Systematic error** pushes results consistently in one direction: calibration, reagent or calibrator lot, drift, temperature.

### 5. Making the decision

1. Look at all levels in the run.
2. Apply the rules in order, starting with 1-2s as the trigger to look harder.
3. Check the LJ chart for across-run rules (2-2s across runs, 4-1s, 10x).
4. **Accept**: report patients. **Reject**: hold patients and investigate (Module 2).
5. Document the decision, including warnings you reviewed and accepted.

Never adjust the mean or widen the limits to make a failing control "pass". Changing ranges is a supervisory decision with its own documentation.

---

## Question bank

Answers and rationale follow each question. Pilot labs can pick 10–15 per assessment. **Pass mark: 80%. [CHECK]**

1. **Why is one Level 1 result at +2.3 SD not, by itself, a reason to reject a run in a Westgard multirule procedure?**
   a) 2 SD limits are too wide to matter b) About 1 in 20 results from a stable system falls outside 2 SD by chance c) Level 1 is less important than Level 2 d) Only Level 3 matters for rejection
   **Answer: b.** 1-2s is a warning that triggers inspection with the other rules.

2. **Mean 100, SD 2. Which result violates 1-3s?**
   a) 104 b) 105 c) 107 d) 95
   **Answer: c.** 107 is +3.5 SD. 104 is +2 SD, 105 is +2.5 SD, 95 is −2.5 SD.

3. **Level 1 is +2.4 SD and Level 2 is +2.6 SD in the same run. Which rule is violated?**
   a) R-4s b) 2-2s c) 4-1s d) None
   **Answer: b.** Two results beyond the same (+2 SD) limit.

4. **Level 1 is +2.2 SD and Level 2 is −2.1 SD in the same run. Which rule, and what error type?**
   **Answer:** R-4s, random error. The range between the two exceeds 4 SD.

5. **A 2-2s violation most often points to:**
   a) Random error b) Systematic error c) A clerical error d) Nothing; it's a warning
   **Answer: b.**

6. **Ten consecutive Level 2 results sit below the mean, all within ±2 SD. What does this suggest?**
   **Answer:** A 10x violation: a systematic shift. Look for what changed where the run of low results began (lot change, calibration, maintenance).

7. **Calculate the CV: mean 5.0 mmol/L, SD 0.1 mmol/L.**
   **Answer:** 2.0%.

8. **What does increased scatter on the LJ chart, in both directions, most suggest?**
   a) Calibration shift b) Imprecision / random error c) New reagent lot bias d) Control material evaporation
   **Answer: b.**

9. **Results drift steadily upward over eight runs. Name two likely causes.**
   **Answer (any two):** deteriorating reagent, deteriorating or evaporating control, ageing lamp or electrode, slowly failing component, calibration drift.

10. **Which of the following can QC NOT detect?**
    a) Reagent deterioration b) Calibration shift c) A haemolysed patient specimen d) Probe carry-over affecting all samples
    **Answer: c.** Pre-analytical problems in a single specimen are invisible to QC.

11. **Your control fails. A colleague suggests widening the SD limits because "it's been running high for weeks". What's wrong with that?**
    **Answer:** It hides a real shift. The run is rejected and investigated; any range change is a supervisory decision based on data, documented separately.

12. **Why is it important to look at the LJ chart and not just today's result?**
    **Answer:** Across-run rules (2-2s across runs, 4-1s, 10x) and trends only show over time, and the chart tells you when the problem started, which defines the patient look-back window.

13. **True or false: a run where all controls are within ±2 SD can still be rejected.**
    **Answer:** True. 4-1s and 10x can be violated with every point inside 2 SD.

14. **Four consecutive Level 3 results are +1.3, +1.6, +1.2, +1.8 SD. Which rule?**
    **Answer:** 4-1s. Systematic error.

15. **Before accepting a run with a 1-2s warning, what must you do?**
    **Answer:** Check the other rules (within the run and across runs on the LJ chart), then accept only if none are violated, and document the review.

---

## Case: "It's only 1 SD"

It's 06:30. Level 2 potassium has been between +1.1 and +1.9 SD for the last four runs. Today it's +1.4 SD. Level 1 is +0.3 SD. The night tech accepted all four previous runs because "nothing was outside 2 SD". The reagent pack was changed at 01:00 yesterday.

**Questions**
1. Is there a rule violation? Which one?
2. What type of error does it suggest?
3. What's the first thing you'd look at, and why?
4. What happens to patient results?
5. What would you say to the night tech?

**Model answer**
1. Yes. Level 2 has five consecutive results beyond +1 SD: 4-1s (violated from the fourth run).
2. Systematic.
3. The reagent pack change at 01:00 yesterday: check when the shift started on the LJ chart and whether it lines up. Then check calibration after the pack change, and the Level 2 control vial.
4. Hold results from the current run. Look back from the last run where the rule was not violated; rerun selected patients to see whether the bias is clinically significant against your allowable limit. **[CHECK: your lab's allowable difference for potassium.]**
5. Constructively: rules that span runs need the chart, not just today's point. Suggest they review this module.

---

## Direct observation checklist (Method 6, and Method 3 for QC)

| # | The technologist… | ✔ / ✘ |
|---|---|---|
| 1 | Runs the correct control levels at the required frequency | |
| 2 | Handles control material correctly (reconstitution, mixing, stability) | |
| 3 | Reviews every level against its limits before releasing patients | |
| 4 | Opens the LJ chart and checks across-run rules | |
| 5 | Correctly identifies accept vs reject | |
| 6 | Holds patient results when QC is rejected | |
| 7 | Documents the decision, including reviewed warnings | |
| 8 | Can explain the error type the violated rule suggests | |

Assessor: ________ Date: ________ Result: Satisfactory / Unsatisfactory

## QC record review checklist (Method 3)

Reviewer selects one month of QC records for the employee.

| Check | Yes / No / N/A |
|---|---|
| All required levels run each shift/day | |
| Every out-of-range result has a documented action | |
| No evidence of repeated reruns until "pass" | |
| Warnings reviewed and documented | |
| Corrective actions include a patient look-back when required | |
| Records signed / initialled and dated | |

---

*LabReady Pro training content. Follow your laboratory's QC policy, the manufacturer's instructions and your accrediting body's requirements.*
