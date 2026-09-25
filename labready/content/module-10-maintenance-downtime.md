# Module 10 — Maintenance, Troubleshooting & Downtime

**LabReady Chemistry Competency System** · Draft v0.1 for founding-lab pilots
**Time:** lesson ~20 min · quiz ~15 min · case ~10 min
**Prerequisites:** Modules 1–3
**Competency methods covered:** 3 (maintenance records), 4 (direct observation of maintenance and function checks), 6 (problem solving)

> Author's note (Elie): review everything marked **[CHECK]** against your experience and the pilot lab's procedures. Instrument-specific steps belong in the Cobas Pure and ARCHITECT packs.

---

## Learning objectives

1. Perform and document scheduled maintenance and function checks.
2. Approach an instrument error logically and know when to call service.
3. Decide which patient results are affected by an instrument problem.
4. Run a safe downtime: backup testing, prioritisation, communication and recovery.

---

## Lesson

### 1. Scheduled maintenance

Maintenance follows the manufacturer's schedule (daily, weekly, monthly, quarterly, as needed) plus anything your lab adds. Typical chemistry tasks: probe and mixer cleaning, cuvette checks or replacement, wash solution and water checks, ISE electrode and reference maintenance, photometer checks, filter and tubing replacement.

**Function checks** confirm the system is working before patient testing: temperatures, photometer/lamp checks, water quality, ISE slope, pressure or vacuum checks, depending on the platform.

Rules:
- Do it on schedule. If it's overdue, it's not done.
- Record it: date, task, result, initials. Unrecorded maintenance didn't happen as far as an inspector is concerned.
- After major maintenance or part replacement, check whether calibration, calibration verification and QC are required before resuming (Module 3).

