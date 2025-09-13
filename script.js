document.addEventListener("DOMContentLoaded", () => {
    // --- State Variables ---
    let transactions = [];
    let categories = {
        income: [
            "Salary",
            "Freelance",
            "Gift",
            "Savings Withdrawal",
            "Other Income",
        ],
        expense: [
            "Groceries",
            "Rent/Mortgage",
            "Utilities",
            "Transport",
            "Entertainment",
            "Dining Out",
            "Shopping",
            "Medical",
            "Travel",
            "Subscriptions",
            "Savings Deposit",
            "Other Expense",
        ],
    };
    let currentView = "view-transactions";
    let editingTransactionId = null;
    // Only text and type needed for filter state now
    let currentFilter = { text: "", type: "all" };
    let expenseChart = null;
    let savingsChart = null;

    // CSV Import State
    let csvData = [];
    let csvHeaders = [];
    let columnMappings = {};
    let csvFiles = [];
    let currentFileIndex = 0;

    // --- DOM Elements ---
    const views = document.querySelectorAll(".view");
    const navButtons = document.querySelectorAll(".nav-btn[data-view]");
    const transactionList = document.getElementById("transaction-list");
    const noTransactionsMessage = document.getElementById(
        "no-transactions-message",
    );
    const fab = document.getElementById("add-transaction-fab");
    const userGreetingEl = document.getElementById("user-greeting");
    const clearAllBtn = document.getElementById("clear-all-transactions-btn");

    // Modals & Forms
    const transactionModal = document.getElementById("transaction-modal");
    const categoryModal = document.getElementById("category-modal");
    const transactionForm = document.getElementById("transaction-form");
    const categoryManager = document.getElementById("category-manager");
    const closeModalBtns = document.querySelectorAll(".close-modal-btn");
    const modalTitle = document.getElementById("modal-title");
    const hiddenTransactionId = document.getElementById("transaction-id");
    const typeSelect = document.getElementById("type");
    const dateInput = document.getElementById("date");
    const descriptionInput = document.getElementById("description");
    const amountInput = document.getElementById("amount");
    const categorySelect = document.getElementById("category");
    const saveTransactionBtn = document.getElementById("save-transaction-btn");

    // Category Management Elements
    const manageCategoriesNavBtn = document.getElementById(
        "manage-categories-nav-btn",
    );
    const incomeCategoryList = document.getElementById("income-category-list");
    const expenseCategoryList = document.getElementById("expense-category-list");
    const newIncomeCategoryInput = document.getElementById("new-income-category");
    const newExpenseCategoryInput = document.getElementById(
        "new-expense-category",
    );
    const addIncomeCategoryBtn = document.getElementById(
        "add-income-category-btn",
    );
    const addExpenseCategoryBtn = document.getElementById(
        "add-expense-category-btn",
    );

    // Reporting Elements
    const reportPeriodSelect = document.getElementById("report-period");
    const generateReportBtn = document.getElementById("generate-report-btn");
    const generatePrintReportBtn = document.getElementById(
        "generate-print-report-btn",
    );
    const totalIncomeEl = document.getElementById("total-income");
    const totalExpensesEl = document.getElementById("total-expenses");
    const netBalanceEl = document.getElementById("net-balance");
    const expenseChartCanvas = document.getElementById("expense-chart");
    const noExpenseDataMessage = document.getElementById(
        "no-expense-data-message",
    );
    const customDateRangeDiv = document.getElementById("custom-date-range");
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    // Savings Summary Elements
    const totalSavingsDepositsEl = document.getElementById(
        "total-savings-deposits",
    );
    const totalSavingsWithdrawalsEl = document.getElementById(
        "total-savings-withdrawals",
    );
    const netSavingsEl = document.getElementById("net-savings");
    const savingsChartCanvas = document.getElementById("savings-chart");
    const noSavingsDataMessage = document.getElementById(
        "no-savings-data-message",
    );
    // Report Headers (for conditional display)
    const expenseBreakdownHeader = document.getElementById(
        "expense-breakdown-header",
    );
    const savingsTrendHeader = document.getElementById("savings-trend-header");

    // Monthly Statement Elements
    const statementMonthSelect = document.getElementById("statement-month");
    const statementYearInput = document.getElementById("statement-year");
    const generateStatementBtn = document.getElementById(
        "generate-statement-btn",
    );
    // Using original version - this will now target statement.html
    // const clearStatementBtn = document.getElementById('clear-statement-btn');
    // const statementOutputDiv = document.getElementById('monthly-statement-output');

    // Filtering Elements
    const searchInput = document.getElementById("search-input");
    const filterTypeSelect = document.getElementById("filter-type");
    const searchBar = document.querySelector(".filter-search-bar");

    // Theme Toggle Elements
    const themeToggle = document.getElementById("theme-toggle-checkbox");

    // Save/Load Elements
    const saveDataBtn = document.getElementById("save-data-btn");
    const loadDataBtn = document.getElementById("load-data-btn");
    const loadFileInput = document.getElementById("load-file-input");
    const smartCategorizeBtn = document.getElementById("smart-categorize-btn");

    // CSV Import Elements
    const importCsvBtn = document.getElementById("import-csv-btn");
    const csvFileInput = document.getElementById("csv-file-input");
    const csvMappingModal = document.getElementById("csv-mapping-modal");
    const columnMappingList = document.getElementById("column-mapping-list");
    const csvPreviewTable = document.getElementById("csv-preview-table");
    const csvPreviewHeader = document.getElementById("csv-preview-header");
    const csvPreviewBody = document.getElementById("csv-preview-body");
    const importTransactionsBtn = document.getElementById("import-transactions-btn");
    const cancelCsvImportBtn = document.getElementById("cancel-csv-import-btn");

    // Bottom Navigation Elements
    const bottomNav = document.getElementById("bottom-nav");
    const bottomNavBtns = bottomNav.querySelectorAll(".bottom-nav-btn");
    const bottomNavAddBtn = document.getElementById("bottom-nav-add-btn");
    const bottomNavCategoriesBtn = document.getElementById(
        "bottom-nav-categories-btn",
    );

    // --- Utility Functions ---
    const formatCurrency = (amount) => {
        // Ensure input is treated as a number before formatting
        const numAmount = Number(amount);
        return isNaN(numAmount) ? "0.00" : numAmount.toFixed(2);
    };
    const formatDate = (dateString, format = "YYYY-MM-DD") => {
        if (!dateString) return "";
        try {
            // Handle both 'YYYY-MM-DD' and dates possibly coming from Date object ISO string
            let date = new Date(
                dateString.includes("T") ? dateString : dateString + "T00:00:00",
            );
            // Check if the date is valid after parsing
            if (isNaN(date.getTime())) {
                console.error("Invalid date string for formatting:", dateString);
                // Return the original string or a default error indicator if invalid
                return dateString;
            }

            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const yearFull = date.getFullYear();
            const yearShort = String(yearFull).slice(-2);

            if (format === "MM/DD/YY") {
                return `${month}/${day}/${yearShort}`;
            }
            if (format === "MM/DD") {
                return `${month}/${day}`;
            }
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
        transactions = JSON.parse(localStorage.getItem("transactions_v2")) || [];
        // Ensure amounts are numbers
        transactions = transactions.map((t) => ({
            ...t,
            amount: Number(t.amount) || 0,
        }));
        const storedCategories = JSON.parse(localStorage.getItem("categories_v2"));
        if (storedCategories) {
            // Use Set to avoid duplicates if default categories were already present
            categories.income = [
                ...new Set([...categories.income, ...storedCategories.income]),
            ];
            categories.expense = [
                ...new Set([...categories.expense, ...storedCategories.expense]),
            ];
        }
        // Sort categories alphabetically
        categories.income.sort((a, b) => a.localeCompare(b));
        categories.expense.sort((a, b) => a.localeCompare(b));
    };
    const saveData = () => {
        localStorage.setItem("transactions_v2", JSON.stringify(transactions));
        localStorage.setItem("categories_v2", JSON.stringify(categories));
    };

    // --- View Management ---
    const showView = (viewId) => {
        currentView = viewId;
        views.forEach((view) => {
            view.classList.toggle("active", view.id === viewId);
        });
        navButtons.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.view === viewId);
        });
        bottomNavBtns.forEach((btn) => {
            if (btn.dataset.view)
                btn.classList.toggle("active", btn.dataset.view === viewId);
        });

        if (viewId === "view-report") {
            generateReport(); // Refresh report summary/charts when switching to report view
        }
        // No need to clear statement div as it's removed or handled by statement.html logic

        if (viewId === "view-transactions") renderTransactionList(); // Render list when switching to transactions view
    };

    // --- Modal Management ---
    const openModal = (modalElement) => {
        modalElement.classList.add("active");
        // Focus on the first input field when modal opens
        const firstInput = modalElement.querySelector(
            'input:not([type="hidden"]), select',
        );
        if (firstInput) setTimeout(() => firstInput.focus(), 50); // Delay focus slightly
    };
    const closeModal = (modalElement) => {
        modalElement.classList.remove("active");
    };
    const openTransactionModal = (mode = "add", transaction = null) => {
        transactionForm.reset(); // Clear form
        editingTransactionId = null; // Reset editing ID
        hiddenTransactionId.value = ""; // Clear hidden ID field

        if (mode === "add") {
            modalTitle.textContent = "Add Transaction";
            saveTransactionBtn.innerHTML =
                '<i class="fas fa-plus"></i> Add Transaction';
            // Set default date to today
            dateInput.value = formatDate(new Date().toISOString()); // Format as YYYY-MM-DD
            typeSelect.value = "expense"; // Default to expense
            populateCategoryOptions(); // Populate categories based on default type
        } else if (mode === "edit" && transaction) {
            modalTitle.textContent = "Edit Transaction";
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
        const id = hiddenTransactionId.value
            ? parseInt(hiddenTransactionId.value)
            : Date.now(); // Use existing ID or generate new one

        // Basic Validation
        if (!date || !description || isNaN(amount) || amount <= 0 || !category) {
            alert("Please fill in all fields with valid data.");
            return;
        }
        // Special category validation
        if (category === "Savings Deposit" && type !== "expense") {
            alert("Savings Deposit must be an Expense type.");
            return;
        }
        if (category === "Savings Withdrawal" && type !== "income") {
            alert("Savings Withdrawal must be an Income type.");
            return;
        }
        // Ensure category belongs to the selected type
        if (type === "income" && !categories.income.includes(category)) {
            alert(`Category "${category}" is not a valid Income category.`);
            return;
        }
        if (type === "expense" && !categories.expense.includes(category)) {
            alert(`Category "${category}" is not a valid Expense category.`);
            return;
        }

        const transactionData = { id, type, date, description, amount, category };

        // Add or Update transaction
        if (editingTransactionId) {
            // Update existing transaction
            transactions = transactions.map((t) =>
                t.id === editingTransactionId ? transactionData : t,
            );
        } else {
            // Add new transaction
            transactions.push(transactionData);
        }

        saveData(); // Save updated transactions to local storage
        renderTransactionList(); // Re-render the transaction list
        closeModal(transactionModal); // Close the modal
        if (currentView === "view-report") generateReport(); // Update report if currently viewing it
    };

    const deleteTransaction = (id) => {
        if (confirm("Are you sure you want to delete this transaction?")) {
            transactions = transactions.filter((t) => t.id !== id); // Remove transaction
            saveData(); // Save changes
            renderTransactionList(); // Re-render list
            if (currentView === "view-report") generateReport(); // Update report if viewing
        }
    };

    const clearAllTransactions = () => {
        if (transactions.length === 0) {
            alert("There are no transactions to clear.");
            return;
        }
        if (
            confirm(
                "Are you sure you want to delete ALL transactions? This action cannot be undone.",
            )
        ) {
            transactions = []; // Clear the array
            saveData(); // Save the empty array
            renderTransactionList(); // Re-render the empty list
            if (currentView === "view-report") {
                generateReport(); // Update the report view (will show empty state)
            }
            alert("All transactions have been cleared.");
        }
    };

    // --- Rendering Functions ---
    const renderTransactionList = () => {
        transactionList.innerHTML = ""; // Clear current list

        const searchTermRaw = currentFilter.text.trim(); // Trim whitespace from search term
        const filterType = currentFilter.type;

        // --- Updated Filtering Logic ---
        const filteredTransactions = transactions
            .filter((t) => {
                // 1. Check Type Filter first
                const typeMatch = filterType === "all" || t.type === filterType;
                if (!typeMatch) {
                    return false; // If type doesn't match, no need to check further
                }

                // 2. If search term is empty, show all transactions matching the type
                if (searchTermRaw === "") {
                    return true;
                }

                // 3. Perform checks if search term is not empty
                const searchTermLower = searchTermRaw.toLowerCase();

                // Check Description/Category (Case-insensitive)
                const textMatch =
                    t.description.toLowerCase().includes(searchTermLower) ||
                    t.category.toLowerCase().includes(searchTermLower);
                if (textMatch) return true;

                // Check Date (Accepts YYYY-MM-DD and MM/DD)
                let dateMatch = false;
                if (t.date) {
                    // Ensure transaction date exists
                    if (searchTermRaw.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        // YYYY-MM-DD format
                        dateMatch = t.date === searchTermRaw;
                    } else if (searchTermRaw.match(/^\d{2}\/\d{2}$/)) {
                        // MM/DD format
                        // Convert MM/DD search to required MM-DD ending format for comparison
                        const requiredEnding = "-" + searchTermRaw.replace("/", "-"); // turns "02/28" into "-02-28"
                        dateMatch = t.date.endsWith(requiredEnding);
                    }
                }
                if (dateMatch) return true;

                // Check Amount (Exact Match)
                const searchAmount = parseFloat(searchTermRaw);
                if (!isNaN(searchAmount)) {
                    // Check if searchTerm is a valid number
                    // Compare using toFixed(2) to handle potential floating point inaccuracies
                    const amountMatch = t.amount.toFixed(2) === searchAmount.toFixed(2);
                    if (amountMatch) return true;
                }

                // If none of the above matched, return false
                return false;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
        // --- End of Updated Filtering Logic ---

        // Display messages or transaction cards
        if (filteredTransactions.length === 0) {
            if (transactions.length === 0) {
                noTransactionsMessage.style.display = "block"; // Show "No transactions yet"
                transactionList.innerHTML = ""; // Ensure list is empty
            } else {
                noTransactionsMessage.style.display = "none"; // Hide default message
                transactionList.innerHTML =
                    '<li class="info-message">No transactions match your search criteria.</li>'; // Show filter message
            }
        } else {
            noTransactionsMessage.style.display = "none"; // Hide message
            // Populate list with filtered transactions
            filteredTransactions.forEach((t) => {
                const li = document.createElement("li");
                li.classList.add("transaction-card");
                li.dataset.id = t.id;
                const amountClass =
                    t.type === "income" ? "text-income" : "text-expense";
                const amountPrefix = t.type === "income" ? "+" : "-";

                li.innerHTML = `
                     <div class="transaction-details">
                         <span class="transaction-description">${t.description}</span>
                         <span class="transaction-category" data-transaction-id="${t.id}" data-current-category="${t.category}"><i class="fas fa-tag"></i> ${t.category}</span>
                         <span class="transaction-date"><i class="fas fa-calendar-alt"></i> ${formatDate(t.date, "MM/DD/YY")}</span>
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

    // --- Inline Category Editing ---
    const handleCategoryTagClick = (categoryTag) => {
        // Check if there's already a dropdown being edited
        const existingDropdown = document.querySelector('.category-edit-dropdown');
        if (existingDropdown) {
            // Close existing dropdown first
            existingDropdown.blur();
            return;
        }
        
        const transactionId = parseInt(categoryTag.dataset.transactionId);
        const currentCategory = categoryTag.dataset.currentCategory;
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) return;
        
        // Get available categories for this transaction type
        const availableCategories = categories[transaction.type] || [];
        
        // Create dropdown
        const dropdown = document.createElement('select');
        dropdown.className = 'category-edit-dropdown';
        
        // Populate dropdown
        availableCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            option.selected = cat === currentCategory;
            dropdown.appendChild(option);
        });
        
        // Replace category tag with dropdown
        const originalContent = categoryTag.innerHTML;
        categoryTag.innerHTML = '';
        categoryTag.appendChild(dropdown);
        categoryTag.style.padding = '2px';
        
        let isCompleted = false;
        
        // Handle dropdown change and completion
        const completeEdit = (save = true) => {
            if (isCompleted) return;
            isCompleted = true;
            
            if (save) {
                const newCategory = dropdown.value;
                if (newCategory !== currentCategory) {
                    // Update transaction
                    transaction.category = newCategory;
                    saveData();
                    renderTransactions();
                    return; // renderTransactions will recreate the element
                }
            }
            
            // Restore original content
            categoryTag.innerHTML = originalContent;
            categoryTag.style.padding = '';
            categoryTag.dataset.currentCategory = transaction.category;
        };
        
        // Event listeners
        dropdown.addEventListener('change', () => {
            completeEdit(true);
        });
        
        dropdown.addEventListener('blur', (e) => {
            // Use setTimeout to allow click events to process first
            setTimeout(() => {
                if (!isCompleted) {
                    completeEdit(true);
                }
            }, 100);
        });
        
        dropdown.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                completeEdit(false);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                completeEdit(true);
            }
        });
        
        // Prevent events from bubbling up 
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        dropdown.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        
        // Set the dropdown to show all options immediately
        dropdown.size = Math.min(availableCategories.length, 6); // Show up to 6 options
        
        // Focus the dropdown
        setTimeout(() => {
            dropdown.focus();
        }, 0);
    };

    // --- Editing Logic ---
    // Handles clicks within the transaction list for edit/delete buttons
    const handleTransactionListClick = (e) => {
        // Don't handle if clicking on an active dropdown
        if (e.target.closest('.category-edit-dropdown')) {
            return;
        }
        
        const editButton = e.target.closest(".edit-btn");
        const deleteButton = e.target.closest(".delete-btn");
        const categoryTag = e.target.closest(".transaction-category");

        if (categoryTag) {
            e.preventDefault();
            e.stopPropagation();
            handleCategoryTagClick(categoryTag);
        } else if (editButton) {
            const card = editButton.closest(".transaction-card");
            const id = parseInt(card.dataset.id);
            const transactionToEdit = transactions.find((t) => t.id === id);
            if (transactionToEdit) openTransactionModal("edit", transactionToEdit);
        } else if (deleteButton) {
            const card = deleteButton.closest(".transaction-card");
            const id = parseInt(card.dataset.id);
            deleteTransaction(id);
        }
    };

    // --- Category Management ---
    // Populates the category dropdown in the transaction modal based on selected type
    const populateCategoryOptions = () => {
        const currentType = typeSelect.value;
        categorySelect.innerHTML = ""; // Clear existing options
        let selectedCategoryFound = false;
        const currentCategoryValue = categorySelect.value; // Store current value if editing

        if (categories[currentType]) {
            categories[currentType].forEach((cat) => {
                const option = document.createElement("option");
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
        const listElement =
            type === "income" ? incomeCategoryList : expenseCategoryList;
        listElement.innerHTML = ""; // Clear current list
        categories[type].forEach((cat) => {
            const li = document.createElement("li");
            li.textContent = cat;
            // Add delete button only for non-core categories
            if (cat !== "Savings Deposit" && cat !== "Savings Withdrawal") {
                const deleteBtn = document.createElement("button");
                deleteBtn.classList.add(
                    "btn-icon",
                    "btn-danger",
                    "delete-category-btn",
                );
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
        const inputElement =
            type === "income" ? newIncomeCategoryInput : newExpenseCategoryInput;
        const categoryName = inputElement.value.trim();
        if (categoryName && !categories[type].includes(categoryName)) {
            categories[type].push(categoryName);
            categories[type].sort((a, b) => a.localeCompare(b)); // Keep sorted
            saveData(); // Save updated categories
            renderCategoryList(type); // Re-render list in modal
            populateCategoryOptions(); // Update dropdown in transaction modal
            inputElement.value = ""; // Clear input field
        } else if (!categoryName) {
            alert("Category name cannot be empty.");
        } else {
            alert(`Category "${categoryName}" already exists.`);
        }
    };
    // Deletes a category (if not core and not in use)
    const deleteCategory = (type, categoryName) => {
        // Prevent deletion of core categories (already checked in renderCategoryList)
        // Double-check here just in case
        if (
            categoryName === "Savings Deposit" ||
            categoryName === "Savings Withdrawal"
        ) {
            alert(`Cannot delete the core "${categoryName}" category.`);
            return;
        }
        // Check if the category is used in any transactions
        const isUsed = transactions.some(
            (t) => t.type === type && t.category === categoryName,
        );
        if (isUsed) {
            alert(
                `Cannot delete category "${categoryName}" as it is used by existing transactions.`,
            );
            return;
        }
        // Prevent deleting the last category
        if (categories[type].length <= 1) {
            alert(`Cannot delete the last category for ${type}.`);
            return;
        }
        // Filter out the category to delete
        categories[type] = categories[type].filter((cat) => cat !== categoryName);
        saveData(); // Save changes
        renderCategoryList(type); // Re-render modal list
        populateCategoryOptions(); // Update transaction form dropdown
    };
    // Shows the category management modal
    const showCategoryModal = () => {
        renderCategoryList("income");
        renderCategoryList("expense");
        openModal(categoryModal);
    };

    // --- Reporting Logic ---
    const generateReport = () => {
        const period = reportPeriodSelect.value;
        const today = new Date();
        let startDate, endDate;

        if (period === "custom") {
            startDate = startDateInput.value
                ? new Date(startDateInput.value + "T00:00:00")
                : null;
            endDate = endDateInput.value
                ? new Date(endDateInput.value + "T23:59:59")
                : null;
            // Validate custom date range
            if (
                !startDate ||
                !endDate ||
                isNaN(startDate.getTime()) ||
                isNaN(endDate.getTime()) ||
                startDate > endDate
            ) {
                alert("Please select a valid start and end date for the custom range.");
                // Reset report display on error
                totalIncomeEl.textContent = "0.00";
                totalExpensesEl.textContent = "0.00";
                netBalanceEl.textContent = "0.00";
                totalSavingsDepositsEl.textContent = "0.00";
                totalSavingsWithdrawalsEl.textContent = "0.00";
                netSavingsEl.textContent = "0.00";
                updateExpenseChart({});
                updateSavingsChart([]); // Clear charts
                customDateRangeDiv.style.display = "flex"; // Ensure range inputs are visible
                return;
            }
        } else {
            endDate = new Date(); // Today
            endDate.setHours(23, 59, 59, 999); // End of today
            switch (period) {
                case "weekly":
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of current week (Sunday)
                    break;
                case "biweekly":
                    startDate = new Date(new Date().getTime() - 13 * 24 * 60 * 60 * 1000); // 14 days ago (including today)
                    break;
                case "monthly":
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1); // First day of current month
                    break;
                case "all":
                default:
                    startDate = new Date(0); // Beginning of time (for all transactions)
                    break;
            }
            startDate.setHours(0, 0, 0, 0); // Start of the day
        }
        // Show/hide custom date range inputs based on selection
        customDateRangeDiv.style.display = period === "custom" ? "flex" : "none";

        // Filter transactions based on the calculated date range
        const periodTransactions = transactions
            .filter((t) => {
                try {
                    const transactionDate = new Date(
                        t.date.includes("T") ? t.date : t.date + "T00:00:00",
                    );
                    return (
                        !isNaN(transactionDate.getTime()) &&
                        transactionDate >= startDate &&
                        transactionDate <= endDate
                    );
                } catch (e) {
                    return false;
                } // Ignore invalid transaction dates
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date for savings chart consistency

        // Calculate summaries
        let totalIncome = 0;
        let totalExpenses = 0;
        let totalSavingsDeposits = 0;
        let totalSavingsWithdrawals = 0;
        const expenseByCategory = {}; // For expense chart (excluding savings deposit)
        const savingsDataForChart = []; // For savings trend chart

        let currentNetSavings = 0; // Track running balance for savings chart

        periodTransactions.forEach((t) => {
            let isSavingsTransaction = false;
            if (t.category === "Savings Deposit") {
                totalSavingsDeposits += t.amount;
                currentNetSavings += t.amount; // Increase net savings
                isSavingsTransaction = true;
                // NOTE: Savings Deposit is treated as an EXPENSE in the operating budget calculation below
                totalExpenses += t.amount; // Add to operating expenses
                // Don't add to expenseByCategory chart data
            } else if (t.category === "Savings Withdrawal") {
                totalSavingsWithdrawals += t.amount;
                currentNetSavings -= t.amount; // Decrease net savings
                isSavingsTransaction = true;
                // NOTE: Savings Withdrawal is treated as INCOME in the operating budget
                totalIncome += t.amount; // Add to operating income
            } else if (t.type === "income") {
                totalIncome += t.amount;
            } else if (t.type === "expense") {
                totalExpenses += t.amount;
                // Aggregate expenses by category for the chart
                expenseByCategory[t.category] =
                    (expenseByCategory[t.category] || 0) + t.amount;
            }

            // Track daily savings balance change for the line chart
            if (isSavingsTransaction) {
                savingsDataForChart.push({
                    date: t.date,
                    netSavingsBalance: currentNetSavings,
                });
            }
        });

        const netBalance = totalIncome - totalExpenses; // Operating net balance
        const netSavingsChange = totalSavingsDeposits - totalSavingsWithdrawals; // Net flow into/out of savings

        // Update Summary Display in the UI
        totalIncomeEl.textContent = formatCurrency(totalIncome);
        totalExpensesEl.textContent = formatCurrency(totalExpenses);
        netBalanceEl.textContent = formatCurrency(netBalance);
        netBalanceEl.className = netBalance >= 0 ? "text-income" : "text-expense"; // Style based on positive/negative

        totalSavingsDepositsEl.textContent = formatCurrency(totalSavingsDeposits);
        totalSavingsWithdrawalsEl.textContent = formatCurrency(
            totalSavingsWithdrawals,
        );
        netSavingsEl.textContent = formatCurrency(netSavingsChange);
        netSavingsEl.className = "text-savings"; // Always use savings class for savings figures

        // Update the charts
        updateExpenseChart(expenseByCategory);
        updateSavingsChart(savingsDataForChart);
    };

    // Updates the expense breakdown doughnut chart
    const updateExpenseChart = (expenseData) => {
        const labels = Object.keys(expenseData).sort(
            (a, b) => expenseData[b] - expenseData[a],
        ); // Sort labels by amount desc
        const data = labels.map((label) => expenseData[label]);
        const hasData = labels.length > 0;

        // Show/Hide Header based on data presence
        expenseBreakdownHeader.style.display = hasData ? "block" : "none";

        // Function to generate chart colors
        const generateColors = (count) => {
            const baseColors = [
                "#dc3545",
                "#6c757d",
                "#ffc107",
                "#fd7e14",
                "#6f42c1",
                "#20c997",
                "#e83e8c",
                "#0d6efd",
            ];
            const alpha = "aa"; // Add some transparency
            return Array.from(
                { length: count },
                (_, i) => baseColors[i % baseColors.length] + alpha,
            );
        };
        const chartColors = generateColors(labels.length);

        // Get theme-dependent colors for chart styling
        const bodyStyle = getComputedStyle(document.body);
        const borderColor =
            bodyStyle.getPropertyValue("--card-bg-color").trim() || "#ffffff"; // Border color matches card background
        const textColor =
            bodyStyle.getPropertyValue("--text-color").trim() || "#000000"; // Legend text color matches theme

        // Destroy existing chart instance if it exists
        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }

        // Create new chart if there is data
        if (hasData) {
            noExpenseDataMessage.style.display = "none"; // Hide no data message
            expenseChartCanvas.style.display = "block"; // Show canvas
            expenseChart = new Chart(expenseChartCanvas, {
                type: "doughnut",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Expenses by Category",
                            data: data,
                            backgroundColor: chartColors,
                            borderColor: borderColor, // Use theme background for border
                            borderWidth: 2,
                            hoverOffset: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allow chart to fill container height
                    layout: { padding: { bottom: 25 } }, // Add padding for legend
                    animation: { animateScale: true, animateRotate: true },
                    plugins: {
                        legend: {
                            // Configure legend
                            position: "bottom",
                            labels: {
                                color: textColor, // Use theme text color
                                padding: 10,
                                usePointStyle: true,
                                font: { size: 13 },
                            },
                        },
                        tooltip: {
                            // Configure tooltips
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || "";
                                    if (label) label += ": ";
                                    if (context.parsed !== null) {
                                        label += "$" + formatCurrency(context.parsed); // Format amount
                                        // Calculate and add percentage
                                        const total = context.dataset.data.reduce(
                                            (acc, value) => acc + value,
                                            0,
                                        );
                                        if (total > 0) {
                                            const percentage = (
                                                (context.parsed / total) *
                                                100
                                            ).toFixed(1);
                                            label += ` (${percentage}%)`;
                                        }
                                    }
                                    return label;
                                },
                            },
                        },
                    },
                },
            });
        } else {
            // Show no data message if no expense data
            noExpenseDataMessage.style.display = "block";
            expenseChartCanvas.style.display = "none"; // Hide canvas
        }
    };

    // Updates the savings trend line chart
    const updateSavingsChart = (savingsData) => {
        // Get theme-dependent colors
        const bodyStyle = getComputedStyle(document.body);
        const savingsColor =
            bodyStyle.getPropertyValue("--info-color").trim() || "#17a2b8"; // Use info color for savings
        const textColor =
            bodyStyle.getPropertyValue("--text-color").trim() || "#000000";
        const gridColor =
            bodyStyle.getPropertyValue("--border-color").trim() || "#dee2e6";

        // Aggregate data: Use the last entry for each date if multiple savings transactions occur on the same day
        const aggregatedData = savingsData.reduce((acc, entry) => {
            acc[entry.date] = entry.netSavingsBalance; // Overwrite with the latest balance for the date
            return acc;
        }, {});

        // Sort dates chronologically
        const labels = Object.keys(aggregatedData).sort(
            (a, b) => new Date(a) - new Date(b),
        );
        const dataPoints = labels.map((date) => aggregatedData[date]); // Get corresponding balances
        const hasData = labels.length > 0;

        // Show/Hide Header based on data
        savingsTrendHeader.style.display = hasData ? "block" : "none";

        // Destroy existing chart instance
        if (savingsChart) {
            savingsChart.destroy();
            savingsChart = null;
        }

        // Create new chart if there is data
        if (hasData) {
            noSavingsDataMessage.style.display = "none"; // Hide message
            savingsChartCanvas.style.display = "block"; // Show canvas
            savingsChart = new Chart(savingsChartCanvas, {
                type: "line",
                data: {
                    labels: labels.map((date) => formatDate(date, "MM/DD")), // Format dates for x-axis
                    datasets: [
                        {
                            label: "Net Savings Balance", // Tooltip label
                            data: dataPoints,
                            borderColor: savingsColor, // Line color
                            backgroundColor: savingsColor + "33", // Fill color with transparency
                            tension: 0.1, // Slight curve to the line
                            fill: true, // Fill area below the line
                            pointRadius: 3, // Size of points on the line
                            pointHoverRadius: 5, // Size on hover
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        // Configure axes
                        y: {
                            beginAtZero: false, // Allow y-axis to start below zero if needed
                            ticks: {
                                color: textColor, // Use theme text color
                                callback: function(value) {
                                    return "$" + formatCurrency(value);
                                }, // Format ticks as currency
                            },
                            grid: { color: gridColor + "80" }, // Grid line color with transparency
                        },
                        x: {
                            ticks: {
                                color: textColor,
                                maxRotation: 45, // Rotate labels if they overlap
                                minRotation: 45,
                            },
                            grid: { display: false }, // Hide vertical grid lines
                        },
                    },
                    plugins: {
                        legend: { display: false }, // Hide legend for line chart
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    // Format tooltip content
                                    let label = context.dataset.label || "";
                                    if (label) label += ": ";
                                    if (context.parsed.y !== null) {
                                        label += "$" + formatCurrency(context.parsed.y);
                                    }
                                    return label;
                                },
                            },
                        },
                    },
                },
            });
        } else {
            // Show message if no savings data
            noSavingsDataMessage.style.display = "block";
            savingsChartCanvas.style.display = "none"; // Hide canvas
        }
    };

    // Opens the printable report in a new tab
    const generatePrintableReport = () => {
        const period = reportPeriodSelect.value;
        let startDateValue = "";
        let endDateValue = "";

        if (period === "custom") {
            startDateValue = startDateInput.value;
            endDateValue = endDateInput.value;
            // Basic validation for custom dates
            if (!startDateValue || !endDateValue) {
                alert("Please select both start and end dates for the custom range.");
                return;
            }
            // More robust validation (check if dates are valid and range is correct)
            const startD = new Date(startDateValue + "T00:00:00");
            const endD = new Date(endDateValue + "T23:59:59");
            if (isNaN(startD.getTime()) || isNaN(endD.getTime()) || startD > endD) {
                alert("Invalid custom date range selected.");
                return;
            }
        }

        // Pass the full transactions data and theme to the new tab via sessionStorage
        sessionStorage.setItem("allTransactionsData", JSON.stringify(transactions));
        sessionStorage.setItem(
            "appTheme",
            localStorage.getItem("theme") || "light",
        );

        // Construct URL with parameters
        let url = `report.html?period=${encodeURIComponent(period)}`;
        if (startDateValue)
            url += `&startDate=${encodeURIComponent(startDateValue)}`;
        if (endDateValue) url += `&endDate=${encodeURIComponent(endDateValue)}`;

        window.open(url, "_blank"); // Open in new tab
    };

    // Opens the printable monthly statement in a new tab
    const generateMonthlyStatement = () => {
        const selectedMonth = statementMonthSelect.value; // Keep as string '0'-'11'
        const selectedYear = statementYearInput.value;

        // Validate year input
        if (
            !selectedYear ||
            isNaN(parseInt(selectedYear)) ||
            selectedYear < 2000 ||
            selectedYear > 2100
        ) {
            alert("Please enter a valid year (e.g., 2024).");
            return;
        }

        // Pass the full transactions data and theme to the new tab via sessionStorage
        sessionStorage.setItem("allTransactionsData", JSON.stringify(transactions));
        sessionStorage.setItem(
            "appTheme",
            localStorage.getItem("theme") || "light",
        );

        // Construct URL for the statement page
        const url = `statement.html?month=${encodeURIComponent(selectedMonth)}&year=${encodeURIComponent(selectedYear)}`;

        // Open the statement page in a new tab/window
        window.open(url, "_blank");
    };

    // --- Dark Mode ---
    const applyTheme = () => {
        const savedTheme = localStorage.getItem("theme") || "light";
        document.body.dataset.theme = savedTheme;
        themeToggle.checked = savedTheme === "dark";

        // Update chart colors if charts exist and view is report
        if (currentView === "view-report") {
            const bodyStyle = getComputedStyle(document.body);
            const textColor =
                bodyStyle.getPropertyValue("--text-color").trim() || "#000000";
            const gridColor =
                bodyStyle.getPropertyValue("--border-color").trim() || "#dee2e6";
            const borderColor =
                bodyStyle.getPropertyValue("--card-bg-color").trim() || "#ffffff";

            // Update Expense Chart
            if (
                expenseChart &&
                expenseChart.options &&
                expenseChart.options.plugins &&
                expenseChart.options.plugins.legend
            ) {
                expenseChart.options.plugins.legend.labels.color = textColor;
                if (expenseChart.data.datasets[0]) {
                    // Check dataset exists
                    expenseChart.data.datasets[0].borderColor = borderColor;
                }
                expenseChart.update("none"); // Update without animation
            }
            // Update Savings Chart
            if (savingsChart && savingsChart.options && savingsChart.options.scales) {
                if (savingsChart.options.plugins.legend) {
                    // Check legend exists
                    savingsChart.options.plugins.legend.labels.color = textColor;
                }
                savingsChart.options.scales.y.ticks.color = textColor;
                savingsChart.options.scales.y.grid.color = gridColor + "80";
                savingsChart.options.scales.x.ticks.color = textColor;
                savingsChart.update("none"); // Update without animation
            }
        }
    };

    const setDarkMode = (isDark) => {
        localStorage.setItem("theme", isDark ? "dark" : "light");
        applyTheme(); // Apply the theme and update charts if necessary
    };

    const toggleDarkMode = () => {
        setDarkMode(themeToggle.checked);
    };

    // --- JSON Save/Load Functions ---
    const saveDataToJSONFile = () => {
        try {
            // Prepare data object
            const dataToSave = {
                transactions: transactions,
                categories: categories,
                savedAt: new Date().toISOString(), // Add timestamp
            };
            const jsonString = JSON.stringify(dataToSave, null, 2); // Pretty print JSON
            const blob = new Blob([jsonString], {
                type: "application/json;charset=utf-8;",
            }); // Create blob
            const link = document.createElement("a"); // Create download link
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            link.setAttribute(
                "download",
                `income_expense_tracker_data_${timestamp}.json`,
            ); // Set filename
            link.style.visibility = "hidden"; // Hide link
            document.body.appendChild(link);
            link.click(); // Trigger download
            document.body.removeChild(link); // Clean up link
            URL.revokeObjectURL(url); // Release object URL
        } catch (error) {
            console.error("Error saving data to JSON:", error);
            alert("Error saving data.");
        }
    };
    const handleLoadDataFromFile = (event) => {
        const file = event.target.files[0];
        if (!file) return; // No file selected

        // Validate file type
        if (!file.name.endsWith(".json")) {
            alert("Invalid file type. Please select a .json file.");
            loadFileInput.value = ""; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                // Validate JSON structure
                if (
                    typeof loadedData !== "object" ||
                    loadedData === null ||
                    !Array.isArray(loadedData.transactions) ||
                    typeof loadedData.categories !== "object" ||
                    loadedData.categories === null ||
                    !Array.isArray(loadedData.categories.income) ||
                    !Array.isArray(loadedData.categories.expense)
                ) {
                    throw new Error("Invalid JSON structure.");
                }

                // Confirmation before overwriting
                if (
                    !confirm(
                        "Load data? This will REPLACE all current transactions and categories.",
                    )
                ) {
                    loadFileInput.value = ""; // Reset file input if cancelled
                    return;
                }

                // Update state with loaded data
                transactions = loadedData.transactions.map((t) => ({
                    ...t,
                    amount: Number(t.amount) || 0,
                })); // Ensure amounts are numbers

                // Merge categories, ensuring defaults are kept and no duplicates
                const defaultIncome = [
                    "Salary",
                    "Freelance",
                    "Gift",
                    "Savings Withdrawal",
                    "Other Income",
                ];
                const defaultExpense = [
                    "Groceries",
                    "Rent/Mortgage",
                    "Utilities",
                    "Transport",
                    "Entertainment",
                    "Dining Out",
                    "Savings Deposit",
                    "Other Expense",
                ];

                categories = {
                    income: [
                        ...new Set([
                            ...defaultIncome,
                            ...(Array.isArray(loadedData.categories.income)
                                ? loadedData.categories.income
                                : []),
                        ]),
                    ].sort((a, b) => a.localeCompare(b)),
                    expense: [
                        ...new Set([
                            ...defaultExpense,
                            ...(Array.isArray(loadedData.categories.expense)
                                ? loadedData.categories.expense
                                : []),
                        ]),
                    ].sort((a, b) => a.localeCompare(b)),
                };

                saveData(); // Save the newly loaded data to localStorage
                renderTransactionList(); // Update transaction list view
                if (currentView === "view-report") generateReport(); // Update report view if active
                populateCategoryOptions(); // Update category dropdowns
                alert("Data loaded successfully!");
            } catch (error) {
                console.error("Error loading data from JSON:", error);
                alert(`Error loading file: ${error.message}`);
            } finally {
                loadFileInput.value = ""; // Reset file input regardless of success/error
            }
        };
        reader.onerror = (e) => {
            console.error("FileReader error:", e);
            alert("Error reading file.");
            loadFileInput.value = ""; // Reset file input on error
        };
        reader.readAsText(file); // Read the file content
    };

    // --- CSV Import Functions ---
    const parseCSV = (csvText) => {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return { headers: [], data: [] };
        
        const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];
                
                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            
            result.push(current.trim());
            return result;
        };
        
        const headers = parseCSVLine(lines[0]);
        const data = lines.slice(1).map(line => parseCSVLine(line));
        
        return { headers, data };
    };

    const handleCsvFileSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        // Validate all files are CSV files (case-insensitive)
        const invalidFiles = files.filter(file => {
            const fileName = file.name.toLowerCase();
            return !fileName.endsWith('.csv');
        });

        if (invalidFiles.length > 0) {
            alert(`Invalid file type(s). Please select only .csv files.\nInvalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
            csvFileInput.value = '';
            return;
        }

        csvFiles = files;
        currentFileIndex = 0;
        
        const fileCountText = files.length > 1 ? ` (${files.length} files selected)` : '';
        
        if (files.length > 1) {
            const confirmMessage = `You've selected ${files.length} CSV files. They will be processed sequentially. Continue?`;
            if (!confirm(confirmMessage)) {
                csvFileInput.value = '';
                return;
            }
        }

        processCurrentFile();
    };

    const processCurrentFile = () => {
        if (currentFileIndex >= csvFiles.length) {
            // All files processed
            csvFiles = [];
            currentFileIndex = 0;
            csvFileInput.value = '';
            return;
        }

        const file = csvFiles[currentFileIndex];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                const parsed = parseCSV(csvText);
                
                if (parsed.headers.length === 0) {
                    alert(`The CSV file "${file.name}" appears to be empty or invalid. Skipping this file.`);
                    currentFileIndex++;
                    processCurrentFile();
                    return;
                }
                
                csvHeaders = parsed.headers;
                csvData = parsed.data;
                
                initializeColumnMappings();
                renderColumnMappings();
                renderDataPreview();
                updateModalTitle();
                openModal(csvMappingModal);
                
            } catch (error) {
                console.error('Error parsing CSV:', error);
                alert(`Error reading CSV file "${file.name}". Please ensure it's a valid CSV format. Skipping this file.`);
                currentFileIndex++;
                processCurrentFile();
            }
        };
        
        reader.onerror = () => {
            alert(`Error reading file "${file.name}". Skipping this file.`);
            currentFileIndex++;
            processCurrentFile();
        };
        
        reader.readAsText(file);
    };

    const updateModalTitle = () => {
        const modalTitle = csvMappingModal.querySelector('h2');
        if (csvFiles.length > 1) {
            const fileName = csvFiles[currentFileIndex].name;
            modalTitle.innerHTML = `<i class="fas fa-file-csv"></i> Map CSV Columns - ${fileName} (${currentFileIndex + 1} of ${csvFiles.length})`;
        } else {
            modalTitle.innerHTML = `<i class="fas fa-file-csv"></i> Map CSV Columns`;
        }
    };

    // Auto-categorization system
    const categoryKeywords = {
        income: {
            'Salary': [
                'salary', 'payroll', 'wages', 'pay', 'income', 'employment',
                'employer', 'work', 'job', 'paycheck', 'biweekly', 'monthly pay',
                'fedwire', 'wire transfer', 'direct deposit', 'deposit', 'ach',
                'automatic deposit', 'electronic deposit', 'bank transfer'
            ],
            'Freelance': [
                'freelance', 'consulting', 'contract', 'gig', 'project',
                'client', 'invoice', 'hourly', 'commission', 'self employed'
            ],
            'Gift': [
                'gift', 'present', 'birthday', 'holiday', 'christmas',
                'wedding', 'bonus', 'tip', 'gratuity', 'cash gift'
            ],
            'Savings Withdrawal': [
                'savings withdrawal', 'withdrawal', 'atm withdrawal',
                'cash withdrawal', 'bank withdrawal', 'transfer from savings'
            ],
            'Other Income': [
                'interest', 'dividend', 'refund', 'rebate', 'cashback',
                'return', 'reimbursement', 'tax refund', 'insurance claim',
                'rental income', 'investment', 'profit', 'earnings'
            ]
        },
        expense: {
            'Groceries': [
                'grocery', 'groceries', 'supermarket', 'food', 'walmart', 'target',
                'kroger', 'safeway', 'publix', 'whole foods', 'costco', 'sams club',
                'market', 'produce', 'meat', 'dairy', 'bakery', 'deli', 'heb', 'h-e-b',
                'aldi', 'food lion', 'giant', 'meijer', 'wegmans', 'fresh market'
            ],
            'Rent/Mortgage': [
                'rent', 'mortgage', 'housing', 'apartment', 'landlord',
                'property management', 'housing payment', 'monthly rent'
            ],
            'Utilities': [
                'electric', 'electricity', 'gas', 'water', 'sewer', 'trash',
                'internet', 'cable', 'phone', 'cell phone', 'mobile',
                'utility', 'utilities', 'power', 'energy', 'heating',
                'cooling', 'wifi', 'broadband', 'telecom'
            ],
            'Transport': [
                'gas', 'gasoline', 'fuel', 'car', 'auto', 'vehicle',
                'uber', 'lyft', 'taxi', 'bus', 'train', 'subway',
                'parking', 'toll', 'car payment', 'insurance',
                'maintenance', 'repair', 'oil change', 'tire',
                'shell', 'exxon', 'mobil', 'chevron', 'bp', 'valero',
                'citgo', 'sunoco', 'marathon', 'phillips 66',
                'conoco', 'speedway', 'wawa', '7-eleven', 'circle k',
                'gas station', 'fuel stop', 'truck stop'
            ],
            'Entertainment': [
                'movie', 'cinema', 'theater', 'concert', 'music',
                'game', 'gaming', 'netflix', 'spotify', 'streaming',
                'entertainment', 'fun', 'hobby', 'sports', 'tickets',
                'amusement', 'recreation', 'subscription', 'steam',
                'steamgames', 'xbox', 'playstation', 'nintendo', 'twitch',
                'youtube premium', 'disney plus', 'hulu', 'paramount'
            ],
            'Dining Out': [
                'restaurant', 'dining', 'food', 'lunch', 'dinner',
                'breakfast', 'cafe', 'coffee', 'starbucks', 'mcdonald',
                'pizza', 'takeout', 'delivery', 'fast food', 'bar',
                'pub', 'bistro', 'diner', 'eatery', 'burger', 'chicken',
                'whataburger', 'subway', 'taco', 'kfc', 'wendys', 'arbys',
                'chipotle', 'panda express', 'five guys', 'in-n-out',
                'sonic', 'dairy queen', 'jack in the box', 'chick-fil-a',
                'popeyes', 'papa johns', 'dominos', 'pizza hut',
                'applebees', 'chilis', 'olive garden', 'outback',
                'red lobster', 'texas roadhouse', 'cracker barrel',
                'ihop', 'dennys', 'waffle house', 'panera', 'qdoba',
                'buffalo wild wings', 'jimmy johns', 'raising canes',
                'bill miller', 'wings', 'bbq', 'grill', 'wings'
            ],
            'Savings Deposit': [
                'savings deposit', 'deposit', 'transfer to savings',
                'save', 'saving', 'emergency fund'
            ],
            'Other Expense': [
                'shopping', 'purchase', 'buy', 'store', 'retail',
                'online', 'clothes', 'clothing', 'shoes',
                'insurance', 'fee', 'charge', 'service', 'subscription',
                'openai', 'chatgpt', 'microsoft', 'adobe', 'google',
                'apple', 'dropbox', 'zoom', 'slack', 'github',
                'paypal', 'square', 'stripe', 'quickbooks',
                'overdraft', 'overdraft fee', 'nsf', 'insufficient funds',
                'bank fee', 'maintenance fee', 'monthly fee', 'annual fee',
                'late fee', 'penalty', 'interest charge', 'finance charge',
                'hotel', 'motel', 'inn', 'lodge', 'resort', 'travel',
                'booking', 'reservation', 'expedia', 'hotels.com',
                'hampton', 'hilton', 'marriott', 'hyatt', 'holiday inn',
                'fairfield', 'license', 'registration', 'government',
                'wire fee', 'domestic', 'international', 'transfer fee'
            ]
        }
    };

    const autoCategorizeTransaction = (description, type) => {
        if (!description || !type) return null;
        
        const descLower = description.toLowerCase().trim();
        const availableCategories = categories[type] || [];
        
        // Check each category's keywords
        for (const category of availableCategories) {
            const keywords = categoryKeywords[type]?.[category] || [];
            
            // Check if any keyword matches the description
            for (const keyword of keywords) {
                if (descLower.includes(keyword.toLowerCase())) {
                    return category;
                }
            }
        }
        
        // SUPER AGGRESSIVE pattern-based categorization 
        if (type === 'expense') {
            // DINING OUT - Be extremely aggressive with food detection
            if (descLower.match(/(\bwhataburger\b|\bmcdonald|\bburger\b|\bwendys\b|\bsubway\b|\btaco\b|\bkfc\b|\bpopeyes\b|\bchick\b|\bchicken\b)/)) return 'Dining Out';
            if (descLower.match(/(\bpizza\b|\bdomino|\bpapa\b|\bjimmy\b|\braising\b|\bcanes\b|\bwings\b|\bbuffalo\b|\bsonic\b|\bdairy queen\b)/)) return 'Dining Out';
            if (descLower.match(/(\bstarbucks\b|\bdunkin\b|\bcoffee\b|\bcafe\b|\bpanera\b|\bchipotle\b|\brestaurant\b|\bdining\b)/)) return 'Dining Out';
            if (descLower.match(/(\bapplebees\b|\bchilis\b|\bolive garden\b|\bred lobster\b|\btexas roadhouse\b|\boutback\b|\bihop\b|\bdennys\b)/)) return 'Dining Out';
            if (descLower.match(/(\bbill miller\b|\bbigs\b|\bfood\b|\bbbq\b|\bgrill\b|\bbar\b|\bdiner\b|\beatery\b)/)) return 'Dining Out';
            
            // GROCERIES - Be aggressive with grocery detection  
            if (descLower.match(/(\bheb\b|\bh-e-b\b|\bwalmart\b|\btarget\b|\bkroger\b|\bcostco\b|\bsams club\b|\baldi\b)/)) return 'Groceries';
            if (descLower.match(/(\bgrocery\b|\bsupermarket\b|\bmarket\b|\bfood\b.*\bstore\b|\bproduce\b)/)) return 'Groceries';
            
            // TRANSPORT - Aggressive gas/auto detection
            if (descLower.match(/(\bshell\b|\bexxon\b|\bmobil\b|\bchevron\b|\bbp\b|\bvalero\b|\bcitgo\b|\bmarathon\b|\bgas\b|\bfuel\b)/)) return 'Transport';
            if (descLower.match(/(\bspeedway\b|\bquiktrip\b|\bphillips 66\b|\bconoco\b|\bsunoco\b|\b7.eleven\b|\bcircle k\b|\bwawa\b)/)) return 'Transport';
            if (descLower.match(/(\bzapco\b|\bautomotive\b|\bcar\b.*\bservice\b|\bauto\b|\bmechanic\b|\brepair\b)/)) return 'Transport';
            
            // ENTERTAINMENT - Gaming and streaming
            if (descLower.match(/(\bsteam\b|\bsteamgames\b|\bgaming\b|\bxbox\b|\bplaystation\b|\bnintendo\b)/)) return 'Entertainment';
            if (descLower.match(/(\bnetflix\b|\bspotify\b|\bhulu\b|\bdisney\b|\byoutube\b|\bapple music\b|\bstreaming\b)/)) return 'Entertainment';
            if (descLower.match(/(\bamc\b|\bregal\b|\bcinemark\b|\btheater\b|\bcinema\b|\bmovie\b|\btickets\b)/)) return 'Entertainment';
            
            // UTILITIES - Phone, internet, power
            if (descLower.match(/(\bcomcast\b|\bverizon\b|\bat&t\b|\bspectrum\b|\btime warner\b|\bcox\b|\boptimum\b)/)) return 'Utilities';
            if (descLower.match(/(\belectric\b|\bpower\b|\benergy\b|\bwater\b|\bsewer\b|\binternet\b|\bphone\b|\bwireless\b)/)) return 'Utilities';
            
            // OTHER EXPENSE - Everything else (be more selective)
            if (descLower.match(/(\bamazon\b|\bapple\.com\b|\bgoogle\b|\bmicrosoft\b|\badobe\b|\bopenai\b)/)) return 'Other Expense';
            if (descLower.match(/(\bhotel\b|\binn\b|\bmotel\b|\bhampton\b|\bhilton\b|\bmarriott\b|\bfairfield\b)/)) return 'Other Expense';
            if (descLower.match(/(\bcvs\b|\bpharmacy\b|\bcerebral\b|\bhealth\b|\bmedical\b)/)) return 'Other Expense';
            if (descLower.match(/(\boverdraft\b|\bfee\b|\bcharge\b|\blicense\b|\bregistration\b|\bdomestic\b)/)) return 'Other Expense';
            if (descLower.match(/(\bzoom\b|\bslack\b|\bgithub\b|\bpaypal\b|\bsubscription\b|\bservice\b)/)) return 'Other Expense';
            
        } else if (type === 'income') {
            // Income patterns (enhanced with aggressive salary detection)
            if (descLower.match(/(\bpayroll\b|\bsalary\b|\bwages\b|\bemployer\b|\bdirect deposit\b|\bpay\b.*\bdeposit\b)/)) return 'Salary';
            if (descLower.match(/(\bfedwire\b|\bwire transfer\b|\bcredit via\b|\bach credit\b|\bdeposit\b.*\bbank\b)/)) return 'Salary';
            if (descLower.match(/(\bmechanical\b|\bconstruction\b|\bcorp\b|\bcompany\b|\bco\b|\binc\b|\bllc\b)/)) return 'Salary';
            if (descLower.match(/(\bfreelance\b|\bconsulting\b|\bcontract\b|\bclient\b|\binvoice\b|\bself.employed\b)/)) return 'Freelance';
            if (descLower.match(/(\binterest\b|\bdividend\b|\binvestment\b|\brefund\b|\bcashback\b|\breturn\b)/)) return 'Other Income';
            if (descLower.match(/(\bgift\b|\bbonus\b|\btip\b|\bpresent\b|\bgratuity\b)/)) return 'Gift';
        }

        // Comprehensive merchant name detection - BE VERY AGGRESSIVE
        const merchantCategories = {
            // GROCERIES - Map Amazon purchases intelligently
            'heb': 'Groceries', 'h-e-b': 'Groceries', 'walmart': 'Groceries', 'target': 'Groceries',
            'kroger': 'Groceries', 'costco': 'Groceries', 'sams club': 'Groceries',
            
            // DINING OUT - All restaurants and food places
            'whataburger': 'Dining Out', 'mcdonalds': 'Dining Out', 'mcdonald': 'Dining Out',
            'burger king': 'Dining Out', 'wendys': 'Dining Out', 'subway': 'Dining Out',
            'taco bell': 'Dining Out', 'kfc': 'Dining Out', 'popeyes': 'Dining Out',
            'chick-fil-a': 'Dining Out', 'chickfila': 'Dining Out', 'chick fil a': 'Dining Out',
            'chicken express': 'Dining Out', 'sonic': 'Dining Out', 'dairy queen': 'Dining Out',
            'jack in the box': 'Dining Out', 'jack in box': 'Dining Out', 'arbys': 'Dining Out', 
            'five guys': 'Dining Out', 'chipotle': 'Dining Out', 'panda express': 'Dining Out', 
            'qdoba': 'Dining Out', 'pizza hut': 'Dining Out', 'dominos': 'Dining Out', 
            'domino': 'Dining Out', 'papa johns': 'Dining Out', 'little caesars': 'Dining Out', 
            'starbucks': 'Dining Out', 'dunkin': 'Dining Out', 'panera': 'Dining Out', 
            'applebees': 'Dining Out', 'chilis': 'Dining Out', 'olive garden': 'Dining Out', 
            'red lobster': 'Dining Out', 'outback': 'Dining Out', 'texas roadhouse': 'Dining Out', 
            'cracker barrel': 'Dining Out', 'ihop': 'Dining Out', 'dennys': 'Dining Out', 
            'waffle house': 'Dining Out', 'buffalo wild wings': 'Dining Out', 'buffalo wild': 'Dining Out',
            'jimmy johns': 'Dining Out', 'jimmy john': 'Dining Out', 'raising canes': 'Dining Out',
            'raising cane': 'Dining Out', 'bill miller': 'Dining Out', 'wings': 'Dining Out',
            'bbq': 'Dining Out', 'grill': 'Dining Out', 'bigs': 'Dining Out',
            
            // TRANSPORT - Gas stations and automotive 
            'shell': 'Transport', 'exxon': 'Transport', 'mobil': 'Transport',
            'chevron': 'Transport', 'bp': 'Transport', 'valero': 'Transport',
            'citgo': 'Transport', 'marathon': 'Transport', 'phillips 66': 'Transport',
            'conoco': 'Transport', 'sunoco': 'Transport', 'speedway': 'Transport',
            'circle k': 'Transport', 'wawa': 'Transport', '7-eleven': 'Transport',
            'quiktrip': 'Transport', 'casey': 'Transport', 'racetrac': 'Transport',
            'zapco': 'Transport', 'automotive': 'Transport', 'car service': 'Transport',
            
            // ENTERTAINMENT - Gaming, streaming, fun
            'netflix': 'Entertainment', 'spotify': 'Entertainment', 'hulu': 'Entertainment',
            'disney': 'Entertainment', 'amazon prime': 'Entertainment', 'youtube': 'Entertainment',
            'apple music': 'Entertainment', 'amc': 'Entertainment', 'regal': 'Entertainment',
            'cinemark': 'Entertainment', 'marcus': 'Entertainment', 'steam': 'Entertainment',
            'steamgames': 'Entertainment', 'xbox': 'Entertainment', 'playstation': 'Entertainment',
            
            // UTILITIES - Phone, internet, power
            'comcast': 'Utilities', 'verizon': 'Utilities', 'att': 'Utilities',
            'spectrum': 'Utilities', 'cox': 'Utilities', 'optimum': 'Utilities',
            'time warner': 'Utilities', 'xfinity': 'Utilities', 'frontier': 'Utilities',
            
            // OTHER EXPENSE - Everything else that doesn't fit cleanly
            'amazon': 'Other Expense', 'openai': 'Other Expense', 'microsoft': 'Other Expense', 
            'adobe': 'Other Expense', 'google': 'Other Expense', 'apple': 'Other Expense', 
            'dropbox': 'Other Expense', 'zoom': 'Other Expense', 'slack': 'Other Expense', 
            'github': 'Other Expense', 'quickbooks': 'Other Expense', 'paypal': 'Other Expense', 
            'tst': 'Other Expense', 'hampton inn': 'Other Expense', 'hampton': 'Other Expense', 
            'hilton': 'Other Expense', 'marriott': 'Other Expense', 'hyatt': 'Other Expense', 
            'holiday inn': 'Other Expense', 'fairfield': 'Other Expense', 'best western': 'Other Expense', 
            'motel': 'Other Expense', 'hotel': 'Other Expense', 'overdraft': 'Other Expense', 
            'nsf': 'Other Expense', 'fee': 'Other Expense', 'paddle': 'Other Expense', 
            'nexusmods': 'Other Expense', 'cerebral': 'Other Expense', 'cvs': 'Other Expense',
            'pharmacy': 'Other Expense', 'license': 'Other Expense', 'domestic': 'Other Expense'
        };
        
        // First try exact merchant matching
        for (const [merchant, category] of Object.entries(merchantCategories)) {
            if (descLower.includes(merchant) && availableCategories.includes(category)) {
                return category;
            }
        }
        
        // Special handling for transaction descriptions with location/ID codes
        // Handle patterns like "CHICKEN EXPRESS CLEAR 830-6292750 TX 08/27"
        if (type === 'expense') {
            // Extract the business name from complex transaction descriptions
            const businessNamePatterns = [
                // Handle "DOMINO'S 9272 512-494-5463 TX 09/09" pattern
                /^([a-zA-Z\s'&]+?)\s+\d{4}\s+[\d\-]+/i,
                // Handle "HAMPTON INNS AUSTIN TX 09/09" pattern  
                /^([a-zA-Z\s&]+?)\s+(?:austin|houston|dallas|san antonio|new braunfels|clear|tx|ca|fl|ny|il)\s/i,
                // Handle "GOOGLE *Google One g.co/helppay# CA 09/08" pattern
                /^([a-zA-Z\s\*]+?)\s+[a-z\.\/]+/i,
                // Original patterns
                /^([a-zA-Z\s&]+?)\s+(?:clear|austin|houston|dallas|san antonio|new braunfels|tx|ca|fl|ny|il)/i,
                /^([a-zA-Z\s&]+?)\s+\d{3,}/i, // Business name followed by numbers
                /^([a-zA-Z\s&]+?)\s+[a-z]{2}\s+\d{2}\/\d{2}/i, // Business name + state + date
            ];
            
            for (const pattern of businessNamePatterns) {
                const match = description.match(pattern);
                if (match) {
                    const businessName = match[1].toLowerCase().trim();
                    
                    // Check if the extracted business name matches our categories
                    for (const [merchant, category] of Object.entries(merchantCategories)) {
                        if (businessName.includes(merchant) && availableCategories.includes(category)) {
                            return category;
                        }
                    }
                    
                    // Check for general food/restaurant keywords in business name
                    if (businessName.match(/\b(burger|pizza|chicken|taco|bbq|grill|cafe|restaurant|diner|bistro|bar|pub)\b/)) {
                        return 'Dining Out';
                    }
                    
                    // Check for gas/fuel keywords
                    if (businessName.match(/\b(gas|fuel|oil|station|petroleum)\b/)) {
                        return 'Transport';
                    }
                    
                    // Check for store keywords
                    if (businessName.match(/\b(store|shop|market|mart|center|plaza)\b/)) {
                        return 'Other Expense';
                    }
                }
            }
        }
        
        // Additional fuzzy matching for partial names
        const fuzzyMatches = {
            'dining': ['whataburger', 'chicken', 'burger', 'pizza', 'taco', 'restaurant', 'cafe', 'coffee', 'diner'],
            'transport': ['shell', 'exxon', 'mobil', 'gas', 'fuel', 'oil', 'station'],
            'utilities': ['electric', 'power', 'energy', 'water', 'internet', 'phone', 'wireless', 'cable'],
            'groceries': ['market', 'grocery', 'food', 'supermarket'],
        };
        
        for (const [categoryType, keywords] of Object.entries(fuzzyMatches)) {
            for (const keyword of keywords) {
                if (descLower.includes(keyword)) {
                    switch(categoryType) {
                        case 'dining': return availableCategories.includes('Dining Out') ? 'Dining Out' : null;
                        case 'transport': return availableCategories.includes('Transport') ? 'Transport' : null;
                        case 'utilities': return availableCategories.includes('Utilities') ? 'Utilities' : null;
                        case 'groceries': return availableCategories.includes('Groceries') ? 'Groceries' : null;
                    }
                }
            }
        }
        
        // Fallback to default categories
        return type === 'income' ? 'Other Income' : 'Other Expense';
    };

    const initializeColumnMappings = () => {
        columnMappings = {};
        csvHeaders.forEach(header => {
            const headerLower = header.toLowerCase().trim();
            if (headerLower.includes('date')) {
                columnMappings[header] = 'date';
            } else if (headerLower.includes('description') || headerLower.includes('memo') || headerLower.includes('payee')) {
                columnMappings[header] = 'description';
            } else if (headerLower.includes('amount') || headerLower.includes('value')) {
                columnMappings[header] = 'amount';
            } else if (headerLower.includes('type')) {
                columnMappings[header] = 'type';
            } else if (headerLower.includes('category')) {
                columnMappings[header] = 'category';
            } else {
                columnMappings[header] = 'ignore';
            }
        });
    };

    const renderColumnMappings = () => {
        columnMappingList.innerHTML = '';
        
        csvHeaders.forEach(header => {
            const mappingRow = document.createElement('div');
            mappingRow.className = 'mapping-row';
            mappingRow.style.cssText = 'display: flex; align-items: center; margin-bottom: 0.5rem; gap: 1rem;';
            
            const headerLabel = document.createElement('label');
            headerLabel.style.cssText = 'font-weight: bold; min-width: 150px; flex-shrink: 0;';
            headerLabel.textContent = header + ':';
            
            const mappingSelect = document.createElement('select');
            mappingSelect.className = 'mapping-select';
            mappingSelect.style.cssText = 'flex: 1; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 4px;';
            mappingSelect.dataset.header = header;
            
            const options = [
                { value: 'ignore', text: 'Ignore' },
                { value: 'date', text: 'Date' },
                { value: 'description', text: 'Description' },
                { value: 'amount', text: 'Amount' },
                { value: 'type', text: 'Type' },
                { value: 'category', text: 'Category' }
            ];
            
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                if (columnMappings[header] === option.value) {
                    optionElement.selected = true;
                }
                mappingSelect.appendChild(optionElement);
            });
            
            mappingSelect.addEventListener('change', () => {
                columnMappings[header] = mappingSelect.value;
                renderDataPreview();
            });
            
            mappingRow.appendChild(headerLabel);
            mappingRow.appendChild(mappingSelect);
            columnMappingList.appendChild(mappingRow);
        });
    };

    const renderDataPreview = () => {
        csvPreviewHeader.innerHTML = '';
        csvPreviewBody.innerHTML = '';
        
        const mappedFields = ['Date', 'Description', 'Amount', 'Type', 'Category'];
        const headerRow = document.createElement('tr');
        
        mappedFields.forEach(field => {
            const th = document.createElement('th');
            th.textContent = field;
            th.style.cssText = 'padding: 0.5rem; border: 1px solid var(--border-color); background-color: var(--card-bg-color);';
            headerRow.appendChild(th);
        });
        csvPreviewHeader.appendChild(headerRow);
        
        const previewRows = csvData.slice(0, 5);
        
        previewRows.forEach(row => {
            const tr = document.createElement('tr');
            
            mappedFields.forEach(field => {
                const td = document.createElement('td');
                td.style.cssText = 'padding: 0.5rem; border: 1px solid var(--border-color);';
                
                let fieldValue = getMappedValue(row, field.toLowerCase());
                
                // Special handling for category preview with auto-categorization
                if (field === 'Category') {
                    const descriptionValue = getMappedValue(row, 'description');
                    const typeValue = getMappedValue(row, 'type');
                    const { type: inferredType } = processTransactionAmount(getMappedValue(row, 'amount'), typeValue);
                    const finalType = typeValue && (typeValue.toLowerCase().includes('income') || typeValue.toLowerCase().includes('expense')) 
                        ? (typeValue.toLowerCase().includes('income') ? 'income' : 'expense')
                        : inferredType;
                    
                    if (!fieldValue || !categories[finalType].includes(fieldValue)) {
                        const autoCategory = autoCategorizeTransaction(descriptionValue, finalType);
                        if (autoCategory) {
                            fieldValue = autoCategory;
                            td.style.fontStyle = 'italic';
                            td.style.color = 'var(--success-color)';
                            td.title = 'Auto-categorized based on description';
                        }
                    }
                }
                
                td.textContent = fieldValue || '';
                
                if (field === 'Amount' && fieldValue) {
                    const numValue = parseFloat(fieldValue);
                    if (!isNaN(numValue)) {
                        td.style.color = numValue >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
                    }
                }
                
                tr.appendChild(td);
            });
            
            csvPreviewBody.appendChild(tr);
        });
    };

    const getMappedValue = (row, field) => {
        for (const [header, mapping] of Object.entries(columnMappings)) {
            if (mapping === field) {
                const headerIndex = csvHeaders.indexOf(header);
                if (headerIndex !== -1 && row[headerIndex] !== undefined) {
                    return row[headerIndex];
                }
            }
        }
        return '';
    };

    const parseDate = (dateString) => {
        if (!dateString) return '';
        
        const cleanDate = dateString.trim();
        if (!cleanDate) return '';
        
        const formats = [
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
            /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
            /^(\d{1,2})-(\d{1,2})-(\d{2})$/
        ];
        
        for (const format of formats) {
            const match = cleanDate.match(format);
            if (match) {
                let year, month, day;
                
                if (format === formats[0]) {
                    [, year, month, day] = match;
                } else if (format === formats[1] || format === formats[3]) {
                    [, month, day, year] = match;
                } else if (format === formats[2] || format === formats[4]) {
                    [, month, day, year] = match;
                    year = '20' + year;
                }
                
                month = month.padStart(2, '0');
                day = day.padStart(2, '0');
                
                const date = new Date(`${year}-${month}-${day}`);
                if (!isNaN(date.getTime())) {
                    return `${year}-${month}-${day}`;
                }
            }
        }
        
        const jsDate = new Date(cleanDate);
        if (!isNaN(jsDate.getTime())) {
            const year = jsDate.getFullYear();
            const month = String(jsDate.getMonth() + 1).padStart(2, '0');
            const day = String(jsDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        return '';
    };

    const processTransactionAmount = (amountString, typeString) => {
        if (!amountString) return { amount: 0, type: '' };
        
        const cleanAmount = amountString.replace(/[$,]/g, '').trim();
        let amount = parseFloat(cleanAmount);
        
        if (isNaN(amount)) return { amount: 0, type: '' };
        
        amount = Math.abs(amount);
        
        let type = '';
        if (typeString) {
            const typeClean = typeString.toLowerCase().trim();
            if (typeClean.includes('income') || typeClean.includes('credit') || typeClean.includes('deposit')) {
                type = 'income';
            } else if (typeClean.includes('expense') || typeClean.includes('debit') || typeClean.includes('withdrawal')) {
                type = 'expense';
            }
        }
        
        if (!type) {
            const originalAmount = parseFloat(amountString.replace(/[$,]/g, '').trim());
            type = originalAmount >= 0 ? 'income' : 'expense';
        }
        
        return { amount, type };
    };

    const validateTransaction = (transaction) => {
        const errors = [];
        
        if (!transaction.date) {
            errors.push('Date is required');
        }
        
        if (!transaction.description || transaction.description.trim() === '') {
            errors.push('Description is required');
        }
        
        if (!transaction.amount || transaction.amount <= 0) {
            errors.push('Amount must be greater than 0');
        }
        
        if (!transaction.type || (transaction.type !== 'income' && transaction.type !== 'expense')) {
            errors.push('Type must be either "income" or "expense"');
        }
        
        if (!transaction.category || transaction.category.trim() === '') {
            errors.push('Category is required');
        } else {
            const validCategories = categories[transaction.type] || [];
            if (!validCategories.includes(transaction.category)) {
                errors.push(`Category "${transaction.category}" is not valid for ${transaction.type}`);
            }
        }
        
        return errors;
    };

    const importCsvTransactions = () => {
        const requiredMappings = ['date', 'description', 'amount'];
        const mappedFields = Object.values(columnMappings);
        
        for (const required of requiredMappings) {
            if (!mappedFields.includes(required)) {
                alert(`Please map at least these required fields: Date, Description, and Amount.`);
                return;
            }
        }
        
        const newTransactions = [];
        const errors = [];
        
        csvData.forEach((row, index) => {
            const dateValue = getMappedValue(row, 'date');
            const descriptionValue = getMappedValue(row, 'description');
            const amountValue = getMappedValue(row, 'amount');
            const typeValue = getMappedValue(row, 'type');
            const categoryValue = getMappedValue(row, 'category');
            
            const parsedDate = parseDate(dateValue);
            const { amount, type: inferredType } = processTransactionAmount(amountValue, typeValue);
            const finalType = typeValue && (typeValue.toLowerCase().includes('income') || typeValue.toLowerCase().includes('expense')) 
                ? (typeValue.toLowerCase().includes('income') ? 'income' : 'expense')
                : inferredType;
            
            let finalCategory = categoryValue;
            
            // Auto-categorize if no category is provided or if provided category is invalid
            if (!finalCategory || !categories[finalType].includes(finalCategory)) {
                finalCategory = autoCategorizeTransaction(descriptionValue, finalType);
            }
            
            // Final fallback if auto-categorization fails
            if (!finalCategory || !categories[finalType].includes(finalCategory)) {
                finalCategory = finalType === 'income' ? 'Other Income' : 'Other Expense';
            }
            
            const transaction = {
                id: Date.now() + index,
                date: parsedDate,
                description: descriptionValue.trim(),
                amount: amount,
                type: finalType,
                category: finalCategory
            };
            
            const validationErrors = validateTransaction(transaction);
            if (validationErrors.length > 0) {
                errors.push(`Row ${index + 2}: ${validationErrors.join(', ')}`);
            } else {
                newTransactions.push(transaction);
            }
        });
        
        if (errors.length > 0) {
            const maxErrors = 10;
            const errorMessage = errors.slice(0, maxErrors).join('\n');
            const moreErrors = errors.length > maxErrors ? `\n... and ${errors.length - maxErrors} more errors` : '';
            alert(`Found errors in the CSV data:\n\n${errorMessage}${moreErrors}\n\nPlease fix the data and try again.`);
            return;
        }
        
        if (newTransactions.length === 0) {
            alert('No valid transactions found to import.');
            return;
        }
        
        const confirmMessage = `Import ${newTransactions.length} transactions? This will add them to your existing data.`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        transactions.push(...newTransactions);
        saveData();
        renderTransactionList();
        
        if (currentView === "view-report") {
            generateReport();
        }
        
        closeModal(csvMappingModal);
        
        const currentFileName = csvFiles.length > 0 ? csvFiles[currentFileIndex].name : 'file';
        let successMessage = `Successfully imported ${newTransactions.length} transactions`;
        
        if (csvFiles.length > 1) {
            successMessage += ` from "${currentFileName}"`;
        }
        
        csvData = [];
        csvHeaders = [];
        columnMappings = {};
        currentFileIndex++;
        
        if (currentFileIndex < csvFiles.length) {
            // More files to process
            successMessage += `\n\nProcessing next file (${currentFileIndex + 1} of ${csvFiles.length})...`;
            alert(successMessage);
            setTimeout(() => processCurrentFile(), 500); // Small delay for better UX
        } else {
            // All files processed
            successMessage += csvFiles.length > 1 ? `\n\nAll ${csvFiles.length} files have been processed!` : '!';
            alert(successMessage);
            csvFiles = [];
            currentFileIndex = 0;
        }
    };

    // --- Smart Categorization System ---
    const smartCategorizeTransactions = () => {
        const uncategorizedTransactions = transactions.filter(t => 
            t.category === 'Other Expense' || t.category === 'Other Income'
        );
        
        if (uncategorizedTransactions.length === 0) {
            alert('No transactions to categorize! All transactions are already categorized.');
            return;
        }
        
        const categorizationPlan = [];
        let changedCount = 0;
        
        uncategorizedTransactions.forEach(transaction => {
            const newCategory = smartCategorizeTransaction(transaction.description, transaction.type);
            if (newCategory && newCategory !== transaction.category) {
                categorizationPlan.push({
                    transaction: transaction,
                    oldCategory: transaction.category,
                    newCategory: newCategory
                });
                changedCount++;
            }
        });
        
        if (changedCount === 0) {
            alert('No improvements found. All transactions are already properly categorized or cannot be auto-categorized.');
            return;
        }
        
        // Show confirmation dialog with preview
        showCategorizationPreview(categorizationPlan);
    };
    
    const smartCategorizeTransaction = (description, type) => {
        if (!description || !type) return null;
        
        const descLower = description.toLowerCase().trim();
        
        if (type === 'expense') {
            // TRAVEL - Hotels, flights, travel services
            if (descLower.match(/(\bhotel\b|\binn\b|\bmotel\b|\blodge\b|\bresort\b|\bhampton\b|\bhilton\b|\bmarriott\b)/)) return 'Travel';
            if (descLower.match(/(\bfairfield\b|\bbest western\b|\bholiday inn\b|\bhyatt\b|\bembassy\b|\bcourtyard\b)/)) return 'Travel';
            if (descLower.match(/(\bairline\b|\bflight\b|\bairport\b|\btravel\b|\bbooking\b|\bexpedia\b)/)) return 'Travel';
            
            // MEDICAL - Health, pharmacy, medical services
            if (descLower.match(/(\bcvs\b|\bpharmacy\b|\bwalgreens\b|\brite aid\b|\bmedical\b|\bhealth\b|\bdoctor\b)/)) return 'Medical';
            if (descLower.match(/(\bcerebral\b|\btherapy\b|\bclinic\b|\bhospital\b|\bdental\b|\bvision\b|\binsurance\b)/)) return 'Medical';
            if (descLower.match(/(\bmedicine\b|\bprescription\b|\bcare\b|\bwellness\b|\bmental health\b)/)) return 'Medical';
            
            // SHOPPING - Retail, online shopping, general purchases
            if (descLower.match(/(\bamazon\b|\bebay\b|\bshopping\b|\bstore\b|\bretail\b|\bmall\b|\bonline\b)/)) return 'Shopping';
            if (descLower.match(/(\bclothes\b|\bclothing\b|\bshoes\b|\bfashion\b|\bapparel\b|\btarget\b|\bwalmart\b)/)) return 'Shopping';
            if (descLower.match(/(\bmktpl\b|\bmarketplace\b|\bpurchase\b|\bbuy\b|\border\b)/)) return 'Shopping';
            
            // SUBSCRIPTIONS - Software, apps, digital services
            if (descLower.match(/(\bapple\.com\b|\bgoogle\b|\bmicrosoft\b|\badobe\b|\bopenai\b|\bsubscription\b)/)) return 'Subscriptions';
            if (descLower.match(/(\bnetflix\b|\bspotify\b|\bhulu\b|\bdisney\b|\byoutube\b|\bstreaming\b)/)) return 'Subscriptions';
            if (descLower.match(/(\bzoom\b|\bslack\b|\bgithub\b|\bdropbox\b|\bcloud\b|\bsaas\b|\bapp\b)/)) return 'Subscriptions';
            if (descLower.match(/(\bprime\b|\bicloud\b|\boffice 365\b|\bcreative cloud\b|\bquickbooks\b)/)) return 'Subscriptions';
            
            // DINING OUT - Restaurants and food
            if (descLower.match(/(\brestaurant\b|\bdining\b|\bfood\b|\bpizza\b|\bburger\b|\bchicken\b|\btaco\b)/)) return 'Dining Out';
            if (descLower.match(/(\bwhataburger\b|\bmcdonald\b|\bdomino\b|\bsubway\b|\bkfc\b|\bwings\b|\bbbq\b)/)) return 'Dining Out';
            if (descLower.match(/(\bjimmy\b|\braising\b|\bcanes\b|\bbuffalo\b|\bsonic\b|\bstarbucks\b|\bcoffee\b)/)) return 'Dining Out';
            
            // GROCERIES - Food shopping
            if (descLower.match(/(\bheb\b|\bh-e-b\b|\bgrocery\b|\bsupermarket\b|\bmarket\b|\bcostco\b|\bkroger\b)/)) return 'Groceries';
            
            // TRANSPORT - Gas, automotive, transportation
            if (descLower.match(/(\bgas\b|\bfuel\b|\bshell\b|\bchevron\b|\bexxon\b|\bmobil\b|\bstation\b)/)) return 'Transport';
            if (descLower.match(/(\bauto\b|\bcar\b|\bautomotive\b|\bmechanic\b|\brepair\b|\bservice\b|\btire\b)/)) return 'Transport';
            if (descLower.match(/(\buber\b|\blyft\b|\btaxi\b|\bparking\b|\btoll\b|\btransport\b)/)) return 'Transport';
            
            // ENTERTAINMENT - Games, movies, fun
            if (descLower.match(/(\bsteam\b|\bsteamgames\b|\bgaming\b|\bgame\b|\bxbox\b|\bplaystation\b)/)) return 'Entertainment';
            if (descLower.match(/(\bmovie\b|\bcinema\b|\btheater\b|\bamc\b|\bregal\b|\btickets\b)/)) return 'Entertainment';
            
            // UTILITIES - Phone, internet, power
            if (descLower.match(/(\belectric\b|\bpower\b|\benergy\b|\bwater\b|\bsewer\b|\binternet\b|\bphone\b)/)) return 'Utilities';
            if (descLower.match(/(\bcomcast\b|\bverizon\b|\bat&t\b|\bspectrum\b|\butility\b|\bwireless\b)/)) return 'Utilities';
            
        } else if (type === 'income') {
            // SALARY - Employment income
            if (descLower.match(/(\bpayroll\b|\bsalary\b|\bwages\b|\bemployer\b|\bdirect deposit\b|\bfedwire\b)/)) return 'Salary';
            if (descLower.match(/(\bmechanical\b|\bconstruction\b|\bcorp\b|\bcompany\b|\bco\b|\binc\b|\bllc\b)/)) return 'Salary';
            
            // FREELANCE - Contract work
            if (descLower.match(/(\bfreelance\b|\bconsulting\b|\bcontract\b|\bclient\b|\binvoice\b)/)) return 'Freelance';
            
            // OTHER INCOME - Investments, refunds, etc.
            if (descLower.match(/(\binterest\b|\bdividend\b|\binvestment\b|\brefund\b|\bcashback\b)/)) return 'Other Income';
        }
        
        return null; // Return null if no category matches, keep original category
    };
    
    const showCategorizationPreview = (categorizationPlan) => {
        let previewText = `Smart Categorization will update ${categorizationPlan.length} transactions:\n\n`;
        
        const categoryChanges = {};
        categorizationPlan.forEach(item => {
            const key = `${item.oldCategory} → ${item.newCategory}`;
            if (!categoryChanges[key]) {
                categoryChanges[key] = 0;
            }
            categoryChanges[key]++;
        });
        
        Object.entries(categoryChanges).forEach(([change, count]) => {
            previewText += `• ${count} transactions: ${change}\n`;
        });
        
        previewText += `\nDo you want to proceed with these changes?`;
        
        if (confirm(previewText)) {
            applyCategorization(categorizationPlan);
        }
    };
    
    const applyCategorization = (categorizationPlan) => {
        let successCount = 0;
        
        categorizationPlan.forEach(item => {
            const transaction = transactions.find(t => t.id === item.transaction.id);
            if (transaction) {
                transaction.category = item.newCategory;
                successCount++;
            }
        });
        
        saveData();
        renderTransactionList();
        
        if (currentView === "view-report") {
            generateReport();
        }
        
        alert(`Successfully categorized ${successCount} transactions!`);
    };

    // --- Event Listeners ---
    // View Switching
    navButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            showView(button.dataset.view);
        });
    });
    
    bottomNavBtns.forEach((button) => {
        if (button.dataset.view)
            button.addEventListener("click", () => showView(button.dataset.view));
    });

    // Modals & Forms
    bottomNavAddBtn.addEventListener("click", () => openTransactionModal("add"));
    bottomNavCategoriesBtn.addEventListener("click", showCategoryModal);
    fab.addEventListener("click", () => openTransactionModal("add"));
    closeModalBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const modal = btn.closest(".modal");
            if (modal) closeModal(modal);
        });
    });
    transactionModal.addEventListener("click", (e) => {
        if (e.target === transactionModal) closeModal(transactionModal);
    }); // Close on backdrop click
    categoryModal.addEventListener("click", (e) => {
        if (e.target === categoryModal) closeModal(categoryModal);
    }); // Close on backdrop click
    csvMappingModal.addEventListener("click", (e) => {
        if (e.target === csvMappingModal) {
            const shouldCancel = csvFiles.length > 1 
                ? confirm(`Cancel import process? This will skip all remaining files (${csvFiles.length - currentFileIndex} files).`)
                : true;
                
            if (shouldCancel) {
                closeModal(csvMappingModal);
                csvData = [];
                csvHeaders = [];
                columnMappings = {};
                csvFiles = [];
                currentFileIndex = 0;
            }
        }
    }); // Close on backdrop click
    transactionForm.addEventListener("submit", handleTransactionFormSubmit);
    typeSelect.addEventListener("change", populateCategoryOptions); // Update categories when type changes

    // Transaction List Actions
    transactionList.addEventListener("click", handleTransactionListClick);

    // Filtering
    searchInput.addEventListener("input", handleFilterChange);
    filterTypeSelect.addEventListener("change", handleFilterChange);

    // Search bar scroll transparency
    let scrollTimeout;
    window.addEventListener("scroll", () => {
        clearTimeout(scrollTimeout);
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            searchBar.classList.add("scrolled");
        } else {
            searchBar.classList.remove("scrolled");
        }
    });

    // Keyboard shortcut to focus search (/ key)
    document.addEventListener("keydown", (e) => {
        // Only trigger if not already focused on an input
        if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
            e.preventDefault();
            searchInput.focus();
            searchBar.classList.remove("scrolled"); // Make visible when focused
        }
        // Escape to blur search
        if (e.key === "Escape" && e.target === searchInput) {
            searchInput.blur();
        }
    });

    // Category Management
    manageCategoriesNavBtn.addEventListener("click", showCategoryModal);
    addIncomeCategoryBtn.addEventListener("click", () => addCategory("income"));
    addExpenseCategoryBtn.addEventListener("click", () => addCategory("expense"));

    // Reporting & Statements
    generateReportBtn.addEventListener("click", generateReport);
    generatePrintReportBtn.addEventListener("click", generatePrintableReport);
    reportPeriodSelect.addEventListener("change", () => {
        const isCustom = reportPeriodSelect.value === "custom";
        customDateRangeDiv.style.display = isCustom ? "flex" : "none";
        if (!isCustom) {
            generateReport(); // Generate report immediately for non-custom periods
        } else {
            // Optionally clear report when switching to custom until Generate is clicked
            totalIncomeEl.textContent = "0.00";
            totalExpensesEl.textContent = "0.00";
            netBalanceEl.textContent = "0.00";
            totalSavingsDepositsEl.textContent = "0.00";
            totalSavingsWithdrawalsEl.textContent = "0.00";
            netSavingsEl.textContent = "0.00";
            updateExpenseChart({});
            updateSavingsChart([]);
        }
    });
    generateStatementBtn.addEventListener("click", generateMonthlyStatement);
    // Removed clearStatementBtn listener

    // Theme Toggle
    themeToggle.addEventListener("change", toggleDarkMode);

    // Save/Load
    saveDataBtn.addEventListener("click", saveDataToJSONFile);
    loadDataBtn.addEventListener("click", () => loadFileInput.click()); // Trigger hidden file input
    loadFileInput.addEventListener("change", handleLoadDataFromFile);

    // Smart Categorization
    smartCategorizeBtn.addEventListener("click", smartCategorizeTransactions);

    // CSV Import
    importCsvBtn.addEventListener("click", () => csvFileInput.click());
    csvFileInput.addEventListener("change", handleCsvFileSelect);
    importTransactionsBtn.addEventListener("click", importCsvTransactions);
    cancelCsvImportBtn.addEventListener("click", () => {
        const shouldCancel = csvFiles.length > 1 
            ? confirm(`Cancel import process? This will skip all remaining files (${csvFiles.length - currentFileIndex} files).`)
            : true;
            
        if (shouldCancel) {
            closeModal(csvMappingModal);
            csvData = [];
            csvHeaders = [];
            columnMappings = {};
            csvFiles = [];
            currentFileIndex = 0;
        }
    });

    // Clear All
    clearAllBtn.addEventListener("click", clearAllTransactions);

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
