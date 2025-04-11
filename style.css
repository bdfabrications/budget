document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let transactions = [];
    let categories = {
        income: ['Salary', 'Freelance', 'Gift', 'Other Income'],
        expense: ['Groceries', 'Rent/Mortgage', 'Utilities', 'Transport', 'Entertainment', 'Dining Out', 'Other Expense']
    };
    let currentView = 'view-transactions';
    let editingTransactionId = null;
    let currentFilter = { text: '', type: 'all' };
    let expenseChart = null;

    // --- DOM Elements ---
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('header nav .nav-btn');
    const transactionList = document.getElementById('transaction-list');
    const noTransactionsMessage = document.getElementById('no-transactions-message');
    const fab = document.getElementById('add-transaction-fab');
    const userGreetingEl = document.getElementById('user-greeting');

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
    const generatePrintReportBtn = document.getElementById('generate-print-report-btn'); // New button
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const netBalanceEl = document.getElementById('net-balance');
    const expenseChartCanvas = document.getElementById('expense-chart');
    const noExpenseDataMessage = document.getElementById('no-expense-data-message');
    const customDateRangeDiv = document.getElementById('custom-date-range');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

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
    const formatDate = (dateString) => {
        return dateString ? dateString.split('T')[0] : '';
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
        if (viewId === 'view-report') generateReport();
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
            dateInput.valueAsDate = new Date(); typeSelect.value = 'expense'; populateCategoryOptions();
        } else if (mode === 'edit' && transaction) {
            modalTitle.textContent = 'Edit Transaction'; saveTransactionBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            editingTransactionId = transaction.id; hiddenTransactionId.value = transaction.id; typeSelect.value = transaction.type;
            dateInput.value = transaction.date; descriptionInput.value = transaction.description; amountInput.value = transaction.amount;
            populateCategoryOptions(); categorySelect.value = transaction.category;
        } else { console.error("Invalid mode or missing transaction for edit."); return; }
        openModal(transactionModal);
    };

    // --- Transaction Logic ---
    const handleTransactionFormSubmit = (e) => {
        e.preventDefault(); const type = typeSelect.value; const date = dateInput.value; const description = descriptionInput.value.trim(); const amount = parseFloat(amountInput.value); const category = categorySelect.value; const id = hiddenTransactionId.value ? parseInt(hiddenTransactionId.value) : Date.now();
        if (!date || !description || isNaN(amount) || amount <= 0 || !category) { alert('Please fill in all fields with valid data.'); return; }
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

    // --- Rendering Functions ---
    const renderTransactionList = () => {
        transactionList.innerHTML = ''; const searchTerm = currentFilter.text.toLowerCase(); const filterType = currentFilter.type;
        const filteredTransactions = transactions.filter(t => { const descriptionMatch = t.description.toLowerCase().includes(searchTerm); const categoryMatch = t.category.toLowerCase().includes(searchTerm); const typeMatch = filterType === 'all' || t.type === filterType; return (descriptionMatch || categoryMatch) && typeMatch; }).sort((a, b) => new Date(b.date) - new Date(a.date));
        if (filteredTransactions.length === 0 && transactions.length > 0) { transactionList.innerHTML = '<li class="info-message">No transactions match your filter.</li>'; noTransactionsMessage.style.display = 'none'; }
        else if (transactions.length === 0) { noTransactionsMessage.style.display = 'block'; }
        else { noTransactionsMessage.style.display = 'none'; filteredTransactions.forEach(t => { const li = document.createElement('li'); li.classList.add('transaction-card'); li.dataset.id = t.id; li.innerHTML = ` <div class="transaction-details"> <span class="transaction-description">${t.description}</span> <span class="transaction-category"><i class="fas fa-tag"></i> ${t.category}</span> <span class="transaction-date"><i class="fas fa-calendar-alt"></i> ${formatDate(t.date)}</span> </div> <div class="transaction-amount ${t.type === 'income' ? 'text-income' : 'text-expense'}"> ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)} </div> <div class="transaction-actions"> <button class="btn-icon btn-warning edit-btn" title="Edit"><i class="fas fa-edit"></i></button> <button class="btn-icon btn-danger delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button> </div> `; transactionList.appendChild(li); }); }
    };

    // --- Filtering Logic ---
    const handleFilterChange = () => { currentFilter.text = searchInput.value; currentFilter.type = filterTypeSelect.value; renderTransactionList(); };

    // --- Editing Logic ---
    const handleTransactionListClick = (e) => { const editButton = e.target.closest('.edit-btn'); const deleteButton = e.target.closest('.delete-btn'); if (editButton) { const card = editButton.closest('.transaction-card'); const id = parseInt(card.dataset.id); const transactionToEdit = transactions.find(t => t.id === id); if (transactionToEdit) openTransactionModal('edit', transactionToEdit); } else if (deleteButton) { const card = deleteButton.closest('.transaction-card'); const id = parseInt(card.dataset.id); deleteTransaction(id); } };

    // --- Category Management ---
    const populateCategoryOptions = () => { const currentType = typeSelect.value; categorySelect.innerHTML = ''; if (categories[currentType]) { categories[currentType].forEach(cat => { const option = document.createElement('option'); option.value = cat; option.textContent = cat; categorySelect.appendChild(option); }); } };
    const renderCategoryList = (type) => { const listElement = type === 'income' ? incomeCategoryList : expenseCategoryList; listElement.innerHTML = ''; categories[type].forEach(cat => { const li = document.createElement('li'); li.textContent = cat; const deleteBtn = document.createElement('button'); deleteBtn.classList.add('btn-icon', 'btn-danger', 'delete-category-btn'); deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; deleteBtn.title = `Delete ${cat}`; deleteBtn.onclick = () => deleteCategory(type, cat); li.appendChild(deleteBtn); listElement.appendChild(li); }); };
    const addCategory = (type) => { const inputElement = type === 'income' ? newIncomeCategoryInput : newExpenseCategoryInput; const categoryName = inputElement.value.trim(); if (categoryName && !categories[type].includes(categoryName)) { categories[type].push(categoryName); categories[type].sort((a,b) => a.localeCompare(b)); saveData(); renderCategoryList(type); populateCategoryOptions(); inputElement.value = ''; } else if (!categoryName) { alert('Category name cannot be empty.'); } else { alert(`Category "${categoryName}" already exists.`); } };
    const deleteCategory = (type, categoryName) => { const isUsed = transactions.some(t => t.type === type && t.category === categoryName); if (isUsed) { alert(`Cannot delete category "${categoryName}" as it is used by existing transactions.`); return; } if (categories[type].length <= 1) { alert(`Cannot delete the last category for ${type}.`); return; } categories[type] = categories[type].filter(cat => cat !== categoryName); saveData(); renderCategoryList(type); populateCategoryOptions(); };
    const showCategoryModal = () => { renderCategoryList('income'); renderCategoryList('expense'); openModal(categoryModal); };

    // --- Reporting Logic ---
    const generateReport = () => {
        const period = reportPeriodSelect.value;
        const today = new Date();
        let startDate;
        let endDate;
        let periodText = '';

        if (period === 'custom') {
            startDate = startDateInput.value ? new Date(startDateInput.value) : null;
            endDate = endDateInput.value ? new Date(endDateInput.value) : null;
             if (!startDate || !endDate || startDate > endDate) { // Added validation
                alert('Please select a valid start and end date for the custom range.');
                return;
             }
             periodText = `Custom Range: ${formatDate(startDateInput.value)} - ${formatDate(endDateInput.value)}`;

        } else {
            endDate = new Date(); // End of today
            switch (period) {
                case 'weekly':
                    const firstDay = today.getDate() - today.getDay();
                    startDate = new Date(new Date().setDate(firstDay));
                    periodText = "This Week";
                    break;
                case 'biweekly':
                    startDate = new Date(new Date().getTime() - 13 * 24 * 60 * 60 * 1000);
                    periodText = "Last 14 Days";
                    break;
                case 'monthly':
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    periodText = "This Month";
                    break;
                case 'all':
                default:
                    startDate = new Date(0);
                    periodText = "All Time";
                    break;
            }
        }

        // Ensure consistent time handling for filtering
        const startOfDayFilter = new Date(startDate);
        startOfDayFilter.setHours(0,0,0,0);
        const endOfDayFilter = new Date(endDate);
        endOfDayFilter.setHours(23,59,59,999);


        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            // Compare transaction date directly with start/end of day filters
            return transactionDate >= startOfDayFilter && transactionDate <= endOfDayFilter;
        });

        let totalIncome = 0;
        let totalExpenses = 0;
        const expenseByCategory = {};
        filteredTransactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else {
                totalExpenses += t.amount;
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            }
        });
        const netBalance = totalIncome - totalExpenses;
        totalIncomeEl.textContent = formatCurrency(totalIncome);
        totalExpensesEl.textContent = formatCurrency(totalExpenses);
        netBalanceEl.textContent = formatCurrency(netBalance);
        netBalanceEl.classList.toggle('text-income', netBalance >= 0);
        netBalanceEl.classList.toggle('text-expense', netBalance < 0);
        updateExpenseChart(expenseByCategory);

        // Show/hide custom date inputs
        customDateRangeDiv.style.display = period === 'custom' ? 'flex' : 'none';
    };

    const updateExpenseChart = (expenseData) => {
        const labels = Object.keys(expenseData).sort((a,b) => expenseData[b] - expenseData[a]);
        const data = labels.map(label => expenseData[label]);
        const generateColors = (count) => {
            const baseColors = ['#007bff', '#6c757d', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6610f2', '#fd7e14', '#20c997', '#e83e8c'];
            const alpha = 'aa';
            return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length] + alpha);
        };
        const chartColors = generateColors(labels.length);
        // Ensure theme is applied before getting colors
        applyTheme();
        const bodyStyle = getComputedStyle(document.body);
        const borderColor = bodyStyle.getPropertyValue('--card-bg-color').trim() || '#ffffff';
        const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000';

        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }

        if (labels.length > 0) {
            noExpenseDataMessage.style.display = 'none';
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
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: textColor,
                                padding: 10,
                                usePointStyle: true,
                                font: {
                                    size: 13
                                }
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
            noExpenseDataMessage.style.display = 'block';
        }
    };

    const generatePrintableReport = () => {
        const period = reportPeriodSelect.value;
         let startDateValue = '';
         let endDateValue = '';

          if (period === 'custom') {
            startDateValue = startDateInput.value;
            endDateValue = endDateInput.value;
            if (!startDateValue || !endDateValue) {
                alert('Please select both start and end dates for the custom range.');
                return;
            }
            const startD = new Date(startDateValue);
            const endD = new Date(endDateValue);
             if (startD > endD) {
                 alert('Start date cannot be after end date.');
                 return;
             }
         }

        let url = 'report.html?period=' + encodeURIComponent(period);
        if (startDateValue) {
            url += '&startDate=' + encodeURIComponent(startDateValue);
        }
        if (endDateValue) {
            url += '&endDate=' + encodeURIComponent(endDateValue);
        }
        window.open(url, '_blank');
    };

    // --- Dark Mode ---
    const applyTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.dataset.theme = savedTheme;
        themeToggle.checked = (savedTheme === 'dark');
        // Update chart colors if chart exists
        if (expenseChart && currentView === 'view-report') {
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

     const setDarkMode = (isDark) => {
         localStorage.setItem('theme', isDark ? 'dark' : 'light');
         applyTheme(); // Apply theme and update chart
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
                transactions = loadedData.transactions;
                categories = {
                    income: Array.isArray(loadedData.categories.income) ? loadedData.categories.income.sort((a,b) => a.localeCompare(b)) : [],
                    expense: Array.isArray(loadedData.categories.expense) ? loadedData.categories.expense.sort((a,b) => a.localeCompare(b)) : []
                };
                saveData(); renderTransactionList(); if (currentView === 'view-report') generateReport(); populateCategoryOptions(); alert('Data loaded successfully!');
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
    generatePrintReportBtn.addEventListener('click', generatePrintableReport); // New button listener
    reportPeriodSelect.addEventListener('change', () => {
        // Only call generateReport if not selecting 'custom' initially
        // Let the button handle generation for custom after dates are set
        if (reportPeriodSelect.value !== 'custom') {
            generateReport();
        }
        customDateRangeDiv.style.display = reportPeriodSelect.value === 'custom' ? 'flex' : 'none';
    });
    themeToggle.addEventListener('change', toggleDarkMode);
    saveDataBtn.addEventListener('click', saveDataToJSONFile);
    loadDataBtn.addEventListener('click', () => loadFileInput.click());
    loadFileInput.addEventListener('change', handleLoadDataFromFile);

    // --- Initialization ---
    const initializeApp = () => {
        loadData();
        applyTheme(); // Apply theme initially
        displayGreeting();
        showView(currentView); // Show initial view ('view-transactions')
        // renderTransactionList(); // Called within showView if it's the active one
    };

    initializeApp();
});
