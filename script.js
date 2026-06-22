    (function() {
      // ----- STATE (localStorage simulation) -----
      let users = JSON.parse(localStorage.getItem('fusUsers')) || [];
      let bookings = JSON.parse(localStorage.getItem('fusBookings')) || [];
      let reviews = JSON.parse(localStorage.getItem('fusReviews')) || [];

      let currentUser = null; // { email, name, role }

      // DOM refs
      const pages = {
        splash: document.getElementById('page-splash'),
        login: document.getElementById('page-login'),
        signup: document.getElementById('page-signup'),
        home: document.getElementById('page-home'),
        services: document.getElementById('page-services'),
        booking: document.getElementById('page-booking'),
        mybookings: document.getElementById('page-mybookings'),
        confirmation: document.getElementById('page-confirmation'),
        reviews: document.getElementById('page-reviews'),
        admin: document.getElementById('page-admin')
      };
      const navItems = document.querySelectorAll('.nav-item');
      const userStatus = document.getElementById('userStatus');

      // ----- SERVICE DATA -----
      const serviceData = {
        home: {
          title: 'Home Decluttering',
          desc: 'We transform chaotic living spaces into calm, functional areas. Our team sorts, organizes, and optimizes every corner – from closets and kitchens to basements and garages. We help you let go of what no longer serves you, creating a home that breathes and flows.',
          highlight: '⏱ 2–4 hrs · full-home package',
          features: ['🧹 Full home assessment', '📦 Donation coordination', '🏷️ Custom labeling system', '♻️ Eco-friendly disposal']
        },
        hostel: {
          title: 'Hostel Room Organization',
          desc: 'Compact spaces need smart solutions. We maximize every square inch of your hostel room with space-saving hacks, modular storage, and streamlined systems. Enjoy a clutter-free, peaceful retreat that feels twice as big and works for your student lifestyle.',
          highlight: '⏱ 1–2 hrs · student-friendly',
          features: ['📚 Desk & study area optimization', '🧳 Luggage storage solutions', '🛏️ Bed area organization', '💡 Smart lighting setup']
        },
        office: {
          title: 'Office Organization',
          desc: 'Boost productivity and reduce stress with a professionally organized office. We declutter desks, filing systems, common areas, and meeting rooms. Our approach improves workflow, saves time, and creates a polished environment that impresses clients and calms employees.',
          highlight: '⏱ 3–5 hrs · team workshops available',
          features: ['📊 Paper & digital filing systems', '🖥️ Cable management', '📅 Meeting room optimization', '🧑‍💼 Ergonomic assessments']
        },
        mobility: {
          title: 'Mobility-Friendly Organization',
          desc: 'Designed for accessibility and ease. We reorganize spaces to reduce physical strain, improve navigation, and keep essentials within reach. Our service supports seniors, people with disabilities, and anyone needing a safer, more functional home environment.',
          highlight: '⏱ 2–3 hrs · safety audit included',
          features: ['♿ Clear pathways & navigation', '🔑 Easy-reach storage', '🛋️ Furniture rearrangement', '🆘 Emergency access planning']
        },
        packing: {
          title: 'Packing & Sorting',
          desc: 'Efficient relocation starts here. We help you sort, categorize, and pack your belongings with precision. Whether you\'re moving, downsizing, or just need to clear out a space, our team ensures everything is organized, labeled, and ready for its next chapter.',
          highlight: '⏱ 2–6 hrs · custom timeline',
          features: ['📦 Professional packing materials', '🏷️ Color-coded labeling', '📋 Inventory tracking', '🚛 Loading assistance']
        },
        transformation: {
          title: 'Space Transformation',
          desc: 'Complete makeovers for any room. We take your space from cluttered to curated with a full redesign. Our team handles furniture layout, storage solutions, décor placement, and organizational systems to create a space that feels brand new and perfectly suited to your lifestyle.',
          highlight: '⏱ 4–8 hrs · full transformation',
          features: ['🎨 Design consultation', '🛋️ Furniture arrangement', '🖼️ Décor styling', '📐 Custom storage solutions']
        }
      };

      // ----- HELPERS -----
      function saveUsers() { localStorage.setItem('fusUsers', JSON.stringify(users)); }
      function saveBookings() { localStorage.setItem('fusBookings', JSON.stringify(bookings)); }
      function saveReviews() { localStorage.setItem('fusReviews', JSON.stringify(reviews)); }

      function showPage(pageId) {
        Object.keys(pages).forEach(key => pages[key].classList.remove('active'));
        if (pages[pageId]) pages[pageId].classList.add('active');

        const isAdmin = currentUser && currentUser.role === 'admin';
        const isCustomer = currentUser && currentUser.role === 'customer';

        navItems.forEach(item => {
          const page = item.dataset.page;
          if (isAdmin) {
            if (['home', 'services', 'booking', 'reviews', 'mybookings'].includes(page)) {
              item.classList.add('hidden-nav');
            } else {
              item.classList.remove('hidden-nav');
            }
          } else if (isCustomer) {
            item.classList.remove('hidden-nav');
          } else {
            if (page === 'admin') item.classList.add('hidden-nav');
            else item.classList.remove('hidden-nav');
          }
          item.classList.remove('active');
          if (item.dataset.page === pageId) item.classList.add('active');
        });

        if (pageId === 'admin') {
          navItems.forEach(item => item.classList.remove('active'));
        }

        // Hide service detail when leaving services page
        if (pageId !== 'services') {
          document.getElementById('serviceDetail').classList.remove('visible');
        }

        updateUserStatus();
      }

      function updateUserStatus() {
        if (currentUser) {
          const roleLabel = currentUser.role === 'admin' ? '<span class="role-tag">Admin</span>' : '';
          userStatus.style.display = 'inline-flex';
          userStatus.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.name} ${roleLabel}`;
        } else {
          userStatus.style.display = 'none';
        }
      }

      function isLoggedIn() { return currentUser !== null; }
      function isAdmin() { return currentUser && currentUser.role === 'admin'; }
      function isCustomer() { return currentUser && currentUser.role === 'customer'; }

      // ----- RENDER ADMIN -----
      function renderAdmin() {
        const total = bookings.length;
        const pending = bookings.filter(b => b.status === 'pending').length;
        const confirmed = bookings.filter(b => b.status === 'confirmed').length;
        const completed = bookings.filter(b => b.status === 'completed').length;
        document.getElementById('totalBookings').textContent = total;
        document.getElementById('pendingBookings').textContent = pending;
        document.getElementById('confirmedBookings').textContent = confirmed;
        document.getElementById('completedBookings').textContent = completed;

        const list = document.getElementById('adminBookingList');
        if (bookings.length === 0) {
          list.innerHTML = `<div style="text-align:center;color:#567a5e;padding:20px 0;">No bookings yet</div>`;
        } else {
          let html = '';
          bookings.forEach((b, idx) => {
            const statusClass = b.status || 'pending';
            const statusLabel = statusClass.charAt(0).toUpperCase() + statusClass.slice(1);
            html += `
              <div class="booking-item" data-id="${idx}">
                <div class="row1">
                  <span><strong>${b.customerName || b.name}</strong> · ${b.service}</span>
                  <span class="badge ${statusClass}">${statusLabel}</span>
                </div>
                <div class="row2">
                  <span><i class="fas fa-phone"></i> ${b.phone} · <i class="fas fa-map-pin"></i> ${b.location}</span>
                  <span>${b.date} at ${b.time}</span>
                </div>
                <div class="actions">
                  ${statusClass === 'pending' ? `<button class="approve" data-id="${idx}">Confirm</button><button class="reject" data-id="${idx}">Reject</button>` : ''}
                  ${statusClass === 'confirmed' ? `<button class="complete" data-id="${idx}">Complete</button>` : ''}
                </div>
              </div>
            `;
          });
          list.innerHTML = html;
          list.querySelectorAll('.approve').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              const idx = parseInt(this.dataset.id);
              if (bookings[idx]) { bookings[idx].status = 'confirmed';
                saveBookings();
                renderAdmin(); }
            });
          });
          list.querySelectorAll('.reject').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              const idx = parseInt(this.dataset.id);
              if (bookings[idx]) { bookings[idx].status = 'rejected';
                saveBookings();
                renderAdmin(); }
            });
          });
          list.querySelectorAll('.complete').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              const idx = parseInt(this.dataset.id);
              if (bookings[idx]) { bookings[idx].status = 'completed';
                saveBookings();
                renderAdmin(); }
            });
          });
        }

        const custList = document.getElementById('adminCustomerList');
        const customers = users.filter(u => u.role === 'customer');
        if (customers.length === 0) {
          custList.innerHTML = `<div style="color:#567a5e;padding:10px 0;text-align:center;">No customers yet</div>`;
        } else {
          let html = '';
          customers.forEach(c => {
            const custBookings = bookings.filter(b => b.userId === c.email);
            html += `
              <div style="padding:8px 0;border-bottom:1px solid #e0efe0;font-size:13px;">
                <strong>${c.name}</strong> (${c.email}) · ${custBookings.length} booking${custBookings.length !== 1 ? 's' : ''}
              </div>
            `;
          });
          custList.innerHTML = html;
        }
      }

      // ----- RENDER CUSTOMER BOOKINGS -----
      function renderCustomerBookings() {
        const list = document.getElementById('customerBookingsList');
        if (!currentUser) return;
        const userBookings = bookings.filter(b => b.userId === currentUser.email);
        if (userBookings.length === 0) {
          list.innerHTML = `<div style="text-align:center;color:#567a5e;padding:20px 0;">No bookings yet</div>`;
          return;
        }
        let html = '';
        userBookings.forEach((b, idx) => {
          const statusClass = b.status || 'pending';
          const statusLabel = statusClass.charAt(0).toUpperCase() + statusClass.slice(1);
          html += `
            <div class="booking-item" style="border-bottom:1px solid #e0efe0;padding:10px 0;">
              <div class="row1">
                <span><strong>${b.service}</strong></span>
                <span class="badge ${statusClass}">${statusLabel}</span>
              </div>
              <div class="row2">
                <span><i class="fas fa-calendar-day"></i> ${b.date} at ${b.time}</span>
                <span><i class="fas fa-map-pin"></i> ${b.location}</span>
              </div>
            </div>
          `;
        });
        list.innerHTML = html;
      }

      // ----- SHOW SERVICE DETAIL -----
      function showServiceDetail(serviceKey) {
        const data = serviceData[serviceKey];
        if (!data) return;
        const panel = document.getElementById('serviceDetail');
        document.getElementById('detailTitle').textContent = data.title;
        document.getElementById('detailDesc').textContent = data.desc;
        document.getElementById('detailHighlight').innerHTML = data.highlight;

        const featuresContainer = document.getElementById('detailFeatures');
        featuresContainer.innerHTML = data.features.map(f => `<span>${f}</span>`).join('');

        panel.classList.add('visible');
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Update booking button to pre-fill service
        document.getElementById('detailBookBtn').onclick = function() {
          if (!isLoggedIn() || isAdmin()) {
            alert('Please login as a customer to book.');
            showPage('login');
            return;
          }
          const select = document.getElementById('custService');
          const serviceName = data.title;
          for (let opt of select.options) {
            if (opt.value === serviceName) {
              select.selectedIndex = opt.index;
              break;
            }
          }
          showPage('booking');
        };
      }

      // ----- NAVIGATION -----
      navItems.forEach(item => {
        item.addEventListener('click', function() {
          const page = this.dataset.page;
          if (!isLoggedIn()) {
            if (page !== 'login' && page !== 'signup' && page !== 'splash') {
              showPage('login');
              return;
            }
            showPage(page);
            return;
          }
          if (isAdmin()) {
            if (page !== 'admin') {
              showPage('admin');
              return;
            }
            showPage('admin');
            return;
          }
          if (isCustomer()) {
            if (page === 'admin') {
              showPage('home');
              return;
            }
            showPage(page);
            return;
          }
        });
      });

      // ----- SPLASH -----
      document.getElementById('splashGetStarted').addEventListener('click', () => {
        if (isLoggedIn()) {
          if (isAdmin()) showPage('admin');
          else showPage('home');
        } else {
          showPage('login');
        }
      });

      // ----- AUTH TOGGLES -----
      document.getElementById('gotoSignup').addEventListener('click', () => showPage('signup'));
      document.getElementById('gotoLogin').addEventListener('click', () => showPage('login'));
      document.getElementById('loginBackBtn').addEventListener('click', () => showPage('splash'));
      document.getElementById('signupBackBtn').addEventListener('click', () => showPage('splash'));

      // ----- SIGNUP -----
      document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const password = document.getElementById('signupPassword').value.trim();
        if (!name || !email || password.length < 6) {
          alert('Please fill all fields. Password must be at least 6 characters.');
          return;
        }
        if (users.find(u => u.email === email)) {
          alert('Email already registered. Please login.');
          return;
        }
        const newUser = { name, email, password, role: 'customer' };
        users.push(newUser);
        saveUsers();
        currentUser = { name, email, role: 'customer' };
        sessionStorage.setItem('fusCurrentUser', JSON.stringify({ email: currentUser.email }));
        updateUserStatus();
        showPage('home');
        this.reset();
      });

      // ----- LOGIN -----
      document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value.trim();

        if (email === 'admin@fus.agency' && password === 'admin123') {
          let admin = users.find(u => u.email === email);
          if (!admin) {
            admin = { name: 'Admin', email, password, role: 'admin' };
            users.push(admin);
            saveUsers();
          }
          currentUser = { name: admin.name, email, role: 'admin' };
          sessionStorage.setItem('fusCurrentUser', JSON.stringify({ email: currentUser.email }));
          updateUserStatus();
          renderAdmin();
          showPage('admin');
          this.reset();
          return;
        }

        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
          alert('Invalid credentials. Try admin@fus.agency / admin123');
          return;
        }
        if (user.role === 'admin') {
          currentUser = { name: user.name, email, role: 'admin' };
          sessionStorage.setItem('fusCurrentUser', JSON.stringify({ email: currentUser.email }));
          updateUserStatus();
          renderAdmin();
          showPage('admin');
          this.reset();
          return;
        }
        currentUser = { name: user.name, email, role: 'customer' };
        sessionStorage.setItem('fusCurrentUser', JSON.stringify({ email: currentUser.email }));
        updateUserStatus();
        showPage('home');
        this.reset();
      });

      // ----- LOGOUT -----
      document.getElementById('homeLogoutBtn').addEventListener('click', function() {
        currentUser = null;
        sessionStorage.removeItem('fusCurrentUser');
        updateUserStatus();
        showPage('splash');
      });
      document.getElementById('adminLogoutBtn').addEventListener('click', function() {
        currentUser = null;
        sessionStorage.removeItem('fusCurrentUser');
        updateUserStatus();
        showPage('splash');
      });

      // ----- HOME BUTTONS -----
      document.getElementById('homeBookBtn').addEventListener('click', () => {
        if (!isLoggedIn()) { showPage('login'); return; }
        if (isAdmin()) { showPage('admin'); return; }
        showPage('booking');
      });
      document.getElementById('homeServicesBtn').addEventListener('click', () => {
        if (isAdmin()) { showPage('admin'); return; }
        showPage('services');
      });
      document.getElementById('homeReviewsBtn').addEventListener('click', () => {
        if (isAdmin()) { showPage('admin'); return; }
        showPage('reviews');
      });
      document.getElementById('homeContactBtn').addEventListener('click', () => {
        alert('📞 Contact FUS Agency: +1 (555) 742-0832  |  hello@fus.agency');
      });
      document.getElementById('homeStatusBtn').addEventListener('click', () => {
        if (isAdmin()) { showPage('admin'); return; }
        renderCustomerBookings();
        showPage('mybookings');
      });
      document.getElementById('servicesBookBtn').addEventListener('click', () => {
        if (!isLoggedIn()) { showPage('login'); return; }
        if (isAdmin()) { showPage('admin'); return; }
        showPage('booking');
      });
      document.getElementById('confirmationHomeBtn').addEventListener('click', () => showPage('home'));
      document.getElementById('reviewsHomeBtn').addEventListener('click', () => showPage('home'));
      document.getElementById('mybookingsHomeBtn').addEventListener('click', () => showPage('home'));
      document.getElementById('adminHomeBtn').addEventListener('click', () => {
        if (isCustomer()) showPage('home');
        else showPage('splash');
      });

      // ----- SERVICE CARDS (clickable with detail) -----
      document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
          if (!isLoggedIn() || isAdmin()) {
            alert('Please login as a customer to view service details.');
            showPage('login');
            return;
          }
          const serviceKey = this.dataset.service;
          showServiceDetail(serviceKey);
          // Also ensure we're on services page
          showPage('services');
        });
      });

      // ----- BOOKING FORM -----
      document.getElementById('bookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        if (!isLoggedIn() || isAdmin()) {
          alert('Please login as a customer to book.');
          showPage('login');
          return;
        }
        const name = document.getElementById('custName').value.trim();
        const phone = document.getElementById('custPhone').value.trim();
        const location = document.getElementById('custLocation').value.trim();
        const date = document.getElementById('custDate').value;
        const time = document.getElementById('custTime').value;
        const service = document.getElementById('custService').value;
        if (!name || !phone || !location || !date || !time || !service) {
          alert('Please fill all fields.');
          return;
        }
        const newBooking = {
          id: Date.now(),
          customerName: name,
          phone,
          location,
          date,
          time,
          service,
          status: 'pending',
          userId: currentUser.email
        };
        bookings.push(newBooking);
        saveBookings();

        document.getElementById('confirmName').textContent = name;
        document.getElementById('confirmPhone').textContent = phone;
        document.getElementById('confirmLocation').textContent = location;
        document.getElementById('confirmDate').textContent = date;
        document.getElementById('confirmTime').textContent = time;
        document.getElementById('confirmService').textContent = service;

        showPage('confirmation');
        this.reset();
      });

      // ----- REVIEW FORM -----
      document.getElementById('reviewForm').addEventListener('submit', function(e) {
        e.preventDefault();
        if (!isLoggedIn() || isAdmin()) {
          alert('Please login as a customer to leave a review.');
          showPage('login');
          return;
        }
        const name = document.getElementById('reviewName').value.trim();
        const rating = parseInt(document.getElementById('reviewRating').value);
        const text = document.getElementById('reviewText').value.trim();
        if (!name || !text) { alert('Please fill all fields.'); return; }
        const newReview = { name, rating, text, response: null, userId: currentUser.email };
        reviews.push(newReview);
        saveReviews();
        alert('Thank you for your review!');
        this.reset();
        showPage('reviews');
        const container = document.getElementById('reviewsContainer');
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML =
          `<div class="review-header"><strong>${name}</strong><span class="stars">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</span></div><div class="review-text">${text}</div>`;
        container.prepend(div);
      });

      // ----- INIT -----
      if (users.length === 0) {
        users.push({ name: 'Admin', email: 'admin@fus.agency', password: 'admin123', role: 'admin' });
        users.push({ name: 'Demo Customer', email: 'demo@user.com', password: 'demo123', role: 'customer' });
        saveUsers();
      }
      if (bookings.length === 0) {
        bookings.push({ id: 1, customerName: 'Sarah J.', phone: '555-1234', location: 'NYC', date: '2026-06-20',
          time: '10:00', service: 'Home Decluttering', status: 'pending', userId: 'demo@user.com' });
        bookings.push({ id: 2, customerName: 'Mike R.', phone: '555-5678', location: 'LA', date: '2026-06-22',
          time: '14:30', service: 'Office Organization', status: 'confirmed', userId: 'demo@user.com' });
        saveBookings();
      }
      if (reviews.length === 0) {
        reviews.push({ name: 'Maya R.', rating: 5, text: 'My apartment feels twice as big! FUS is incredible.',
          response: null, userId: 'demo@user.com' });
        reviews.push({ name: 'James T.', rating: 5, text: 'Office declutter boosted our team morale.',
          response: 'Thank you James! We\'re glad to help.', userId: 'demo@user.com' });
        saveReviews();
      }

      const savedUser = sessionStorage.getItem('fusCurrentUser');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const found = users.find(u => u.email === parsed.email);
          if (found) {
            currentUser = { name: found.name, email: found.email, role: found.role };
          }
        } catch (e) {}
      }

      updateUserStatus();

      if (isLoggedIn()) {
        if (isAdmin()) {
          renderAdmin();
          showPage('admin');
        } else {
          showPage('home');
        }
      } else {
        showPage('splash');
      }

      // Override showPage to handle role-based redirects
      const origShow = showPage;
      showPage = function(pageId) {
        if (currentUser) {
          sessionStorage.setItem('fusCurrentUser', JSON.stringify({ email: currentUser.email }));
        } else {
          sessionStorage.removeItem('fusCurrentUser');
        }

        if (isAdmin() && pageId !== 'admin' && pageId !== 'splash' && pageId !== 'login' && pageId !== 'signup') {
          origShow('admin');
          return;
        }
        if (isCustomer() && pageId === 'admin') {
          origShow('home');
          return;
        }
        origShow(pageId);
      };

      // Re-bind nav click to use new showPage
      navItems.forEach(item => {
        item.removeEventListener('click', null);
        item.addEventListener('click', function() {
          const page = this.dataset.page;
          if (!isLoggedIn()) {
            if (page !== 'login' && page !== 'signup' && page !== 'splash') {
              showPage('login');
              return;
            }
            showPage(page);
            return;
          }
          if (isAdmin() && page !== 'admin') {
            showPage('admin');
            return;
          }
          if (isCustomer() && page === 'admin') {
            showPage('home');
            return;
          }
          showPage(page);
        });
      });

      window.renderAdmin = renderAdmin;
      window.showServiceDetail = showServiceDetail;
    })();
 