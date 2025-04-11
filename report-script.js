document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let transactions = [];
    let expenseChart = null;
    let reportPeriod = 'all';
    let startDate = '';
    let endDate = '';

    // --- DOM Elements ---
    const reportGeneratedDateEl = document.getElementById('report-generated-date');
    const reportPeriodDisplayEl = document.getElementById('report-period-display');
    const totalIncomeEl = document.getElementById('report-total-income');
    const totalExpensesEl = document.getElementById('report-total-expenses');
    const netBalanceEl = document.getElementById('report-net-balance');
    const transactionTableBody = document.querySelector('#transaction-details-table tbody'); // Combined table
    const incomeCategoryTableBody = document.querySelector('#income-category-table tbody');
    const expenseCategoryTableBody = document.querySelector('#expense-category-table tbody');
    const expenseChartCanvas = document.getElementById('report-expense-chart');
    const noTransactionsMsg = document.getElementById('no-transactions-message'); // Combined message
    const noIncomeCatMsg = document.getElementById('no-income-categories-message');
    const noExpenseCatMsg = document.getElementById('no-expense-categories-message');
    const noExpenseChartMsg = document.getElementById('report-no-expense-data');

    // --- Utility Functions ---
    const formatCurrency = (amount) => {
        // Ensure amount is a number before formatting
        const numAmount = Number(amount);
        return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
    };
    // Updated Date Formatting
     const formatDate = (dateString, format = 'MM/DD/YY') => {
         if (!dateString) return '';
         try {
             // Attempt to handle different valid date string inputs gracefully
             let date = new Date(dateString);
             // Check if the date is valid after parsing
             if (isNaN(date.getTime())) {
                 // Try adding time if it's just YYYY-MM-DD
                 date = new Date(dateString + 'T00:00:00');
                 if (isNaN(date.getTime())) {
                    console.error("Invalid date string:", dateString);
                    return dateString; // Return original invalid string
                 }
             }

             const month = String(date.getMonth() + 1).padStart(2, '0');
             const day = String(date.getDate()).padStart(2, '0');
             const year = String(date.getFullYear()).slice(-2); // Get last two digits

            if (format === 'MM/DD') {
                return `${month}/${day}`;
            }
             // Default to MM/DD/YY
             return `${month}/${day}/${year}`;
         } catch (e) {
             console.error("Error formatting date:", dateString, e);
             return dateString; // Return original if error
         }
     };

    // --- Data Loading ---
      const loadData = () => {
        transactions = JSON.parse(localStorage.getItem('transactions_v2')) || [];
        // Ensure amounts are numbers
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
            startDateFilter = startDate ? new Date(startDate + 'T00:00:00') : null; // Start of day
            endDateFilter = endDate ? new Date(endDate + 'T23:59:59') : null; // End of day

            if (!startDateFilter || !endDateFilter || isNaN(startDateFilter.getTime()) || isNaN(endDateFilter.getTime())) {
                 periodText = 'Invalid Custom Range Dates';
                 reportPeriodDisplayEl.textContent = periodText;
                 console.error("Invalid custom dates provided:", startDate, endDate);
                return;
            }
             if (startDateFilter > endDateFilter) {
                 periodText = 'Start Date After End Date';
                 reportPeriodDisplayEl.textContent = periodText;
                 console.error("Start date is after end date:", startDate, endDate);
                 return;
             }
            // Format dates using MM/DD/YY for display
             periodText = `Custom Range: ${formatDate(startDate)} - ${formatDate(endDate)}`;
         } else {
            const today = new Date();
            endDateFilter = new Date(); // End of today
            endDateFilter.setHours(23, 59, 59, 999);

            switch (reportPeriod) {
                 case 'weekly':
                     const firstDayOfWeek = today.getDate() - today.getDay();
                     startDateFilter = new Date(new Date().setDate(firstDayOfWeek));
                     periodText = 'This Week';
                     break;
                 case 'monthly':
                     startDateFilter = new Date(today.getFullYear(), today.getMonth(), 1);
                     periodText = 'This Month';
                     break;
                 case 'all':
                 default:
                    startDateFilter = new Date(0); // Beginning of epoch time
                    periodText = 'All Time';
                    break;
            }
             startDateFilter.setHours(0, 0, 0, 0); // Ensure start of day
        }

        const filteredTransactions = transactions.filter(t => {
            try {
                 const transactionDate = new Date(t.date + 'T00:00:00'); // Interpret as local start of day
                 return !isNaN(transactionDate.getTime()) && transactionDate >= startDateFilter && transactionDate <= endDateFilter;
            } catch (e) {
                console.error("Error parsing transaction date:", t.date, e);
                return false;
            }
        }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

        let totalIncome = 0;
        let totalExpenses = 0;
        const incomeByCategory = {};
        const expenseByCategory = {};

        filteredTransactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            } else {
                totalExpenses += t.amount;
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            }
        });

        const netBalance = totalIncome - totalExpenses;

        // Use MM/DD/YY for the generated date
        reportGeneratedDateEl.textContent = formatDate(new Date().toISOString().split('T')[0]);
        reportPeriodDisplayEl.textContent = periodText;
        totalIncomeEl.textContent = formatCurrency(totalIncome);
        totalExpensesEl.textContent = formatCurrency(totalExpenses);
        netBalanceEl.textContent = formatCurrency(netBalance);
        netBalanceEl.className = netBalance >= 0 ? 'net-balance text-income' : 'net-balance text-expense';

        // Populate Combined Transaction Table
        transactionTableBody.innerHTML = ''; // Clear previous
        if (filteredTransactions.length > 0) {
            noTransactionsMsg.style.display = 'none';
            filteredTransactions.forEach(t => {
                const row = transactionTableBody.insertRow();
                const typeText = t.type.charAt(0).toUpperCase() + t.type.slice(1); // Capitalize type
                const amountClass = t.type === 'income' ? 'text-income' : 'text-expense';
                const amountPrefix = t.type === 'income' ? '+' : '-';
                 // Use MM/DD for transaction dates
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

        // Populate Category Breakdown Tables
        incomeCategoryTableBody.innerHTML = '';
        expenseCategoryTableBody.innerHTML = '';

        const sortedIncomeCategories = Object.entries(incomeByCategory).sort(([,a], [,b]) => b - a);
        const sortedExpenseCategories = Object.entries(expenseByCategory).sort(([,a], [,b]) => b - a);

        if(sortedIncomeCategories.length > 0) {
            noIncomeCatMsg.style.display = 'none';
            sortedIncomeCategories.forEach(([category, amount]) => {
                const percentage = totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : 0;
                const row = incomeCategoryTableBody.insertRow();
                row.innerHTML = `
                    <td>${category}</td>
                    <td class="amount text-income">${formatCurrency(amount)}</td>
                    <td class="percentage">${percentage}%</td>
                `;
            });
        } else {
            noIncomeCatMsg.style.display = 'block';
        }

        if (sortedExpenseCategories.length > 0) {
            noExpenseCatMsg.style.display = 'none';
            sortedExpenseCategories.forEach(([category, amount]) => {
                const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
                const row = expenseCategoryTableBody.insertRow();
                row.innerHTML = `
                    <td>${category}</td>
                    <td class="amount text-expense">${formatCurrency(amount)}</td>
                    <td class="percentage">${percentage}%</td>
                `;
            });
        } else {
            noExpenseCatMsg.style.display = 'block';
        }

        updateExpenseChart(expenseByCategory);
        applyTheme();
    };

    // --- Chart Update Function ---
     const updateExpenseChart = (expenseData) => {
         const labels = Object.keys(expenseData).sort((a,b) => expenseData[b] - expenseData[a]);
         const data = labels.map(label => expenseData[label]);

         const generateColors = (count) => {
             const baseColors = ['#dc3545', '#6c757d', '#ffc107', '#fd7e14', '#17a2b8', '#6610f2', '#20c997', '#e83e8c', '#007bff', '#28a745' ];
             const alpha = 'dd';
             return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length] + alpha);
         };
         const chartColors = generateColors(labels.length);
         const bodyStyle = getComputedStyle(document.body);
         const borderColor = bodyStyle.getPropertyValue('--card-bg-color').trim() || '#ffffff';
         const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000';

         if (expenseChart) {
             expenseChart.destroy();
             expenseChart = null;
         }

         if (labels.length > 0) {
             noExpenseChartMsg.style.display = 'none';
             expenseChart = new Chart(expenseChartCanvas, {
                 type: 'doughnut',
                 data: {
                     labels: labels,
                     datasets: [{
                         label: 'Expenses by Category',
                         data: data,
                         backgroundColor: chartColors,
                         borderColor: borderColor,
                         borderWidth: 2,
                         hoverOffset: 8
                     }]
                 },
                 options: {
                     responsive: true,
                     maintainAspectRatio: false,
                     animation: {
                         animateScale: true,
                         animateRotate: true
                     },
                     plugins: {
                         legend: {
                             position: 'bottom',
                             labels: {
                                 color: textColor,
                                 padding: 15,
                                 usePointStyle: true,
                                 font: { size: 13 }
                             }
                         },
                         tooltip: {
                             callbacks: {
                                  label: function(context) {
                                     let label = context.label || '';
                                     if (label) label += ': ';
                                     if (context.parsed !== null) {
                                         label += '$' + formatCurrency(context.parsed);
                                         const total = context.dataset.data.reduce((acc, value) => acc + value, 0);
                                         if (total > 0) {
                                             const percentage = ((context.parsed / total) * 100).toFixed(1);
                                             label += ` (${percentage}%)`;
                                         }
                                     }
                                     return label;
                                 }
                             }
                         }
                     }
                 }
             });
         } else {
             noExpenseChartMsg.style.display = 'block';
         }
     };

     const applyTheme = () => {
         const savedTheme = localStorage.getItem('theme') || 'light';
         document.body.dataset.theme = savedTheme;
          if (expenseChart) {
             const bodyStyle = getComputedStyle(document.body);
             const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000';
             const borderColor = bodyStyle.getPropertyValue('--card-bg-color').trim() || '#ffffff';
             if (expenseChart.options && expenseChart.options.plugins && expenseChart.options.plugins.legend) {
                 expenseChart.options.plugins.legend.labels.color = textColor;
             }
             if (expenseChart.data && expenseChart.data.datasets && expenseChart.data.datasets.length > 0) {
                 expenseChart.data.datasets[0].borderColor = borderColor;
             }
             expenseChart.update();
         }
     }

    // --- Initial Load ---
    displayDetailedReport();
});
