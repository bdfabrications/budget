document.addEventListener("DOMContentLoaded", () => {
  // --- State ---
  let transactions = [];
  let expenseChart = null;
  let savingsChart = null;
  let reportPeriod = "all";
  let startDate = "";
  let endDate = "";

  // --- DOM Elements ---
  const reportGeneratedDateEl = document.getElementById(
    "report-generated-date",
  );
  const reportPeriodDisplayEl = document.getElementById(
    "report-period-display",
  );
  const totalIncomeEl = document.getElementById("report-total-income");
  const totalExpensesEl = document.getElementById("report-total-expenses");
  const netBalanceEl = document.getElementById("report-net-balance");
  const totalSavingsDepositsEl = document.getElementById(
    "report-savings-deposits",
  );
  const totalSavingsWithdrawalsEl = document.getElementById(
    "report-savings-withdrawals",
  );
  const netSavingsEl = document.getElementById("report-net-savings");
  const transactionTableBody = document.querySelector(
    "#transaction-details-table tbody",
  );
  const incomeCategoryTableBody = document.querySelector(
    "#income-category-table tbody",
  );
  const expenseCategoryTableBody = document.querySelector(
    "#expense-category-table tbody",
  );
  const expenseChartCanvas = document.getElementById("report-expense-chart");
  const savingsChartCanvas = document.getElementById("report-savings-chart");
  const noTransactionsMsg = document.getElementById("no-transactions-message");
  const noIncomeCatMsg = document.getElementById(
    "no-income-categories-message",
  );
  const noExpenseCatMsg = document.getElementById(
    "no-expense-categories-message",
  );
  const noExpenseChartMsg = document.getElementById("report-no-expense-data");
  const noSavingsChartMsg = document.getElementById("report-no-savings-data");

  // --- Utility Functions ---
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
    const sessionData = sessionStorage.getItem("allTransactionsData");
    if (sessionData) {
      transactions = JSON.parse(sessionData) || [];
    } else {
      transactions = JSON.parse(localStorage.getItem("transactions_v2")) || [];
    }
    transactions = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount) || 0,
    }));

    // DEBUGGING: This will show us what data the report page is receiving.
    console.log(
      `Report loaded ${transactions.length} transactions from storage.`,
    );
  };

  // --- Get URL Parameters ---
  function getUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    reportPeriod = params.get("period") || "all";
    startDate = params.get("startDate") || "";
    endDate = params.get("endDate") || "";
  }

  // --- Report Generation ---
  const displayDetailedReport = () => {
    loadData();
    getUrlParameters();
    applyTheme();

    let periodText = "All Time";
    let startDateFilter, endDateFilter;

    endDateFilter = new Date();
    endDateFilter.setHours(23, 59, 59, 999);

    if (reportPeriod === "custom") {
      startDateFilter = startDate ? new Date(startDate + "T00:00:00") : null;
      endDateFilter = endDate ? new Date(endDate + "T23:59:59") : null;
      if (
        !startDateFilter ||
        !endDateFilter ||
        isNaN(startDateFilter.getTime()) ||
        isNaN(endDateFilter.getTime()) ||
        startDateFilter > endDateFilter
      ) {
        periodText = "Invalid Custom Range";
        reportPeriodDisplayEl.textContent = periodText;
        return;
      }
      periodText = `Custom: ${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else {
      const today = new Date();
      switch (reportPeriod) {
        case "weekly":
          startDateFilter = new Date();
          startDateFilter.setDate(today.getDate() - today.getDay());
          periodText = "This Week";
          break;
        case "biweekly":
          startDateFilter = new Date(
            today.getTime() - 13 * 24 * 60 * 60 * 1000,
          );
          periodText = "Last 14 Days";
          break;
        case "monthly":
          startDateFilter = new Date(today.getFullYear(), today.getMonth(), 1);
          periodText = "This Month";
          break;
        case "all":
        default:
          startDateFilter = new Date(0);
          periodText = "All Time";
          break;
      }
      startDateFilter.setHours(0, 0, 0, 0);
    }

    const filteredTransactions = transactions
      .filter((t) => {
        try {
          const transactionDate = new Date(
            t.date.includes("T") ? t.date : t.date + "T00:00:00",
          );
          return (
            !isNaN(transactionDate.getTime()) &&
            transactionDate >= startDateFilter &&
            transactionDate <= endDateFilter
          );
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let totalIncome = 0,
      totalExpenses = 0,
      totalSavingsDeposits = 0,
      totalSavingsWithdrawals = 0;
    const incomeByCategory = {},
      expenseByCategory = {},
      savingsDataForChart = [];
    let currentNetSavings = 0;

    filteredTransactions.forEach((t) => {
      let isSavingsTransaction = false;
      if (t.category === "Savings Deposit") {
        totalSavingsDeposits += t.amount;
        currentNetSavings += t.amount;
        isSavingsTransaction = true;
        totalExpenses += t.amount;
        expenseByCategory[t.category] =
          (expenseByCategory[t.category] || 0) + t.amount;
      } else if (t.category === "Savings Withdrawal") {
        totalSavingsWithdrawals += t.amount;
        currentNetSavings -= t.amount;
        isSavingsTransaction = true;
        totalIncome += t.amount;
        incomeByCategory[t.category] =
          (incomeByCategory[t.category] || 0) + t.amount;
      } else if (t.type === "income") {
        totalIncome += t.amount;
        incomeByCategory[t.category] =
          (incomeByCategory[t.category] || 0) + t.amount;
      } else {
        totalExpenses += t.amount;
        expenseByCategory[t.category] =
          (expenseByCategory[t.category] || 0) + t.amount;
      }
      if (isSavingsTransaction) {
        savingsDataForChart.push({
          date: t.date,
          netSavingsBalance: currentNetSavings,
        });
      }
    });

    const netBalance = totalIncome - totalExpenses;
    const netSavingsChange = totalSavingsDeposits - totalSavingsWithdrawals;

    reportGeneratedDateEl.textContent = formatDate(
      new Date().toISOString().split("T")[0],
    );
    reportPeriodDisplayEl.textContent = periodText;
    totalIncomeEl.textContent = formatCurrency(totalIncome);
    totalExpensesEl.textContent = formatCurrency(totalExpenses);
    netBalanceEl.textContent = formatCurrency(netBalance);
    netBalanceEl.className = netBalance >= 0 ? "text-income" : "text-expense";
    totalSavingsDepositsEl.textContent = formatCurrency(totalSavingsDeposits);
    totalSavingsWithdrawalsEl.textContent = formatCurrency(
      totalSavingsWithdrawals,
    );
    netSavingsEl.textContent = formatCurrency(netSavingsChange);
    netSavingsEl.className = "text-savings";

    transactionTableBody.innerHTML = "";
    if (filteredTransactions.length > 0) {
      noTransactionsMsg.style.display = "none";
      filteredTransactions.forEach((t) => {
        const row = transactionTableBody.insertRow();
        row.innerHTML = `
                    <td data-label="Date" class="date-col">${formatDate(t.date, "MM/DD")}</td>
                    <td data-label="Type" class="type-col">${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</td>
                    <td data-label="Description" class="desc-col">${t.description}</td>
                    <td data-label="Category" class="cat-col">${t.category}</td>
                    <td data-label="Amount" class="amount amount-col ${t.type === "income" ? "text-income" : "text-expense"}">${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}</td>
                `;
      });
    } else {
      noTransactionsMsg.style.display = "block";
    }

    incomeCategoryTableBody.innerHTML = "";
    const sortedIncomeCategories = Object.entries(incomeByCategory).sort(
      ([, a], [, b]) => b - a,
    );
    if (sortedIncomeCategories.length > 0) {
      noIncomeCatMsg.style.display = "none";
      sortedIncomeCategories.forEach(([category, amount]) => {
        const percentage =
          totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : 0;
        incomeCategoryTableBody.innerHTML += `<tr><td>${category}</td><td class="amount text-income">${formatCurrency(amount)}</td><td class="percentage">${percentage}%</td></tr>`;
      });
    } else {
      noIncomeCatMsg.style.display = "block";
    }

    expenseCategoryTableBody.innerHTML = "";
    const sortedExpenseCategories = Object.entries(expenseByCategory).sort(
      ([, a], [, b]) => b - a,
    );
    if (sortedExpenseCategories.length > 0) {
      noExpenseCatMsg.style.display = "none";
      sortedExpenseCategories.forEach(([category, amount]) => {
        const percentage =
          totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
        expenseCategoryTableBody.innerHTML += `<tr><td>${category}</td><td class="amount text-expense">${formatCurrency(amount)}</td><td class="percentage">${percentage}%</td></tr>`;
      });
    } else {
      noExpenseCatMsg.style.display = "block";
    }

    updateExpenseChart(expenseByCategory);
    updateSavingsChart(savingsDataForChart);
  };

  const updateExpenseChart = (expenseData) => {
    const chartExpenseData = { ...expenseData };
    delete chartExpenseData["Savings Deposit"];
    const labels = Object.keys(chartExpenseData).sort(
      (a, b) => chartExpenseData[b] - chartExpenseData[a],
    );
    const data = labels.map((label) => chartExpenseData[label]);
    const hasData = data.length > 0;
    noExpenseChartMsg.style.display = hasData ? "none" : "block";
    expenseChartCanvas.style.display = hasData ? "block" : "none";
    if (expenseChart) {
      expenseChart.destroy();
    }
    if (hasData) {
      const bodyStyle = getComputedStyle(document.body);
      expenseChart = new Chart(expenseChartCanvas, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              label: "Expenses",
              data,
              backgroundColor: [
                "#dc3545",
                "#6c757d",
                "#ffc107",
                "#fd7e14",
                "#17a2b8",
                "#6610f2",
                "#20c997",
                "#e83e8c",
              ].map((c) => c + "dd"),
              borderColor: bodyStyle.getPropertyValue("--card-bg-color").trim(),
              borderWidth: 1,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: bodyStyle.getPropertyValue("--text-color").trim(),
                padding: 10,
                usePointStyle: true,
                font: { size: 11 },
              },
            },
            tooltip: {
              callbacks: {
                label: (c) =>
                  `$${formatCurrency(c.parsed)} (${((c.parsed / c.dataset.data.reduce((a, v) => a + v, 0)) * 100).toFixed(1)}%)`,
              },
            },
          },
        },
      });
    }
  };

  const updateSavingsChart = (savingsData) => {
    const aggregatedData = savingsData.reduce((acc, entry) => {
      acc[entry.date] = entry.netSavingsBalance;
      return acc;
    }, {});
    const labels = Object.keys(aggregatedData).sort(
      (a, b) => new Date(a) - new Date(b),
    );
    const dataPoints = labels.map((date) => aggregatedData[date]);
    const hasData = dataPoints.length > 0;
    noSavingsChartMsg.style.display = hasData ? "none" : "block";
    savingsChartCanvas.style.display = hasData ? "block" : "none";
    if (savingsChart) {
      savingsChart.destroy();
    }
    if (hasData) {
      const bodyStyle = getComputedStyle(document.body);
      savingsChart = new Chart(savingsChartCanvas, {
        type: "line",
        data: {
          labels: labels.map((date) => formatDate(date, "MM/DD")),
          datasets: [
            {
              label: "Net Savings Balance",
              data: dataPoints,
              borderColor: bodyStyle.getPropertyValue("--info-color").trim(),
              backgroundColor:
                bodyStyle.getPropertyValue("--info-color").trim() + "33",
              tension: 0.1,
              fill: true,
              pointRadius: 2,
              borderWidth: 1.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            y: {
              ticks: {
                color: bodyStyle.getPropertyValue("--text-color").trim(),
                callback: (v) => "$" + formatCurrency(v),
              },
              grid: {
                color:
                  bodyStyle.getPropertyValue("--border-color").trim() + "80",
              },
            },
            x: {
              ticks: {
                color: bodyStyle.getPropertyValue("--text-color").trim(),
              },
              grid: { display: false },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) =>
                  c.dataset.label + ": $" + formatCurrency(c.parsed.y),
              },
            },
          },
        },
      });
    }
  };

  const applyTheme = () => {
    const savedTheme =
      sessionStorage.getItem("appTheme") ||
      localStorage.getItem("theme") ||
      "light";
    document.body.dataset.theme = savedTheme;
  };

  // --- Initial Load ---
  displayDetailedReport();
});
