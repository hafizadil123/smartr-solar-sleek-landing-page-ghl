function handleLottieError(player) {
    console.error('Lottie animation failed to load:', player.src);

    const animationFiles = ['ripped.json','paper-rip-1.json', 'paper-rip-2.json', 'paper-rip-3.json'];
    const currentSrc = player.src;
    const currentFile = currentSrc.split('/').pop();
    const currentIndex = animationFiles.indexOf(currentFile);

    if (currentIndex < animationFiles.length - 1) {
        const nextFile = animationFiles[currentIndex + 1];
        console.log('Trying next animation file:', nextFile);
        player.src = nextFile;
        return;
    }

    console.log('All animation files failed, showing fallback bill image');
    player.style.display = 'none';
    const fallbackBill = player.parentElement.querySelector('.fallback-bill');
    if (fallbackBill) {
        fallbackBill.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const calculateBtn = document.getElementById('calculate-btn');
    const calculatorResultsSection = document.getElementById('calculator-results-section');

    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateEnergyCosts);
    }

    const monthlyUsageInput = document.getElementById('monthly-usage');
    const pricePerKwhInput = document.getElementById('price-per-kwh');
    const rateIncreaseInput = document.getElementById('rate-increase');

    if (monthlyUsageInput && pricePerKwhInput && rateIncreaseInput) {
        monthlyUsageInput.value = '800';
        pricePerKwhInput.value = '19.0';
        rateIncreaseInput.value = '7.0';
    }

    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.process-card, .testimonial-card, .benefit-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    const calculatorInputs = [monthlyUsageInput, pricePerKwhInput, rateIncreaseInput];

    calculatorInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                if (input.value && !isNaN(input.value) && parseFloat(input.value) >= 0) {
                    input.style.borderColor = '#59b7c9';
                } else {
                    input.style.borderColor = '#e1e5e9';
                }
            });
        }
    });

    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && (e.target.id === 'monthly-usage' || e.target.id === 'price-per-kwh' || e.target.id === 'rate-increase')) {
            calculateEnergyCosts();
        }
    });

    setupQuestionnaire();
});

let energyChart = null;

