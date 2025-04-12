document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let transactions = [];
    let expenseChart = null;
    let savingsChart = null; // Added state for savings chart instance
    let reportPeriod = 'all';
    let startDate = '';
    let endDate = '';

    // --- DOM Elements ---
    const reportGeneratedDateEl = document.getElementById('report-generated-date');
    const reportPeriodDisplayEl = document.getElementById('report-period-display');
    // Operating Summary
    const totalIncomeEl = document.getElementById('report-total-income');
    const totalExpensesEl = document.getElementById('report-total-expenses');
    const netBalanceEl = document.getElementById('report-net-balance');
    // Savings Summary
    const totalSavingsDepositsEl = document.getElementById('report-savings-deposits');
    const totalSavingsWithdrawalsEl = document.getElementById('report-savings-withdrawals');
    const netSavingsEl = document.getElementById('report-net-savings');
    // Tables
    const transactionTableBody = document.querySelector('#transaction-details-table tbody');
    const incomeCategoryTableBody = document.querySelector('#income-category-table tbody');
    const expenseCategoryTableBody = document.querySelector('#expense-category-table tbody');
    // Charts & Messages
    const expenseChartCanvas = document.getElementById('report-expense-chart');
    const savingsChartCanvas = document.getElementById('report-savings-chart'); // Added savings chart canvas
    const noTransactionsMsg = document.getElementById('no-transactions-message');
    const noIncomeCatMsg = document.getElementById('no-income-categories-message');
    const noExpenseCatMsg = document.getElementById('no-expense-categories-message');
    const noExpenseChartMsg = document.getElementById('report-no-expense-data');
    const noSavingsChartMsg = document.getElementById('report-no-savings-data'); // Added savings chart message


    // --- Utility Functions ---
    const formatCurrency = (amount) => {
        const numAmount = Number(amount);
        return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
    };

     const formatDate = (dateString, format = 'MM/DD/YY') => {
         if (!dateString) return '';
         try {
             const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
             if (isNaN(date.getTime())) {
                 console.error("Invalid date string:", dateString);
                 return dateString;
             }
             const month = String(date.getMonth() + 1).padStart(2, '0');
             const day = String(date.getDate()).padStart(2, '0');
             const yearFull = date.getFullYear();
             const yearShort = String(yearFull).slice(-2);

             if (format === 'MM/DD') { return `${month}/${day}`; }
             if (format === 'YYYY-MM-DD') { return `${yearFull}-${month}-${day}`; }
             return `${month}/${day}/${yearShort}`;
         } catch (e) {
             console.error("Error formatting date:", dateString, e);
             return dateString;
         }
     };

    // --- Data Loading ---
      const loadData = () => {
        transactions = JSON.parse(localStorage.getItem('transactions_v2')) || [];
        transactions = transactions.map(t => ({ ...t, amount: Number(t.amount) || 0 }));
    };

    // --- Get URL Parameters ---
    function getUrlParameters() {
        const params = new URLSearchParams(window.location.search);
        reportPeriod = params.get('period') || 'all';
        startDate = params.get('startDate') || '';
        endDate = params.get('endDate') || '';
    }

    // --- Report Generation ---
    const displayDetailedReport = () => {
        loadData();
        getUrlParameters();

        let periodText = 'All Time';
        let startDateFilter;
        let endDateFilter;

         if (reportPeriod === 'custom') {
            startDateFilter = startDate ? new Date(startDate + 'T00:00:00') : null;
            endDateFilter = endDate ? new Date(endDate + 'T23:59:59') : null;
            if (!startDateFilter || !endDateFilter || isNaN(startDateFilter.getTime()) || isNaN(endDateFilter.getTime()) || startDateFilter > endDateFilter) {
                 periodText = 'Invalid Custom Range Dates';
                 reportPeriodDisplayEl.textContent = periodText;
                 // Clear potential stale data on error
                 totalIncomeEl.textContent = '0.00'; totalExpensesEl.textContent = '0.00'; netBalanceEl.textContent = '0.00';
                 totalSavingsDepositsEl.textContent = '0.00'; totalSavingsWithdrawalsEl.textContent = '0.00'; netSavingsEl.textContent = '0.00';
                 updateExpenseChart({}); updateSavingsChart([]); // Clear charts
                 return;
            }
             periodText = `Custom Range: ${formatDate(startDate)} - ${formatDate(endDate)}`;
         } else {
            const today = new Date();
            endDateFilter = new Date();
            endDateFilter.setHours(23, 59, 59, 999);
            switch (reportPeriod) {
                 case 'weekly':
                     startDateFilter = new Date(new Date().setDate(today.getDate() - today.getDay()));
                     periodText = 'This Week'; break;
                 case 'biweekly':
                     startDateFilter = new Date(new Date().getTime() - 13 * 24 * 60 * 60 * 1000);
                     periodText = 'Last 14 Days'; break;
                 case 'monthly':
                     startDateFilter = new Date(today.getFullYear(), today.getMonth(), 1);
                     periodText = 'This Month'; break;
                 case 'all': default:
                    startDateFilter = new Date(0);
                    periodText = 'All Time'; break;
            }
             startDateFilter.setHours(0, 0, 0, 0);
        }

        const filteredTransactions = transactions.filter(t => {
            try {
                 const transactionDate = new Date(t.date.includes('T') ? t.date : t.date + 'T00:00:00');
                 return !isNaN(transactionDate.getTime()) && transactionDate >= startDateFilter && transactionDate <= endDateFilter;
            } catch (e) { return false; }
        }).sort((a, b) => new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00'));


        let totalIncome = 0;
        let totalExpenses = 0;
        let totalSavingsDeposits = 0; // Added for savings summary
        let totalSavingsWithdrawals = 0; // Added for savings summary
        const incomeByCategory = {};
        const expenseByCategory = {};
        const savingsDataForChart = []; // Added for savings chart
        let currentNetSavings = 0; // Added for savings chart calculation

        filteredTransactions.forEach(t => {
            let isSavingsTransaction = false;
            if (t.category === 'Savings Deposit') {
                totalSavingsDeposits += t.amount;
                currentNetSavings += t.amount;
                isSavingsTransaction = true;
                // Track as expense for operating balance, add to category breakdown
                totalExpenses += t.amount;
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            } else if (t.category === 'Savings Withdrawal') {
                totalSavingsWithdrawals += t.amount;
                currentNetSavings -= t.amount;
                isSavingsTransaction = true;
                // Track as income for operating balance, add to category breakdown
                totalIncome += t.amount;
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            } else if (t.type === 'income') {
                totalIncome += t.amount;
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            } else { // Regular expense
                totalExpenses += t.amount;
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            }
            // Store daily net savings balance change for the chart
            if (isSavingsTransaction) {
                savingsDataForChart.push({ date: t.date, netSavingsBalance: currentNetSavings });
            }
        });

        const netBalance = totalIncome - totalExpenses; // Operating balance
        const netSavingsChange = totalSavingsDeposits - totalSavingsWithdrawals; // Net savings flow

        // Update Summary Display
        reportGeneratedDateEl.textContent = formatDate(new Date().toISOString().split('T')[0]);
        reportPeriodDisplayEl.textContent = periodText;
        totalIncomeEl.textContent = formatCurrency(totalIncome);
        totalExpensesEl.textContent = formatCurrency(totalExpenses);
        netBalanceEl.textContent = formatCurrency(netBalance);
        netBalanceEl.className = netBalance >= 0 ? 'net-balance text-income' : 'net-balance text-expense';
        // Update Savings Summary
        totalSavingsDepositsEl.textContent = formatCurrency(totalSavingsDeposits);
        totalSavingsWithdrawalsEl.textContent = formatCurrency(totalSavingsWithdrawals);
        netSavingsEl.textContent = formatCurrency(netSavingsChange);
        netSavingsEl.className = netSavingsChange >= 0 ? 'text-savings' : 'text-danger'; // Style based on net flow


        // Populate Transaction Table (Remains the same)
        transactionTableBody.innerHTML = '';
        if (filteredTransactions.length > 0) {
            noTransactionsMsg.style.display = 'none';
            filteredTransactions.forEach(t => {
                const row = transactionTableBody.insertRow();
                const typeText = t.type.charAt(0).toUpperCase() + t.type.slice(1);
                const amountClass = t.type === 'income' ? 'text-income' : 'text-expense';
                const amountPrefix = t.type === 'income' ? '+' : '-';
                 const transactionDateFormatted = formatDate(t.date, 'MM/DD');
                row.innerHTML = `
                    <td class="date-col">${transactionDateFormatted}</td>
                    <td class="type-col">${typeText}</td>
                    <td class="desc-col">${t.description}</td>
                    <td class="cat-col">${t.category}</td>
                    <td class="amount amount-col ${amountClass}">${amountPrefix}${formatCurrency(t.amount)}</td>
                `;
            });
        } else {
             noTransactionsMsg.style.display = 'block';
        }

        // Populate Category Breakdown Tables (Remains the same, includes Savings Deposit/Withdrawal here)
        incomeCategoryTableBody.innerHTML = '';
        expenseCategoryTableBody.innerHTML = '';
        const sortedIncomeCategories = Object.entries(incomeByCategory).sort(([,a], [,b]) => b - a);
        const sortedExpenseCategories = Object.entries(expenseByCategory).sort(([,a], [,b]) => b - a);
        if(sortedIncomeCategories.length > 0) {
            noIncomeCatMsg.style.display = 'none';
            sortedIncomeCategories.forEach(([category, amount]) => {
                const percentage = totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : 0;
                const row = incomeCategoryTableBody.insertRow();
                row.innerHTML = `<td>${category}</td><td class="amount text-income">${formatCurrency(amount)}</td><td class="percentage">${percentage}%</td>`;
            });
        } else { noIncomeCatMsg.style.display = 'block'; }
        if (sortedExpenseCategories.length > 0) {
            noExpenseCatMsg.style.display = 'none';
            sortedExpenseCategories.forEach(([category, amount]) => {
                const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
                const row = expenseCategoryTableBody.insertRow();
                row.innerHTML = `<td>${category}</td><td class="amount text-expense">${formatCurrency(amount)}</td><td class="percentage">${percentage}%</td>`;
            });
        } else { noExpenseCatMsg.style.display = 'block'; }

        // Update Charts
        updateExpenseChart(expenseByCategory);
        updateSavingsChart(savingsDataForChart); // Call savings chart update
        applyTheme();
    };

    // --- Chart Update Functions ---
     const updateExpenseChart = (expenseData) => {
         const chartExpenseData = { ...expenseData };
         delete chartExpenseData['Savings Deposit']; // Exclude from visual

         const labels = Object.keys(chartExpenseData).sort((a,b) => chartExpenseData[b] - chartExpenseData[a]);
         const data = labels.map(label => chartExpenseData[label]);

         const generateColors = (count) => {
             const baseColors = ['#dc3545', '#6c757d', '#ffc107', '#fd7e14', '#17a2b8', '#6610f2', '#20c997', '#e83e8c', '#007bff', '#28a745' ];
             const alpha = 'dd'; // Use slightly less transparency for print
             return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length] + alpha);
         };
         const chartColors = generateColors(labels.length);
         const bodyStyle = getComputedStyle(document.body);
         const borderColor = bodyStyle.getPropertyValue('--card-bg-color').trim() || '#ffffff';
         const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000';

         if (expenseChart) { expenseChart.destroy(); expenseChart = null; }

         if (labels.length > 0) {
             noExpenseChartMsg.style.display = 'none';
             expenseChartCanvas.style.display = 'block';
             expenseChart = new Chart(expenseChartCanvas, {
                 type: 'doughnut',
                 data: { labels: labels, datasets: [{ label: 'Expenses', data: data, backgroundColor: chartColors, borderColor: borderColor, borderWidth: 1, hoverOffset: 4 }] }, // Reduced border for print
                 options: {
                     responsive: true, maintainAspectRatio: false, animation: false, // Disable animation for print
                     plugins: {
                         legend: { position: 'bottom', labels: { color: textColor, padding: 10, usePointStyle: true, font: { size: 11 } } }, // Smaller font
                         tooltip: {
                             callbacks: {
                                  label: function(context) {
                                     let label = context.label || ''; if (label) label += ': ';
                                     if (context.parsed !== null) {
                                         label += '$' + formatCurrency(context.parsed);
                                         const chartTotal = context.dataset.data.reduce((acc, value) => acc + value, 0);
                                         if (chartTotal > 0) { label += ` (${((context.parsed / chartTotal) * 100).toFixed(1)}%)`; }
                                     } return label;
                                 }
                             }
                         }
                     }
                 }
             });
         } else {
             noExpenseChartMsg.style.display = 'block';
             expenseChartCanvas.style.display = 'none';
         }
     };

    // --- Added Savings Chart Update Function ---
     const updateSavingsChart = (savingsData) => {
        const bodyStyle = getComputedStyle(document.body);
        const savingsColor = bodyStyle.getPropertyValue('--info-color').trim() || '#17a2b8';
        const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000';
        const gridColor = bodyStyle.getPropertyValue('--border-color').trim() || '#dee2e6';

         const aggregatedData = savingsData.reduce((acc, entry) => {
             acc[entry.date] = entry.netSavingsBalance;
             return acc;
         }, {});

         const labels = Object.keys(aggregatedData).sort((a, b) => new Date(a + 'T00:00:00') - new Date(b + 'T00:00:00')); // Ensure consistent sorting
         const dataPoints = labels.map(date => aggregatedData[date]);
         const hasData = labels.length > 0;

        if (savingsChart) { savingsChart.destroy(); savingsChart = null; }

        if (hasData) {
            noSavingsChartMsg.style.display = 'none';
            savingsChartCanvas.style.display = 'block';
            savingsChart = new Chart(savingsChartCanvas, {
                type: 'line',
                data: {
                    labels: labels.map(date => formatDate(date, 'MM/DD')), // Format labels
                    datasets: [{
                        label: 'Net Savings Balance',
                        data: dataPoints,
                        borderColor: savingsColor,
                        backgroundColor: savingsColor + '33', // Fill color
                        tension: 0.1, fill: true, pointRadius: 2, pointHoverRadius: 4, borderWidth: 1.5 // Adjusted for print
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, animation: false, // Disable animation
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: { color: textColor, font: {size: 10}, callback: function(value) { return '$' + formatCurrency(value); } }, // Smaller font
                            grid: { color: gridColor + '80' }
                        },
                        x: {
                            ticks: { color: textColor, font: {size: 10}, maxRotation: 45, minRotation: 45 }, // Smaller font
                             grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false }, // Keep legend hidden
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || ''; if (label) label += ': ';
                                    if (context.parsed.y !== null) { label += '$' + formatCurrency(context.parsed.y); }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        } else {
             noSavingsChartMsg.style.display = 'block';
             savingsChartCanvas.style.display = 'none';
        }
    };


     const applyTheme = () => {
         const savedTheme = localStorage.getItem('theme') || 'light';
         document.body.dataset.theme = savedTheme;
          // Update chart colors if charts exist
          const bodyStyle = getComputedStyle(document.body);
          const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000';
          const gridColor = bodyStyle.getPropertyValue('--border-color').trim() || '#dee2e6';
          const borderColor = bodyStyle.getPropertyValue('--card-bg-color').trim() || '#ffffff';

          if (expenseChart && expenseChart.options?.plugins?.legend) {
              expenseChart.options.plugins.legend.labels.color = textColor;
              if (expenseChart.data.datasets[0]) expenseChart.data.datasets[0].borderColor = borderColor;
              expenseChart.update('none'); // Use 'none' to prevent re-animation
          }
          if (savingsChart && savingsChart.options?.scales) {
              if(savingsChart.options.plugins?.legend) savingsChart.options.plugins.legend.labels.color = textColor;
              savingsChart.options.scales.y.ticks.color = textColor;
              savingsChart.options.scales.y.grid.color = gridColor + '80';
              savingsChart.options.scales.x.ticks.color = textColor;
              savingsChart.update('none'); // Use 'none' to prevent re-animation
          }
     }

    // --- Initial Load ---
    displayDetailedReport(); // Generate report data and charts
    // Apply theme after initial chart generation might cause flicker,
    // but ensures colors are correct if theme is loaded from storage.
    // Consider applying theme *before* chart generation if flicker is an issue.
    // applyTheme();
});