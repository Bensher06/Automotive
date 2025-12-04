document.addEventListener('DOMContentLoaded', () => {

    // --- Sidebar Toggle ---
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const body = document.body;

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            body.classList.toggle('sidebar-collapsed');
        });
    }

    // --- Chart.js Global Config ---
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#6E747C';
    Chart.defaults.borderColor = '#F5F7FA';

    // -----------------------------
    // --- Chart 1: Profit Trend (Line) ---
    // -----------------------------
    const profitTrendCtx = document.getElementById('profitTrendChart');
    let profitTrendChart = null;
    if (profitTrendCtx) {
        const gradientFill = profitTrendCtx.getContext('2d').createLinearGradient(0, 0, 0, 250);
        gradientFill.addColorStop(0, 'rgba(40, 167, 69, 0.2)');
        gradientFill.addColorStop(1, 'rgba(40, 167, 69, 0)');

        profitTrendChart = new Chart(profitTrendCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Profit',
                    data: [120, 130, 125, 140, 150, 148, 155],
                    borderColor: '#28a745', // --color-green
                    backgroundColor: gradientFill,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#28a745',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#212832',
                        titleFont: { weight: '600' },
                        bodyFont: { weight: '500' },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `Profit: ₱${context.raw}`
                        }
                    }
                },
                scales: {
                    y: {
                        display: false, // Hide Y-axis
                        beginAtZero: false,
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { weight: 500 }
                        }
                    }
                }
            }
        });
    }

    // -----------------------------
    // --- Chart 2: Profit Margin (Gauge/Doughnut) ---
    // -----------------------------
    const profitMarginCtx = document.getElementById('profitMarginChart');
    let profitMarginChart = null;
    if (profitMarginCtx) {
        const gaugeValue = 54.7;
        const remainingValue = 100 - gaugeValue;

        profitMarginChart = new Chart(profitMarginCtx, {
            type: 'doughnut',
            data: {
                labels: ['Current Margin', 'Remaining'],
                datasets: [{
                    data: [gaugeValue, remainingValue],
                    backgroundColor: [
                        '#E8B430', // --color-yellow
                        '#F5F7FA'  // --color-bg (light grey)
                    ],
                    borderWidth: 0,
                    borderRadius: 20,
                    cutout: '80%',
                }]
            },
            plugins: [{
                id: 'gaugeCenterText',
                beforeDraw: (chart) => {
                    const { ctx, data } = chart;
                    const value = data.datasets[0].data[0];
                    
                    ctx.save();
                    // Main Percentage Text
                    ctx.font = '800 3.5rem var(--font-family)';
                    ctx.fillStyle = '#212832';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${value}%`, chart.width / 2, chart.height / 2);
                    
                    // "0" Label
                    ctx.font = '500 0.9rem var(--font-family)';
                    ctx.fillStyle = '#6E747C';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText('0', chart.width * 0.15, chart.height * 0.95);

                    // "100" Label
                    ctx.textAlign = 'right';
                    ctx.fillText('100', chart.width * 0.85, chart.height * 0.95);
                    
                    ctx.restore();
                }
            }],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                circumference: 270, // Go 3/4 of the way
                rotation: 225, // Start at bottom-left
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    // -----------------------------
    // --- Period Selector for Profit Trend ---
    // -----------------------------
    const periodSelect = document.querySelector('.period-select');

    if (periodSelect && profitTrendChart) {
        periodSelect.addEventListener('change', (e) => {
            const period = parseInt(e.target.value);
            console.log(`Profit period changed to: ${period} days`);
            
            // Update chart data based on period
            let labels, data;
            if (period === 7) {
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                data = [120, 130, 125, 140, 150, 148, 155];
            } else {
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                data = [850, 920, 880, 950];
            }
            
            profitTrendChart.data.labels = labels;
            profitTrendChart.data.datasets[0].data = data;
            profitTrendChart.update();
        });
    }

});