function calculateEnergyCosts() {
    const monthlyKwh = parseFloat(document.getElementById('monthly-usage').value);
    const pricePerKwh = parseFloat(document.getElementById('price-per-kwh').value);
    const annualRateIncrease = parseFloat(document.getElementById('rate-increase').value);

    if (!monthlyKwh || !pricePerKwh || !annualRateIncrease) {
        alert('Please fill in all fields with valid numbers.');
        return;
    }

    if (monthlyKwh <= 0 || pricePerKwh <= 0 || annualRateIncrease < 0) {
        alert('Please enter positive values for all fields.');
        return;
    }

    const projection = calculateProjection(monthlyKwh, pricePerKwh, annualRateIncrease);

    displayResults(projection);

    const resultsSection = document.getElementById('calculator-results-section');
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function calculateProjection(monthlyKwh, pricePerKwh, annualRateIncrease) {
    const years = [];
    const costs = [];
    const prices = [];
    let currentPrice = pricePerKwh;
    let totalCost = 0;

    for (let year = 0; year < 30; year++) {
        const currentYear = 2025 + year;
        const yearlyKwh = monthlyKwh * 12;
        const yearlyCost = yearlyKwh * currentPrice / 100;

        years.push(currentYear);
        costs.push(yearlyCost);
        prices.push(currentPrice);

        totalCost += yearlyCost;

        currentPrice *= (1 + annualRateIncrease / 100);
    }

    return {
        years,
        costs,
        prices,
        totalCost,
        averageYearly: totalCost / 30,
        finalYearCost: costs[costs.length - 1]
    };
}

function displayResults(projection) {
    document.getElementById('total-cost').textContent = formatCurrency(projection.totalCost);
    document.getElementById('avg-yearly').textContent = formatCurrency(projection.averageYearly);
    document.getElementById('final-year').textContent = formatCurrency(projection.finalYearCost);

    createChart(projection);
}

function createChart(projection) {
    const ctx = document.getElementById('energyChart').getContext('2d');

    if (energyChart) {
        energyChart.destroy();
    }

    const labels = projection.years.map(year => year.toString());
    const costData = projection.costs;
    const priceData = projection.prices.map(price => price / 10);

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(89, 183, 201, 0.8)');
    gradient.addColorStop(1, 'rgba(16, 58, 59, 0.6)');

    energyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Annual Energy Cost ($)',
                data: costData,
                backgroundColor: gradient,
                borderColor: 'rgba(89, 183, 201, 1)',
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#103a3b',
                        font: {
                            family: 'Inter',
                            size: 12,
                            weight: '600'
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(242, 235, 225, 0.95)',
                    titleColor: '#103a3b',
                    bodyColor: '#103a3b',
                    borderColor: '#59b7c9',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            const year = projection.years[context.dataIndex];
                            const cost = context.parsed.y;
                            const price = projection.prices[context.dataIndex];
                            return [
                                `Year: ${year}`,
                                `Cost: ${formatCurrency(cost)}`,
                                `Price per kWh: ${price.toFixed(2)}¢`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#103a3b',
                        font: {
                            family: 'Inter',
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    title: {
                        display: true,
                        text: 'Year',
                        color: '#103a3b',
                        font: {
                            family: 'Inter',
                            size: 14,
                            weight: '600'
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(16, 58, 59, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#103a3b',
                        font: {
                            family: 'Inter',
                            size: 10
                        },
                        callback: function (value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    title: {
                        display: true,
                        text: 'Annual Energy Cost ($)',
                        color: '#103a3b',
                        font: {
                            family: 'Inter',
                            size: 14,
                            weight: '600'
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart',
                onProgress: function (animation) {
                    const progress = animation.currentStep / animation.numSteps;
                    if (progress > 0.5) {
                        document.querySelector('.chart-container').style.opacity = '1';
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });

    addChartEnhancements();
}

function addChartEnhancements() {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.style.opacity = '0';
    chartContainer.style.transition = 'opacity 0.5s ease-in-out';

    setTimeout(() => {
        chartContainer.style.opacity = '1';
    }, 100);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function scrollToForm() {
    const form = document.querySelector('.hero-form');
    if (form) {
        form.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

document.documentElement.style.scrollBehavior = 'smooth';

document.addEventListener('DOMContentLoaded', function () {
    const buttons = document.querySelectorAll('button');

    buttons.forEach(button => {
        button.addEventListener('click', function () {
            if (this.classList.contains('submit-btn') || this.classList.contains('calculate-btn')) {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                this.disabled = true;

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 2000);
            }
        });
    });
});

let currentStep = 1;
const totalSteps = 6;
let applicationData = {};

function startApplication() {
    currentStep = 1;
    applicationData = {};

    const overlay = document.getElementById('application-overlay');
    overlay.classList.add('active');

    updateProgress();

    showStep(1);

    document.body.style.overflow = 'hidden';
}

function updateProgress() {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    const percentage = (currentStep / totalSteps) * 100;

    progressFill.classList.add('updating');

    progressFill.style.width = percentage + '%';
    progressText.textContent = `Step ${currentStep} of ${totalSteps}`;

    setTimeout(() => {
        progressFill.classList.remove('updating');
    }, 600);
}

function showStep(stepNumber) {
    document.querySelectorAll('.question-step').forEach(step => {
        step.classList.remove('active');
    });

    const currentStepElement = document.getElementById(`step-${stepNumber}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }

    updateProgress();
}

function nextStep() {
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function selectOption(value, nextStepId) {
    applicationData.propertyType = value;

    const addressQuestion = document.getElementById('address-question');
    if (value === 'homeowner') {
        addressQuestion.textContent = 'What is your home address?';
    } else {
        addressQuestion.textContent = 'What is your rental property address?';
    }

    nextStep();
}

function submitApplication() {
    applicationData.address = document.getElementById('address-input').value;
    applicationData.firstName = document.getElementById('first-name-input').value;
    applicationData.lastName = document.getElementById('last-name-input').value;
    applicationData.email = document.getElementById('email-input').value;
    applicationData.phone = document.getElementById('phone-input').value;

    if (!applicationData.propertyType || !applicationData.firstName || !applicationData.lastName || !applicationData.phone) {
        alert('Please fill in all required fields marked with *.');
        return;
    }

    console.log('Application submitted:', applicationData);

    const webhookUrl = 'https://services.leadconnectorhq.com/hooks/7EycMHgBuFfbUKE1cWbp/webhook-trigger/e802527b-3d33-4c84-a2e4-33206dc29399';

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
    })
        .then(response => {
            if (response.ok) {
                console.log('Data sent to webhook successfully');
                alert('Thank you! Your application has been submitted successfully. We\'ll be in touch soon!');
            } else {
                console.error('Failed to send data to webhook:', response.status);
                alert('Thank you! Your application has been submitted successfully. We\'ll be in touch soon!');
            }
        })
        .catch(error => {
            console.error('Error sending data to webhook:', error);
            alert('Thank you! Your application has been submitted successfully. We\'ll be in touch soon!');
        })
        .finally(() => {
            closeApplication();
        });
}

function closeApplication() {
    const overlay = document.getElementById('application-overlay');
    overlay.classList.remove('active');

    document.body.style.overflow = '';

    currentStep = 1;
    showStep(1);
}

function setupQuestionnaire() {
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const value = this.getAttribute('data-value');

            document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));

            this.classList.add('selected');

            selectOption(value);
        });
    });

    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (validateCurrentStep()) {
                nextStep();
            }
        });
    });

    const submitBtn = document.getElementById('submit-application');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitApplication);
    }

    const closeBtn = document.getElementById('close-application');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeApplication);
    }

    const overlay = document.getElementById('application-overlay');
    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) {
                closeApplication();
            }
        });
    }

    document.querySelectorAll('.question-input').forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextBtn = this.parentElement.querySelector('.next-btn, .submit-btn');
                if (nextBtn) {
                    nextBtn.click();
                }
            }
        });
    });

    const phoneInput = document.getElementById('phone-input');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) {
                value = value.substring(0, 10);
            }

            if (value.length >= 6) {
                value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
            } else if (value.length >= 3) {
                value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
            } else if (value.length > 0) {
                value = `(${value}`;
            }

            e.target.value = value;
        });
    }
}

function validateCurrentStep() {
    const currentStepElement = document.getElementById(`step-${currentStep}`);

    if (currentStep === 2) {
        const addressInput = document.getElementById('address-input');
        if (!addressInput.value.trim()) {
            alert('Please enter your address.');
            addressInput.focus();
            return false;
        }
    } else if (currentStep === 3) {
        const firstNameInput = document.getElementById('first-name-input');
        if (!firstNameInput.value.trim()) {
            alert('Please enter your first name.');
            firstNameInput.focus();
            return false;
        }
    } else if (currentStep === 4) {
        const lastNameInput = document.getElementById('last-name-input');
        if (!lastNameInput.value.trim()) {
            alert('Please enter your last name.');
            lastNameInput.focus();
            return false;
        }
    } else if (currentStep === 6) {
        const phoneInput = document.getElementById('phone-input');
        if (!phoneInput.value.trim()) {
            alert('Please enter your phone number.');
            phoneInput.focus();
            return false;
        }
    }

    return true;
} 