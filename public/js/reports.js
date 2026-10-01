const categoryChartEl = document.getElementById('categoryChart');

if (categoryChartEl) {
  new Chart(categoryChartEl, {
    type: 'doughnut',
    data: {
      labels: JSON.parse(categoryChartEl.dataset.labels),
      datasets: [{
        data: JSON.parse(categoryChartEl.dataset.values),
        backgroundColor: JSON.parse(categoryChartEl.dataset.colors),
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
      },
      cutout: '58%',
    },
  });
}

const dailyChartEl = document.getElementById('dailyChart');

if (dailyChartEl) {
  new Chart(dailyChartEl, {
    type: 'bar',
    data: {
      labels: JSON.parse(dailyChartEl.dataset.labels),
      datasets: [{
        label: 'Spend',
        data: JSON.parse(dailyChartEl.dataset.values),
        backgroundColor: '#2d7958',
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `₹${value}`,
          },
        },
      },
    },
  });
}