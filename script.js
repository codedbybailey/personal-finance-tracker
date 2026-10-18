"use strict";

const STORAGE_KEY = "bloom-balance.transactions.v1";
const MAX_AMOUNT_CENTS = 99999999999;
const categories = {
    expense: ["Food & groceries", "Housing", "Transport", "Bills", "Health", "Shopping", "Leisure", "Other expense"],
    income: ["Salary", "Freelance", "Gifts", "Other income"]
};
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const form = document.getElementById("transaction-form");
const fields = {
    description: document.getElementById("description"),
    amount: document.getElementById("amount"),
    type: document.getElementById("type"),
    category: document.getElementById("category"),
    date: document.getElementById("date")
};
const typeFilter = document.getElementById("filter-type");
const categoryFilter = document.getElementById("filter-category");
const chartYear = document.getElementById("chart-year");
let transactions = [];
let editingId = null;
let storageWritable = true;

function formatMoney(cents) {
    return currency.format(cents / 100);
}

function today() {
    const now = new Date();
    // Use the local calendar date rather than UTC, which can be a day ahead.
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01") {
        return false;
    }
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseAmount(value) {
    // Split the decimal string so 0.29 becomes exactly 29 cents.
    const text = value.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(text)) {
        return null;
    }
    const [dollars, fraction = ""] = text.split(".");
    const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
    return Number.isSafeInteger(cents) && cents > 0 && cents <= MAX_AMOUNT_CENTS ? cents : null;
}

function calculateTotals(items = transactions) {
    let income = 0;
    let expenses = 0;
    for (const transaction of items) {
        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expenses += transaction.amount;
        }
    }
    return { income, expenses, balance: income - expenses };
}

function totalsAreSafe(items) {
    const totals = calculateTotals(items);
    return Number.isSafeInteger(totals.income) && Number.isSafeInteger(totals.expenses);
}

function showStorageMessage(message) {
    const notice = document.getElementById("storage-message");
    notice.textContent = message;
    notice.hidden = !message;
}

function validTransaction(transaction) {
    return transaction && typeof transaction.id === "string" && transaction.id.length > 0
        && typeof transaction.description === "string" && transaction.description.trim().length > 0
        && transaction.description.length <= 100 && Number.isSafeInteger(transaction.amount)
        && transaction.amount > 0 && transaction.amount <= MAX_AMOUNT_CENTS
        && Object.hasOwn(categories, transaction.type) && categories[transaction.type].includes(transaction.category)
        && typeof transaction.date === "string" && validDate(transaction.date);
}

function loadTransactions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) {
            return [];
        }
        const saved = JSON.parse(raw);
        if (!Array.isArray(saved) || !saved.every(validTransaction)
            || new Set(saved.map(transaction => transaction.id)).size !== saved.length || !totalsAreSafe(saved)) {
            throw new Error("Invalid saved transactions");
        }
        return saved;
    } catch (error) {
        // Keep existing storage untouched if it is unreadable or has an unknown format.
        storageWritable = false;
        showStorageMessage("Saved transactions could not be read. Changes will stay in this tab only. Existing browser data has not been overwritten.");
        return [];
    }
}

function saveTransactions() {
    if (!storageWritable) {
        return false;
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        showStorageMessage("");
        return true;
    } catch (error) {
        showStorageMessage("Changes could not be saved in this browser. Keep this tab open to retain them, or allow site storage and try again.");
        return false;
    }
}

function populateSelect(select, options, firstLabel) {
    const previous = select.value;
    select.replaceChildren();
    if (firstLabel) {
        select.add(new Option(firstLabel, "all"));
    }
    for (const value of options) {
        select.add(new Option(value, value));
    }
    if (Array.from(select.options).some(option => option.value === previous)) {
        select.value = previous;
    }
}

function updateCategories() {
    populateSelect(fields.category, categories[fields.type.value]);
}

function updateFilterCategories() {
    const options = typeFilter.value === "all" ? Object.values(categories).flat() : categories[typeFilter.value];
    populateSelect(categoryFilter, options, "All categories");
}

function clearErrors() {
    for (const name of ["description", "amount", "category", "date"]) {
        fields[name].removeAttribute("aria-invalid");
        const error = document.getElementById(`${name}-error`);
        error.textContent = "";
        error.hidden = true;
    }
}

function readTransaction() {
    clearErrors();
    const amount = parseAmount(fields.amount.value);
    const description = fields.description.value.trim();
    const errors = {};
    if (!description || description.length > 100) {
        errors.description = "Enter a description of 1 to 100 characters.";
    }
    if (amount === null) {
        errors.amount = "Enter an amount greater than zero, up to 999,999,999.99, with no more than two decimal places.";
    }
    if (!Object.hasOwn(categories, fields.type.value) || !categories[fields.type.value].includes(fields.category.value)) {
        errors.category = "Choose a category for this transaction type.";
    }
    if (!validDate(fields.date.value)) {
        errors.date = "Enter a valid date from 1900 onwards.";
    }
    for (const [name, message] of Object.entries(errors)) {
        fields[name].setAttribute("aria-invalid", "true");
        const error = document.getElementById(`${name}-error`);
        error.textContent = message;
        error.hidden = false;
    }
    if (Object.keys(errors).length) {
        document.getElementById("form-message").textContent = "Check the marked fields.";
        fields[Object.keys(errors)[0]].focus();
        return null;
    }
    return { description, amount, type: fields.type.value, category: fields.category.value, date: fields.date.value };
}

