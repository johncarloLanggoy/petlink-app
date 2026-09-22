    // Create floating particles
    function createParticles() {
      const particlesContainer = document.getElementById('particles');
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const size = Math.random() * 5 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
        particlesContainer.appendChild(particle);
      }
    }
    createParticles();

    async function handleForgot() {
      const email = document.getElementById('email').value.trim();
      const msg = document.getElementById('message');
      const btn = document.getElementById('resetBtn');
      const btnText = document.getElementById('btnText');
      
      const show = (text, type) => { 
        msg.textContent = text; 
        msg.className = 'message show ' + type; 
        setTimeout(() => {
          msg.classList.remove('show');
        }, 5000);
      };

      if (!email) return show('Please enter your email address.', 'error');

      btnText.innerHTML = 'Generating... <span class="loading"></span>';
      btn.disabled = true;

      try {
        const res = await fetch('/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        btnText.innerHTML = 'Generate reset link';
        btn.disabled = false;
        
        show(data.message, 'success');

        if (data.reset_link) {
          const box = document.getElementById('resetLinkBox');
          const link = document.getElementById('resetLink');
          link.href = data.reset_link;
          link.textContent = data.reset_link;
          box.style.display = 'block';
          box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } catch {
        btnText.innerHTML = 'Generate reset link';
        btn.disabled = false;
        show('Something went wrong. Please try again.', 'error');
      }
    }
    
    document.addEventListener('keydown', e => { if (e.key === 'Enter') handleForgot(); });
    
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.parentElement.style.transform = 'scale(1.02)';
      });
      input.addEventListener('blur', () => {
        input.parentElement.style.transform = 'scale(1)';
      });
    });