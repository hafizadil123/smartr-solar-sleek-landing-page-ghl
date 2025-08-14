// Global variables
let energyChart = null;

// DOM elements
const kwhUsageInput = document.getElementById('kwh-usage');
const pricePerKwhInput = document.getElementById('price-per-kwh');
const rateIncreaseInput = document.getElementById('rate-increase');
const calculateBtn = document.getElementById('calculate-btn');
const resultsSection = document.getElementById('results-section');
const totalCostElement = document.getElementById('total-cost');
const avgYearlyElement = document.getElementById('avg-yearly');
const finalYearElement = document.getElementById('final-year');

// Event listeners
calculateBtn.addEventListener('click', calculateEnergyCosts);
document.addEventListener('DOMContentLoaded', () => {
    // Add some sample data for demonstration
    kwhUsageInput.value = '800';
    pricePerKwhInput.value = '12.5';
    rateIncreaseInput.value = '3.5';
});

// Main calculation function
function calculateEnergyCosts() {
    // Get input values
    const monthlyKwh = parseFloat(kwhUsageInput.value);
    const pricePerKwh = parseFloat(pricePerKwhInput.value);
    const annualRateIncrease = parseFloat(rateIncreaseInput.value);

    // Validate inputs
    if (!monthlyKwh || !pricePerKwh || !annualRateIncrease) {
        alert('Please fill in all fields with valid numbers.');
        return;
    }

    if (monthlyKwh <= 0 || pricePerKwh <= 0 || annualRateIncrease < 0) {
        alert('Please enter positive values for all fields.');
        return;
    }

    // Calculate 30-year projection
    const projection = calculateProjection(monthlyKwh, pricePerKwh, annualRateIncrease);
    
    // Display results
    displayResults(projection);
    
    // Show results section with animation
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Calculate 30-year energy cost projection
function calculateProjection(monthlyKwh, pricePerKwh, annualRateIncrease) {
    const years = [];
    const costs = [];
    const prices = [];
    let currentPrice = pricePerKwh;
    let totalCost = 0;

    for (let year = 0; year < 30; year++) {
        const currentYear = 2025 + year;
        const yearlyKwh = monthlyKwh * 12;
        const yearlyCost = yearlyKwh * currentPrice / 100; // Convert cents to dollars
        
        years.push(currentYear);
        costs.push(yearlyCost);
        prices.push(currentPrice);
        
        totalCost += yearlyCost;
        
        // Increase price for next year
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

// Display results and create chart
function displayResults(projection) {
    // Update summary statistics
    totalCostElement.textContent = formatCurrency(projection.totalCost);
    avgYearlyElement.textContent = formatCurrency(projection.averageYearly);
    finalYearElement.textContent = formatCurrency(projection.finalYearCost);

    // Create or update chart
    createChart(projection);
}

// Create beautiful chart using Chart.js
function createChart(projection) {
    const ctx = document.getElementById('energyChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (energyChart) {
        energyChart.destroy();
    }

    // Prepare data for chart
    const labels = projection.years.map(year => year.toString());
    const costData = projection.costs;
    const priceData = projection.prices.map(price => price / 10); // Scale down for better visualization

    // Create gradient for bars using brand colors
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(89, 183, 201, 0.8)'); // #59b7c9
    gradient.addColorStop(1, 'rgba(16, 58, 59, 0.6)'); // #103a3b

    energyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Annual Energy Cost ($)',
                data: costData,
                backgroundColor: gradient,
                borderColor: 'rgba(89, 183, 201, 1)', // #59b7c9
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
                        color: '#103a3b', // Brand color
                        font: {
                            family: 'Inter',
                            size: 12,
                            weight: '600'
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(242, 235, 225, 0.95)', // #f2ebe1
                    titleColor: '#103a3b', // Brand color
                    bodyColor: '#103a3b', // Brand color
                    borderColor: '#59b7c9', // Brand color
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
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
                        color: '#103a3b', // Brand color
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
                        color: '#103a3b', // Brand color
                        font: {
                            family: 'Inter',
                            size: 14,
                            weight: '600'
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(16, 58, 59, 0.1)', // Brand color with opacity
                        drawBorder: false
                    },
                    ticks: {
                        color: '#103a3b', // Brand color
                        font: {
                            family: 'Inter',
                            size: 10
                        },
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    title: {
                        display: true,
                        text: 'Annual Energy Cost ($)',
                        color: '#103a3b', // Brand color
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
                onProgress: function(animation) {
                    // Add some visual feedback during animation
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

    // Add some visual enhancements
    addChartEnhancements();
}

// Add visual enhancements to the chart
function addChartEnhancements() {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.style.opacity = '0';
    chartContainer.style.transition = 'opacity 0.5s ease-in-out';
    
    setTimeout(() => {
        chartContainer.style.opacity = '1';
    }, 100);
}

// Format currency for display
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add input validation and real-time feedback
    const inputs = [kwhUsageInput, pricePerKwhInput, rateIncreaseInput];
    
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value && !isNaN(input.value) && parseFloat(input.value) >= 0) {
                input.style.borderColor = '#59b7c9'; // Brand color
            } else {
                input.style.borderColor = '#e1e5e9';
            }
        });
    });

    // Add keyboard support
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateEnergyCosts();
        }
    });
});

// Add some additional utility functions
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const startValue = start;
    const change = end - start;
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + change * easeOutQuart;
        
        element.textContent = formatCurrency(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
} 