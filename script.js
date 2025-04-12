document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let transactions = [];
    let categories = {
        income: ['Salary', 'Freelance', 'Gift', 'Savings Withdrawal', 'Other Income'],
        expense: ['Groceries', 'Rent/Mortgage', 'Utilities', 'Transport', 'Entertainment', 'Dining Out', 'Savings Deposit', 'Other Expense']
    };
    let currentView = 'view-transactions';
    let editingTransactionId = null;
    // Only text and type needed for filter state now
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
    // Using original version - this will now target statement.html
    // const clearStatementBtn = document.getElementById('clear-statement-btn');
    // const statementOutputDiv = document.getElementById('monthly-statement-output');


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
        // Ensure input is treated as a number before formatting
        const numAmount = Number(amount);
        return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
    };
     const formatDate = (dateString, format = 'YYYY-MM-DD') => {
         if (!dateString) return '';
         try {
             // Handle both 'YYYY-MM-DD' and dates possibly coming from Date object ISO string
             let date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
             // Check if the date is valid after parsing
             if (isNaN(date.getTime())) {
                console.error("Invalid date string for formatting:", dateString);
                // Return the original string or a default error indicator if invalid
                return dateString;
             }

             const month = String(date.getMonth() + 1).padStart(2, '0');
             const day = String(date.getDate()).padStart(2, '0');
             const yearFull = date.getFullYear();
             const yearShort = String(yearFull).slice(-2);

             if (format === 'MM/DD/YY') { return `${month}/${day}/${yearShort}`; }
             if (format === 'MM/DD') { return `${month}/${day}`; }
             // Default format YYYY-MM-DD
             return `${yearFull}-${month}-${day}`;
         } catch (e) {
             console.error("Error formatting date:", dateString, e);
             return dateString; // Return original on error
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
         // Ensure amounts are numbers
         transactions = transactions.map(t => ({ ...t, amount: Number(t.amount) || 0 }));
        const storedCategories = JSON.parse(localStorage.getItem('categories_v2'));
        if (storedCategories) {
            // Use Set to avoid duplicates if default categories were already present
            categories.income = [...new Set([...categories.income, ...storedCategories.income])];
            categories.expense = [...new Set([...categories.expense, ...storedCategories.expense])];
        }
        // Sort categories alphabetically
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
        // No need to clear statement div as it's removed or handled by statement.html logic

        if (viewId === 'view-transactions') renderTransactionList(); // Render list when switching to transactions view
    };


    // --- Modal Management ---
    const openModal = (modalElement) => {
        modalElement.classList.add('active');
         // Focus on the first input field when modal opens
         const firstInput = modalElement.querySelector('input:not([type="hidden"]), select');
         if(firstInput) setTimeout(() => firstInput.focus(), 50); // Delay focus slightly
    };
    const closeModal = (modalElement) => { modalElement.classList.remove('active'); };
    const openTransactionModal = (mode = 'add', transaction = null) => {
        transactionForm.reset(); // Clear form
        editingTransactionId = null; // Reset editing ID
        hiddenTransactionId.value = ''; // Clear hidden ID field

        if (mode === 'add') {
            modalTitle.textContent = 'Add Transaction';
            saveTransactionBtn.innerHTML = '<i class="fas fa-plus"></i> Add Transaction';
            // Set default date to today
            dateInput.value = formatDate(new Date().toISOString()); // Format as YYYY-MM-DD
            typeSelect.value = 'expense'; // Default to expense
            populateCategoryOptions(); // Populate categories based on default type
        } else if (mode === 'edit' && transaction) {
            modalTitle.textContent = 'Edit Transaction';
            saveTransactionBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            editingTransactionId = transaction.id;
            hiddenTransactionId.value = transaction.id;
            typeSelect.value = transaction.type;
            dateInput.value = transaction.date; // Assumes t.date is YYYY-MM-DD
            descriptionInput.value = transaction.description;
            amountInput.value = transaction.amount;
            populateCategoryOptions(); // Populate categories for the correct type
            categorySelect.value = transaction.category; // Set the current category
        } else {
            console.error("Invalid mode or missing transaction for edit.");
            return; // Exit if mode is invalid
        }
        openModal(transactionModal);
    };

    // --- Transaction Logic ---
    const handleTransactionFormSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission

        // Get form values
        const type = typeSelect.value;
        const date = dateInput.value; // Already in YYYY-MM-DD
        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const category = categorySelect.value;
        const id = hiddenTransactionId.value ? parseInt(hiddenTransactionId.value) : Date.now(); // Use existing ID or generate new one

        // Basic Validation
        if (!date || !description || isNaN(amount) || amount <= 0 || !category) {
            alert('Please fill in all fields with valid data.');
            return;
        }
        // Special category validation
        if (category === 'Savings Deposit' && type !== 'expense') {
             alert('Savings Deposit must be an Expense type.');
             return;
        }
        if (category === 'Savings Withdrawal' && type !== 'income') {
             alert('Savings Withdrawal must be an Income type.');
             return;
        }
        // Ensure category belongs to the selected type
        if (type === 'income' && !categories.income.includes(category)) {
             alert(`Category "${category}" is not a valid Income category.`);
             return;
        }
         if (type === 'expense' && !categories.expense.includes(category)) {
             alert(`Category "${category}" is not a valid Expense category.`);
             return;
        }


        const transactionData = { id, type, date, description, amount, category };

        // Add or Update transaction
        if (editingTransactionId) {
            // Update existing transaction
            transactions = transactions.map(t => t.id === editingTransactionId ? transactionData : t);
        } else {
            // Add new transaction
            transactions.push(transactionData);
        }

        saveData(); // Save updated transactions to local storage
        renderTransactionList(); // Re-render the transaction list
        closeModal(transactionModal); // Close the modal
        if (currentView === 'view-report') generateReport(); // Update report if currently viewing it
    };

    const deleteTransaction = (id) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(t => t.id !== id); // Remove transaction
            saveData(); // Save changes
            renderTransactionList(); // Re-render list
            if (currentView === 'view-report') generateReport(); // Update report if viewing
        }
    };

    const clearAllTransactions = () => {
        if (transactions.length === 0) {
             alert('There are no transactions to clear.');
             return;
        }
        if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
            transactions = []; // Clear the array
            saveData(); // Save the empty array
            renderTransactionList(); // Re-render the empty list
            if (currentView === 'view-report') {
                 generateReport(); // Update the report view (will show empty state)
            }
             alert('All transactions have been cleared.');
        }
    };


    // --- Rendering Functions ---
    const renderTransactionList = () => {
        transactionList.innerHTML = ''; // Clear current list

        const searchTermRaw = currentFilter.text.trim(); // Trim whitespace from search term
        const filterType = currentFilter.type;

        // --- Updated Filtering Logic ---
        const filteredTransactions = transactions.filter(t => {
            // 1. Check Type Filter first
            const typeMatch = filterType === 'all' || t.type === filterType;
            if (!typeMatch) {
                return false; // If type doesn't match, no need to check further
            }

            // 2. If search term is empty, show all transactions matching the type
            if (searchTermRaw === '') {
                return true;
            }

            // 3. Perform checks if search term is not empty
            const searchTermLower = searchTermRaw.toLowerCase();

            // Check Description/Category (Case-insensitive)
            const textMatch = t.description.toLowerCase().includes(searchTermLower) ||
                              t.category.toLowerCase().includes(searchTermLower);
            if (textMatch) return true;

            // Check Date (Accepts YYYY-MM-DD and MM/DD)
            let dateMatch = false;
            if (t.date) { // Ensure transaction date exists
                if (searchTermRaw.match(/^\d{4}-\d{2}-\d{2}$/)) { // YYYY-MM-DD format
                    dateMatch = t.date === searchTermRaw;
                } else if (searchTermRaw.match(/^\d{2}\/\d{2}$/)) { // MM/DD format
                    // Convert MM/DD search to required MM-DD ending format for comparison
                    const requiredEnding = '-' + searchTermRaw.replace('/', '-'); // turns "02/28" into "-02-28"
                    dateMatch = t.date.endsWith(requiredEnding);
                }
            }
            if (dateMatch) return true;

            // Check Amount (Exact Match)
            const searchAmount = parseFloat(searchTermRaw);
            if (!isNaN(searchAmount)) { // Check if searchTerm is a valid number
                // Compare using toFixed(2) to handle potential floating point inaccuracies
                const amountMatch = t.amount.toFixed(2) === searchAmount.toFixed(2);
                if (amountMatch) return true;
            }

            // If none of the above matched, return false
            return false;

        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
        // --- End of Updated Filtering Logic ---


        // Display messages or transaction cards
        if (filteredTransactions.length === 0) {
             if (transactions.length === 0) {
                 noTransactionsMessage.style.display = 'block'; // Show "No transactions yet"
                 transactionList.innerHTML = ''; // Ensure list is empty
             } else {
                 noTransactionsMessage.style.display = 'none'; // Hide default message
                 transactionList.innerHTML = '<li class="info-message">No transactions match your search criteria.</li>'; // Show filter message
             }
        }
        else {
            noTransactionsMessage.style.display = 'none'; // Hide message
            // Populate list with filtered transactions
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
    // This function updates the filter state based on search input and type select
    const handleFilterChange = () => {
        currentFilter.text = searchInput.value; // Store raw text input
        currentFilter.type = filterTypeSelect.value;
        renderTransactionList(); // Re-render the list with new filters
    };

    // --- Editing Logic ---
    // Handles clicks within the transaction list for edit/delete buttons
    const handleTransactionListClick = (e) => {
        const editButton = e.target.closest('.edit-btn');
        const deleteButton = e.target.closest('.delete-btn');

        if (editButton) {
            const card = editButton.closest('.transaction-card');
            const id = parseInt(card.dataset.id);
            const transactionToEdit = transactions.find(t => t.id === id);
            if (transactionToEdit) openTransactionModal('edit', transactionToEdit);
        } else if (deleteButton) {
            const card = deleteButton.closest('.transaction-card');
            const id = parseInt(card.dataset.id);
            deleteTransaction(id);
        }
    };

    // --- Category Management ---
    // Populates the category dropdown in the transaction modal based on selected type
    const populateCategoryOptions = () => {
         const currentType = typeSelect.value;
         categorySelect.innerHTML = ''; // Clear existing options
         let selectedCategoryFound = false;
         const currentCategoryValue = categorySelect.value; // Store current value if editing

         if (categories[currentType]) {
             categories[currentType].forEach(cat => {
                 const option = document.createElement('option');
                 option.value = cat;
                 option.textContent = cat;
                 // Re-select previously selected category if editing
                 if (cat === currentCategoryValue) {
                      option.selected = true;
                      selectedCategoryFound = true;
                 }
                 categorySelect.appendChild(option);
             });
         }
         // If editing and the previous category is no longer valid for the type, select the first option
         if (!selectedCategoryFound && categorySelect.options.length > 0) {
             categorySelect.options[0].selected = true;
         }
    };
    // Renders the category list in the category management modal
    const renderCategoryList = (type) => {
        const listElement = type === 'income' ? incomeCategoryList : expenseCategoryList;
        listElement.innerHTML = ''; // Clear current list
        categories[type].forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat;
            // Add delete button only for non-core categories
            if (cat !== 'Savings Deposit' && cat !== 'Savings Withdrawal') {
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('btn-icon', 'btn-danger', 'delete-category-btn');
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.title = `Delete ${cat}`;
                deleteBtn.onclick = () => deleteCategory(type, cat);
                li.appendChild(deleteBtn);
            }
            listElement.appendChild(li);
        });
    };
    // Adds a new category
    const addCategory = (type) => {
        const inputElement = type === 'income' ? newIncomeCategoryInput : newExpenseCategoryInput;
        const categoryName = inputElement.value.trim();
        if (categoryName && !categories[type].includes(categoryName)) {
            categories[type].push(categoryName);
            categories[type].sort((a,b) => a.localeCompare(b)); // Keep sorted
            saveData(); // Save updated categories
            renderCategoryList(type); // Re-render list in modal
            populateCategoryOptions(); // Update dropdown in transaction modal
            inputElement.value = ''; // Clear input field
        } else if (!categoryName) {
            alert('Category name cannot be empty.');
        } else {
            alert(`Category "${categoryName}" already exists.`);
        }
    };
    // Deletes a category (if not core and not in use)
    const deleteCategory = (type, categoryName) => {
        // Prevent deletion of core categories (already checked in renderCategoryList)
        // Double-check here just in case
         if (categoryName === 'Savings Deposit' || categoryName === 'Savings Withdrawal') {
             alert(`Cannot delete the core "${categoryName}" category.`);
             return;
         }
        // Check if the category is used in any transactions
        const isUsed = transactions.some(t => t.type === type && t.category === categoryName);
        if (isUsed) {
            alert(`Cannot delete category "${categoryName}" as it is used by existing transactions.`);
            return;
        }
        // Prevent deleting the last category
        if (categories[type].length <= 1) {
            alert(`Cannot delete the last category for ${type}.`);
            return;
        }
        // Filter out the category to delete
        categories[type] = categories[type].filter(cat => cat !== categoryName);
        saveData(); // Save changes
        renderCategoryList(type); // Re-render modal list
        populateCategoryOptions(); // Update transaction form dropdown
    };
    // Shows the category management modal
    const showCategoryModal = () => {
        renderCategoryList('income');
        renderCategoryList('expense');
        openModal(categoryModal);
    };

    // --- Reporting Logic ---
     const generateReport = () => {
            const period = reportPeriodSelect.value;
            const today = new Date();
            let startDate, endDate;

            if (period === 'custom') {
                startDate = startDateInput.value ? new Date(startDateInput.value + 'T00:00:00') : null;
                endDate = endDateInput.value ? new Date(endDateInput.value + 'T23:59:59') : null;
                // Validate custom date range
                if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
                    alert('Please select a valid start and end date for the custom range.');
                    // Reset report display on error
                    totalIncomeEl.textContent = '0.00'; totalExpensesEl.textContent = '0.00'; netBalanceEl.textContent = '0.00';
                    totalSavingsDepositsEl.textContent = '0.00'; totalSavingsWithdrawalsEl.textContent = '0.00'; netSavingsEl.textContent = '0.00';
                    updateExpenseChart({}); updateSavingsChart([]); // Clear charts
                    customDateRangeDiv.style.display = 'flex'; // Ensure range inputs are visible
                    return;
                }
            } else {
                 endDate = new Date(); // Today
                 endDate.setHours(23, 59, 59, 999); // End of today
                 switch (period) {
                     case 'weekly':
                         startDate = new Date();
                         startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of current week (Sunday)
                         break;
                     case 'biweekly':
                         startDate = new Date(new Date().getTime() - 13 * 24 * 60 * 60 * 1000); // 14 days ago (including today)
                         break;
                     case 'monthly':
                         startDate = new Date(today.getFullYear(), today.getMonth(), 1); // First day of current month
                         break;
                     case 'all':
                     default:
                         startDate = new Date(0); // Beginning of time (for all transactions)
                         break;
                 }
                 startDate.setHours(0, 0, 0, 0); // Start of the day
            }
            // Show/hide custom date range inputs based on selection
            customDateRangeDiv.style.display = period === 'custom' ? 'flex' : 'none';

            // Filter transactions based on the calculated date range
            const periodTransactions = transactions.filter(t => {
                 try {
                    const transactionDate = new Date(t.date.includes('T') ? t.date : t.date + 'T00:00:00');
                    return !isNaN(transactionDate.getTime()) && transactionDate >= startDate && transactionDate <= endDate;
                 } catch(e) { return false; } // Ignore invalid transaction dates
            }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date for savings chart consistency


            // Calculate summaries
            let totalIncome = 0;
            let totalExpenses = 0;
            let totalSavingsDeposits = 0;
            let totalSavingsWithdrawals = 0;
            const expenseByCategory = {}; // For expense chart (excluding savings deposit)
            const savingsDataForChart = []; // For savings trend chart

            let currentNetSavings = 0; // Track running balance for savings chart

            periodTransactions.forEach(t => {
                let isSavingsTransaction = false;
                if (t.category === 'Savings Deposit') {
                    totalSavingsDeposits += t.amount;
                    currentNetSavings += t.amount; // Increase net savings
                    isSavingsTransaction = true;
                    // NOTE: Savings Deposit is treated as an EXPENSE in the operating budget calculation below
                    totalExpenses += t.amount; // Add to operating expenses
                    // Don't add to expenseByCategory chart data
                } else if (t.category === 'Savings Withdrawal') {
                    totalSavingsWithdrawals += t.amount;
                    currentNetSavings -= t.amount; // Decrease net savings
                    isSavingsTransaction = true;
                    // NOTE: Savings Withdrawal is treated as INCOME in the operating budget
                    totalIncome += t.amount; // Add to operating income
                } else if (t.type === 'income') {
                    totalIncome += t.amount;
                } else if (t.type === 'expense') {
                    totalExpenses += t.amount;
                    // Aggregate expenses by category for the chart
                    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
                }

                 // Track daily savings balance change for the line chart
                  if(isSavingsTransaction) {
                     savingsDataForChart.push({ date: t.date, netSavingsBalance: currentNetSavings });
                  }
            });

            const netBalance = totalIncome - totalExpenses; // Operating net balance
            const netSavingsChange = totalSavingsDeposits - totalSavingsWithdrawals; // Net flow into/out of savings

            // Update Summary Display in the UI
            totalIncomeEl.textContent = formatCurrency(totalIncome);
            totalExpensesEl.textContent = formatCurrency(totalExpenses);
            netBalanceEl.textContent = formatCurrency(netBalance);
            netBalanceEl.className = netBalance >= 0 ? 'text-income' : 'text-expense'; // Style based on positive/negative

            totalSavingsDepositsEl.textContent = formatCurrency(totalSavingsDeposits);
            totalSavingsWithdrawalsEl.textContent = formatCurrency(totalSavingsWithdrawals);
            netSavingsEl.textContent = formatCurrency(netSavingsChange);
            netSavingsEl.className = 'text-savings'; // Always use savings class for savings figures

            // Update the charts
            updateExpenseChart(expenseByCategory);
            updateSavingsChart(savingsDataForChart);
        };

    // Updates the expense breakdown doughnut chart
    const updateExpenseChart = (expenseData) => {
        const labels = Object.keys(expenseData).sort((a,b) => expenseData[b] - expenseData[a]); // Sort labels by amount desc
        const data = labels.map(label => expenseData[label]);
        const hasData = labels.length > 0;

        // Show/Hide Header based on data presence
        expenseBreakdownHeader.style.display = hasData ? 'block' : 'none';

        // Function to generate chart colors
        const generateColors = (count) => {
            const baseColors = ['#dc3545', '#6c757d', '#ffc107', '#fd7e14', '#6f42c1', '#20c997', '#e83e8c', '#0d6efd'];
            const alpha = 'aa'; // Add some transparency
            return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length] + alpha);
        };
        const chartColors = generateColors(labels.length);

        // Get theme-dependent colors for chart styling
        const bodyStyle = getComputedStyle(document.body);
        const borderColor = bodyStyle.getPropertyValue('--card-bg-color').trim() || '#ffffff'; // Border color matches card background
        const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000'; // Legend text color matches theme

        // Destroy existing chart instance if it exists
        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }

        // Create new chart if there is data
        if (hasData) {
            noExpenseDataMessage.style.display = 'none'; // Hide no data message
            expenseChartCanvas.style.display = 'block'; // Show canvas
            expenseChart = new Chart(expenseChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Expenses by Category',
                        data: data,
                        backgroundColor: chartColors,
                        borderColor: borderColor, // Use theme background for border
                        borderWidth: 2,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allow chart to fill container height
                    layout: { padding: { bottom: 25 } }, // Add padding for legend
                    animation: { animateScale: true, animateRotate: true },
                    plugins: {
                        legend: { // Configure legend
                            position: 'bottom',
                            labels: {
                                color: textColor, // Use theme text color
                                padding: 10,
                                usePointStyle: true,
                                font: { size: 13 }
                            }
                        },
                        tooltip: { // Configure tooltips
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed !== null) {
                                        label += '$' + formatCurrency(context.parsed); // Format amount
                                        // Calculate and add percentage
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
             // Show no data message if no expense data
             noExpenseDataMessage.style.display = 'block';
             expenseChartCanvas.style.display = 'none'; // Hide canvas
        }
    };

    // Updates the savings trend line chart
     const updateSavingsChart = (savingsData) => {
        // Get theme-dependent colors
        const bodyStyle = getComputedStyle(document.body);
        const savingsColor = bodyStyle.getPropertyValue('--info-color').trim() || '#17a2b8'; // Use info color for savings
        const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000';
        const gridColor = bodyStyle.getPropertyValue('--border-color').trim() || '#dee2e6';

        // Aggregate data: Use the last entry for each date if multiple savings transactions occur on the same day
         const aggregatedData = savingsData.reduce((acc, entry) => {
             acc[entry.date] = entry.netSavingsBalance; // Overwrite with the latest balance for the date
             return acc;
         }, {});

         // Sort dates chronologically
         const labels = Object.keys(aggregatedData).sort((a, b) => new Date(a) - new Date(b));
         const dataPoints = labels.map(date => aggregatedData[date]); // Get corresponding balances
         const hasData = labels.length > 0;

         // Show/Hide Header based on data
         savingsTrendHeader.style.display = hasData ? 'block' : 'none';

        // Destroy existing chart instance
        if (savingsChart) {
            savingsChart.destroy();
            savingsChart = null;
        }

        // Create new chart if there is data
        if (hasData) {
            noSavingsDataMessage.style.display = 'none'; // Hide message
             savingsChartCanvas.style.display = 'block'; // Show canvas
            savingsChart = new Chart(savingsChartCanvas, {
                type: 'line',
                data: {
                    labels: labels.map(date => formatDate(date, 'MM/DD')), // Format dates for x-axis
                    datasets: [{
                        label: 'Net Savings Balance', // Tooltip label
                        data: dataPoints,
                        borderColor: savingsColor, // Line color
                        backgroundColor: savingsColor + '33', // Fill color with transparency
                        tension: 0.1, // Slight curve to the line
                        fill: true, // Fill area below the line
                        pointRadius: 3, // Size of points on the line
                        pointHoverRadius: 5, // Size on hover
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { // Configure axes
                        y: {
                            beginAtZero: false, // Allow y-axis to start below zero if needed
                            ticks: {
                                color: textColor, // Use theme text color
                                callback: function(value) { return '$' + formatCurrency(value); } // Format ticks as currency
                            },
                            grid: { color: gridColor + '80' } // Grid line color with transparency
                        },
                        x: {
                            ticks: {
                                color: textColor,
                                maxRotation: 45, // Rotate labels if they overlap
                                minRotation: 45
                            },
                             grid: { display: false } // Hide vertical grid lines
                        }
                    },
                    plugins: {
                        legend: { display: false }, // Hide legend for line chart
                        tooltip: {
                            callbacks: {
                                label: function(context) { // Format tooltip content
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed.y !== null) {
                                        label += '$' + formatCurrency(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        } else {
             // Show message if no savings data
             noSavingsDataMessage.style.display = 'block';
             savingsChartCanvas.style.display = 'none'; // Hide canvas
        }
    };


    // Opens the printable report in a new tab
    const generatePrintableReport = () => {
        const period = reportPeriodSelect.value;
         let startDateValue = '';
         let endDateValue = '';

          if (period === 'custom') {
            startDateValue = startDateInput.value;
            endDateValue = endDateInput.value;
            // Basic validation for custom dates
            if (!startDateValue || !endDateValue) {
                alert('Please select both start and end dates for the custom range.');
                return;
            }
            // More robust validation (check if dates are valid and range is correct)
            const startD = new Date(startDateValue + 'T00:00:00');
            const endD = new Date(endDateValue + 'T23:59:59');
             if (isNaN(startD.getTime()) || isNaN(endD.getTime()) || startD > endD) {
                 alert('Invalid custom date range selected.');
                 return;
             }
         }

        // Construct URL with parameters
        let url = `report.html?period=${encodeURIComponent(period)}`;
        if (startDateValue) url += `&startDate=${encodeURIComponent(startDateValue)}`;
        if (endDateValue) url += `&endDate=${encodeURIComponent(endDateValue)}`;

        window.open(url, '_blank'); // Open in new tab
    };

    // Opens the printable monthly statement in a new tab
     const generateMonthlyStatement = () => {
        const selectedMonth = statementMonthSelect.value; // Keep as string '0'-'11'
        const selectedYear = statementYearInput.value;

        // Validate year input
        if (!selectedYear || isNaN(parseInt(selectedYear)) || selectedYear < 2000 || selectedYear > 2100) {
            alert('Please enter a valid year (e.g., 2024).');
            return;
        }

        // Construct URL for the statement page
        const url = `statement.html?month=${encodeURIComponent(selectedMonth)}&year=${encodeURIComponent(selectedYear)}`;

        // Open the statement page in a new tab/window
        window.open(url, '_blank');
    };


    // --- Dark Mode ---
    const applyTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.dataset.theme = savedTheme;
        themeToggle.checked = (savedTheme === 'dark');

        // Update chart colors if charts exist and view is report
        if (currentView === 'view-report') {
            const bodyStyle = getComputedStyle(document.body);
            const textColor = bodyStyle.getPropertyValue('--text-color').trim() || '#000000';
            const gridColor = bodyStyle.getPropertyValue('--border-color').trim() || '#dee2e6';
            const borderColor = bodyStyle.getPropertyValue('--card-bg-color').trim() || '#ffffff';

            // Update Expense Chart
            if (expenseChart && expenseChart.options && expenseChart.options.plugins && expenseChart.options.plugins.legend) {
                expenseChart.options.plugins.legend.labels.color = textColor;
                if (expenseChart.data.datasets[0]) { // Check dataset exists
                    expenseChart.data.datasets[0].borderColor = borderColor;
                }
                expenseChart.update('none'); // Update without animation
            }
            // Update Savings Chart
            if (savingsChart && savingsChart.options && savingsChart.options.scales) {
                if (savingsChart.options.plugins.legend) { // Check legend exists
                     savingsChart.options.plugins.legend.labels.color = textColor;
                }
                savingsChart.options.scales.y.ticks.color = textColor;
                savingsChart.options.scales.y.grid.color = gridColor + '80';
                savingsChart.options.scales.x.ticks.color = textColor;
                savingsChart.update('none'); // Update without animation
            }
        }
    }


     const setDarkMode = (isDark) => {
         localStorage.setItem('theme', isDark ? 'dark' : 'light');
         applyTheme(); // Apply the theme and update charts if necessary
     };

     const toggleDarkMode = () => { setDarkMode(themeToggle.checked); };

    // --- JSON Save/Load Functions ---
    const saveDataToJSONFile = () => {
        try {
            // Prepare data object
            const dataToSave = {
                transactions: transactions,
                categories: categories,
                savedAt: new Date().toISOString() // Add timestamp
            };
            const jsonString = JSON.stringify(dataToSave, null, 2); // Pretty print JSON
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' }); // Create blob
            const link = document.createElement('a'); // Create download link
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            link.setAttribute('download', `income_expense_tracker_data_${timestamp}.json`); // Set filename
            link.style.visibility = 'hidden'; // Hide link
            document.body.appendChild(link);
            link.click(); // Trigger download
            document.body.removeChild(link); // Clean up link
            URL.revokeObjectURL(url); // Release object URL
        } catch (error) {
            console.error("Error saving data to JSON:", error);
            alert('Error saving data.');
        }
    };
    const handleLoadDataFromFile = (event) => {
        const file = event.target.files[0];
        if (!file) return; // No file selected

        // Validate file type
        if (!file.name.endsWith('.json')) {
            alert('Invalid file type. Please select a .json file.');
            loadFileInput.value = ''; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                // Validate JSON structure
                if (
                    typeof loadedData !== 'object' || loadedData === null ||
                    !Array.isArray(loadedData.transactions) ||
                    typeof loadedData.categories !== 'object' || loadedData.categories === null ||
                    !Array.isArray(loadedData.categories.income) ||
                    !Array.isArray(loadedData.categories.expense)
                ) {
                    throw new Error("Invalid JSON structure.");
                }

                // Confirmation before overwriting
                if (!confirm('Load data? This will REPLACE all current transactions and categories.')) {
                    loadFileInput.value = ''; // Reset file input if cancelled
                    return;
                }

                // Update state with loaded data
                transactions = loadedData.transactions.map(t => ({ ...t, amount: Number(t.amount) || 0 })); // Ensure amounts are numbers

                // Merge categories, ensuring defaults are kept and no duplicates
                 const defaultIncome = ['Salary', 'Freelance', 'Gift', 'Savings Withdrawal', 'Other Income'];
                 const defaultExpense = ['Groceries', 'Rent/Mortgage', 'Utilities', 'Transport', 'Entertainment', 'Dining Out', 'Savings Deposit', 'Other Expense'];

                categories = {
                    income: [...new Set([...defaultIncome, ...(Array.isArray(loadedData.categories.income) ? loadedData.categories.income : [])])].sort((a,b) => a.localeCompare(b)),
                    expense: [...new Set([...defaultExpense, ...(Array.isArray(loadedData.categories.expense) ? loadedData.categories.expense : [])])].sort((a,b) => a.localeCompare(b))
                };

                saveData(); // Save the newly loaded data to localStorage
                renderTransactionList(); // Update transaction list view
                if (currentView === 'view-report') generateReport(); // Update report view if active
                populateCategoryOptions(); // Update category dropdowns
                alert('Data loaded successfully!');

            } catch (error) {
                console.error("Error loading data from JSON:", error);
                alert(`Error loading file: ${error.message}`);
            } finally {
                loadFileInput.value = ''; // Reset file input regardless of success/error
            }
        };
        reader.onerror = (e) => {
            console.error("FileReader error:", e);
            alert('Error reading file.');
            loadFileInput.value = ''; // Reset file input on error
        };
        reader.readAsText(file); // Read the file content
    };

    // --- Event Listeners ---
    // View Switching
    navButtons.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
    bottomNavBtns.forEach(button => { if (button.dataset.view) button.addEventListener('click', () => showView(button.dataset.view)); });

    // Modals & Forms
    bottomNavAddBtn.addEventListener('click', () => openTransactionModal('add'));
    bottomNavCategoriesBtn.addEventListener('click', showCategoryModal);
    fab.addEventListener('click', () => openTransactionModal('add'));
    closeModalBtns.forEach(btn => { btn.addEventListener('click', () => { const modal = btn.closest('.modal'); if(modal) closeModal(modal); }); });
    transactionModal.addEventListener('click', (e) => { if (e.target === transactionModal) closeModal(transactionModal); }); // Close on backdrop click
    categoryModal.addEventListener('click', (e) => { if (e.target === categoryModal) closeModal(categoryModal); }); // Close on backdrop click
    transactionForm.addEventListener('submit', handleTransactionFormSubmit);
    typeSelect.addEventListener('change', populateCategoryOptions); // Update categories when type changes

    // Transaction List Actions
    transactionList.addEventListener('click', handleTransactionListClick);

    // Filtering
    searchInput.addEventListener('input', handleFilterChange);
    filterTypeSelect.addEventListener('change', handleFilterChange);

    // Category Management
    manageCategoriesNavBtn.addEventListener('click', showCategoryModal);
    addIncomeCategoryBtn.addEventListener('click', () => addCategory('income'));
    addExpenseCategoryBtn.addEventListener('click', () => addCategory('expense'));

    // Reporting & Statements
    generateReportBtn.addEventListener('click', generateReport);
    generatePrintReportBtn.addEventListener('click', generatePrintableReport);
    reportPeriodSelect.addEventListener('change', () => {
        const isCustom = reportPeriodSelect.value === 'custom';
        customDateRangeDiv.style.display = isCustom ? 'flex' : 'none';
        if (!isCustom) {
            generateReport(); // Generate report immediately for non-custom periods
        } else {
            // Optionally clear report when switching to custom until Generate is clicked
             totalIncomeEl.textContent = '0.00'; totalExpensesEl.textContent = '0.00'; netBalanceEl.textContent = '0.00';
             totalSavingsDepositsEl.textContent = '0.00'; totalSavingsWithdrawalsEl.textContent = '0.00'; netSavingsEl.textContent = '0.00';
             updateExpenseChart({}); updateSavingsChart([]);
        }
    });
    generateStatementBtn.addEventListener('click', generateMonthlyStatement);
    // Removed clearStatementBtn listener

    // Theme Toggle
    themeToggle.addEventListener('change', toggleDarkMode);

    // Save/Load
    saveDataBtn.addEventListener('click', saveDataToJSONFile);
    loadDataBtn.addEventListener('click', () => loadFileInput.click()); // Trigger hidden file input
    loadFileInput.addEventListener('change', handleLoadDataFromFile);

    // Clear All
    clearAllBtn.addEventListener('click', clearAllTransactions);


    // --- Initialization ---
    const initializeApp = () => {
        loadData(); // Load data from local storage
        applyTheme(); // Apply saved theme
        displayGreeting(); // Show time-based greeting
        // Set default statement month/year (optional, could leave blank)
        statementYearInput.value = new Date().getFullYear();
        statementMonthSelect.value = new Date().getMonth();
        showView(currentView); // Show the initial view (and render transactions)
    };

    initializeApp(); // Run initialization on page load
});