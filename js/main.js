// Waitlist form
document.querySelector('.waitlist-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button');
  btn.textContent = "You're on the list!";
  btn.disabled = true;
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});