function resetForm() {
    editingId = null;
    form.reset();
    fields.date.value = today();
    updateCategories();
    clearErrors();
    document.getElementById("form-heading").textContent = "Add transaction";
    document.getElementById("submit-transaction").textContent = "Add transaction";
    document.getElementById("cancel-edit").hidden = true;
}

function addTransaction(event) {
    event.preventDefault();
    const values = readTransaction();
    if (!values) {
        return;
    }
    const wasEditing = editingId !== null;
    const id = editingId || createId();
    const next = wasEditing
        ? transactions.map(transaction => transaction.id === id ? { id, ...values } : transaction)
        : [...transactions, { id, ...values }];
    if (!totalsAreSafe(next)) {
        document.getElementById("form-message").textContent = "This amount would exceed the supported total. Enter a smaller amount.";
        fields.amount.focus();
        return;
    }
    transactions = next;
    const saved = saveTransactions();
    resetForm();
    renderDashboard();
    document.getElementById("form-message").textContent = `${wasEditing ? "Transaction updated." : "Transaction added."}${saved ? "" : " This change is not saved to browser storage."}`;
    document.getElementById("activity-message").textContent = "";
    fields.description.focus();
}

function createId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }
    // Fallback for browsers without randomUUID, including some local file contexts.
    let id;
    do {
        id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    } while (transactions.some(transaction => transaction.id === id));
    return id;
}

function editTransaction(id) {
    const transaction = transactions.find(item => item.id === id);
    if (!transaction) {
        return;
    }
    editingId = id;
    fields.type.value = transaction.type;
    updateCategories();
    fields.description.value = transaction.description;
    fields.amount.value = `${Math.floor(transaction.amount / 100)}.${String(transaction.amount % 100).padStart(2, "0")}`;
    fields.category.value = transaction.category;
    fields.date.value = transaction.date;
    clearErrors();
    document.getElementById("form-heading").textContent = "Edit transaction";
    document.getElementById("submit-transaction").textContent = "Save changes";
    document.getElementById("cancel-edit").hidden = false;
    document.getElementById("form-message").textContent = "Editing transaction. Save your changes or cancel.";
    fields.description.focus();
}

function deleteTransaction(id) {
    const transaction = transactions.find(item => item.id === id);
    if (!transaction || !window.confirm(`Delete “${transaction.description}” (${formatMoney(transaction.amount)})?`)) {
        return;
    }
    transactions = transactions.filter(item => item.id !== id);
    if (editingId === id) {
        resetForm();
        document.getElementById("form-message").textContent = "";
    }
    const saved = saveTransactions();
    renderDashboard();
    document.getElementById("activity-message").textContent = `Transaction deleted.${saved ? "" : " This change is not saved to browser storage."}`;
    // The deleted button no longer exists; return keyboard focus to the history controls.
    typeFilter.focus();
}

function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

