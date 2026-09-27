# Instrument Pack — Roche cobas pure (c 303 / e 402)

**LabReady Instrument Competency Pack** · Draft v0.1 for founding-lab pilots
**Time:** lesson ~25 min · quiz ~15 min · case ~10 min · direct observation at the analyser
**Prerequisites:** Modules 1–3 and 10
**Competency methods covered:** 3 (records), 4 (direct observation on this analyser), 6 (problem solving)

> Author's note (Elie): this pack is written from bench experience, not copied from Roche documents. Where exact steps, volumes, intervals or screen names matter, it says "per the operator's manual" on purpose. Check everything marked **[CHECK]** against the current operator's manual, the software version your lab runs and your lab's own procedures before using it for a competency record.

---

## Learning objectives

1. Describe what each part of the cobas pure does (ISE, c 303 photometric chemistry, e 402 immunoassay) and which tests your lab runs on each.
2. Start up, perform scheduled maintenance and function checks, and record them.
3. Load reagents and consumables correctly and know when a reagent or calibration is no longer usable.
4. Recognise the common alarm and flag categories and respond at operator level.
5. Recognise immunoassay-specific pitfalls on the e 402: biotin, high-dose hook and heterophile antibodies.
6. Decide which patient results are affected by an analyser problem and when to stop testing.

---

## Lesson

### 1. The system in one page

The cobas pure is a compact integrated system. In most labs it combines:

- **An ISE unit** for sodium, potassium and chloride, using indirect potentiometry (the sample is diluted before measurement).
- **The c 303 module**: photometric clinical chemistry. Sample and reagent react in cuvettes; the analyser reads absorbance over time and converts it to a result against a calibration.
- **The e 402 module**: immunoassay using electrochemiluminescence (ECL). Most assays capture the analyte on streptavidin-coated microparticles through a biotinylated antibody; the particles are held on an electrode and light is generated and measured.

A shared sample supply unit feeds all of them, so one tube can go to every module. That's convenient, and it also means a sample-level problem (clot, short sample, wrong tube) can affect results across modules.

**[CHECK: the exact module configuration, software version and test menu at the pilot lab. Some labs run the c 303 without the e 402.]**

### 2. Start-up and daily checks

