# Instrument Pack — Abbott ARCHITECT (c-series / i-series)

**LabReady Instrument Competency Pack** · Draft v0.1 for founding-lab pilots
**Time:** lesson ~25 min · quiz ~15 min · case ~10 min · direct observation at the analyser
**Prerequisites:** Modules 1–3 and 10
**Competency methods covered:** 3 (records), 4 (direct observation on this analyser), 6 (problem solving)

> Author's note (Elie): this pack is written from bench experience, not copied from Abbott documents. Where exact steps, volumes, intervals or screen names matter, it says "per the operator's manual" on purpose. Check everything marked **[CHECK]** against the current operator's manual, the software version your lab runs and your lab's own procedures before using it for a competency record.

---

## Learning objectives

1. Describe the c-series (photometric chemistry with ICT electrolytes) and i-series (CMIA immunoassay) modules and which tests your lab runs on each.
2. Start up, perform scheduled maintenance and function checks, and record them.
3. Manage reagents, bulk solutions and calibrations, including on-board stability.
4. Recognise the common error and flag categories and respond at operator level.
5. Recognise immunoassay pitfalls on the i-series: hook effect, heterophile antibodies and carry-over.
6. Decide which patient results are affected by an analyser problem and when to stop testing.

---

## Lesson

### 1. The system in one page

ARCHITECT systems come as stand-alone chemistry (c-series, such as the c4000, c8000 or c16000), stand-alone immunoassay (i-series, such as the i1000SR or i2000SR), or integrated ci-systems that share one sample handler.

- **c-series:** photometric chemistry in cuvettes, plus the **ICT (Integrated Chip Technology) module** for sodium, potassium and chloride. The ICT module is a consumable with a limited life; replacing it means calibration and QC before reporting.
- **i-series:** **CMIA (chemiluminescent microparticle immunoassay)**. The analyte binds to antibody-coated paramagnetic microparticles; an acridinium-labelled conjugate is added; after washing, **pre-trigger** and **trigger** solutions start the light reaction, which is measured.

On an integrated system, one tube can go to both modules, so a sample-level problem can affect results on both.

**[CHECK: the exact models, software version and test menu at the pilot lab.]**

### 2. Start-up and daily checks

