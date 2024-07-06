let expenses = JSON.parse(localStorage.getItem('expenses')) || {};
let monthlyBudget = localStorage.getItem('monthlyBudget') || 0;
let chart;
let selectedMonth = getCurrentMonth();

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function updateMonthSelector() {
    const selector = document.getElementById('month-selector');
    selector.innerHTML = '';
    const months = Object.keys(expenses).sort().reverse();
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        selector.appendChild(option);
    });
    if (!months.includes(getCurrentMonth())) {
        const option = document.createElement('option');
        option.value = getCurrentMonth();
        option.textContent = getCurrentMonth();
        selector.insertBefore(option, selector.firstChild);
    }
    selector.value = selectedMonth;
}

function changeMonth() {
    selectedMonth = document.getElementById('month-selector').value;
    renderExpenses();
}

function checkAndUpdateMonth() {
    const currentMonth = getCurrentMonth();
    if (!expenses[currentMonth] || !Array.isArray(expenses[currentMonth])) {
        expenses[currentMonth] = [];
    }
    if (!expenses[selectedMonth] || !Array.isArray(expenses[selectedMonth])) {
        expenses[selectedMonth] = [];
    }
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateMonthSelector();
}

function renderExpenses() {
    checkAndUpdateMonth();

    const expensesDiv = document.getElementById('expenses');
    expensesDiv.innerHTML = '';
    let total = 0;

    if (expenses[selectedMonth] && Array.isArray(expenses[selectedMonth])) {
        expenses[selectedMonth].forEach((expense, index) => {
            const expenseDiv = document.createElement('div');
            expenseDiv.className = 'expense-item';
            expenseDiv.innerHTML = `
                <span>${expense.description} - €${expense.amount} (${expense.category}) - ${expense.date}</span>
                <span class="delete-btn" onclick="deleteExpense(${index})">Delete</span>
            `;
            expensesDiv.appendChild(expenseDiv);
            total += Number(expense.amount);
        });
    } else {
        expensesDiv.innerHTML = '<p>No expenses for this month.</p>';
    }

    document.getElementById('current-month').textContent = `Selected Month: ${selectedMonth}`;
    document.getElementById('total').textContent = `Total Expenses: €${total.toFixed(2)}`;
    updateBudgetProgress(total);
    updateChart();
}

function addExpense() {
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    if (description && amount && date && category) {
        const expenseMonth = date.substring(0, 7); // Get YYYY-MM from the date
        if (!expenses[expenseMonth]) {
            expenses[expenseMonth] = [];
        }
        expenses[expenseMonth].push({ description, amount, date, category });
        localStorage.setItem('expenses', JSON.stringify(expenses));
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        updateMonthSelector();
        if (expenseMonth === selectedMonth) {
            renderExpenses();
        }
    }
}

function deleteExpense(index) {
    expenses[selectedMonth].splice(index, 1);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    renderExpenses();
}

function setMonthlyBudget() {
    monthlyBudget = document.getElementById('monthly-budget').value;
    localStorage.setItem('monthlyBudget', monthlyBudget);
    updateBudgetProgress(calculateTotalExpenses());
}

function updateBudgetProgress(totalExpenses) {
    const progressDiv = document.getElementById('budget-progress');
    const remainingDiv = document.getElementById('budget-remaining');
    if (monthlyBudget > 0) {
        const percentageSpent = (totalExpenses / monthlyBudget) * 100;
        const remaining = monthlyBudget - totalExpenses;
        progressDiv.textContent = `Budget Progress: ${percentageSpent.toFixed(2)}% (€${totalExpenses.toFixed(2)} / €${monthlyBudget})`;
        remainingDiv.textContent = `Remaining Budget: €${remaining.toFixed(2)}`;
    } else {
        progressDiv.textContent = 'Set a monthly budget to track progress';
        remainingDiv.textContent = '';
    }
}

function calculateTotalExpenses() {
    return expenses[selectedMonth] && Array.isArray(expenses[selectedMonth]) 
        ? expenses[selectedMonth].reduce((total, expense) => total + Number(expense.amount), 0) 
        : 0;
}

function updateChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const categoryTotals = expenses[selectedMonth] && Array.isArray(expenses[selectedMonth]) 
        ? expenses[selectedMonth].reduce((totals, expense) => {
            totals[expense.category] = (totals[expense.category] || 0) + Number(expense.amount);
            return totals;
        }, {}) 
        : {};

    const totalExpenses = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    const data = {
        labels: Object.keys(categoryTotals),
        datasets: [{
            data: Object.values(categoryTotals),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
        }]
    };

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Expenses by Category',
                    font: {
                        size: 18
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = ((value / totalExpenses) * 100).toFixed(2);
                            return `${label}: €${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize
document.getElementById('monthly-budget').value = monthlyBudget;
document.getElementById('date').valueAsDate = new Date();
updateMonthSelector();
renderExpenses();

// Add event listener to update on page load
window.addEventListener('load', renderExpenses);