Before patient testing each day (or each shift, per your lab's procedure):

1. Check the analyser status and any overnight alarms. Don't clear them without reading them.
2. Check system water, wash solutions and waste. Empty or replace per the manual.
3. Check consumables: cuvettes (c 303), assay cups and tips (e 402), system reagents and ISE solutions.
4. Perform the daily maintenance the manual lists (for example probe and ISE-related tasks), plus anything your lab adds.
5. Review the function checks the analyser performs or asks for, such as photometer and ISE checks. Record readings where your log requires them.
6. Run QC for every analyte you'll report, and review it against your rules (Module 1) before releasing patients.

Don't start patients while a required maintenance task is overdue or a function check is outside its limits.

**[CHECK: daily, weekly and as-needed task names and intervals per the current operator's manual and the lab's maintenance log.]**

### 3. Reagents, calibrators and on-board stability

- **Load reagents per the manual.** The analyser reads each pack's identity, lot and expiry. Don't force a pack into a position it rejects.
- **Two clocks matter:** the lot expiry date *and* the on-board (opened) stability. A pack can be in date but past its on-board stability. The analyser tracks this; you still need to know it exists.
- **Calibration interval:** each assay has a calibration frequency, and some events force a new calibration, such as a new reagent lot or certain maintenance. The analyser shows calibration status per test. Results from a test whose calibration has expired or failed must not be reported.
- **After calibration**, run QC before reporting patients (Module 3).
- **New reagent lot:** follow your lab's lot-to-lot procedure (Module 5) before putting it into use. Run the study in the LabReady worksheets.
- **Immunoassay reagents** are usually mixed on board. Don't shake packs by hand unless the pack insert tells you to.

**[CHECK: the lab's policy on calibration after a new pack of the same lot, and which maintenance tasks trigger recalibration.]**

### 4. Alarms and flags: what to do at operator level

Read the alarm text and code first, then look it up in the operator's manual. Group it:

| Category | Examples | First response |
|---|---|---|
| Sample | Clot, short sample, bubble or foam, sample volume | Inspect the tube, remove the clot or foam, check volume and tube type, rerun the flagged tests |
| Reagent | Empty, expired, past on-board stability, calibration expired | Replace the pack or recalibrate, run QC, rerun affected tests |
| Result flags | Above or below measuring range, reaction limit exceeded, HIL index above the assay's limit | Dilute per the assay insert and your lab's rules (Module 4); follow the HIL policy (Module 9) |
| Mechanical | Probe or mixer movement, cuvette handling, gripper | Clear per the manual, check for obstructions, then function checks and QC |
| Temperature / photometer | Incubation or reaction temperature, photometer check | Stop reporting affected tests; results since the fault may be affected |
| ISE | Slope or calibration failure, noise, clogged or air in flow path | ISE maintenance per the manual, recalibrate, QC |
| Communication | Host or LIS connection lost | Follow LIS downtime (Module 10); check results transferred |

Rules that don't change:

- **Clearing an alarm doesn't fix the problem.** A repeated alarm is data (Module 10).
- **Protect patients first.** Work out which samples were in progress and whether their results are affected.
- **Call Roche service** when the fix is beyond operator level, the problem recurs, or the manual says to. Have the alarm history, serial number and what you've already tried ready.

**[CHECK: the pilot lab's escalation path and service contact details.]**

### 5. Immunoassay pitfalls on the e 402

These don't show up as instrument alarms, which is why they catch people out.

**Biotin.** Many assays on this platform rely on biotin–streptavidin binding. High biotin in the patient's sample (usually from high-dose supplements) can interfere. In a sandwich assay it tends to give a **falsely low** result; in a competitive assay it tends to give a **falsely high** result. The classic trap: a thyroid panel showing low TSH with high free T4, looking like hyperthyroidism in a patient who's well. Each assay insert states its biotin tolerance.
- What to do: ask about supplements, follow your lab's policy (for example a comment, a redraw after a biotin-free interval, or testing on another method).

**High-dose hook.** In some sandwich assays a very high analyte concentration saturates both antibodies and gives a falsely *low* result. Assays at risk (for example some tumour markers or hormones) have a stated hook limit in the insert. If the clinical picture says the value should be very high, dilute and rerun.

**Heterophile and human anti-animal antibodies.** These can bridge the assay antibodies and give falsely high (sometimes low) results. Suspect them when a result doesn't fit the patient and doesn't change as expected on dilution. Options include a blocking tube, testing on a different platform, or referral, per your lab's policy.

**Carry-over and sample integrity** matter more for analytes with a very wide range (for example hCG). Follow the manual's guidance and your lab's rules on rerunning low results that follow a very high one.

**[CHECK: the lab's biotin, hook and heterophile policies, and which assays on the menu have hook or biotin limits worth listing on the bench card.]**

### 6. Which results are affected?

Use the same thinking as Module 10:

- **Sample-level** (clot, short sample, foam): that sample's flagged tests. Short sampling reads falsely low.
- **Test-level** (one reagent pack, one calibration): every result on that test since the problem started, possibly on one module only.
- **Module- or run-level** (temperature, photometer, ISE, water): every result on that module since the fault. Treat it as a QC failure look-back (Module 2).

If the ISE is down but the c 303 is fine, you may keep reporting photometric tests while you fix the ISE. That's a decision for your procedure and supervisor, not a guess.

---

## Question bank

**Pass mark: 80%. [CHECK]**

1. **What measuring principle does the e 402 use?**
   **Answer:** Electrochemiluminescence (ECL), with most assays captured on streptavidin-coated microparticles.

2. **A reagent pack is within its expiry date but past its on-board stability. Can you use it?**
   **Answer:** No. Both the expiry date and the on-board stability must be current.

3. **A patient on high-dose biotin has a low TSH and a high free T4 but is clinically well. What should you suspect?**
   **Answer:** Biotin interference: falsely low in the sandwich assay (TSH), falsely high in the competitive assay (free T4). Follow the lab's biotin policy.

4. **What is a high-dose hook effect and what do you do if you suspect it?**
   **Answer:** In a sandwich assay, a very high concentration can give a falsely low result. Dilute and rerun per the assay insert.

5. **The ISE slope check fails before the morning run. What's affected and what do you do?**
   **Answer:** Sodium, potassium and chloride. Don't report them; perform ISE maintenance per the manual, recalibrate, run QC. Photometric and immunoassay tests may continue if their QC is acceptable and your procedure allows.

6. **Three clot alarms in 15 minutes on clean-looking samples. Sample problem or analyser problem?**
   **Answer:** Probably the analyser: probe, pressure detection, tubing or wash. Check per the manual, run QC, call service if it continues.

7. **The calibration for ALT has expired and the analyser still has ALT requests pending. What do you do?**
   **Answer:** Don't report ALT. Recalibrate, run QC and confirm it's acceptable, then run the pending samples.

8. **A result flags as above the measuring range. What do you do?**
   **Answer:** Dilute per the assay insert and the lab's dilution rules (Module 4) and report with the dilution documented, or report as greater than the upper limit if the lab's procedure says so.

9. **Why doesn't clearing an alarm count as fixing it?**
   **Answer:** The cause is still there. Repeated alarms show an underlying problem to investigate or escalate.

10. **Name three things to have ready when calling Roche service.**
    **Answer (any three):** alarm codes and history, serial number, what happened and when, what you've tried, affected tests or modules.

11. **What must you do before reporting patient results after a calibration?**
    **Answer:** Run QC and confirm it's acceptable.

12. **A result doesn't fit the patient and doesn't dilute linearly. What interference should you consider?**
    **Answer:** Heterophile or human anti-animal antibodies. Follow the lab's policy (blocking tube, alternative method or referral).

---

## Case: a thyroid panel that doesn't fit

A GP calls about a 34-year-old woman with fatigue and hair thinning. Her TSH on the e 402 is 0.02 mIU/L (low) and her free T4 is 48 pmol/L (high). She has no symptoms of hyperthyroidism: normal heart rate, no weight loss, no tremor. QC for both assays was acceptable this morning. Her previous panel, eight months ago on the same analyser, was normal.

**Questions**
1. What does the pattern look like, and why doesn't it fit?
2. What interference is most likely, and why does it push TSH and free T4 in opposite directions?
3. What should you ask?
4. What do you do with the result?
5. What do you document?

**Model answer**
1. It looks like hyperthyroidism, but the patient has no signs of it and was normal eight months ago.
2. Biotin. TSH is a sandwich assay, where excess biotin reduces the signal, so it reads falsely low. Free T4 is a competitive assay, where less signal means a higher result, so it reads falsely high. Patients often take high-dose biotin for hair and nails, which fits her symptoms.
3. Ask whether she takes biotin or a "hair, skin and nails" supplement, and at what dose.
4. Follow the lab's biotin policy: don't report the results as a straightforward hyperthyroid picture; add a comment, and arrange a redraw after the biotin-free interval the policy states, or test on a method without biotin–streptavidin binding. Talk to the pathologist or director if the policy says so.
5. The call, what was asked and answered, the action taken (comment, redraw, alternative method), who was informed and when.

**[CHECK: units, reference intervals and the biotin-free interval the lab's policy uses.]**

---

## Direct observation checklist (Method 4)

Observed on this analyser. The assessor ticks what they saw, not what they were told.

| # | The technologist… | ✔ / ✘ |
|---|---|---|
| 1 | Checks alarms, water, wash, waste and consumables at start-up | |
| 2 | Performs daily maintenance per the manual and lab schedule and records it | |
| 3 | Reviews function checks (photometer, ISE) and acts on any outside limits | |
| 4 | Loads a reagent pack and checks lot, expiry, on-board stability and calibration status | |
| 5 | Performs or reviews a calibration and runs QC before reporting | |
| 6 | Responds to a sample-level alarm correctly (clot, short sample, foam) | |
| 7 | Handles an above-range result with the correct dilution and documentation | |
| 8 | Explains biotin, hook and heterophile interference and the lab's policy for each | |
| 9 | Identifies which results are affected by a module-level fault | |
| 10 | Knows when and how to call service and what to have ready | |

Assessor: ________ Date: ________ Result: Satisfactory / Unsatisfactory

## Record review (Method 3)

| Check | Yes / No / N/A |
|---|---|
| Daily and weekly maintenance complete and initialled for the period | |
| Function check readings recorded and within limits, or actions documented | |
| Calibrations current for every reported test; failures have documented actions | |
| QC reviewed and acceptable before patient results were released | |
| New reagent lots have an accepted lot-to-lot study before use | |
| Alarms that stopped testing have documented actions and look-back | |
| Service visits documented with verification before resuming | |

---

*LabReady Pro training content, written independently. Not produced by or affiliated with Roche. cobas and cobas pure are trademarks of Roche. Follow the manufacturer's operator manual and assay inserts, your laboratory's procedures and your accrediting body's requirements.*
