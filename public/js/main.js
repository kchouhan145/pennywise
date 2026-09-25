const themeToggle = document.querySelector('[data-theme-toggle]');
const addExpenseButtons = document.querySelectorAll('[data-add-expense]');
const modal = document.querySelector('[data-expense-modal]');
const modalCloseButton = document.querySelector('[data-close-modal]');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.documentElement.toggleAttribute('data-dark');
  });
}

function openExpenseModal() {
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeExpenseModal() {
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

addExpenseButtons.forEach((button) => {
  button.addEventListener('click', openExpenseModal);
});

if (modalCloseButton) {
  modalCloseButton.addEventListener('click', closeExpenseModal);
}

if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeExpenseModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeExpenseModal();
    }
  });
}