**[CHECK: the pilot lab's maintenance log format and schedules per analyser.]**

### 2. Troubleshooting an error

1. **Read the message.** Note the code and the exact wording. Look it up in the operator's manual.
2. **Classify it:** sample-related (clot, short sample, bubble), reagent-related (empty, expired, stability), mechanical (probe crash, mixer, arm), photometric/detector, temperature, fluidics/water, ISE, communication/LIS.
3. **Protect patients:** which samples were in progress? Are their results affected?
4. **Fix at operator level** following the manual: clean, reseat, replace consumables, prime, reset.
5. **Verify:** function checks and QC (and calibration if required) before resuming.
6. **Call service** when the problem is beyond operator level, recurs, or the manual says to. Have the error log, serial number and what you've already tried ready.
7. **Document** error, actions, parts, service call reference, verification and resumption time.

Don't clear the same error repeatedly without understanding it. Recurring errors are data.

### 3. Which results are affected?

- **Sample-level errors** (clot, short sample): usually only that sample's flagged tests. Rerun after checking the specimen. Short sampling gives falsely **low** results.
- **Run-level errors** (temperature, reagent, photometer, water): every result since the problem started may be affected. Treat it like a QC failure look-back (Module 2).
- If in doubt, hold and review with your supervisor.

### 4. Downtime

Before it happens, know your downtime procedure:

- **Backup:** second analyser, point-of-care devices, or a reference lab for send-outs.
- **Prioritise:** ED, ICU, critical and stat tests first. Communicate expected delays.
- **LIS downtime:** manual requisitions and reports, a log of every result released manually, and back-entry into the LIS on recovery with verification.
- **Communicate:** notify clinical areas when testing is delayed and when it's restored.

Recovery:
1. Fix, run function checks, calibrate if needed, QC acceptable.
2. Clear the backlog in priority order.
3. Back-enter and verify manual results.
4. Confirm backup-method results were reported with any needed comments.
5. Document the downtime: start, end, cause, actions, communication.

**[CHECK: the pilot lab's downtime and LIS downtime procedures.]**

---

## Question bank

**Pass mark: 80%. [CHECK]**

1. **Weekly maintenance was done but not recorded. Was it done, as far as an inspector is concerned?**
   **Answer:** No. Unrecorded maintenance can't be shown to have been done.

2. **What must you check after replacing a photometer lamp?**
   **Answer:** Required function checks, calibration if required, calibration verification if required, and QC before resuming.

3. **A probe clot alarm occurs on one sample. What results are affected?**
   **Answer:** Usually that sample's tests; short sampling gives falsely low results. Check the specimen and rerun.

4. **The reaction bath temperature was out of range for 40 minutes before an alarm. What's affected?**
   **Answer:** Potentially every result in that window. Hold, investigate, and look back as for a QC failure.

5. **When should you call service?**
   **Answer:** When the problem is beyond operator-level fixes, recurs, or the manual says to.

6. **What information should you have ready for the service call?**
   **Answer:** Error codes and log, serial number, what happened, what you've tried.

7. **An error has been cleared five times this shift. What's wrong with that?**
   **Answer:** A recurring error indicates an underlying problem. Investigate or escalate.

8. **During downtime, which tests are prioritised?**
   **Answer:** ED, ICU, critical and stat requests, per the downtime plan.

9. **What's required when the LIS comes back after downtime?**
   **Answer:** Back-enter manual results and verify them, clear backlog, document downtime.

10. **Name three classes of instrument error.**
    **Answer (any three):** sample, reagent, mechanical, photometric/detector, temperature, fluidics/water, ISE, communication/LIS.

11. **What must be done before resuming patient testing after a repair?**
    **Answer:** Function checks, calibration if required, and acceptable QC.

12. **What should a maintenance log entry include?**
    **Answer:** Date, task, result or reading, initials; any issues and actions.

---

## Case: probe clot alarms mid-run

At 07:50 the chemistry analyser gives three sample probe clot alarms in 20 minutes on different patients' samples. The last two alarms were on samples you'd checked for clots. QC at 07:00 was acceptable. The ED is busy.

**Questions**
1. Is this a sample problem or an instrument problem?
2. What do you do about results already released?
3. How do you fix it?
4. What do you do about the ED workload?
5. What do you document?

**Model answer**
1. Probably instrument-related: repeated alarms on specimens without visible clots suggest a probe or its pressure detection, wash or tubing problem. One alarm would suggest a sample; three in 20 minutes on clean samples doesn't.
2. Identify samples processed since the alarms started, and results with short-sampling flags. Rerun affected tests once the probe is fixed. Watch for falsely low results.
3. Operator-level steps per the manual: inspect and clean the probe, check for bends, check tubing and wash station, run the relevant function checks and QC. If alarms continue, call service.
4. Move stat work to the backup analyser (with acceptable QC) and tell the ED about delays.
5. Error codes and times, actions, samples affected and rerun, verification and QC, service call if made, resumption time, communication to ED.

---

## Direct observation checklist (Method 4)

| # | The technologist… | ✔ / ✘ |
|---|---|---|
| 1 | Performs daily maintenance per the manufacturer and lab schedule | |
| 2 | Performs required function checks and records readings | |
| 3 | Records maintenance completely | |
| 4 | Uses the manual to troubleshoot an error | |
| 5 | Identifies which results are affected | |
| 6 | Verifies with QC (and calibration if needed) before resuming | |
| 7 | Knows when and how to call service | |
| 8 | Can explain the downtime procedure and priorities | |

Assessor: ________ Date: ________ Result: Satisfactory / Unsatisfactory

## Maintenance record review (Method 3)

| Check | Yes / No / N/A |
|---|---|
| Daily, weekly and monthly maintenance complete for the period | |
| Function check readings recorded and within limits | |
| Out-of-limit readings have documented actions | |
| Service visits documented with verification | |
| Records initialled and dated | |

---

*LabReady Pro training content. Follow your laboratory's procedures, the manufacturer's operator manual and your accrediting body's requirements.*
