document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const statementTitleEl = document.getElementById("statement-title");
    const statementContentArea = document.getElementById(
        "statement-content-area",
    );

    // --- State ---
    let transactions = [];
    let statementMonth = -1;
    let statementYear = -1;
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    // --- Utility Functions (Copied from main script for consistency) ---
    const formatCurrency = (amount) => {
        const numAmount = Number(amount);
        return isNaN(numAmount) ? "0.00" : numAmount.toFixed(2);
    };

    const formatDate = (dateString, format = "MM/DD/YY") => {
        if (!dateString) return "";
        try {
            const date = new Date(
                dateString.includes("T") ? dateString : dateString + "T00:00:00",
            );
            if (isNaN(date.getTime())) {
                console.error("Invalid date string:", dateString);
                return dateString;
            }
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const yearFull = date.getFullYear();
            const yearShort = String(yearFull).slice(-2);

            if (format === "MM/DD") {
                return `${month}/${day}`;
            }
            if (format === "YYYY-MM-DD") {
                return `${yearFull}-${month}-${day}`;
            }
            return `${month}/${day}/${yearShort}`;
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return dateString;
        }
    };

    // --- Data Loading ---
    const loadData = () => {
        // Try to load from sessionStorage first (passed from main app)
        const sessionData = sessionStorage.getItem("allTransactionsData");
        if (sessionData) {
            transactions = JSON.parse(sessionData) || [];
        } else {
            // Fallback to localStorage if the page is opened directly or refreshed
            transactions = JSON.parse(localStorage.getItem("transactions_v2")) || [];
        }
        transactions = transactions.map((t) => ({
            ...t,
            amount: Number(t.amount) || 0,
        }));
    };

    // --- Apply Theme ---
    const applyTheme = () => {
        // Try sessionStorage first, then fallback to localStorage
        const savedTheme =
            sessionStorage.getItem("appTheme") ||
            localStorage.getItem("theme") ||
            "light";
        document.body.dataset.theme = savedTheme;
    };

    // --- Get URL Parameters ---
    function getUrlParameters() {
        const params = new URLSearchParams(window.location.search);
        statementMonth = parseInt(params.get("month"), 10); // Base 10
        statementYear = parseInt(params.get("year"), 10); // Base 10

        if (
            isNaN(statementMonth) ||
            statementMonth < 0 ||
            statementMonth > 11 ||
            isNaN(statementYear) ||
            statementYear < 2000 ||
            statementYear > 2100
        ) {
            console.error("Invalid month or year parameter.");
            statementMonth = -1; // Mark as invalid
            statementYear = -1;
        }
    }

    // --- Generate and Display Statement ---
    const displayStatement = () => {
        loadData();
        getUrlParameters();
        applyTheme(); // Apply theme to the printable page

        if (statementMonth === -1 || statementYear === -1) {
            statementTitleEl.textContent = "Error: Invalid Month or Year";
            statementContentArea.innerHTML =
                '<p style="color: var(--danger-color);">Could not generate statement due to invalid parameters.</p>';
            return;
        }

        // Update Title
        statementTitleEl.textContent = `Monthly Statement: ${monthNames[statementMonth]} ${statementYear}`;

        // Filter Transactions (Logic copied from original generateMonthlyStatement)
        const monthTransactions = transactions
            .filter((t) => {
                try {
                    const transactionDate = new Date(t.date + "T00:00:00");
                    // Check if getTime() is valid before accessing month/year
                    return (
                        !isNaN(transactionDate.getTime()) &&
                        transactionDate.getMonth() === statementMonth &&
                        transactionDate.getFullYear() === statementYear
                    );
                } catch (e) {
                    return false;
                }
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        let monthlyIncome = 0;
        let monthlyExpenses = 0;
        let monthlySavingsDeposit = 0;
        let monthlySavingsWithdrawal = 0;

        let statementContent = `----------------------------------------\n`;
        statementContent += `Date       | Type    | Description          | Category           | Amount\n`;
        statementContent += `----------------------------------------\n`;

        if (monthTransactions.length === 0) {
            statementContent += "No transactions found for this month.\n";
        } else {
            monthTransactions.forEach((t) => {
                if (t.category === "Savings Deposit") {
                    monthlySavingsDeposit += t.amount;
                } else if (t.category === "Savings Withdrawal") {
                    monthlySavingsWithdrawal += t.amount;
                } else if (t.type === "income") {
                    monthlyIncome += t.amount;
                } else if (t.type === "expense") {
                    monthlyExpenses += t.amount;
                }

                const dateStr = formatDate(t.date, "MM/DD/YY").padEnd(10);
                const typeStr = (
                    t.type.charAt(0).toUpperCase() + t.type.slice(1)
                ).padEnd(8);
                const descStr = t.description.substring(0, 20).padEnd(20);
                const catStr = t.category.substring(0, 18).padEnd(18);
                const amountPrefix =
                    t.type === "income" || t.category === "Savings Withdrawal"
                        ? "+"
                        : "-";
                const amountStr = (amountPrefix + formatCurrency(t.amount)).padStart(8);

                statementContent += `${dateStr}| ${typeStr}| ${descStr}| ${catStr}| ${amountStr}\n`;
            });
            statementContent += `----------------------------------------\n`;
        }

        const netMonthlyOperating = monthlyIncome - monthlyExpenses;
        const netMonthlySavings = monthlySavingsDeposit - monthlySavingsWithdrawal;

        // Generate Summary (Logic copied from original generateMonthlyStatement)
        let summaryContent = `\nSummary (Operating):\n`;
        summaryContent += ` Total Income:      +${formatCurrency(monthlyIncome)}\n`;
        summaryContent += ` Total Expenses:    -${formatCurrency(monthlyExpenses)}\n`;
        summaryContent += ` Net Balance:        ${netMonthlyOperating >= 0 ? "+" : ""}${formatCurrency(netMonthlyOperating)}\n`;
        summaryContent += `\nSummary (Savings):\n`;
        summaryContent += ` Deposits:          +${formatCurrency(monthlySavingsDeposit)}\n`;
        summaryContent += ` Withdrawals:       -${formatCurrency(monthlySavingsWithdrawal)}\n`;
        summaryContent += ` Net Savings Flow:   ${netMonthlySavings >= 0 ? "+" : ""}${formatCurrency(netMonthlySavings)}\n`;
        summaryContent += `----------------------------------------\n`;

        // Display content in <pre> tags for formatting
        statementContentArea.innerHTML = `<pre>${statementContent}</pre><pre>${summaryContent}</pre>`;

        // Optionally trigger print dialog automatically after a short delay
        // setTimeout(() => { window.print(); }, 500);
    };

    // --- Initial Load ---
    displayStatement();
});