function renderTransactions() {
    const list = document.getElementById("transaction-list");
    list.replaceChildren();
    const filtered = transactions.filter(transaction => (typeFilter.value === "all" || transaction.type === typeFilter.value)
        && (categoryFilter.value === "all" || transaction.category === categoryFilter.value));
    filtered.sort((a, b) => b.date.localeCompare(a.date));
    for (const transaction of filtered) {
        const row = makeElement("article", "transaction-row");
        const detail = makeElement("div", "transaction-detail");
        detail.append(makeElement("h3", "transaction-description", transaction.description));
        const meta = makeElement("p", "transaction-meta");
        const date = makeElement("time", "", new Date(`${transaction.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
        date.dateTime = transaction.date;
        meta.append(date, document.createTextNode(` · ${transaction.category}`));
        detail.append(meta);
        const amount = makeElement("p", `transaction-amount ${transaction.type}`, `${transaction.type === "income" ? "+" : "−"}${formatMoney(transaction.amount)}`);
        amount.setAttribute("aria-label", `${transaction.type === "income" ? "Income" : "Expense"}: ${formatMoney(transaction.amount)}`);
        const actions = makeElement("div", "transaction-actions");
        for (const action of ["edit", "delete"]) {
            const button = makeElement("button", "button-quiet", action === "edit" ? "Edit" : "Delete");
            button.type = "button";
            button.dataset.action = action;
            button.dataset.id = transaction.id;
            button.setAttribute("aria-label", `${button.textContent} ${transaction.description}, ${transaction.date}, ${formatMoney(transaction.amount)}`);
            actions.append(button);
        }
        row.append(detail, amount, actions);
        list.append(row);
    }
    document.getElementById("transaction-count").textContent = `${filtered.length} of ${transactions.length} transactions`;
    document.getElementById("transactions-empty").hidden = filtered.length > 0;
    document.getElementById("empty-heading").textContent = transactions.length ? "No matching transactions." : "No transactions yet.";
    document.getElementById("empty-support").textContent = transactions.length ? "Choose another type or category to see more activity." : "Add your first income or expense to get started.";
}

function monthlyTotals(year) {
    const months = Array.from({ length: 12 }, () => ({ income: 0, expense: 0 }));
    for (const transaction of transactions) {
        if (transaction.date.slice(0, 4) === year) {
            months[Number(transaction.date.slice(5, 7)) - 1][transaction.type] += transaction.amount;
        }
    }
    return months;
}

function renderCharts() {
    const breakdown = document.getElementById("expense-breakdown");
    breakdown.replaceChildren();
    const expenseTotals = new Map();
    let total = 0;
    for (const transaction of transactions) {
        if (transaction.type === "expense") {
            expenseTotals.set(transaction.category, (expenseTotals.get(transaction.category) || 0) + transaction.amount);
            total += transaction.amount;
        }
    }
    document.getElementById("breakdown-empty").hidden = total > 0;
    for (const [category, amount] of [...expenseTotals].sort((a, b) => b[1] - a[1])) {
        const item = makeElement("li", "breakdown-item");
        const label = makeElement("div", "breakdown-label");
        label.append(makeElement("span", "", category), makeElement("span", "financial-value", `${formatMoney(amount)} · ${(amount / total * 100).toFixed(1)}%`));
        const track = makeElement("div", "breakdown-track");
        track.setAttribute("aria-hidden", "true");
        const fill = makeElement("div", "breakdown-fill");
        fill.style.width = `${amount / total * 100}%`;
        track.append(fill);
        item.append(label, track);
        breakdown.append(item);
    }
    const previousYear = chartYear.value;
    const years = [...new Set([String(new Date().getFullYear()), ...transactions.map(transaction => transaction.date.slice(0, 4))])].sort().reverse();
    populateSelect(chartYear, years);
    chartYear.value = years.includes(previousYear) ? previousYear : String(new Date().getFullYear());
    const months = monthlyTotals(chartYear.value);
    const maximum = Math.max(1, ...months.flatMap(month => [month.income, month.expense]));
    const chart = document.getElementById("monthly-chart");
    const table = document.getElementById("monthly-table");
    chart.replaceChildren();
    table.replaceChildren();
    document.getElementById("monthly-empty").hidden = months.some(month => month.income || month.expense);
    document.getElementById("monthly-caption").textContent = `Monthly totals for ${chartYear.value} in USD`;
    months.forEach((month, index) => {
        const column = makeElement("div", "month-column");
        const bars = makeElement("div", "month-bars");
        bars.setAttribute("role", "img");
        bars.setAttribute("aria-label", `${monthNames[index]} ${chartYear.value}: income ${formatMoney(month.income)}, expenses ${formatMoney(month.expense)}`);
        for (const type of ["income", "expense"]) {
            const bar = makeElement("div", `month-bar bar-${type}`);
            bar.style.height = `${month[type] / maximum * 100}%`;
            bar.title = `${type === "income" ? "Income" : "Expenses"}: ${formatMoney(month[type])}`;
            bars.append(bar);
        }
        column.append(bars, makeElement("span", "chart-label", monthNames[index]));
        chart.append(column);
        const row = document.createElement("tr");
        const heading = makeElement("th", "", monthNames[index]);
        heading.scope = "row";
        row.append(heading, makeElement("td", "financial-value", formatMoney(month.income)), makeElement("td", "financial-value", formatMoney(month.expense)));
        table.append(row);
    });
}

function renderDashboard() {
    const totals = calculateTotals();
    document.getElementById("current-balance").textContent = formatMoney(totals.balance);
    document.getElementById("total-income").textContent = formatMoney(totals.income);
    document.getElementById("total-expenses").textContent = formatMoney(totals.expenses);
    renderTransactions();
    renderCharts();
}

function animateEntrance() {
    if (!window.gsap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }
    // Animate headings only; amounts, chart bars, and form controls stay still.
    const media = window.gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
        window.gsap.fromTo(".site-header h1, .editorial-accent", { opacity: 0, y: 8 }, {
            opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: "power1.out", clearProps: "all"
        });
    });
}

form.addEventListener("submit", addTransaction);
fields.type.addEventListener("change", updateCategories);
document.getElementById("cancel-edit").addEventListener("click", () => {
    resetForm();
    document.getElementById("form-message").textContent = "Edit cancelled.";
    fields.description.focus();
});
typeFilter.addEventListener("change", () => {
    updateFilterCategories();
    renderTransactions();
});
categoryFilter.addEventListener("change", renderTransactions);
chartYear.addEventListener("change", renderCharts);
document.getElementById("transaction-list").addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
        return;
    }
    if (button.dataset.action === "edit") {
        editTransaction(button.dataset.id);
    } else if (button.dataset.action === "delete") {
        deleteTransaction(button.dataset.id);
    }
});

transactions = loadTransactions();
resetForm();
updateFilterCategories();
renderDashboard();
animateEntrance();
