const themeToggle = document.querySelector('[data-theme-toggle]');
const addExpenseButtons = document.querySelectorAll('[data-add-expense]');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.documentElement.toggleAttribute('data-dark');
  });
}

addExpenseButtons.forEach((button) => {
  button.addEventListener('click', () => {
    window.alert('Expense entry will be available in Phase 3.');
  });
});
