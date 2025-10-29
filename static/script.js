// Clean, focused frontend logic for BMI, Macros, Body Fat, Calories, Measurements and Theme.
// Assumes Bootstrap is available for classes/tooltips.

document.addEventListener('DOMContentLoaded', () => {

    // --- Utilities ---
    const safeGet = id => document.getElementById(id);
    const formatNumber = (n, decimals = 1) => {
        if (isNaN(n) || !isFinite(n)) return '-';
        const p = Math.pow(10, decimals);
        return Math.round(n * p) / p;
    };
    const showAlert = (elementId, html, type = 'warning') => {
        const el = safeGet(elementId);
        if (!el) return;
        el.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
        el.classList.add('result-display');
    };

    // --- BMI Calculator ---
    const bmiForm = safeGet('bmiForm');
    if (bmiForm) {
        bmiForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const weight = parseFloat(safeGet('weight')?.value);
            const heightCm = parseFloat(safeGet('height')?.value);

            if (!weight || !heightCm) {
                showAlert('bmiResult', 'Please enter valid weight and height.', 'warning');
                return;
            }

            const heightM = heightCm / 100;
            const bmi = weight / (heightM * heightM);
            let category = ['Obese', 'danger'];
            if (bmi < 18.5) category = ['Underweight', 'warning'];
            else if (bmi < 25) category = ['Normal weight', 'success'];
            else if (bmi < 30) category = ['Overweight', 'warning'];

            safeGet('bmiResult').innerHTML = `
                <div class="alert alert-${category[1]}">
                    <h5 class="mb-2">BMI Results</h5>
                    <p class="mb-1">Your BMI is: <strong>${formatNumber(bmi)}</strong></p>
                    <p class="mb-0">Category: <strong>${category[0]}</strong></p>
                </div>
            `;
            safeGet('bmiResult').classList.add('result-display');

            // store for other calculators
            localStorage.setItem('userWeight', String(weight));
            localStorage.setItem('userHeight', String(heightCm));
        });
    }

    // --- Daily Calorie Calculator (Mifflin-St Jeor) ---
    const calorieForm = safeGet('calorieForm');
    if (calorieForm) {
        calorieForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const weight = parseFloat(safeGet('weight')?.value) || parseFloat(localStorage.getItem('userWeight'));
            const height = parseFloat(safeGet('height')?.value) || parseFloat(localStorage.getItem('userHeight'));
            const age = parseInt(safeGet('age')?.value);
            const gender = safeGet('genderCal')?.value || 'male';
            const activityLevel = safeGet('activityLevel')?.value || 'moderate';

            if (!weight || !height || !age) {
                showAlert('calorieResult', 'Please fill weight, height and age (use BMI form if needed).', 'warning');
                return;
            }

            let bmr;
            if (gender === 'male') bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
            else bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;

            const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extra: 1.9 };
            const dailyCalories = Math.round(bmr * (activityMultipliers[activityLevel] || 1.55));

            safeGet('calorieResult').innerHTML = `
                <div class="alert alert-info">
                    <h5 class="mb-2">Calorie Calculation Results</h5>
                    <p class="mb-1"><strong>BMR:</strong> ${Math.round(bmr)} kcal</p>
                    <p class="mb-0"><strong>Daily Calories:</strong> ${dailyCalories} kcal</p>
                    <small class="text-muted d-block mt-2">Based on Mifflin-St Jeor Equation</small>
                </div>
            `;
            safeGet('calorieResult').classList.add('result-display');

            // store calories for macro fallback
            localStorage.setItem('dailyCalories', String(dailyCalories));
        });
    }

    // --- Ideal Weight Calculator ---
    // Some templates include an `idealWeightForm` (id). If present, handle submit here to avoid full page reload.
    const idealForm = safeGet('idealWeightForm');
    if (idealForm) {
        idealForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Height input may be present specifically for this form or use stored BMI height
            const heightInput = safeGet('heightIdeal')?.value;
            const heightCm = parseFloat(heightInput) || parseFloat(localStorage.getItem('userHeight')) || parseFloat(safeGet('height')?.value);
            const gender = safeGet('genderIdeal')?.value || safeGet('gender')?.value || 'male';

            if (!heightCm || isNaN(heightCm)) {
                showAlert('idealWeightResult', 'Please provide your height (cm) to calculate ideal weight.', 'warning');
                return;
            }

            // Use Devine formula (approx) converted for cm inputs
            // Devine uses inches; 50 kg + 2.3kg per inch over 5ft (152.4cm) for males
            const heightInches = heightCm / 2.54;
            let idealWeightKg;
            if (gender === 'male') {
                idealWeightKg = 50 + 2.3 * (heightInches - 60);
            } else {
                idealWeightKg = 45.5 + 2.3 * (heightInches - 60);
            }

            if (!isFinite(idealWeightKg) || idealWeightKg <= 0) {
                showAlert('idealWeightResult', 'Calculation error — check the height you entered.', 'warning');
                return;
            }

            safeGet('idealWeightResult').innerHTML = `
                <div class="alert alert-success">
                    <h5 class="mb-2">Ideal Weight</h5>
                    <p class="mb-1">Estimated ideal weight: <strong>${formatNumber(idealWeightKg)} kg</strong></p>
                    <p class="mb-0"><small>Formula: Devine approximation</small></p>
                </div>
            `;
            safeGet('idealWeightResult').classList.add('result-display');
        });
    }

    // --- Macro Calculator ---
    const macroForm = safeGet('macroForm');
    if (macroForm) {
        macroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const goal = safeGet('goal')?.value || 'maintain';
            const exerciseLevel = safeGet('exerciseLevel')?.value || 'intermediate';
            // get weight and dailyCalories from localStorage or immediate inputs
            let weight = parseFloat(localStorage.getItem('userWeight')) || parseFloat(safeGet('weight')?.value);
            if (!weight) {
                showAlert('macroResult', 'Please fill in your weight in the BMI form first.', 'warning');
                return;
            }

            let baseCalories = parseFloat(localStorage.getItem('dailyCalories')) || (weight * 30);
            const exerciseMultiplier = { beginner: 1.0, intermediate: 1.1, advanced: 1.2 };
            let adjustedCalories = baseCalories * (exerciseMultiplier[exerciseLevel] || 1.1);

            if (goal === 'lose') adjustedCalories *= 0.8;
            else if (goal === 'gain') adjustedCalories *= 1.1;

            // macros (g): protein by kg, fats 25% kcal, remainder carbs
            let protein;
            if (goal === 'lose') protein = weight * 2.2;
            else if (goal === 'gain') protein = weight * 2.0;
            else protein = weight * 1.8;

            const fats = (adjustedCalories * 0.25) / 9;
            const carbs = (adjustedCalories - (protein * 4) - (fats * 9)) / 4;

            const proteinCals = protein * 4;
            const carbsCals = carbs * 4;
            const fatsCals = fats * 9;

            safeGet('macroResult').innerHTML = `
                <div class="alert alert-purple">
                    <h5 class="mb-3">Daily Macronutrient Targets</h5>
                    <div><strong>Calories:</strong> ${Math.round(adjustedCalories)} kcal</div>
                    <div class="mt-2"><strong>Protein:</strong> ${Math.round(protein)} g (${Math.round((proteinCals/adjustedCalories)*100)}%)</div>
                    <div class="progress mb-2"><div class="progress-bar bg-info" style="width:${Math.max(0, (proteinCals/adjustedCalories)*100)}%"></div></div>
                    <div><strong>Carbs:</strong> ${Math.round(carbs)} g (${Math.round((carbsCals/adjustedCalories)*100)}%)</div>
                    <div class="progress mb-2"><div class="progress-bar bg-warning" style="width:${Math.max(0, (carbsCals/adjustedCalories)*100)}%"></div></div>
                    <div><strong>Fats:</strong> ${Math.round(fats)} g (${Math.round((fatsCals/adjustedCalories)*100)}%)</div>
                    <div class="progress"><div class="progress-bar bg-danger" style="width:${Math.max(0, (fatsCals/adjustedCalories)*100)}%"></div></div>
                </div>
            `;
            safeGet('macroResult').classList.add('result-display');
        });
    }

    // --- Body Measurements Tracker (localStorage) ---
    const measurementForm = safeGet('measurementForm');
    if (measurementForm) {
        measurementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const measurements = {
                chest: parseFloat(safeGet('chest')?.value) || 0,
                biceps: parseFloat(safeGet('biceps')?.value) || 0,
                hips: parseFloat(safeGet('hips')?.value) || 0,
                thigh: parseFloat(safeGet('thigh')?.value) || 0
            };

            if (Object.values(measurements).every(v => v === 0)) {
                showAlert('measurementResult', 'Please enter at least one measurement.', 'warning');
                return;
            }

            const previous = JSON.parse(localStorage.getItem('bodyMeasurements') || '[]');
            previous.push({ date: new Date().toLocaleDateString(), ...measurements });
            localStorage.setItem('bodyMeasurements', JSON.stringify(previous));

            // show last 3
            const last = previous.slice(-3).reverse();
            const htmlRows = last.map((m, i) => {
                const prev = last[i + 1] || m;
                const makeCell = (k) => {
                    const diff = m[k] - (prev[k] || 0);
                    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '−';
                    const color = diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : '';
                    return `<td>${m[k] || 0} ${i === 0 ? `<small class="${color}"> ${arrow} ${Math.abs(diff).toFixed(1)}</small>` : ''}</td>`;
                };
                return `<tr><td>${m.date}</td>${makeCell('chest')}${makeCell('biceps')}${makeCell('hips')}${makeCell('thigh')}</tr>`;
            }).join('');

            safeGet('measurementResult').innerHTML = `
                <div class="alert alert-teal">
                    <h5 class="mb-3">Measurements History</h5>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light"><tr><th>Date</th><th>Chest (cm)</th><th>Biceps (cm)</th><th>Hips (cm)</th><th>Thigh (cm)</th></tr></thead>
                            <tbody>${htmlRows}</tbody>
                        </table>
                    </div>
                    <small class="text-muted">Showing last 3 measurements. Arrows indicate change from previous.</small>
                </div>
            `;
            safeGet('measurementResult').classList.add('result-display');
            e.target.reset();
        });
    }

    // --- Body Fat Calculator (U.S. Navy method approximation) ---
    const bodyFatForm = safeGet('bodyFatForm');
    if (bodyFatForm) {
        bodyFatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const gender = safeGet('genderFat')?.value || 'male';
            const waist = parseFloat(safeGet('waist')?.value);
            const neck = parseFloat(safeGet('neck')?.value);
            const height = parseFloat(localStorage.getItem('userHeight')) || parseFloat(safeGet('height')?.value);

            if (!waist || !neck || !height) {
                showAlert('bodyFatResult', 'Please enter waist, neck and make sure height is filled (BMI).', 'warning');
                return;
            }

            // Use formula consistent with previous implementation (height in cm). Results approximate.
            let bodyFat;
            if (gender === 'male') {
                bodyFat = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
            } else {
                bodyFat = 163.205 * Math.log10(waist + /*hip not present in form, approximate*/ 0.0 - neck) - 97.684 * Math.log10(height) - 78.387;
                // Note: for females, Navy formula normally needs hip; this approximation uses available inputs.
            }

            if (!isFinite(bodyFat) || bodyFat < 0) {
                showAlert('bodyFatResult', 'Invalid measurements — please check values.', 'warning');
                return;
            }

            safeGet('bodyFatResult').innerHTML = `
                <div class="alert alert-info">
                    <h5 class="mb-2">Body Fat Results</h5>
                    <p class="mb-1">Estimated body fat: <strong>${formatNumber(bodyFat)}%</strong></p>
                </div>
            `;
            safeGet('bodyFatResult').classList.add('result-display');
        });
    }

    // --- Theme switch & load saved ---
    const themeSwitch = safeGet('themeSwitch');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', (e) => {
            const t = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', t);
            localStorage.setItem('theme', t);
        });
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (themeSwitch) themeSwitch.checked = savedTheme === 'dark';
    }

    // --- Init tooltips if bootstrap present ---
    if (window.bootstrap && typeof window.bootstrap.Tooltip === 'function') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
    }
});