Before patient testing each day (or each shift, per your lab's procedure):

1. Check the system status and the error log. Read overnight errors before clearing anything.
2. Check bulk solutions and waste: on the c-series, water, wash solutions and ICT reference solution; on the i-series, pre-trigger, trigger and wash buffer. Replace or top up per the manual.
3. Check consumables: reaction vessels and sample cups on the i-series; cuvette status on the c-series.
4. Perform the daily maintenance the manual lists, plus anything your lab adds.
5. Review function checks and any readings your log requires, such as temperatures and ICT status.
6. Run QC for every analyte you'll report, and review it against your rules (Module 1) before releasing patients.

Don't start patients while required maintenance is overdue or a function check is out of limits.

**[CHECK: daily, weekly and monthly maintenance procedures and their names in the current operator's manual; the lab's maintenance log.]**

### 3. Reagents, calibrators and on-board stability

- **Load reagents per the manual.** The system reads each reagent's identity, lot and expiry. Don't override a reagent the system rejects.
- **Two clocks:** the lot expiry date *and* the on-board (opened) stability. A reagent can be in date and still past its on-board stability.
- **Calibration status** is tracked per assay. Some assays need calibration per reagent lot; others on a schedule; certain maintenance or part replacement also requires it. Don't report results from an assay whose calibration has expired or failed.
- **ICT module:** has its own calibration and a limited use life. Track its install date and sample count per the manual.
- **After calibration**, run QC before reporting patients (Module 3).
- **New reagent lot:** complete your lab's lot-to-lot procedure (Module 5) before use. Run the study in the LabReady worksheets.
- **Microparticle reagents** on the i-series need to be mixed before loading per the insert. Unmixed particles give wrong results without an obvious error.

**[CHECK: which assays on the menu need calibration per lot, and the lab's rule for new packs of the same lot.]**

### 4. Errors and flags: what to do at operator level

Read the error code and text, then look it up in the operator's manual. Group it:

| Category | Examples | First response |
|---|---|---|
| Sample | Clot, short sample, bubble or foam, liquid level detection | Inspect the tube, remove the clot or foam, check volume and tube type, rerun the flagged tests |
| Reagent | Reagent empty, expired, past on-board stability, calibration expired | Replace or recalibrate, run QC, rerun affected tests |
| Result flags | Above linearity or measuring range, HIL indices above the assay's limit, absorbance limit exceeded | Dilute per the insert and lab rules (Module 4); follow the HIL policy (Module 9) |
| ICT | Slope or calibration failure, noise, bubbles | ICT maintenance per the manual, replace the module if due, recalibrate, QC |
| i-series optics / bulk | Pre-trigger or trigger low, wash buffer, optics or background check | Replace the solution, run the relevant checks, QC |
| Mechanical | Pipettor, RV or cuvette handling, carousel movement | Clear per the manual, check for obstructions, then function checks and QC |
| Temperature | Reaction or incubation temperature out of range | Stop reporting affected tests; results since the fault may be affected |
| Communication | LIS connection lost | Follow LIS downtime (Module 10); check results transferred |

Rules that don't change:

- **Clearing an error doesn't fix it.** Repeats are data (Module 10).
- **Protect patients first.** Work out which samples were in progress and whether their results are affected.
- **Call Abbott service** when the fix is beyond operator level, the problem recurs, or the manual says to. Have the error log, serial number and what you've tried ready.

**[CHECK: the pilot lab's escalation path and service contact details.]**

### 5. Immunoassay pitfalls on the i-series

These don't appear as analyser errors.

**High-dose hook.** In a one-step sandwich assay, a very high analyte concentration can saturate both the capture and the detection antibody and give a falsely *low* result. Assays at risk (some tumour markers, hormones and hCG) state their hook limit in the insert. If the clinical picture says the value should be very high, dilute and rerun.

**Heterophile and human anti-animal antibodies (HAMA).** These can bridge the capture and detection antibodies and give falsely high, occasionally low, results. Suspect them when a result doesn't fit the patient and doesn't dilute linearly. Options include a blocking tube, testing on a different platform or referral, per your lab's policy.

**Biotin.** CMIA assays generally don't rely on biotin–streptavidin capture the way some other platforms do, so biotin is a smaller concern here. Don't assume every assay is immune; check the insert. This matters when your lab moves a test between platforms. **[CHECK: biotin statements in the inserts for the lab's menu.]**

**Carry-over.** Analytes with a very wide range (hCG, some tumour markers) can carry over from a very high sample to the next one. Follow the manual's guidance and your lab's rule on rerunning an unexpected low-positive that follows a very high result.

**Microparticle mixing.** An i-series reagent loaded without proper mixing can give a shift in QC and patients with no error message. If QC shifts right after a new pack was loaded, think of this.

**[CHECK: the lab's hook and heterophile policies and which assays warrant a bench-card note.]**

### 6. Which results are affected?

As in Module 10:

- **Sample-level** (clot, short sample, foam): that sample's flagged tests. Short sampling reads falsely low.
- **Assay-level** (one reagent, one calibration, a badly mixed microparticle pack): every result on that assay since the problem began.
- **Module-level** (temperature, optics, trigger solutions, ICT): every result on that module since the fault. Treat it as a QC failure look-back (Module 2).

On an integrated ci-system, a c-series fault doesn't necessarily stop the i-series, and the reverse. Whether you keep reporting from the working module is a decision for your procedure and supervisor.

---

## Question bank

**Pass mark: 80%. [CHECK]**

1. **What measuring principle does the i-series use?**
   **Answer:** CMIA: chemiluminescent microparticle immunoassay with an acridinium-labelled conjugate, started by pre-trigger and trigger solutions.

2. **What measures sodium, potassium and chloride on the c-series?**
   **Answer:** The ICT (Integrated Chip Technology) module.

3. **The ICT module has been replaced. What must happen before reporting electrolytes?**
   **Answer:** Calibration and acceptable QC, plus anything else the manual requires.

4. **A reagent is in date but past its on-board stability. Can you use it?**
   **Answer:** No. Both must be current.

5. **Trigger solution runs low mid-shift. What's affected?**
   **Answer:** i-series results. Replace the solution per the manual and check whether results processed while it was low need review.

6. **QC for one immunoassay shifts right after a new reagent pack is loaded, with no error. What should you think of?**
   **Answer:** The pack may not have been mixed properly (microparticles), or it's a new lot needing its lot-to-lot check. Investigate before reporting.

7. **What is a high-dose hook effect?**
   **Answer:** In a sandwich assay, a very high concentration gives a falsely low result. Dilute and rerun.

8. **A very high hCG is followed by a low-positive hCG on the next sample. What should you consider?**
   **Answer:** Carry-over. Rerun the second sample per the lab's rule.

9. **A result doesn't fit the patient and doesn't dilute linearly. What should you consider?**
   **Answer:** Heterophile or human anti-animal antibody interference. Follow the lab's policy.

10. **Name three things to have ready when calling Abbott service.**
    **Answer (any three):** error codes and log, serial number, what happened and when, what you've tried, affected assays or modules.

11. **The c-series reaction temperature was out of range for 30 minutes. Is the i-series affected?**
    **Answer:** Not by that fault on its own. c-series results in that window are affected; i-series results depend on their own checks and QC.

12. **What must you do before reporting patient results after a calibration?**
    **Answer:** Run QC and confirm it's acceptable.

---

## Case: a pregnancy test that's too low

The ED sends an urgent serum hCG for a 29-year-old woman with abdominal pain and a large uterus on ultrasound, suspected molar pregnancy. The i2000SR result is 1,850 IU/L. QC was acceptable this morning. The ED doctor calls: the clinical picture suggested a much higher value.

**Questions**
1. What might explain a result lower than expected?
2. How do you check?
3. What do you do with the original result?
4. What else should you look at in the run?
5. What do you document?

**Model answer**
1. A high-dose hook effect. A molar pregnancy can produce extremely high hCG, enough to saturate the assay and give a falsely low result.
2. Dilute the sample per the assay insert and the lab's dilution rules, and rerun. A result much higher after dilution, once corrected, confirms the hook.
3. Don't let the original stand. Report the corrected result with the dilution documented and phone it to the ED doctor, as the result changes clinical management.
4. The next samples after a very high hCG, for carry-over, per the lab's rule.
5. The call from the ED, the dilution and rerun, the corrected result, who was told and when, and any carry-over reruns.

**[CHECK: the insert's hook statement and dilution protocol for the lab's hCG assay, and the lab's policy on when hCG is diluted automatically.]**

---

## Direct observation checklist (Method 4)

Observed on this analyser. The assessor ticks what they saw, not what they were told.

| # | The technologist… | ✔ / ✘ |
|---|---|---|
| 1 | Checks the error log, bulk solutions, waste and consumables at start-up | |
| 2 | Performs daily maintenance per the manual and lab schedule and records it | |
| 3 | Reviews function checks and ICT status and acts on anything outside limits | |
| 4 | Loads a reagent correctly (including microparticle mixing) and checks lot, expiry, on-board stability and calibration status | |
| 5 | Performs or reviews a calibration and runs QC before reporting | |
| 6 | Responds to a sample-level error correctly (clot, short sample, foam) | |
| 7 | Handles an above-range result with the correct dilution and documentation | |
| 8 | Explains hook, heterophile and carry-over and the lab's policy for each | |
| 9 | Identifies which results are affected by a module-level fault | |
| 10 | Knows when and how to call service and what to have ready | |

Assessor: ________ Date: ________ Result: Satisfactory / Unsatisfactory

## Record review (Method 3)

| Check | Yes / No / N/A |
|---|---|
| Daily, weekly and monthly maintenance complete and initialled for the period | |
| Function check readings recorded and within limits, or actions documented | |
| ICT module install date and calibration recorded | |
| Calibrations current for every reported assay; failures have documented actions | |
| QC reviewed and acceptable before patient results were released | |
| New reagent lots have an accepted lot-to-lot study before use | |
| Errors that stopped testing have documented actions and look-back | |
| Service visits documented with verification before resuming | |

---

*LabReady Pro training content, written independently. Not produced by or affiliated with Abbott. ARCHITECT is a trademark of Abbott. Follow the manufacturer's operator manual and assay inserts, your laboratory's procedures and your accrediting body's requirements.*
