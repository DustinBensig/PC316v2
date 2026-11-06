(() => {
  const form = document.querySelector('#registerForm');
  if (!form) return;

  const message = document.querySelector('#registerMessage');
  const submit = document.querySelector('#registerSubmit');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    message.textContent = '';
    const data = new FormData(form);
    if (data.get('password') !== data.get('confirmPassword')) {
      message.textContent = 'Passwords do not match.';
      return;
    }

    submit.disabled = true;
    try {
      const response = await fetch('api/student/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          program: data.get('program'),
          password: data.get('password'),
          confirmPassword: data.get('confirmPassword')
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        message.textContent = result.message || 'Account registration could not be completed.';
        return;
      }
      message.textContent = result.message;
      form.reset();
      window.setTimeout(() => { window.location.href = 'login.html'; }, 1800);
    } catch (error) {
      message.textContent = 'The registration service is unavailable. Please try again.';
    } finally {
      submit.disabled = false;
    }
  });
})();
