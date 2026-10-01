const themeToggle = document.querySelector('[data-theme-toggle]');
const addExpenseButtons = document.querySelectorAll('[data-add-expense]');
const modal = document.querySelector('[data-expense-modal]');
const modalCloseButton = document.querySelector('[data-close-modal]');
const progressBars = document.querySelectorAll('[data-progress-width]');
const categoryDots = document.querySelectorAll('[data-category-color]');

progressBars.forEach((progressBar) => {
  progressBar.style.width = `${progressBar.dataset.progressWidth}%`;
});

categoryDots.forEach((categoryDot) => {
  categoryDot.style.backgroundColor = categoryDot.dataset.categoryColor;
});

const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-dark', 'true');
    return;
  }

  document.documentElement.removeAttribute('data-dark');
};

if (themeToggle) {
  const storedTheme = localStorage.getItem('pennywise-theme');
  if (storedTheme) {
    applyTheme(storedTheme);
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.hasAttribute('data-dark');
    const nextTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('pennywise-theme', nextTheme);
    applyTheme(nextTheme);
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
