/**
 * script.js
 * Handles the logic for the Simple Income/Expense Tracker web application.
 * Features: Add/Edit/Delete transactions, Manage Categories, Set Budgets,
 * Display dynamic reports & charts on the main page,
 * Generate a printable summary report in a new window with details and chart image.
 * Stores data in browser localStorage.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // Ensure all IDs match the HTML exactly
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');

    // Report Elements
    const reportPeriodSelect = document.getElementById('report-period');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const viewSummaryReportBtn = document.getElementById('view-summary-report-btn');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const netBalanceEl = document.getElementById('net-balance');
    const expenseChartCanvas = document.getElementById('expense-chart');

    // Category Modal Elements
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    const categoryModal = document.getElementById('category-modal');
    const categoryCloseBtn = document.querySelector('.category-close');
    const incomeCategoryList = document.getElementById('income-category-list');
    const expenseCategoryList = document.getElementById('expense-category-list');
    const newIncomeCategoryInput = document.getElementById('new-income-category');
    const newExpenseCategoryInput = document.getElementById('new-expense-category');
    const addIncomeCategoryBtn = document.getElementById('add-income-category-btn');
    const addExpenseCategoryBtn = document.getElementById('add-expense-category-btn');

    // Edit Modal Elements
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-transaction-form');
    const editIdInput = document.getElementById('edit-id');
    const editTypeSelect = document.getElementById('edit-type');
    const editDateInput = document.getElementById('edit-date');
    const editDescriptionInput = document.getElementById('edit-description');
    const editAmountInput = document.getElementById('edit-amount');
    const editCategorySelect = document.getElementById('edit-category');
    const editCloseBtn = document.querySelector('.edit-close');

    // Budget Elements
    const budgetSection = document.getElementById('budget-section');
    const saveBudgetsBtn = document.getElementById('save-budgets-btn');

    // --- Error Check: Verify crucial elements exist ---
    if (!transactionForm || !transactionList || !typeSelect || !categorySelect || !dateInput || !descriptionInput || !amountInput || !viewSummaryReportBtn || !expenseChartCanvas || !reportPeriodSelect || !generateReportBtn || !totalIncomeEl || !totalExpensesEl || !netBalanceEl || !manageCategoriesBtn || !categoryModal || !editModal || !budgetSection || !saveBudgetsBtn) {
        console.error("FATAL ERROR: One or more essential HTML elements were not found. Check HTML IDs match the JavaScript selectors and ensure the script runs after the DOM is loaded.");
        alert("Error initializing the tracker application. Some features might be broken. Please check the browser console (F12).");
        // Allow script to continue but functionality might be impaired
    }

    // --- Global State ---
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || {
        income: ['Salary', 'Freelance', 'Investment', 'Other Income'],
        expense: ['Groceries', 'Rent/Mortgage', 'Utilities', 'Transport', 'Dining Out', 'Entertainment', 'Shopping', 'Healthcare', 'Other Expense']
    };
    let budgets = JSON.parse(localStorage.getItem('budgets')) || {}; // { expenseCategoryName: percentage }
    let expenseChart = null; // Holds the Chart.js instance for the main page chart
    let editingId = null; // Holds the ID of the transaction currently being edited

    // --- Core Functions ---

    /** Saves the current state to localStorage. */
    const saveData = () => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('budgets', JSON.stringify(budgets));
    };

    /** Formats a number as USD currency. */
    const formatCurrency = (amount) => {
        const numAmount = Number(amount);
        if (isNaN(numAmount)) { return 'N/A'; }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numAmount);
    };

    /** Populates a category select dropdown. */
    const populateCategoryOptions = (selectElement = categorySelect, type = typeSelect.value) => {
        if (!selectElement) return;
        selectElement.innerHTML = '';
        const cats = categories[type] || [];
        if (cats.length > 0) {
            cats.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                selectElement.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = ""; option.textContent = "No categories defined"; option.disabled = true;
            selectElement.appendChild(option);
        }
    };

    // --- Transaction Management Functions ---

    /** Renders a single transaction item in the list. */
    const renderTransactionItem = (transaction) => {
        const li = document.createElement('li'); li.dataset.id = transaction.id;
        const detailsSpan = document.createElement('span'); detailsSpan.classList.add('details');
        detailsSpan.textContent = `${transaction.date} - ${transaction.description} `;
        const categorySpan = document.createElement('span'); categorySpan.textContent = `(${transaction.category})`;
        detailsSpan.appendChild(categorySpan);
        const amountSpan = document.createElement('span'); amountSpan.classList.add('amount', transaction.type);
        amountSpan.textContent = `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`;
        const actionsDiv = document.createElement('div'); actionsDiv.classList.add('actions');
        const editBtn = document.createElement('button'); editBtn.textContent = 'Edit'; editBtn.classList.add('edit-btn'); editBtn.type = 'button';
        editBtn.onclick = () => showEditModal(transaction.id);
        const deleteBtn = document.createElement('button'); deleteBtn.innerHTML = '&times;'; deleteBtn.classList.add('delete-btn'); deleteBtn.type = 'button';
        deleteBtn.onclick = () => deleteTransaction(transaction.id);
        actionsDiv.appendChild(editBtn); actionsDiv.appendChild(deleteBtn);
        li.appendChild(detailsSpan); li.appendChild(amountSpan); li.appendChild(actionsDiv);
        transactionList.prepend(li);
    };

    /** Renders all transactions, sorted by date descending. */
    const renderTransactions = (transactionArray = transactions) => {
        if (!transactionList) return;
        transactionList.innerHTML = '';
        const sortedTransactions = [...transactionArray].sort((a, b) => new Date(b.date) - new Date(a.date));
        sortedTransactions.forEach(renderTransactionItem);
    };

    /** Adds a new transaction. */
    const addTransaction = (e) => {
        e.preventDefault();
        const type = typeSelect.value; const date = dateInput.value; const description = descriptionInput.value.trim();
        const amount = amountInput.value; const category = categorySelect.value; const parsedAmount = parseFloat(amount);
        if (!date || !description || !amount || !category || category === "" || isNaN(parsedAmount) || parsedAmount <= 0) {
            alert('Please fill in all fields with valid data (amount must be positive, category selected).'); return;
        }
        const newTransaction = { id: Date.now(), type, date, description, amount: parsedAmount, category };
        transactions.push(newTransaction); saveData(); renderTransactions(); generateReport();
        transactionForm.reset(); dateInput.valueAsDate = new Date(); populateCategoryOptions(); typeSelect.value = 'expense';
    };

    /** Deletes a transaction by ID after confirmation. */
    const deleteTransaction = (id) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        transactions = transactions.filter(t => t.id !== id); saveData(); renderTransactions(); generateReport();
    };

    // --- Edit Transaction Modal Functions ---

    /** Shows and populates the edit modal. */
    const showEditModal = (id) => {
        if (!editModal || !editForm) { console.error("Edit modal elements not found."); return; }
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) { console.error("Transaction not found for editing:", id); alert("Error: Could not find transaction."); return; }
        editingId = id; editIdInput.value = transaction.id; editTypeSelect.value = transaction.type;
        editDateInput.value = transaction.date; editDescriptionInput.value = transaction.description;
        editAmountInput.value = transaction.amount; populateCategoryOptions(editCategorySelect, transaction.type);
        editCategorySelect.value = transaction.category; editModal.style.display = 'block';
    };

    /** Hides the edit modal. */
    const hideEditModal = () => { if (editModal) { editingId = null; editModal.style.display = 'none'; } };

    /** Handles the update submission from the edit modal. */
    const handleUpdateTransaction = (e) => {
        e.preventDefault(); if (!editingId || !editForm) return;
        const updatedAmount = parseFloat(editAmountInput.value); const updatedDescription = editDescriptionInput.value.trim();
        const updatedDate = editDateInput.value; const updatedCategory = editCategorySelect.value; const updatedType = editTypeSelect.value;
        if (!updatedDate || !updatedDescription || !editAmountInput.value || !updatedCategory || updatedCategory === "" || isNaN(updatedAmount) || updatedAmount <= 0) {
            alert('Please fill in all fields with valid data (amount must be positive, category selected).'); return;
        }
        const updatedData = { id: editingId, type: updatedType, date: updatedDate, description: updatedDescription, amount: updatedAmount, category: updatedCategory };
        const index = transactions.findIndex(t => t.id === editingId);
        if (index !== -1) {
            transactions[index] = updatedData; saveData(); renderTransactions(); generateReport(); hideEditModal(); editForm.reset();
        } else { alert('Error: Could not update transaction.'); console.error("Transaction to update not found:", editingId); hideEditModal(); }
    };


    // --- Category Management Modal Functions ---

    /** Renders category list in the management modal. */
    const renderCategoryList = (type) => {
        const listElement = type === 'income' ? incomeCategoryList : expenseCategoryList; if (!listElement) return;
        listElement.innerHTML = ''; const cats = categories[type] || [];
        cats.forEach(cat => {
            const li = document.createElement('li'); li.textContent = cat; const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete'; deleteBtn.classList.add('delete-category-btn'); deleteBtn.type = 'button';
            deleteBtn.onclick = () => deleteCategory(type, cat); li.appendChild(deleteBtn); listElement.appendChild(li);
        });
    };

    /** Adds a new category. */
    const addCategory = (type) => {
        const inputElement = type === 'income' ? newIncomeCategoryInput : newExpenseCategoryInput; if (!inputElement) return;
        const categoryName = inputElement.value.trim(); if (!categoryName) { alert('Category name cannot be empty.'); return; }
        const cats = categories[type] || []; if (cats.includes(categoryName)) { alert(`Category "${categoryName}" already exists.`); return; }
        categories[type] = [...cats, categoryName]; // Ensure array exists before push/spread
        if (type === 'expense' && !(categoryName in budgets)) { budgets[categoryName] = 0; }
        saveData(); renderCategoryList(type); populateCategoryOptions(); populateBudgetSection(); inputElement.value = '';
    };

    /** Deletes a category if unused. */
    const deleteCategory = (type, categoryName) => {
        const isUsed = transactions.some(t => t.type === type && t.category === categoryName);
        if (isUsed) { alert(`Cannot delete category "${categoryName}" as it is used by transactions.`); return; }
        if (!confirm(`Delete the category "${categoryName}"?`)) return;
        categories[type] = (categories[type] || []).filter(cat => cat !== categoryName);
        if (type === 'expense' && categoryName in budgets) { delete budgets[categoryName]; }
        saveData(); renderCategoryList(type); populateCategoryOptions(); populateBudgetSection();
    };

    /** Shows the category management modal. */
    const showCategoryModal = () => { if(categoryModal) { renderCategoryList('income'); renderCategoryList('expense'); categoryModal.style.display = 'block'; }};
    /** Hides the category management modal. */
    const hideCategoryModal = () => { if(categoryModal) categoryModal.style.display = 'none'; };


    // --- Budget Management Functions ---

    /** Populates the budget input section. */
    const populateBudgetSection = () => {
        if (!budgetSection) return; budgetSection.innerHTML = '';
        const expenseCats = categories.expense || [];
        expenseCats.forEach(cat => {
            if (!(cat in budgets)) { budgets[cat] = 0; }
            const div = document.createElement('div'); const label = document.createElement('label');
            const inputId = `budget-${cat.replace(/[^a-zA-Z0-9]/g, '-')}`; label.textContent = `${cat}:`; label.htmlFor = inputId;
            const input = document.createElement('input'); input.type = 'number'; input.id = inputId; input.min = 0; input.max = 100; input.step = 1;
            input.value = budgets[cat] || 0; input.dataset.category = cat;
            const percentSpan = document.createElement('span'); percentSpan.textContent = '%'; percentSpan.style.marginLeft = '5px';
            div.appendChild(label); div.appendChild(input); div.appendChild(percentSpan); budgetSection.appendChild(div);
        });
    };

     /** Saves the budget percentages. */
    const saveBudgets = () => {
        if (!budgetSection) return; const inputs = budgetSection.querySelectorAll('input[type="number"]');
        let totalPercentage = 0;
        inputs.forEach(input => {
            const category = input.dataset.category; const percentage = parseInt(input.value, 10) || 0;
            budgets[category] = Math.max(0, Math.min(100, percentage)); totalPercentage += budgets[category];
        });
        if (totalPercentage > 100) { alert(`Warning: Total budget allocation (${totalPercentage}%) exceeds 100%.`); }
        saveData(); alert('Budgets saved!'); populateBudgetSection();
    };

    // --- Reporting Functions (Main Page) ---

    /** Generates the main page report and updates the chart. */
    const generateReport = () => {
        if (!reportPeriodSelect || !totalIncomeEl || !totalExpensesEl || !netBalanceEl || !expenseChartCanvas) return;
        const period = reportPeriodSelect.value; const today = new Date(); let startDate; const endDate = new Date();
        switch (period) {
            case 'weekly': const firstDay = today.getDate()-today.getDay()+(today.getDay()===0?-6:1); startDate=new Date(today.getFullYear(),today.getMonth(),firstDay); break;
            case 'biweekly': startDate = new Date(new Date().setDate(today.getDate() - 14)); break;
            case 'monthly': startDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
            case 'all': default: startDate = new Date(0); break;
        }
        const startOfDay=new Date(startDate); startOfDay.setHours(0,0,0,0); const endOfDay=new Date(endDate); endOfDay.setHours(23,59,59,999);
        const filteredTransactions = transactions.filter(t => { const d=new Date(t.date); return d>=startOfDay && d<=endOfDay; });
        let totalIncome = 0; let totalExpenses = 0; const expenseByCategory = {};
        filteredTransactions.forEach(t => { const amt=Number(t.amount)||0; if (t.type==='income') {totalIncome+=amt;} else {totalExpenses+=amt; expenseByCategory[t.category]=(expenseByCategory[t.category]||0)+amt;} });
        const netBalance = totalIncome - totalExpenses;
        totalIncomeEl.textContent = formatCurrency(totalIncome); totalExpensesEl.textContent = formatCurrency(totalExpenses);
        netBalanceEl.textContent = formatCurrency(netBalance); netBalanceEl.className = netBalance>=0 ? 'positive' : 'negative';
        updateExpenseChart(expenseByCategory);
    };

    /** Updates the main page expense pie chart. */
    const updateExpenseChart = (expenseData) => {
        if (!expenseChartCanvas) return; const labels = Object.keys(expenseData); const data = Object.values(expenseData);
        const bgColors = ['rgba(255, 99, 132, 0.8)','rgba(54, 162, 235, 0.8)','rgba(255, 206, 86, 0.8)','rgba(75, 192, 192, 0.8)','rgba(153, 102, 255, 0.8)','rgba(255, 159, 64, 0.8)','rgba(199, 199, 199, 0.8)','rgba(83, 102, 255, 0.8)','rgba(40, 159, 64, 0.8)','rgba(210, 99, 132, 0.8)'];
        const chartColors = labels.map((_,i)=>bgColors[i%bgColors.length]); if (expenseChart) {expenseChart.destroy();} const ctx = expenseChartCanvas.getContext('2d');
        if (labels.length>0) { expenseChart = new Chart(ctx, { type:'pie', data:{ labels, datasets:[{label:'Expenses by Category', data, backgroundColor:chartColors, borderColor:'#fff', borderWidth:1 }] }, options:{ responsive:true, maintainAspectRatio:false, animation:{duration:0}, plugins:{ legend:{position:'top'}, tooltip:{callbacks:{label:function(ctx){let l=ctx.label||''; if(l){l+=': ';} if(ctx.parsed!==null){l+=formatCurrency(ctx.parsed);const t=ctx.dataset.data.reduce((a,v)=>a+v,0);const p=t>0?((ctx.parsed/t)*100).toFixed(1):0;l+=` (${p}%)`;} return l;}}} } } });
        } else { expenseChart = null; ctx.clearRect(0,0,expenseChartCanvas.width,expenseChartCanvas.height); ctx.save(); ctx.textAlign='center'; ctx.fillStyle='#888'; ctx.font='14px Segoe UI'; ctx.fillText('No expense data for selected period.',expenseChartCanvas.width/2,expenseChartCanvas.height/2); ctx.restore(); }
    };

    // --- Printable Report Generation Functions ---

    /** Gathers data for the comprehensive printable report. */
    const generateFinalReportData = () => {
        const reportData = { incomeByCategory: {}, expenseByCategory: {}, totalIncome: 0, totalExpenses: 0, expensePercentages: {}, startDate: null, endDate: null, expenseChartData: { labels: [], data: [] } };
        if (transactions.length === 0) { return reportData; }
        const dates = transactions.map(t => new Date(t.date)); reportData.startDate = new Date(Math.min(...dates)); reportData.endDate = new Date(Math.max(...dates));
        transactions.forEach(t => { const amount = Number(t.amount) || 0; if (t.type === 'income') { reportData.totalIncome += amount; reportData.incomeByCategory[t.category] = (reportData.incomeByCategory[t.category] || 0) + amount; } else { reportData.totalExpenses += amount; reportData.expenseByCategory[t.category] = (reportData.expenseByCategory[t.category] || 0) + amount; } });
        if (reportData.totalExpenses > 0) { const sortedExpCats = Object.keys(reportData.expenseByCategory).sort((a, b) => reportData.expenseByCategory[b] - reportData.expenseByCategory[a]); sortedExpCats.forEach(cat => { const amt = reportData.expenseByCategory[cat]; reportData.expensePercentages[cat] = (amt / reportData.totalExpenses) * 100; reportData.expenseChartData.labels.push(cat); reportData.expenseChartData.data.push(amt); }); }
        return reportData;
    };

    /** Generates the HTML string for the printable report page. */
    const generateReportHTML = (reportData, chartImageDataUrl) => {
        const isEmpty = transactions.length === 0;
        const formatDate = (d) => d ? d.toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'}) : 'N/A';
        const dateRangeStr = isEmpty ? 'N/A' : `Report Period: ${formatDate(reportData.startDate)} - ${formatDate(reportData.endDate)}`;
        const generationDate = new Date().toLocaleString('en-US', {year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
        const embeddedCSS = `<style>body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.5;padding:30px;max-width:800px;margin:20px auto;border:1px solid #ccc;box-shadow:0 0 15px rgba(0,0,0,0.1);background-color:#fff}h1{text-align:center;color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:10px;margin-bottom:15px;font-size:2em}.report-meta{text-align:center;font-size:.9em;color:#555;margin-bottom:30px}h2{color:#34495e;border-bottom:1px solid #eee;padding-bottom:8px;margin-top:40px;margin-bottom:20px;font-size:1.5em}h3{color:#7f8c8d;margin-top:25px;margin-bottom:10px;font-size:1.2em;font-weight:400}p{margin-bottom:15px;color:#333}table{width:100%;border-collapse:collapse;margin-bottom:30px;font-size:.95em}th,td{border:1px solid #dfe6e9;padding:10px 12px;text-align:left;vertical-align:top}th{background-color:#f8f9fa;font-weight:600;color:#34495e}td.amount,td.percentage,td.currency{text-align:right;font-family:'Courier New',Courier,monospace;white-space:nowrap}.summary-section{background-color:#ecf0f1;padding:20px;border-radius:5px;margin-bottom:30px;border:1px solid #bdc3c7}.summary-section p{margin:8px 0;font-size:1.1em;text-align:center}.summary-section .net-positive{color:#27ae60;font-weight:700}.summary-section .net-negative{color:#c0392b;font-weight:700}footer{text-align:center;margin-top:40px;font-size:.8em;color:#95a5a6;border-top:1px solid #eee;padding-top:15px}.chart-container-report{text-align:center;margin:30px 0;}.chart-container-report img{max-width:90%;height:auto;max-height:450px;border:1px solid #eee; padding: 5px; background-color: #fff;}.chart-placeholder{text-align:center;padding:30px;border:1px dashed #bdc3c7;margin:20px 0;color:#7f8c8d;background-color:#fdfefe}.transaction-log th{font-size:.9em;padding:8px 10px}.transaction-log td{font-size:.9em;padding:8px 10px}.transaction-log td.income{color:#27ae60;font-weight:500}.transaction-log td.expense{color:#c0392b;font-weight:500}.transaction-log tr:nth-child(even){background-color:#f8f9fa}.page-break{page-break-before:always;border-top:2px dashed #ccc;margin-top:40px;padding-top:20px}@media print{body{border:none;box-shadow:none;margin:0;padding:0;font-size:10pt}h1{font-size:18pt}h2{font-size:14pt;margin-top:25px}h3{font-size:11pt}table{font-size:9pt}th,td{padding:6px 8px}.page-break{border:none;page-break-before:always;margin:0;padding:0}.summary-section{padding:15px;border:1px solid #ccc}.chart-container-report img{max-width:100%;page-break-inside:avoid}footer{display:none}}</style>`;
        let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Financial Summary Report</title>${embeddedCSS}</head><body>`;
        html += `<h1>Financial Summary Report</h1><div class="report-meta">${dateRangeStr}<br>Generated on: ${generationDate}</div>`;
        if (isEmpty) { html += `<p>No transaction data available.</p>`; }
        else {
            html += `<div class="summary-section"><h2>Overall Summary</h2><p>Total Income: ${formatCurrency(reportData.totalIncome)}</p><p>Total Expenses: ${formatCurrency(reportData.totalExpenses)}</p>`;
            const net = reportData.totalIncome-reportData.totalExpenses; const netCls=net>=0?'net-positive':'net-negative'; html+=`<p>Net Balance: <span class="${netCls}">${formatCurrency(net)}</span></p></div>`;
            html += `<h2>Income Breakdown</h2>`; const inc = Object.entries(reportData.incomeByCategory).sort(([,a],[,b])=>b-a);
            if(inc.length>0){ html+=`<table><thead><tr><th>Category</th><th style="text-align:right;">Amount</th></tr></thead><tbody>`; inc.forEach(([c,a])=>{html+=`<tr><td>${c}</td><td class="amount">${formatCurrency(a)}</td></tr>`;}); html+=`</tbody></table>`; } else {html+=`<p>No income recorded.</p>`;}
            html += `<h2>Expense Breakdown</h2>`; const exp = Object.entries(reportData.expenseByCategory).sort(([,a],[,b])=>b-a);
            if(exp.length>0){ html+=`<table><thead><tr><th>Category</th><th style="text-align:right;">Amount</th><th style="text-align:right;">% of Total Expenses</th></tr></thead><tbody>`; exp.forEach(([c,a])=>{const p=reportData.expensePercentages[c]||0;html+=`<tr><td>${c}</td><td class="amount">${formatCurrency(a)}</td><td class="percentage">${p.toFixed(1)}%</td></tr>`;}); html+=`</tbody></table>`;} else {html+=`<p>No expenses recorded.</p>`;}
            html += `<h2>Expense Visualization</h2>`; if(chartImageDataUrl){html+=`<div class="chart-container-report"><img src="${chartImageDataUrl}" alt="Expense Breakdown Pie Chart"></div>`;}else{html+=`<div class="chart-placeholder">Chart visualization could not be generated.</div>`;}
            html += `<div class="page-break"></div><h2>Detailed Transaction Log</h2>`;
            if(transactions.length>0){ html+=`<table class="transaction-log"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th style="text-align:right;">Amount</th></tr></thead><tbody>`; const sortedT=[...transactions].sort((a,b)=>new Date(a.date)-new Date(b.date)); sortedT.forEach(t=>{html+=`<tr><td>${t.date}</td><td class="${t.type}">${t.type.charAt(0).toUpperCase()+t.type.slice(1)}</td><td>${t.category}</td><td>${t.description}</td><td class="currency ${t.type}">${formatCurrency(t.amount)}</td></tr>`;}); html+=`</tbody></table>`;} else {html+=`<p>No transactions found.</p>`;}
        }
        html += `<footer>End of Report</footer></body></html>`; return html;
    };

    /** Opens the printable report in a new window/tab. */
    const viewPrintableReport = () => {
        const finalReportData = generateFinalReportData(); let chartImageDataUrl = null;
        if (finalReportData.expenseChartData && finalReportData.expenseChartData.labels.length > 0) {
            // Update main chart temporarily to capture image of *all* expenses
            updateExpenseChart(finalReportData.expenseByCategory);
            try { // Capture image
                if(expenseChart && typeof expenseChart.toBase64Image === 'function') { chartImageDataUrl = expenseChart.toBase64Image('image/png'); }
                else { console.warn("Could not get chart image data URL."); }
            } catch (error) { console.error("Error generating chart image:", error); }
            // Restore main chart to reflect selected period
            generateReport();
        } else { console.log("No expense data for report chart."); updateExpenseChart({}); } // Clear main chart if no expenses
        const reportHtml = generateReportHTML(finalReportData, chartImageDataUrl); const reportWindow = window.open('', '_blank');
        if (reportWindow) { reportWindow.document.open(); reportWindow.document.write(reportHtml); reportWindow.document.close(); reportWindow.focus(); }
        else { alert('Could not open report window. Please disable pop-up blockers.'); }
    };

    // --- Event Listeners ---
    // Use optional chaining (?.) for elements inside modals in case HTML structure changes
    transactionForm?.addEventListener('submit', addTransaction);
    typeSelect?.addEventListener('change', () => populateCategoryOptions());
    generateReportBtn?.addEventListener('click', generateReport);
    viewSummaryReportBtn?.addEventListener('click', viewPrintableReport);
    manageCategoriesBtn?.addEventListener('click', showCategoryModal);
    categoryCloseBtn?.addEventListener('click', hideCategoryModal);
    addIncomeCategoryBtn?.addEventListener('click', () => addCategory('income'));
    addExpenseCategoryBtn?.addEventListener('click', () => addCategory('expense'));
    editForm?.addEventListener('submit', handleUpdateTransaction);
    editCloseBtn?.addEventListener('click', hideEditModal);
    editTypeSelect?.addEventListener('change', () => populateCategoryOptions(editCategorySelect, editTypeSelect.value));
    saveBudgetsBtn?.addEventListener('click', saveBudgets);

    // Close modals if clicking outside modal content
    window.addEventListener('click', (event) => {
        if (event.target === categoryModal) { hideCategoryModal(); }
        if (event.target === editModal) { hideEditModal(); }
    });

    // --- Initial Setup ---
    /** Initializes the application on page load. */
    const initializeApp = () => {
        if (!dateInput || !categoryModal || !editModal) {
             console.warn("Initialization: Modals or date input not found.");
             // Don't block initialization, but log warning
        }
        if (dateInput) dateInput.valueAsDate = new Date(); // Set default date
        populateCategoryOptions(); // Populate main category dropdown
        populateBudgetSection(); // Populate budget inputs
        renderTransactions(); // Render existing transactions from localStorage
        generateReport(); // Generate initial report for main page
        console.log("Income/Expense Tracker Initialized.");
    };

    // Run Initialization when the DOM is ready
    initializeApp();

}); // End of DOMContentLoaded listener