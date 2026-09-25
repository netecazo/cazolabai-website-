# Module 6 — Instrument Correlation & Method Comparison

**LabReady Chemistry Competency System** · Draft v0.1 for founding-lab pilots
**Time:** lesson ~25 min · quiz ~15 min · case ~15 min
**Prerequisites:** Modules 1, 3 and 5
**Competency methods covered:** 3 (records review), 5 (previously analysed specimens), 6 (problem solving)

> Author's note (Elie): review everything marked **[CHECK]** against your experience and the pilot lab's procedures.

---

## Learning objectives

1. Explain when instruments or methods must be compared.
2. Interpret slope, intercept, correlation coefficient (r / R²) and bias.
3. Explain why a high R² doesn't prove two methods agree.
4. Estimate bias at medical decision points and compare with acceptance criteria.
5. Decide what to investigate before accepting a comparison.

---

## Lesson

### 1. When comparisons are needed

- **New instrument or method** before patient use (part of method verification).
- **Same test on more than one instrument or method** in the lab: CLIA requires the lab to check the relationship between them at least twice a year. **[CHECK: 42 CFR 493.1281 and the pilot lab's accreditor checklist.]**
- **After major repair or relocation**, if procedure requires.
- **Unexplained patient complaints** that one analyser reads differently from another.

### 2. The numbers

Patient samples are run on both methods. The **comparative (reference/current) method is x**, the **new or test method is y**.

- **Slope:** proportional difference. Slope 1.00 = no proportional bias. Slope 0.93 = the new method reads about 7% lower, more so at higher concentrations.
- **Intercept:** constant difference. Intercept +3 = the new method reads about 3 units higher across the range.
- **r / R²:** how closely the points follow a straight line. It says nothing about whether the line is the **right** line.
- **Bias:** the average difference (y − x), in units or percent. Most useful when estimated at **medical decision points**.

Predicted y at a decision point: **y = slope × x + intercept.** Bias = y − x.

### 3. Why R² can mislead

Two methods can have R² = 0.999 and still disagree badly: if y is always exactly 10% lower than x, the points form a perfect line with slope 0.90. R² rises with a wide range of samples, whatever the agreement. A high R² tells you the regression estimates are reliable; the **slope, intercept and bias** tell you whether the methods agree.

If R² is low (a common rule of thumb: r < 0.975, R² < 0.95), the range of samples may be too narrow for ordinary regression, and statistics such as Deming or Passing-Bablok regression, or a difference (Bland-Altman) plot, are more appropriate. **[CHECK: the pilot lab's statistical approach and software.]**

### 4. Look at the plots, not just the numbers

- **Scatter plot** with the line of identity (y = x). Do points sit on it?
- **Difference plot** (y − x against the mean or against x). Is the difference constant, proportional, or does it change at one end? Any outliers?
- **Outliers:** check for sample mix-up, clot, short sample, interference or specimen deterioration before excluding. Never exclude a point just because it doesn't fit; document the reason.

### 5. Judging acceptability

1. Choose the medical decision points for the analyte.
2. Calculate the predicted bias at each.
3. Compare with the lab's acceptance criterion (often based on allowable total error, e.g. from CLIA proficiency testing limits or biological variation). **[CHECK: the pilot lab's criteria per analyte.]**
4. Consider how much of the allowable error the bias uses. A bias that consumes most of it leaves little room for imprecision.
5. The laboratory director approves acceptance.

### 6. Before accepting a comparison, investigate if…

- Slope is outside roughly 0.95–1.05, or the intercept is clinically meaningful
- Bias at a decision point approaches or exceeds the criterion
- The difference plot shows a pattern (proportional or at one end)
- There are unexplained outliers
- Samples don't cover the reportable range, especially decision points

Things to check: calibration of each system (and calibrator lots), reagent lots, sample type and handling (serum vs plasma, time to analysis), interferences, units and conversion, whether both instruments' QC and calibration verification are acceptable.

---

## Question bank

**Pass mark: 80%. [CHECK]**

1. **What does a slope of 1.08 mean?**
   **Answer:** The new method reads about 8% higher, proportionally.

2. **What does an intercept of −4 mean?**
   **Answer:** The new method reads about 4 units lower across the range (constant bias).

3. **Two methods have R² = 0.999. Does that prove they agree?**
   **Answer:** No. R² shows linearity of the relationship, not agreement. Check slope, intercept and bias.

4. **Slope 0.95, intercept +2. Predict the new method's result at x = 200.**
   **Answer:** 0.95 × 200 + 2 = 192. Bias −8 (−4%).

5. **How often must a lab compare the same test run on two analysers?**
   **Answer:** At least twice a year (CLIA). **[CHECK]**

6. **Why estimate bias at medical decision points?**
   **Answer:** That's where a difference changes clinical decisions; average bias can hide differences at specific concentrations.

7. **What's a difference (Bland-Altman) plot for?**
   **Answer:** Shows the difference between methods across the range, revealing constant or proportional bias and outliers.

8. **One sample differs by 40% while the rest agree. What do you do?**
   **Answer:** Investigate (mix-up, clot, interference, deterioration, repeat on both). Document the reason before excluding.

9. **Why is a wide concentration range important for a comparison?**
   **Answer:** It gives reliable slope and intercept estimates and covers decision points.

10. **Name four things to check when two analysers disagree.**
    **Answer (any four):** calibration and calibrator lots; reagent lots; QC and calibration verification on each; sample type/handling; interferences; units.

11. **Who approves acceptance of a method comparison?**
    **Answer:** The laboratory director (or designee per procedure).

12. **All samples fall between 80 and 120 mg/dL, R² = 0.82. What's the problem?**
    **Answer:** The range is too narrow for reliable regression. Add samples across the reportable range.

---

## Case: slope 0.93, R² 0.998

Your lab is bringing a second chemistry analyser into service. The glucose comparison (40 patient samples, 35–480 mg/dL) gives: slope 0.93, intercept +2 mg/dL, R² = 0.998. The new analyser is y.

**Questions**
1. Does R² = 0.998 mean the analysers agree?
2. Calculate predicted bias at 70, 126 and 200 mg/dL.
3. The lab's criterion is ±6 mg/dL or ±8%, whichever is greater. **[CHECK: confirm against the pilot lab's criterion.]** Does it pass?
4. What should you investigate before accepting?
5. What's your recommendation?

