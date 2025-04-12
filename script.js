document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let transactions = [];
    let categories = {
        income: ['Salary', 'Freelance', 'Gift', 'Savings Withdrawal', 'Other Income'],
        expense: ['Groceries', 'Rent/Mortgage', 'Utilities', 'Transport', 'Entertainment', 'Dining Out', 'Savings Deposit', 'Other Expense']
    };
    let currentView = 'view-transactions';
    let editingTransactionId = null;
    let currentFilter = { text: '', type: 'all' };
    let expenseChart = null;
    let savingsChart = null;

    // --- DOM Elements ---
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('header nav .nav-btn');
    const transactionList = document.getElementById('transaction-list');
    const noTransactionsMessage = document.getElementById('no-transactions-message');
    const fab = document.getElementById('add-transaction-fab');
    const userGreetingEl = document.getElementById('user-greeting');
    const clearAllBtn = document.getElementById('clear-all-transactions-btn');

    // Modals & Forms
    const transactionModal = document.getElementById('transaction-modal');
    const categoryModal = document.getElementById('category-modal');
    const transactionForm = document.getElementById('transaction-form');
    const categoryManager = document.getElementById('category-manager');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const modalTitle = document.getElementById('modal-title');
    const hiddenTransactionId = document.getElementById('transaction-id');
    const typeSelect = document.getElementById('type');
    const dateInput = document.getElementById('date');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');
    const saveTransactionBtn = document.getElementById('save-transaction-btn');

    // Category Management Elements
    const manageCategoriesNavBtn = document.getElementById('manage-categories-nav-btn');
    const incomeCategoryList = document.getElementById('income-category-list');
    const expenseCategoryList = document.getElementById('expense-category-list');
    const newIncomeCategoryInput = document.getElementById('new-income-category');
    const newExpenseCategoryInput = document.getElementById('new-expense-category');
    const addIncomeCategoryBtn = document.getElementById('add-income-category-btn');
    const addExpenseCategoryBtn = document.getElementById('add-expense-category-btn');

    // Reporting Elements
    const reportPeriodSelect = document.getElementById('report-period');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const generatePrintReportBtn = document.getElementById('generate-print-report-btn');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const netBalanceEl = document.getElementById('net-balance');
    const expenseChartCanvas = document.getElementById('expense-chart');
    const noExpenseDataMessage = document.getElementById('no-expense-data-message');
    const customDateRangeDiv = document.getElementById('custom-date-range');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    // Savings Summary Elements
    const totalSavingsDepositsEl = document.getElementById('total-savings-deposits');
    const totalSavingsWithdrawalsEl = document.getElementById('total-savings-withdrawals');
    const netSavingsEl = document.getElementById('net-savings');
    const savingsChartCanvas = document.getElementById('savings-chart');
    const noSavingsDataMessage = document.getElementById('no-savings-data-message');
    // Report Headers (for conditional display)
    const expenseBreakdownHeader = document.getElementById('expense-breakdown-header');
    const savingsTrendHeader = document.getElementById('savings-trend-header');


    // Monthly Statement Elements
    const statementMonthSelect = document.getElementById('statement-month');
    const statementYearInput = document.getElementById('statement-year');
    const generateStatementBtn = document.getElementById('generate-statement-btn');
    // Removed: statementOutputDiv and clearStatementBtn references


    // Filtering Elements
    const searchInput = document.getElementById('search-input');
    const filterTypeSelect = document.getElementById('filter-type');

    // Theme Toggle Elements
    const themeToggle = document.getElementById('theme-toggle-checkbox');

    // Save/Load Elements
    const saveDataBtn = document.getElementById('save-data-btn');
    const loadDataBtn = document.getElementById('load-data-btn');
    const loadFileInput = document.getElementById('load-file-input');

    // Bottom Navigation Elements
    const bottomNav = document.getElementById('bottom-nav');
    const bottomNavBtns = bottomNav.querySelectorAll('.bottom-nav-btn');
    const bottomNavAddBtn = document.getElementById('bottom-nav-add-btn');
    const bottomNavCategoriesBtn = document.getElementById('bottom-nav-categories-btn');

    // --- Utility Functions ---
    const formatCurrency = (amount) => {
        return parseFloat(amount).toFixed(2);
    };
     const formatDate = (dateString, format = 'YYYY-MM-DD') => {
         if (!dateString) return '';
         try {
             let date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
             if (isNaN(date.getTime())) {
                console.error("Invalid date string for formatting:", dateString);
                return dateString;
             }

             const month = String(date.getMonth() + 1).padStart(2, '0');
             const day = String(date.getDate()).padStart(2, '0');
             const yearFull = date.getFullYear();
             const yearShort = String(yearFull).slice(-2);

             if (format === 'MM/DD/YY') { return `${month}/${day}/${yearShort}`; }
              if (format === 'MM/DD') { return `${month}/${day}`; }
             return `${yearFull}-${month}-${day}`;
         } catch (e) {
             console.error("Error formatting date:", dateString, e);
             return dateString;
         }
     };
    const getTimeOfDayGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };
    const displayGreeting = () => {
        const timeGreeting = getTimeOfDayGreeting();
        userGreetingEl.textContent = `${timeGreeting}!`;
        userGreetingEl.style.opacity = 1;
    };

    // --- Local Storage ---
    const loadData = () => {
        transactions = JSON.parse(localStorage.getItem('transactions_v2')) || [];
         transactions = transactions.map(t => ({ ...t, amount: Number(t.amount) || 0 }));
        const storedCategories = JSON.parse(localStorage.getItem('categories_v2'));
        if (storedCategories) {
            categories.income = [...new Set([...categories.income, ...storedCategories.income])];
            categories.expense = [...new Set([...categories.expense, ...storedCategories.expense])];
        }
        categories.income.sort((a, b) => a.localeCompare(b));
        categories.expense.sort((a, b) => a.localeCompare(b));
    };
    const saveData = () => {
        localStorage.setItem('transactions_v2', JSON.stringify(transactions));
        localStorage.setItem('categories_v2', JSON.stringify(categories));
    };

    // --- View Management ---
    const showView = (viewId) => {
        currentView = viewId;
        views.forEach(view => { view.classList.toggle('active', view.id === viewId); });
        navButtons.forEach(btn => { btn.classList.toggle('active', btn.dataset.view === viewId); });
        bottomNavBtns.forEach(btn => { if (btn.dataset.view) btn.classList.toggle('active', btn.dataset.view === viewId); });

        if (viewId === 'view-report') {
             generateReport(); // Refresh report summary/charts when switching to report view
        }
        // Removed clearing statement output here

        if (viewId === 'view-transactions') renderTransactionList();
    };


    // --- Modal Management ---
    const openModal = (modalElement) => {
        modalElement.classList.add('active');
         const firstInput = modalElement.querySelector('input:not([type="hidden"]), select');
         if(firstInput) setTimeout(() => firstInput.focus(), 50);
    };
    const closeModal = (modalElement) => { modalElement.classList.remove('active'); };
    const openTransactionModal = (mode = 'add', transaction = null) => {
        transactionForm.reset(); editingTransactionId = null; hiddenTransactionId.value = '';
        if (mode === 'add') {
            modalTitle.textContent = 'Add Transaction'; saveTransactionBtn.innerHTML = '<i class="fas fa-plus"></i> Add Transaction';
            dateInput.value = formatDate(new Date().toISOString());
            typeSelect.value = 'expense'; populateCategoryOptions();
        } else if (mode === 'edit' && transaction) {
            modalTitle.textContent = 'Edit Transaction'; saveTransactionBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            editingTransactionId = transaction.id; hiddenTransactionId.value = transaction.id; typeSelect.value = transaction.type;
            dateInput.value = transaction.date;
            descriptionInput.value = transaction.description; amountInput.value = transaction.amount;
            populateCategoryOptions(); categorySelect.value = transaction.category;
        } else { console.error("Invalid mode or missing transaction for edit."); return; }
        openModal(transactionModal);
    };

    // --- Transaction Logic ---
    const handleTransactionFormSubmit = (e) => {
        e.preventDefault();
        const type = typeSelect.value;
        const date = dateInput.value;
        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const category = categorySelect.value;
        const id = hiddenTransactionId.value ? parseInt(hiddenTransactionId.value) : Date.now();

        if (!date || !description || isNaN(amount) || amount <= 0 || !category) {
            alert('Please fill in all fields with valid data.'); return;
        }
        if (category === 'Savings Deposit' && type !== 'expense') {
             alert('Savings Deposit must be an Expense type.'); return;
        }
        if (category === 'Savings Withdrawal' && type !== 'income') {
             alert('Savings Withdrawal must be an Income type.'); return;
        }
        if (type === 'income' && !categories.income.includes(category)) {
             alert(`Category "${category}" is not a valid Income category.`); return;
        }
         if (type === 'expense' && !categories.expense.includes(category)) {
             alert(`Category "${category}" is not a valid Expense category.`); return;
        }


        const transactionData = { id, type, date, description, amount, category };
        if (editingTransactionId) { transactions = transactions.map(t => t.id === editingTransactionId ? transactionData : t); }
        else { transactions.push(transactionData); }
        saveData(); renderTransactionList(); closeModal(transactionModal); if (currentView === 'view-report') generateReport();
    };
    const deleteTransaction = (id) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(t => t.id !== id); saveData(); renderTransactionList(); if (currentView === 'view-report') generateReport();
        }
    };
    const clearAllTransactions = () => {
        if (transactions.length === 0) {
             alert('There are no transactions to clear.');
             return;
        }
        if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
            transactions = [];
            saveData();
            renderTransactionList();
            if (currentView === 'view-report') {
                 generateReport();
            }
             alert('All transactions have been cleared.');
        }
    };


    // --- Rendering Functions ---
    const renderTransactionList = () => {
        transactionList.innerHTML = ''; const searchTerm = currentFilter.text.toLowerCase(); const filterType = currentFilter.type;
        const filteredTransactions = transactions.filter(t => { const descriptionMatch = t.description.toLowerCase().includes(searchTerm); const categoryMatch = t.category.toLowerCase().includes(searchTerm); const typeMatch = filterType === 'all' || t.type === filterType; return (descriptionMatch || categoryMatch) && typeMatch; }).sort((a, b) => new Date(b.date) - new Date(a.date));
        if (filteredTransactions.length === 0 && transactions.length > 0) { transactionList.innerHTML = '<li class="info-message">No transactions match your filter.</li>'; noTransactionsMessage.style.display = 'none'; }
        else if (transactions.length === 0) { noTransactionsMessage.style.display = 'block'; }
        else {
            noTransactionsMessage.style.display = 'none';
            filteredTransactions.forEach(t => {
                 const li = document.createElement('li');
                 li.classList.add('transaction-card');
                 li.dataset.id = t.id;
                 const amountClass = t.type === 'income' ? 'text-income' : 'text-expense';
                 const amountPrefix = t.type === 'income' ? '+' : '-';

                 li.innerHTML = `
                     <div class="transaction-details">
                         <span class="transaction-description">${t.description}</span>
                         <span class="transaction-category"><i class="fas fa-tag"></i> ${t.category}</span>
                         <span class="transaction-date"><i class="fas fa-calendar-alt"></i> ${formatDate(t.date, 'MM/DD/YY')}</span>
                     </div>
                     <div class="transaction-amount ${amountClass}">
                         ${amountPrefix}${formatCurrency(t.amount)}
                     </div>
                     <div class="transaction-actions">
                         <button class="btn-icon btn-warning edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                         <button class="btn-icon btn-danger delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
                     </div>
                 `;
                 transactionList.appendChild(li);
             });
        }
    };

    // --- Filtering Logic ---
    const handleFilterChange = () => { currentFilter.text = searchInput.value; currentFilter.type = filterTypeSelect.value; renderTransactionList(); };

    // --- Editing Logic ---
    const handleTransactionListClick = (e) => { const editButton = e.target.closest('.edit-btn'); const deleteButton = e.target.closest('.delete-btn'); if (editButton) { const card = editButton.closest('.transaction-card'); const id = parseInt(card.dataset.id); const transactionToEdit = transactions.find(t => t.id === id); if (transactionToEdit) openTransactionModal('edit', transactionToEdit); } else if (deleteButton) { const card = deleteButton.closest('.transaction-card'); const id = parseInt(card.dataset.id); deleteTransaction(id); } };

    // --- Category Management ---
    const populateCategoryOptions = () => {
         const currentType = typeSelect.value;
         categorySelect.innerHTML = '';
         let selectedCategoryFound = false;
         const currentCategoryValue = categorySelect.value;

         if (categories[currentType]) {
             categories[currentType].forEach(cat => {
                 const option = document.createElement('option');
                 option.value = cat;
                 option.textContent = cat;
                 if (cat === currentCategoryValue) {
                      option.selected = true;
                      selectedCategoryFound = true;
                 }
                 categorySelect.appendChild(option);
             });
         }
         if (!selectedCategoryFound && categorySelect.options.length > 0) {
             categorySelect.options[0].selected = true;
         }
    };
    const renderCategoryList = (type) => { const listElement = type === 'income' ? incomeCategoryList : expenseCategoryList; listElement.innerHTML = ''; categories[type].forEach(cat => { const li = document.createElement('li'); li.textContent = cat; const deleteBtn = document.createElement('button'); deleteBtn.classList.add('btn-icon', 'btn-danger', 'delete-category-btn'); deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; deleteBtn.title = `Delete ${cat}`; deleteBtn.onclick = () => deleteCategory(type, cat); li.appendChild(deleteBtn); listElement.appendChild(li); }); };
    const addCategory = (type) => { const inputElement = type === 'income' ? newIncomeCategoryInput : newExpenseCategoryInput; const categoryName = inputElement.value.trim(); if (categoryName && !categories[type].includes(categoryName)) { categories[type].push(categoryName); categories[type].sort((a,b) => a.localeCompare(b)); saveData(); renderCategoryList(type); populateCategoryOptions(); inputElement.value = ''; } else if (!categoryName) { alert('Category name cannot be empty.'); } else { alert(`Category "${categoryName}" already exists.`); } };
    const deleteCategory = (type, categoryName) => {
         if (categoryName === 'Savings Deposit' || categoryName === 'Savings Withdrawal') {
             alert(`Cannot delete the core "${categoryName}" category.`);
             return;
         }
        const isUsed = transactions.some(t => t.type === type && t.category === categoryName); if (isUsed) { alert(`Cannot delete category "${categoryName}" as it is used by existing transactions.`); return; } if (categories[type].length <= 1) { alert(`Cannot delete the last category for ${type}.`); return; } categories[type] = categories[type].filter(cat => cat !== categoryName); saveData(); renderCategoryList(type); populateCategoryOptions(); };
    const showCategoryModal = () => { renderCategoryList('income'); renderCategoryList('expense'); openModal(categoryModal); };

    // --- Reporting Logic ---
     const generateReport = () => {
            const period = reportPeriodSelect.value;
            const today = new Date();
            let startDate, endDate;

            if (period === 'custom') {
                startDate = startDateInput.value ? new Date(startDateInput.value + 'T00:00:00') : null;
                endDate = endDateInput.value ? new Date(endDateInput.value + 'T23:59:59') : null;
                if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
                    alert('Please select a valid start and end date for the custom range.');
                    totalIncomeEl.textContent = '0.00'; totalExpensesEl.textContent = '0.00'; netBalanceEl.textContent = '0.00';
                    totalSavingsDepositsEl.textContent = '0.00'; totalSavingsWithdrawalsEl.textContent = '0.00'; netSavingsEl.textContent = '0.00';
                    updateExpenseChart({}); updateSavingsChart([]);
                    customDateRangeDiv.style.display = 'flex';
                    return;
                }
            } else {
                 endDate = new Date(); endDate.setHours(23, 59, 59, 999);
                 switch (period) {
                     case 'weekly': startDate = new Date(); startDate.setDate(startDate.getDate() - startDate.getDay()); break;
                     case 'biweekly': startDate = new Date(new Date().getTime() - 13 * 24 * 60 * 60 * 1000); break;
                     case 'monthly': startDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
                     case 'all': default: startDate = new Date(0); break;
                 }
                 startDate.setHours(0, 0, 0, 0);
            }
            customDateRangeDiv.style.display = period === 'custom' ? 'flex' : 'none';

            const periodTransactions = transactions.filter(t => {
                 try {
                    const transactionDate = new Date(t.date.includes('T') ? t.date : t.date + 'T00:00:00');
                    return !isNaN(transactionDate.getTime()) && transactionDate >= startDate && transactionDate <= endDate;
                 } catch(e) { return false; }
            }).sort((a, b) => new Date(a.date) - new Date(b.date));


            let totalIncome = 0;
            let totalExpenses = 0;
            let totalSavingsDeposits = 0;
            let totalSavingsWithdrawals = 0;
            const expenseByCategory = {};
            const savingsDataForChart = [];

            let currentNetSavings = 0;

            periodTransactions.forEach(t => {
                let isSavingsTransaction = false;
                if (t.category === 'Savings Deposit') {
                    totalSavingsDeposits += t.amount;
                    currentNetSavings += t.amount;
                    isSavingsTransaction = true;
                } else if (t.category === 'Savings Withdrawal') {
                    totalSavingsWithdrawals += t.amount;
                    currentNetSavings -= t.amount;
                    isSavingsTransaction = true;
                } else if (t.type === 'income') {
                    totalIncome += t.amount;
                } else if (t.type === 'expense') {
                    totalExpenses += t.amount;
                    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
                }
                  if(isSavingsTransaction) {
                     savingsDataForChart.push({ date: t.date, netSavingsBalance: currentNetSavings });
                  }
            });

            const netBalance = totalIncome - totalExpenses;
            const netSavingsChange = totalSavingsDeposits - totalSavingsWithdrawals;

            // Update Summary Display
            totalIncomeEl.textContent = formatCurrency(totalIncome);
            totalExpensesEl.textContent = formatCurrency(totalExpenses);
            netBalanceEl.textContent = formatCurrency(netBalance);
            netBalanceEl.className = netBalance >= 0 ? 'text-income' : 'text-expense';

            totalSavingsDepositsEl.textContent = formatCurrency(totalSavingsDeposits);
            totalSavingsWithdrawalsEl.textContent = formatCurrency(totalSavingsWithdrawals);
            netSavingsEl.textContent = formatCurrency(netSavingsChange);
            netSavingsEl.className = 'text-savings'; // Always use savings class here

            // --- Update Charts and Headers ---
            updateExpenseChart(expenseByCategory);
            updateSavingsChart(savingsDataForChart);
        };

    const updateExpenseChart = (expenseData) => {
        const labels = Object.keys(expenseData).sort((a,b) => expenseData[b] - expenseData[a]);
        const data = labels.map(label => expenseData[label]);
        const hasData = labels.length > 0;

        // Show/Hide Header
        expenseBreakdownHeader.style.display = hasData ? 'block' : 'none';

        const generateColors = (count) => {
            const baseColors = ['#dc3545', '#6c757d', '#ffc107', '#fd7e14', '#6f42c1', '#20c997', '#e83e8c', '#0d6efd'];
            const alpha = 'aa';
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

        if (hasData) {
            noExpenseDataMessage.style.display = 'none';
            expenseChartCanvas.style.display = 'block';
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
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { bottom: 25 } },
                    animation: { animateScale: true, animateRotate: true },
                    plugins: {
                        legend: { position: 'bottom', labels: { color: textColor, padding: 10, usePointStyle: true, font: { size: 13 } } },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || ''; if (label) label += ': ';
                                    if (context.parsed !== null) {
                                        label += '$' + formatCurrency(context.parsed);
                                        const total = context.dataset.data.reduce((acc, value) => acc + value, 0);
                                        if (total > 0) { const percentage = ((context.parsed / total) * 100).toFixed(1); label += ` (${percentage}%)`; }
                                    } return label;
                                }
                            }
                        }
                    }
                }
            });
        } else {
             noExpenseDataMessage.style.display = 'block';
             expenseChartCanvas.style.display = 'none';
        }
    };

     const updateSavingsChart = (savingsData) => {
        const bodyStyle = getComputedStyle(document.body);
        const savingsColor = bodyStyle.getPropertyValue('--info-color').trim() || '#17a2b8';
        const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000';
        const gridColor = bodyStyle.getPropertyValue('--border-color').trim() || '#dee2e6';

         const aggregatedData = savingsData.reduce((acc, entry) => {
             acc[entry.date] = entry.netSavingsBalance;
             return acc;
         }, {});

         const labels = Object.keys(aggregatedData).sort((a, b) => new Date(a) - new Date(b));
         const dataPoints = labels.map(date => aggregatedData[date]);
         const hasData = labels.length > 0;

         // Show/Hide Header
         savingsTrendHeader.style.display = hasData ? 'block' : 'none';

        if (savingsChart) {
            savingsChart.destroy();
            savingsChart = null;
        }

        if (hasData) {
            noSavingsDataMessage.style.display = 'none';
             savingsChartCanvas.style.display = 'block';
            savingsChart = new Chart(savingsChartCanvas, {
                type: 'line',
                data: {
                    labels: labels.map(date => formatDate(date, 'MM/DD')),
                    datasets: [{
                        label: 'Net Savings Balance',
                        data: dataPoints,
                        borderColor: savingsColor,
                        backgroundColor: savingsColor + '33',
                        tension: 0.1,
                        fill: true,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: { color: textColor, callback: function(value) { return '$' + formatCurrency(value); } },
                            grid: { color: gridColor + '80' }
                        },
                        x: {
                            ticks: { color: textColor, maxRotation: 45, minRotation: 45 },
                             grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false },
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
             noSavingsDataMessage.style.display = 'block';
             savingsChartCanvas.style.display = 'none';
        }
    };


    const generatePrintableReport = () => {
        const period = reportPeriodSelect.value;
         let startDateValue = ''; let endDateValue = '';
          if (period === 'custom') {
            startDateValue = startDateInput.value; endDateValue = endDateInput.value;
            if (!startDateValue || !endDateValue) { alert('Please select both start and end dates for the custom range.'); return; }
            const startD = new Date(startDateValue + 'T00:00:00'); const endD = new Date(endDateValue + 'T23:59:59');
             if (isNaN(startD.getTime()) || isNaN(endD.getTime()) || startD > endD) { alert('Invalid custom date range selected.'); return; }
         }
        let url = `report.html?period=${encodeURIComponent(period)}`;
        if (startDateValue) url += `&startDate=${encodeURIComponent(startDateValue)}`;
        if (endDateValue) url += `&endDate=${encodeURIComponent(endDateValue)}`;
        window.open(url, '_blank');
    };

    // --- Updated Monthly Statement Function ---
     const generateMonthlyStatement = () => {
        const selectedMonth = statementMonthSelect.value; // Keep as string for URL param
        const selectedYear = statementYearInput.value;

        if (!selectedYear || isNaN(parseInt(selectedYear)) || selectedYear < 2000 || selectedYear > 2100) {
            alert('Please enter a valid year (e.g., 2024).');
            return;
        }

        // Construct URL for the new statement page
        const url = `statement.html?month=${encodeURIComponent(selectedMonth)}&year=${encodeURIComponent(selectedYear)}`;

        // Open the statement in a new tab/window
        window.open(url, '_blank');
    };


    // --- Dark Mode ---
    const applyTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.dataset.theme = savedTheme;
        themeToggle.checked = (savedTheme === 'dark');
        if (currentView === 'view-report') {
            const bodyStyle = getComputedStyle(document.body);
            const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000';
            const gridColor = bodyStyle.getPropertyValue('--border-color').trim() || '#dee2e6';
            const borderColor = bodyStyle.getPropertyValue('--card-bg-color').trim() || '#ffffff';

            if (expenseChart && expenseChart.options && expenseChart.options.plugins && expenseChart.options.plugins.legend) {
                expenseChart.options.plugins.legend.labels.color = textColor;
                if (expenseChart.data.datasets[0]) expenseChart.data.datasets[0].borderColor = borderColor; // Check if dataset exists
                expenseChart.update();
            }
            if (savingsChart && savingsChart.options && savingsChart.options.scales) {
                if (savingsChart.options.plugins.legend) savingsChart.options.plugins.legend.labels.color = textColor; // Check if legend exists
                savingsChart.options.scales.y.ticks.color = textColor;
                savingsChart.options.scales.y.grid.color = gridColor + '80';
                savingsChart.options.scales.x.ticks.color = textColor;
                savingsChart.update();
            }
        }
    }


     const setDarkMode = (isDark) => {
         localStorage.setItem('theme', isDark ? 'dark' : 'light');
         applyTheme();
     };

     const toggleDarkMode = () => { setDarkMode(themeToggle.checked); };

    // --- JSON Save/Load Functions ---
    const saveDataToJSONFile = () => {
        try {
            const dataToSave = { transactions: transactions, categories: categories, savedAt: new Date().toISOString() };
            const jsonString = JSON.stringify(dataToSave, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            const timestamp = new Date().toISOString().slice(0, 10);
            link.setAttribute('download', `income_expense_tracker_data_${timestamp}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) { console.error("Error saving data to JSON:", error); alert('Error saving data.'); }
    };
    const handleLoadDataFromFile = (event) => {
        const file = event.target.files[0]; if (!file) return;
        if (!file.name.endsWith('.json')) { alert('Invalid file type. Please select a .json file.'); loadFileInput.value = ''; return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                if (typeof loadedData !== 'object' || loadedData === null || !Array.isArray(loadedData.transactions) || typeof loadedData.categories !== 'object' || loadedData.categories === null || !Array.isArray(loadedData.categories.income) || !Array.isArray(loadedData.categories.expense)) { throw new Error("Invalid JSON structure."); }
                if (!confirm('Load data? This will REPLACE all current transactions and categories.')) { loadFileInput.value = ''; return; }
                transactions = loadedData.transactions.map(t => ({ ...t, amount: Number(t.amount) || 0 }));
                 const defaultIncome = ['Salary', 'Freelance', 'Gift', 'Savings Withdrawal', 'Other Income'];
                 const defaultExpense = ['Groceries', 'Rent/Mortgage', 'Utilities', 'Transport', 'Entertainment', 'Dining Out', 'Savings Deposit', 'Other Expense'];

                categories = {
                    income: [...new Set([...defaultIncome, ...(Array.isArray(loadedData.categories.income) ? loadedData.categories.income : [])])].sort((a,b) => a.localeCompare(b)),
                    expense: [...new Set([...defaultExpense, ...(Array.isArray(loadedData.categories.expense) ? loadedData.categories.expense : [])])].sort((a,b) => a.localeCompare(b))
                };

                saveData();
                renderTransactionList();
                if (currentView === 'view-report') generateReport();
                populateCategoryOptions();
                alert('Data loaded successfully!');
            } catch (error) { console.error("Error loading data from JSON:", error); alert(`Error loading file: ${error.message}`); }
            finally { loadFileInput.value = ''; }
        };
        reader.onerror = (e) => { console.error("FileReader error:", e); alert('Error reading file.'); loadFileInput.value = ''; };
        reader.readAsText(file);
    };

    // --- Event Listeners ---
    navButtons.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
    bottomNavBtns.forEach(button => { if (button.dataset.view) button.addEventListener('click', () => showView(button.dataset.view)); });
    bottomNavAddBtn.addEventListener('click', () => openTransactionModal('add'));
    bottomNavCategoriesBtn.addEventListener('click', showCategoryModal);
    fab.addEventListener('click', () => openTransactionModal('add'));
    closeModalBtns.forEach(btn => { btn.addEventListener('click', () => { const modal = btn.closest('.modal'); if(modal) closeModal(modal); }); });
    transactionModal.addEventListener('click', (e) => { if (e.target === transactionModal) closeModal(transactionModal); });
    categoryModal.addEventListener('click', (e) => { if (e.target === categoryModal) closeModal(categoryModal); });
    transactionForm.addEventListener('submit', handleTransactionFormSubmit);
    typeSelect.addEventListener('change', populateCategoryOptions);
    transactionList.addEventListener('click', handleTransactionListClick);
    searchInput.addEventListener('input', handleFilterChange);
    filterTypeSelect.addEventListener('change', handleFilterChange);
    manageCategoriesNavBtn.addEventListener('click', showCategoryModal);
    addIncomeCategoryBtn.addEventListener('click', () => addCategory('income'));
    addExpenseCategoryBtn.addEventListener('click', () => addCategory('expense'));
    generateReportBtn.addEventListener('click', generateReport);
    generatePrintReportBtn.addEventListener('click', generatePrintableReport);
    reportPeriodSelect.addEventListener('change', () => {
        customDateRangeDiv.style.display = reportPeriodSelect.value === 'custom' ? 'flex' : 'none';
        if (reportPeriodSelect.value !== 'custom') {
            generateReport();
        } else {
             totalIncomeEl.textContent = '0.00'; totalExpensesEl.textContent = '0.00'; netBalanceEl.textContent = '0.00';
             totalSavingsDepositsEl.textContent = '0.00'; totalSavingsWithdrawalsEl.textContent = '0.00'; netSavingsEl.textContent = '0.00';
             updateExpenseChart({}); updateSavingsChart([]);
        }
    });
    themeToggle.addEventListener('change', toggleDarkMode);
    saveDataBtn.addEventListener('click', saveDataToJSONFile);
    loadDataBtn.addEventListener('click', () => loadFileInput.click());
    loadFileInput.addEventListener('change', handleLoadDataFromFile);
    clearAllBtn.addEventListener('click', clearAllTransactions);
    generateStatementBtn.addEventListener('click', generateMonthlyStatement);
    // Removed clearStatementBtn event listener


    // --- Initialization ---
    const initializeApp = () => {
        loadData();
        applyTheme();
        displayGreeting();
        statementYearInput.value = new Date().getFullYear();
        statementMonthSelect.value = new Date().getMonth();
        showView(currentView);
    };

    initializeApp();
});