**Model answer**
1. No. It shows a tight straight-line relationship. The slope shows the new analyser reads about 7% low.
2. At 70: 0.93 × 70 + 2 = 67.1 → −2.9 mg/dL (−4.1%). At 126: 119.2 → −6.8 mg/dL (−5.4%). At 200: 188 → −12 mg/dL (−6%).
3. Technically within the stated criterion at each point (−6.8 at 126 is within 8% = 10.1; −12 at 200 is within 8% = 16).
4. A consistent −7% proportional bias uses most of the allowable error and leaves little room for imprecision. Check calibration on both analysers (calibrator lots and values, recent calibration), reagent lots, calibration verification on both, and sample handling. Look at the difference plot. Recalibrate the new analyser if a calibration issue is found and repeat the comparison.
5. Don't accept yet. Investigate the proportional bias, repeat after correction, and take the data to the director. Two analysers in the same lab giving glucose values 12 mg/dL apart at 200 will confuse clinicians tracking a patient.

---

## Direct observation / record review checklist (Methods 3, 5, 6)

| # | The technologist… | ✔ / ✘ |
|---|---|---|
| 1 | Selects samples across the range including decision points | |
| 2 | Runs samples on both systems close together in time | |
| 3 | Plots the data (scatter and difference) | |
| 4 | Explains slope, intercept, R² and bias correctly | |
| 5 | Calculates bias at decision points | |
| 6 | Applies the lab's acceptance criteria | |
| 7 | Investigates outliers before excluding | |
| 8 | Knows what to check when a comparison fails | |
| 9 | Documents and routes for director approval | |

Assessor: ________ Date: ________ Result: Satisfactory / Unsatisfactory

---

*LabReady Pro training content. Follow your laboratory's procedures, the manufacturer's instructions and your accrediting body's requirements.*
